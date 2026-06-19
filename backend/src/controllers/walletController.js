const sequelize = require('../config/db');
const { Op } = require('sequelize');
const { User, Wallet, Deposit, Withdrawal, Transaction, Trade, BankAccount, TradingAccount } = require('../models');
const tradingView = require('../services/tradingViewService');
const { createAdminNotifications } = require('../services/notificationService');

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
const isTrc20Detail = (account) => String(`${account?.bankName || ''} ${account?.branchName || ''}`).toLowerCase().includes('trc20');

async function notifyAdmins(payload) {
  try {
    await createAdminNotifications(payload);
  } catch (error) {
    console.error('Admin notification delivery failed:', error.message);
  }
}

exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    const tradingAccount = req.query.tradingAccountId
      ? await TradingAccount.findOne({ where: { id: req.query.tradingAccountId, userId: req.user.id } })
      : null;
    const tradeWhere = { userId: req.user.id, status: 'open' };
    if (tradingAccount) tradeWhere.tradingAccountId = tradingAccount.id;
    const trades = await Trade.findAll({ where: tradeWhere });
    const prices = await tradingView.getPrices();
    const openProfit = money(trades.reduce((sum, trade) => {
      const market = prices.find((item) => item.symbol === trade.symbol);


      return sum + profitFor(trade, market?.price || trade.openPrice);
    }, 0));
    const marginWhere = { userId: req.user.id, status: { [Op.in]: ['pending', 'open'] } };
    if (tradingAccount) marginWhere.tradingAccountId = tradingAccount.id;
    const reservedMargin = await Trade.sum('margin', { where: marginWhere });
    const margin = money(reservedMargin || trades.reduce((sum, trade) => sum + Number(trade.margin), 0));
    const balance = money(tradingAccount ? tradingAccount.balance : wallet.balance);
    const equity = money(balance + openProfit);
    const freeFunds = money(equity - margin);
    if (!tradingAccount || tradingAccount.isPrimary) await wallet.update({ equity, margin, freeFunds });
    return res.json({
      wallet: { ...wallet.toJSON(), equity, margin, freeFunds },
      tradingAccount: tradingAccount ? tradingAccount.toJSON() : null,
      summary: { balance, equity, margin, freeFunds, marginLevel: margin ? (equity / margin) * 100 : 0, openProfit },
    });
  } catch (error) {
    return next(error);
  }
};

exports.transactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    return res.json({ transactions });
  } catch (error) {
    return next(error);
  }
};

exports.deposit = async (req, res, next) => {
  try {
    const { amount, paymentMethod, receiptImage, note } = req.body;
    if (!(Number(amount) >= 100) || !paymentMethod) {
      return res.status(400).json({ message: 'Minimum deposit is $100. Payment method is required.' });
    }
    let deposit;
    await sequelize.transaction(async (transaction) => {
      const wallet = await Wallet.findOne({ where: { userId: req.user.id }, transaction });

      // Ensure the user has a Live trading account
      let liveAccount = await TradingAccount.findOne({
        where: { userId: req.user.id, type: 'Live' },
        transaction,
      });

      if (!liveAccount) {
        liveAccount = await TradingAccount.create({
          userId: req.user.id,
          type: 'Live',
          name: 'Live account 1',
          balance: 0,
          status: 'active',
          isPrimary: true,
        }, { transaction });

        // Set all other accounts to not primary
        await TradingAccount.update({ isPrimary: false }, {
          where: { userId: req.user.id, id: { [Op.ne]: liveAccount.id } },
          transaction,
        });

        // Update the user's account type to Live
        await User.update({ accountType: 'Live' }, {
          where: { id: req.user.id },
          transaction,
        });
      }

      deposit = await Deposit.create({ userId: req.user.id, amount, paymentMethod, receiptImage, note }, { transaction });
      await Transaction.create({
        userId: req.user.id,
        type: 'deposit',
        amount,
        status: 'pending',
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        note,
        referenceType: 'deposit',
        referenceId: deposit.id,
        description: `Deposit via ${paymentMethod}`,
      }, { transaction });
    });
    await notifyAdmins({
      title: 'New Deposit Request',
      message: `${req.user.name || req.user.email} submitted a deposit request for $${Number(amount).toFixed(2)}.`,
      type: 'deposit',
    });
    return res.status(201).json({ deposit });
  } catch (error) {
    return next(error);
  }
};

exports.withdraw = async (req, res, next) => {
  try {
    if (req.user.verificationStatus !== 'approved') {
      return res.status(403).json({ message: 'Complete account verification before withdrawals.' });
    }
    const { amount, withdrawalMethod = 'Bank', bankAccountId } = req.body;
    const method = withdrawalMethod === 'Crypto' ? 'Crypto' : 'Bank';
    if (!(Number(amount) > 0) || !bankAccountId) {
      return res.status(400).json({ message: 'Amount and an approved withdrawal detail are required.' });
    }
    const savedDetail = await BankAccount.findOne({
      where: {
        id: bankAccountId,
        userId: req.user.id,
        status: 'approved',
      },
    });
    if (!savedDetail || (method === 'Crypto') !== isTrc20Detail(savedDetail)) {
      return res.status(400).json({ message: 'Select an approved withdrawal detail from Settings.' });
    }
    const bankName = savedDetail.bankName;
    const accountNumber = savedDetail.accountNumber;
    const accountHolderName = savedDetail.accountHolderName;
    let withdrawal;
    await sequelize.transaction(async (transaction) => {
      const wallet = await Wallet.findOne({ where: { userId: req.user.id }, transaction, lock: transaction.LOCK.UPDATE });
      const pending = await Withdrawal.sum('amount', { where: { userId: req.user.id, status: 'pending' }, transaction });
      if (Number(amount) > Number(wallet.balance) - Number(pending || 0)) {
        throw Object.assign(new Error('Insufficient withdrawable balance.'), { status: 400 });
      }
      withdrawal = await Withdrawal.create({
        userId: req.user.id,
        amount,
        withdrawalMethod: method,
        bankName,
        accountNumber,
        accountHolderName,
      }, { transaction });
      await Transaction.create({
        userId: req.user.id,
        type: 'withdrawal',
        amount,
        status: 'pending',
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        referenceType: 'withdrawal',
        referenceId: withdrawal.id,
        description: method === 'Bank' ? `Withdrawal to ${bankName}` : `Crypto withdrawal to ${bankName}`,
      }, { transaction });
    });
    await notifyAdmins({
      title: 'New Withdrawal Request',
      message: `${req.user.name || req.user.email} submitted a withdrawal request for $${Number(amount).toFixed(2)}.`,
      type: 'withdraw',
    });
    return res.status(201).json({ withdrawal });
  } catch (error) {
    return next(error);
  }
};
