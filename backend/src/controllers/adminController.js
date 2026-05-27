const sequelize = require('../config/db');
const { User, Wallet, Deposit, Withdrawal, Transaction, Trade } = require('../models');
const tradingView = require('../services/tradingViewService');

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

async function getUser(id, transaction) {
  const user = await User.findByPk(id, { attributes: publicAttributes, transaction });
  if (!user) throw apiError('User account not found.', 404);
  return user;
}

function buildSummary(wallet, trades, prices = new Map()) {
  const openProfit = money(trades.reduce((sum, trade) => {
    const quote = prices.get(trade.symbol);
    const price = ['market', 'stale'].includes(quote?.source) ? quote.price : trade.openPrice;
    return sum + profitFor(trade, price);
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
      User.findAll({ attributes: publicAttributes, include: [{ model: Wallet, as: 'wallet' }], order: [['createdAt', 'DESC']] }),
      Trade.findAll({ where: { status: 'open' } }),
      tradingView.getPrices(),
    ]);
    const byUser = new Map();
    trades.forEach((trade) => byUser.set(trade.userId, [...(byUser.get(trade.userId) || []), trade]));
    const prices = new Map(livePrices.map((item) => [item.symbol, item]));
    let totalWalletFunds = 0;
    const result = users.map((user) => {
      const values = user.toJSON();
      const summary = values.wallet
        ? buildSummary(values.wallet, byUser.get(user.id) || [], prices)
        : { balance: 0, equity: 0, margin: 0, freeFunds: 0, openProfit: 0 };
      totalWalletFunds += summary.balance;
      return { ...values, wallet: values.wallet ? { ...values.wallet, ...summary } : null };
    });
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
    if (!(amount > 0)) return res.status(400).json({ message: 'Amount must be a positive value.' });
    let output;
    await sequelize.transaction(async (transaction) => {
      const user = await getUser(req.params.id, transaction);
      const { wallet } = await storedSummary(user.id, transaction);
      const before = money(wallet.balance);
      if (type === 'admin_deduct_balance' && amount > before) throw apiError('Deduct amount cannot exceed wallet balance.');
      const after = money(before + (type === 'admin_add_balance' ? amount : -amount));
      await wallet.update({ balance: after }, { transaction });
      const { summary } = await storedSummary(user.id, transaction);
      const ledger = await Transaction.create({
        userId: user.id,
        type,
        amount,
        status: 'completed',
        balanceBefore: before,
        balanceAfter: after,
        note,
        description: type === 'admin_add_balance' ? 'Balance added by administrator' : 'Balance deducted by administrator',
      }, { transaction });
      output = { user, wallet: { ...wallet.toJSON(), ...summary }, transaction: ledger };
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
        before = money(wallet.balance);
        after = money(before + Number(deposit.amount));
        await wallet.update({ balance: after }, { transaction });
        await storedSummary(deposit.userId, transaction);
      }
      await Transaction.update({ status: status === 'approved' ? 'completed' : 'rejected', balanceBefore: before, balanceAfter: after }, {
        where: { referenceType: 'deposit', referenceId: deposit.id },
        transaction,
      });
      result = deposit;
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
        before = money(wallet.balance);
        if (Number(withdrawal.amount) > before) throw apiError('User wallet does not have sufficient balance.');
        after = money(before - Number(withdrawal.amount));
        await wallet.update({ balance: after }, { transaction });
        await storedSummary(withdrawal.userId, transaction);
      }
      await Transaction.update({ status: status === 'approved' ? 'completed' : 'rejected', balanceBefore: before, balanceAfter: after }, {
        where: { referenceType: 'withdrawal', referenceId: withdrawal.id },
        transaction,
      });
      result = withdrawal;
    });
    return res.json({ withdrawal: result });
  } catch (error) {
    return next(error);
  }
};
