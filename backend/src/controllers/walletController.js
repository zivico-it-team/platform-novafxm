const sequelize = require('../config/db');
const { Wallet, Deposit, Withdrawal, Transaction, Trade } = require('../models');
const tradingView = require('../services/tradingViewService');

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

exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    const trades = await Trade.findAll({ where: { userId: req.user.id, status: 'open' } });
    const prices = await tradingView.getPrices();
    const openProfit = money(trades.reduce((sum, trade) => {
      const market = prices.find((item) => item.symbol === trade.symbol);
      const price = ['market', 'stale'].includes(market?.source) ? market.price : trade.openPrice;
      return sum + profitFor(trade, price);
    }, 0));
    const margin = money(trades.reduce((sum, trade) => sum + Number(trade.margin), 0));
    const balance = money(wallet.balance);
    const equity = money(balance + openProfit);
    const freeFunds = money(equity - margin);
    await wallet.update({ equity, margin, freeFunds });
    return res.json({
      wallet: { ...wallet.toJSON(), equity, margin, freeFunds },
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
    const { amount, paymentMethod, referenceNumber, note } = req.body;
    if (!(Number(amount) > 0) || !paymentMethod || !referenceNumber) {
      return res.status(400).json({ message: 'Valid amount, payment method and reference number are required.' });
    }
    let deposit;
    await sequelize.transaction(async (transaction) => {
      const wallet = await Wallet.findOne({ where: { userId: req.user.id }, transaction });
      deposit = await Deposit.create({ userId: req.user.id, amount, paymentMethod, referenceNumber, note }, { transaction });
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
    return res.status(201).json({ deposit });
  } catch (error) {
    return next(error);
  }
};

exports.withdraw = async (req, res, next) => {
  try {
    const { amount, bankName, accountNumber, accountHolderName } = req.body;
    if (!(Number(amount) > 0) || !bankName || !accountNumber || !accountHolderName) {
      return res.status(400).json({ message: 'All withdrawal details are required.' });
    }
    let withdrawal;
    await sequelize.transaction(async (transaction) => {
      const wallet = await Wallet.findOne({ where: { userId: req.user.id }, transaction, lock: transaction.LOCK.UPDATE });
      const pending = await Withdrawal.sum('amount', { where: { userId: req.user.id, status: 'pending' }, transaction });
      if (Number(amount) > Number(wallet.balance) - Number(pending || 0)) {
        throw Object.assign(new Error('Insufficient withdrawable balance.'), { status: 400 });
      }
      withdrawal = await Withdrawal.create({ userId: req.user.id, amount, bankName, accountNumber, accountHolderName }, { transaction });
      await Transaction.create({
        userId: req.user.id,
        type: 'withdrawal',
        amount,
        status: 'pending',
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        referenceType: 'withdrawal',
        referenceId: withdrawal.id,
        description: `Withdrawal to ${bankName}`,
      }, { transaction });
    });
    return res.status(201).json({ withdrawal });
  } catch (error) {
    return next(error);
  }
};
