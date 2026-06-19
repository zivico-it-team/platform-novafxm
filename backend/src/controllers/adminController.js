const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Wallet, Deposit, Withdrawal, Transaction, Trade, TradingAccount, BankAccount } = require('../models');
const tradingView = require('../services/tradingViewService');
const { ensureReferralCode } = require('../services/dashboardService');
const { createNotification } = require('../services/notificationService');

const DEMO_BALANCE = 5000;
const publicAttributes = { exclude: ['password'] };
const money = (value) => Number(Number(value || 0).toFixed(2));
const contractSize = (symbol) => (
  symbol.includes('BTC') || symbol.includes('ETH') || symbol === 'US500'
    ? 1
    : symbol.includes('XAU') || symbol.includes('OIL') ? 100 : 100000
);
const profitFor = (trade, price) => (
  (Number(price) - Number(trade.openPrice))
  * (trade.side === 'BUY' ? 1 : -1)
  * Number(trade.lots)
  * contractSize(trade.symbol)
);

function apiError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

async function notifyUser(payload) {
  try {
    await createNotification(payload);
  } catch (error) {
    console.error('Notification delivery failed:', error.message);
  }
}

async function getUser(id, transaction) {
  const user = await User.findByPk(id, { attributes: publicAttributes, transaction });
  if (!user) throw apiError('User account not found.', 404);
  return user;
}

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const clean = (value) => {
  const text = String(value || '').trim();
  return text || null;
};
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
const phoneDigits = (phone) => String(phone || '').replace(/\D/g, '');
const isValidPhone = (phone) => {
  const text = String(phone || '').trim();
  return /^\+\d{1,4}\s+\d[\d\s().-]{5,18}$/.test(text) && phoneDigits(text).length >= 8 && phoneDigits(text).length <= 15;
};

function buildSummary(wallet, trades, prices = new Map()) {
  const openProfit = money(trades.reduce((sum, trade) => {
    const quote = prices.get(trade.symbol);
    return sum + profitFor(trade, quote?.price || trade.openPrice);
  }, 0));
  const balance = money(wallet.balance);
  const margin = money(trades.reduce((sum, trade) => sum + Number(trade.margin), 0));
  const equity = money(balance + openProfit);
  const freeFunds = money(equity - margin);
  return { balance, equity, margin, freeFunds, openProfit };
}

async function updateSnapshot(wallet, summary, transaction) {
  await wallet.update({
    equity: summary.equity,
    margin: summary.margin,
    freeFunds: summary.freeFunds,
  }, { transaction });
}

async function storedSummary(userId, transaction) {
  const wallet = await Wallet.findOne({
    where: { userId },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!wallet) throw apiError('User wallet not found.', 404);
  const trades = await Trade.findAll({ where: { userId, status: 'open' }, transaction });
  const summary = buildSummary(wallet, trades);
  await updateSnapshot(wallet, summary, transaction);
  return { wallet, summary };
}

exports.users = async (req, res, next) => {
  try {
    const [users, trades, livePrices] = await Promise.all([
      User.findAll({
        attributes: publicAttributes,
        include: [
          { model: Wallet, as: 'wallet' },
          { model: TradingAccount, as: 'tradingAccounts' },
          { model: User, as: 'referrer', attributes: ['id', 'name', 'email', 'referralCode'] },
          {
            model: User,
            as: 'referrals',
            attributes: ['id', 'name', 'email', 'accountType', 'verificationStatus', 'createdAt'],
            include: [{ model: Wallet, as: 'wallet' }],
          },
        ],
        order: [
          ['createdAt', 'DESC'],
          [{ model: TradingAccount, as: 'tradingAccounts' }, 'createdAt', 'ASC'],
          [{ model: User, as: 'referrals' }, 'createdAt', 'DESC'],
        ],
      }),
      Trade.findAll({ where: { status: 'open' } }),
      tradingView.getPrices(),
    ]);
    const byUser = new Map();
    trades.forEach((trade) => byUser.set(trade.userId, [...(byUser.get(trade.userId) || []), trade]));
    const prices = new Map(livePrices.map((item) => [item.symbol, item]));
    let totalWalletFunds = 0;
    const result = await Promise.all(users.map(async (user) => {
      const values = user.toJSON();
      const summary = values.wallet
        ? buildSummary(values.wallet, byUser.get(user.id) || [], prices)
        : { balance: 0, equity: 0, margin: 0, freeFunds: 0, openProfit: 0 };
      const extraAccountFunds = (values.tradingAccounts || []).reduce((sum, account) => {
        if (account.isPrimary) return sum;
        return sum + Number(account.balance || 0);
      }, 0);
      totalWalletFunds += summary.balance + extraAccountFunds;
      const referralIds = (values.referrals || []).map((referral) => referral.id);
      const [approvedDeposits, pendingDeposits] = referralIds.length
        ? await Promise.all([
          Transaction.sum('amount', {
            where: { userId: { [Op.in]: referralIds }, type: 'deposit', status: { [Op.in]: ['approved', 'completed'] } },
          }),
          Transaction.sum('amount', {
            where: { userId: { [Op.in]: referralIds }, type: 'deposit', status: 'pending' },
          }),
        ])
        : [0, 0];
      return {
        ...values,
        wallet: values.wallet ? { ...values.wallet, ...summary } : null,
        referralStats: {
          count: referralIds.length,
          approvedDeposits: money(approvedDeposits),
          pendingDeposits: money(pendingDeposits),
        },
      };
    }));
    await Promise.all(users.map((user, index) => (
      user.wallet ? updateSnapshot(user.wallet, result[index].wallet) : Promise.resolve()
    )));
    const clients = result.filter((user) => user.role !== 'admin');
    return res.json({
      users: result,
      stats: {
        frozenAccounts: clients.filter((user) => user.tradingStatus === 'frozen').length,
        totalWalletFunds: money(totalWalletFunds),
        activeTraders: clients.filter((user) => user.tradingStatus === 'active').length,
        totalOpenPositions: trades.length,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      country,
      dateOfBirth,
      accountType,
      leverage,
      tradingStatus,
      verificationStatus,
      adminNotes,
    } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const selectedAccountType = accountType === 'Live' ? 'Live' : 'Demo';
    const selectedLeverage = Number(leverage || 100);
    if (!clean(name) || !normalizedEmail || !String(password || '').trim()) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (!isValidEmail(normalizedEmail)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (!clean(country)) return res.status(400).json({ message: 'Country is required.' });
    if (!isValidPhone(phone)) return res.status(400).json({ message: 'Enter a valid phone number with country code.' });
    if (String(password).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (!Number.isInteger(selectedLeverage) || selectedLeverage < 1 || selectedLeverage > 1000) {
      return res.status(400).json({ message: 'Leverage must be between 1:1 and 1:1000.' });
    }
    if (await User.findOne({ where: { email: normalizedEmail } })) return res.status(409).json({ message: 'Email already registered.' });

    let created;
    await sequelize.transaction(async (transaction) => {
      const startingBalance = selectedAccountType === 'Demo' ? DEMO_BALANCE : 0;
      created = await User.create({
        name: clean(name),
        email: normalizedEmail,
        phone: clean(phone),
        country: clean(country),
        dateOfBirth: clean(dateOfBirth),
        password: await bcrypt.hash(String(password), 12),
        role: 'user',
        accountType: selectedAccountType,
        leverage: selectedLeverage,
        tradingStatus: tradingStatus === 'frozen' ? 'frozen' : 'active',
        verificationStatus: ['unverified', 'pending', 'approved', 'rejected'].includes(verificationStatus) ? verificationStatus : 'unverified',
        adminNotes: clean(adminNotes),
      }, { transaction });
      await Wallet.create({ userId: created.id, balance: startingBalance, equity: startingBalance, freeFunds: startingBalance }, { transaction });
      await TradingAccount.create({
        userId: created.id,
        type: selectedAccountType,
        name: `${selectedAccountType} account 1`,
        balance: startingBalance,
        status: 'active',
        isPrimary: true,
      }, { transaction });
    });
    await ensureReferralCode(created);
    const user = await User.findByPk(created.id, { attributes: publicAttributes, include: [{ model: Wallet, as: 'wallet' }, { model: TradingAccount, as: 'tradingAccounts' }] });
    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
};

exports.updateUserDetails = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw apiError('User account not found.', 404);
    if (user.role === 'admin') throw apiError('Admin accounts cannot be edited here.', 403);
    const {
      name,
      email,
      password,
      phone,
      country,
      dateOfBirth,
      accountType,
      leverage,
      tradingStatus,
      verificationStatus,
      adminNotes,
    } = req.body;
    const selectedLeverage = Number(leverage || user.leverage || 100);
    const updates = {
      name: clean(name) || user.name,
      phone: clean(phone),
      country: clean(country),
      dateOfBirth: clean(dateOfBirth),
      accountType: accountType === 'Live' ? 'Live' : 'Demo',
      leverage: selectedLeverage,
      tradingStatus: tradingStatus === 'frozen' ? 'frozen' : 'active',
      verificationStatus: ['unverified', 'pending', 'approved', 'rejected'].includes(verificationStatus) ? verificationStatus : user.verificationStatus,
      adminNotes: clean(adminNotes),
    };
    const normalizedEmail = normalizeEmail(email);
    if (!updates.name || !normalizedEmail) return res.status(400).json({ message: 'Name and email are required.' });
    if (!isValidEmail(normalizedEmail)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (!updates.country) return res.status(400).json({ message: 'Country is required.' });
    if (!isValidPhone(updates.phone)) return res.status(400).json({ message: 'Enter a valid phone number with country code.' });
    if (!Number.isInteger(selectedLeverage) || selectedLeverage < 1 || selectedLeverage > 1000) {
      return res.status(400).json({ message: 'Leverage must be between 1:1 and 1:1000.' });
    }
    if (normalizedEmail !== user.email) {
      if (await User.findOne({ where: { email: normalizedEmail, id: { [Op.ne]: user.id } } })) return res.status(409).json({ message: 'Email already registered.' });
      updates.email = normalizedEmail;
    }
    if (String(password || '').trim()) {
      if (String(password).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
      updates.password = await bcrypt.hash(String(password), 12);
    }
    await user.update(updates);
    const updated = await User.findByPk(user.id, { attributes: publicAttributes, include: [{ model: Wallet, as: 'wallet' }, { model: TradingAccount, as: 'tradingAccounts' }] });
    await notifyUser({
      userId: user.id,
      title: 'Account Details Updated',
      message: 'Your account details were updated by an administrator.',
      type: 'admin',
    });
    return res.json({ user: updated });
  } catch (error) {
    return next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(req.params.id, { transaction });
      if (!user) throw apiError('User account not found.', 404);
      if (user.id === req.user.id) throw apiError('You cannot remove your own admin account.', 403);
      if (user.role === 'admin') throw apiError('Admin accounts cannot be removed here.', 403);
      await User.update({ referredById: null }, { where: { referredById: user.id }, transaction });
      await Trade.destroy({ where: { userId: user.id }, transaction });
      await Transaction.destroy({ where: { userId: user.id }, transaction });
      await Deposit.destroy({ where: { userId: user.id }, transaction });
      await Withdrawal.destroy({ where: { userId: user.id }, transaction });
      await BankAccount.destroy({ where: { userId: user.id }, transaction });
      await TradingAccount.destroy({ where: { userId: user.id }, transaction });
      await Wallet.destroy({ where: { userId: user.id }, transaction });
      await user.destroy({ transaction });
    });
    return res.json({ deleted: true });
  } catch (error) {
    return next(error);
  }
};

exports.userWallet = async (req, res, next) => {
  try {
    const user = await getUser(req.params.id);
    const wallet = await Wallet.findOne({ where: { userId: user.id } });
    if (!wallet) throw apiError('User wallet not found.', 404);
    const [trades, prices, deposits, withdrawals, totalTrades] = await Promise.all([
      Trade.findAll({ where: { userId: user.id, status: 'open' } }),
      tradingView.getPrices(),
      Deposit.sum('amount', { where: { userId: user.id, status: 'approved' } }),
      Withdrawal.sum('amount', { where: { userId: user.id, status: 'approved' } }),
      Trade.count({ where: { userId: user.id } }),
    ]);
    const summary = buildSummary(wallet, trades, new Map(prices.map((item) => [item.symbol, item])));
    await updateSnapshot(wallet, summary);
    return res.json({
      user,
      wallet: {
        ...wallet.toJSON(),
        ...summary,
        totalDeposits: money(deposits),
        totalWithdrawals: money(withdrawals),
        totalTrades,
        leverage: user.leverage,
        tradingStatus: user.tradingStatus,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.userTransactions = async (req, res, next) => {
  try {
    const user = await getUser(req.params.id);
    const transactions = await Transaction.findAll({ where: { userId: user.id }, order: [['createdAt', 'DESC']] });
    return res.json({ user, transactions });
  } catch (error) {
    return next(error);
  }
};

exports.updateBalance = (type) => async (req, res, next) => {
  try {
    const amount = money(req.body.amount);
    const note = String(req.body.note || '').trim();
    const tradingAccountId = Number(req.body.tradingAccountId || 0);
    if (!(amount > 0)) return res.status(400).json({ message: 'Amount must be a positive value.' });
    let output;
    await sequelize.transaction(async (transaction) => {
      const user = await getUser(req.params.id, transaction);
      const { wallet } = await storedSummary(user.id, transaction);
      const requestedAccount = tradingAccountId
        ? await TradingAccount.findOne({
          where: { id: tradingAccountId, userId: user.id },
          transaction,
          lock: transaction.LOCK.UPDATE,
        })
        : null;
      if (tradingAccountId && !requestedAccount) throw apiError('Trading account not found.', 404);

      const primaryAccount = await TradingAccount.findOne({ where: { userId: user.id, isPrimary: true }, transaction, lock: transaction.LOCK.UPDATE });
      const fallbackAccount = primaryAccount || await TradingAccount.findOne({ where: { userId: user.id }, order: [['createdAt', 'ASC']], transaction, lock: transaction.LOCK.UPDATE });
      const targetAccount = requestedAccount || fallbackAccount;
      const before = money(requestedAccount ? requestedAccount.balance : wallet.balance);
      if (type === 'admin_deduct_balance' && amount > before) throw apiError('Deduct amount cannot exceed available balance.');
      const after = money(before + (type === 'admin_add_balance' ? amount : -amount));

      if (targetAccount) {
        await targetAccount.update({ balance: after }, { transaction });
      }
      if (!requestedAccount || requestedAccount.isPrimary) {
        await wallet.update({ balance: after }, { transaction });
      }
      const { summary } = await storedSummary(user.id, transaction);
      const ledger = await Transaction.create({
        userId: user.id,
        type,
        amount,
        status: 'completed',
        balanceBefore: before,
        balanceAfter: after,
        note,
        referenceType: targetAccount ? 'trading_account' : null,
        referenceId: targetAccount?.id || null,
        description: type === 'admin_add_balance' ? 'Balance added by administrator' : 'Balance deducted by administrator',
      }, { transaction });
      output = { user, wallet: { ...wallet.toJSON(), ...summary }, transaction: ledger };
    });
    await notifyUser({
      userId: output.user.id,
      title: type === 'admin_add_balance' ? 'Balance Added' : 'Balance Deducted',
      message: `$${amount.toFixed(2)} has been ${type === 'admin_add_balance' ? 'added to' : 'deducted from'} your trading account.`,
      type: 'admin',
    });
    return res.json(output);
  } catch (error) {
    return next(error);
  }
};

exports.setTradingStatus = (tradingStatus) => async (req, res, next) => {
  try {
    const user = await getUser(req.params.id);
    await user.update({ tradingStatus });
    await notifyUser({
      userId: user.id,
      title: tradingStatus === 'active' ? 'Trading Enabled' : 'Trading Disabled',
      message: tradingStatus === 'active'
        ? 'Your trading access has been enabled.'
        : 'Your trading access has been temporarily disabled.',
      type: 'admin',
    });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

exports.updateLeverage = async (req, res, next) => {
  try {
    const leverage = Number(String(req.body.leverage || '').replace('1:', ''));
    if (!Number.isInteger(leverage) || leverage < 1 || leverage > 1000) {
      return res.status(400).json({ message: 'Leverage must be between 1:1 and 1:1000.' });
    }
    const user = await getUser(req.params.id);
    await user.update({ leverage });
    await notifyUser({
      userId: user.id,
      title: 'Leverage Updated',
      message: `Your account leverage has been updated to 1:${leverage}.`,
      type: 'admin',
    });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

exports.updateNotes = async (req, res, next) => {
  try {
    const adminNotes = String(req.body.adminNotes || '').trim();
    if (adminNotes.length > 5000) return res.status(400).json({ message: 'Admin notes cannot exceed 5000 characters.' });
    const user = await getUser(req.params.id);
    await user.update({ adminNotes: adminNotes || null });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

exports.reviewVerification = (verificationStatus) => async (req, res, next) => {
  try {
    const user = await getUser(req.params.id);
    if (!user.idProofImage || !user.addressProofImage) {
      throw apiError('User has not uploaded both verification documents.', 400);
    }
    await user.update({
      verificationStatus,
      verificationReviewedAt: new Date(),
      verificationReviewedBy: req.user.id,
      tradingStatus: verificationStatus === 'approved' ? 'active' : 'frozen',
    });
    await notifyUser({
      userId: user.id,
      title: verificationStatus === 'approved' ? 'KYC Verified' : 'KYC Rejected',
      message: verificationStatus === 'approved'
        ? 'Your account verification has been approved.'
        : 'Your account verification was rejected. Please review and upload valid documents.',
      type: 'kyc',
    });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

exports.resetDemo = async (req, res, next) => {
  try {
    let output;
    await sequelize.transaction(async (transaction) => {
      const user = await getUser(req.params.id, transaction);
      if (user.accountType !== 'Demo') throw apiError('Only demo accounts can be reset.');
      const wallet = await Wallet.findOne({ where: { userId: user.id }, transaction, lock: transaction.LOCK.UPDATE });
      if (!wallet) throw apiError('User wallet not found.', 404);
      const before = money(wallet.balance);
      await Trade.destroy({ where: { userId: user.id, status: 'open' }, transaction });
      await wallet.update({ balance: DEMO_BALANCE, equity: DEMO_BALANCE, margin: 0, freeFunds: DEMO_BALANCE }, { transaction });
      await TradingAccount.update(
        { balance: DEMO_BALANCE },
        { where: { userId: user.id, type: 'Demo' }, transaction },
      );
      const ledger = await Transaction.create({
        userId: user.id,
        type: 'reset_demo',
        amount: Math.abs(DEMO_BALANCE - before),
        status: 'completed',
        balanceBefore: before,
        balanceAfter: DEMO_BALANCE,
        note: String(req.body.note || 'Demo account reset by administrator.').trim(),
        description: 'Demo balance reset',
      }, { transaction });
      output = { user, wallet, transaction: ledger };
    });
    return res.json(output);
  } catch (error) {
    return next(error);
  }
};

exports.deposits = async (req, res, next) => {
  try {
    return res.json({ deposits: await Deposit.findAll({ include: [{ model: User, attributes: publicAttributes }], order: [['createdAt', 'DESC']] }) });
  } catch (error) {
    return next(error);
  }
};

exports.withdrawals = async (req, res, next) => {
  try {
    return res.json({ withdrawals: await Withdrawal.findAll({ include: [{ model: User, attributes: publicAttributes }], order: [['createdAt', 'DESC']] }) });
  } catch (error) {
    return next(error);
  }
};

exports.trades = async (req, res, next) => {
  try {
    return res.json({ trades: await Trade.findAll({ include: [{ model: User, attributes: publicAttributes }], order: [['createdAt', 'DESC']] }) });
  } catch (error) {
    return next(error);
  }
};

exports.bankAccounts = async (req, res, next) => {
  try {
    const accounts = await BankAccount.findAll({
      include: [{ model: User, attributes: publicAttributes }],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ accounts });
  } catch (error) {
    return next(error);
  }
};

exports.reviewBankAccount = (status) => async (req, res, next) => {
  try {
    const account = await BankAccount.findByPk(req.params.id);
    if (!account) throw apiError('Bank account details not found.', 404);
    if (account.status === 'delete_pending' && status === 'approved') {
      const userId = account.userId;
      await User.update({
        bankAccountHolder: null,
        bankName: null,
        bankBranch: null,
        bankAccountNumber: null,
      }, { where: { id: account.userId } });
      await account.destroy();
      await notifyUser({
        userId,
        title: 'Withdrawal Details Removed',
        message: 'Your withdrawal details removal request has been approved.',
        type: 'admin',
      });
      return res.json({ deleted: true });
    }
    if (account.status === 'delete_pending' && status === 'rejected') {
      await account.update({
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
      });
      await notifyUser({
        userId: account.userId,
        title: 'Withdrawal Details Kept',
        message: 'Your withdrawal details removal request was rejected.',
        type: 'admin',
      });
      return res.json({ account });
    }
    await account.update({
      status,
      reviewedAt: new Date(),
      reviewedBy: req.user.id,
    });
    await notifyUser({
      userId: account.userId,
      title: status === 'approved' ? 'Withdrawal Details Approved' : 'Withdrawal Details Rejected',
      message: status === 'approved'
        ? 'Your withdrawal details have been approved.'
        : 'Your withdrawal details were rejected. Please submit valid details.',
      type: 'admin',
    });
    return res.json({ account });
  } catch (error) {
    return next(error);
  }
};

exports.reviewDeposit = (status) => async (req, res, next) => {
  try {
    let result;
    await sequelize.transaction(async (transaction) => {
      const deposit = await Deposit.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!deposit || deposit.status !== 'pending') throw apiError('Pending deposit not found.', 404);
      await deposit.update({ status, reviewedAt: new Date(), reviewedBy: req.user.id }, { transaction });
      let before;
      let after;
      if (status === 'approved') {
        const { wallet } = await storedSummary(deposit.userId, transaction);
        let liveAccount = await TradingAccount.findOne({
          where: { userId: deposit.userId, type: 'Live' },
          order: [['isPrimary', 'DESC'], ['createdAt', 'ASC']],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!liveAccount) {
          liveAccount = await TradingAccount.create({
            userId: deposit.userId,
            type: 'Live',
            name: 'Live account 1',
            balance: 0,
            status: 'active',
            isPrimary: true,
          }, { transaction });
          await TradingAccount.update({ isPrimary: false }, {
            where: { userId: deposit.userId, id: { [Op.ne]: liveAccount.id } },
            transaction,
          });
          await User.update({ accountType: 'Live' }, {
            where: { id: deposit.userId },
            transaction,
          });
        }
        before = money(wallet.balance);
        after = money(before + Number(deposit.amount));
        await wallet.update({ balance: after }, { transaction });
        if (liveAccount) await liveAccount.update({ balance: money(Number(liveAccount.balance) + Number(deposit.amount)) }, { transaction });
        await storedSummary(deposit.userId, transaction);
      }
      const [updatedTransactions] = await Transaction.update({ status: status === 'approved' ? 'completed' : 'rejected', balanceBefore: before, balanceAfter: after }, {
        where: { referenceType: 'deposit', referenceId: deposit.id },
        transaction,
      });
      if (!updatedTransactions) {
        await Transaction.create({
          userId: deposit.userId,
          type: 'deposit',
          amount: deposit.amount,
          status: status === 'approved' ? 'completed' : 'rejected',
          balanceBefore: before,
          balanceAfter: after,
          note: deposit.note,
          referenceType: 'deposit',
          referenceId: deposit.id,
          description: `Deposit via ${deposit.paymentMethod}`,
        }, { transaction });
      }
      result = deposit;
    });
    await notifyUser({
      userId: result.userId,
      title: status === 'approved' ? 'Deposit Approved' : 'Deposit Rejected',
      message: status === 'approved'
        ? `Your deposit of $${Number(result.amount).toFixed(2)} has been approved.`
        : `Your deposit of $${Number(result.amount).toFixed(2)} has been rejected.`,
      type: 'deposit',
    });
    return res.json({ deposit: result });
  } catch (error) {
    return next(error);
  }
};

exports.reviewWithdrawal = (status) => async (req, res, next) => {
  try {
    let result;
    await sequelize.transaction(async (transaction) => {
      const withdrawal = await Withdrawal.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!withdrawal || withdrawal.status !== 'pending') throw apiError('Pending withdrawal not found.', 404);
      await withdrawal.update({ status, reviewedAt: new Date(), reviewedBy: req.user.id }, { transaction });
      let before;
      let after;
      if (status === 'approved') {
        const { wallet } = await storedSummary(withdrawal.userId, transaction);
        const liveAccount = await TradingAccount.findOne({
          where: { userId: withdrawal.userId, type: 'Live' },
          order: [['isPrimary', 'DESC'], ['createdAt', 'ASC']],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        before = money(wallet.balance);
        if (Number(withdrawal.amount) > before) throw apiError('User wallet does not have sufficient balance.');
        after = money(before - Number(withdrawal.amount));
        await wallet.update({ balance: after }, { transaction });
        if (liveAccount) {
          const liveBefore = money(liveAccount.balance);
          if (Number(withdrawal.amount) > liveBefore) throw apiError('Live trading account does not have sufficient balance.');
          await liveAccount.update({ balance: money(liveBefore - Number(withdrawal.amount)) }, { transaction });
        }
        await storedSummary(withdrawal.userId, transaction);
      }
      await Transaction.update({ status: status === 'approved' ? 'completed' : 'rejected', balanceBefore: before, balanceAfter: after }, {
        where: { referenceType: 'withdrawal', referenceId: withdrawal.id },
        transaction,
      });
      result = withdrawal;
    });
    await notifyUser({
      userId: result.userId,
      title: status === 'approved' ? 'Withdrawal Approved' : 'Withdrawal Rejected',
      message: status === 'approved'
        ? `Your withdrawal request of $${Number(result.amount).toFixed(2)} has been approved.`
        : `Your withdrawal request of $${Number(result.amount).toFixed(2)} has been rejected.`,
      type: 'withdraw',
    });
    return res.json({ withdrawal: result });
  } catch (error) {
    return next(error);
  }
};
