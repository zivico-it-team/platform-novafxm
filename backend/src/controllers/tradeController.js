const sequelize = require('../config/db');
const { Wallet, Trade, Transaction } = require('../models');
const tradingView = require('../services/tradingViewService');

const money = (value) => Number(Number(value || 0).toFixed(2));
const contractSize = (symbol) => (
  symbol.includes('BTC') || symbol.includes('ETH') || symbol === 'US500'
    ? 1
    : symbol.includes('XAU') || symbol.includes('OIL') ? 100 : 100000
);
const pnl = (trade, closePrice) => money(
  (Number(closePrice) - Number(trade.openPrice))
  * (trade.side === 'BUY' ? 1 : -1)
  * Number(trade.lots)
  * contractSize(trade.symbol),
);

exports.open = async (req, res, next) => {
  try {
    if (req.user.tradingStatus === 'frozen') {
      return res.status(403).json({ message: 'Trading is temporarily disabled for this account.' });
    }
    const { symbol, side, lots } = req.body;
    if (!symbol || !['BUY', 'SELL'].includes(side) || !(Number(lots) > 0)) {
      return res.status(400).json({ message: 'Valid symbol, side and lots are required.' });
    }
    const market = await tradingView.getPrice(symbol);
    const margin = money((Number(lots) * 10000) / Number(req.user.leverage || 100));
    let trade;
    await sequelize.transaction(async (transaction) => {
      const wallet = await Wallet.findOne({ where: { userId: req.user.id }, transaction, lock: transaction.LOCK.UPDATE });
      const currentMargin = Number(await Trade.sum('margin', { where: { userId: req.user.id, status: 'open' }, transaction }) || 0);
      if (Number(wallet.balance) - currentMargin < margin) {
        throw Object.assign(new Error('Insufficient free funds.'), { status: 400 });
      }
      const openPrice = side === 'BUY' ? market.ask : market.bid;
      trade = await Trade.create({ userId: req.user.id, symbol, side, lots, margin, openPrice }, { transaction });
      const equity = Number(wallet.equity || wallet.balance);
      const nextMargin = money(currentMargin + margin);
      await wallet.update({ margin: nextMargin, freeFunds: money(equity - nextMargin) }, { transaction });
    });
    return res.status(201).json({ trade });
  } catch (error) {
    return next(error);
  }
};

exports.close = async (req, res, next) => {
  try {
    const trade = await Trade.findOne({ where: { id: req.params.id, userId: req.user.id, status: 'open' } });
    if (!trade) return res.status(404).json({ message: 'Open trade not found.' });
    const market = await tradingView.getPrice(trade.symbol);
    const closePrice = trade.side === 'BUY' ? market.bid : market.ask;
    const profit = pnl(trade, closePrice);
    await sequelize.transaction(async (transaction) => {
      await trade.update({ closePrice, profit, status: 'closed', closedAt: new Date() }, { transaction });
      const wallet = await Wallet.findOne({ where: { userId: req.user.id }, transaction, lock: transaction.LOCK.UPDATE });
      const before = money(wallet.balance);
      const after = money(before + profit);
      const margin = money(Math.max(0, Number(wallet.margin || 0) - Number(trade.margin)));
      await wallet.update({ balance: after, equity: after, margin, freeFunds: money(after - margin) }, { transaction });
      await Transaction.create({
        userId: req.user.id,
        type: profit >= 0 ? 'trade_profit' : 'trade_loss',
        amount: Math.abs(profit),
        status: 'completed',
        balanceBefore: before,
        balanceAfter: after,
        note: `${trade.side} ${trade.symbol} position closed`,
        referenceType: 'trade',
        referenceId: trade.id,
        description: `${trade.side} ${trade.symbol} trade closed`,
      }, { transaction });
    });
    return res.json({ trade });
  } catch (error) {
    return next(error);
  }
};

exports.openTrades = async (req, res, next) => {
  try {
    return res.json({ trades: await Trade.findAll({ where: { userId: req.user.id, status: 'open' }, order: [['createdAt', 'DESC']] }) });
  } catch (error) {
    return next(error);
  }
};

exports.closedTrades = async (req, res, next) => {
  try {
    return res.json({ trades: await Trade.findAll({ where: { userId: req.user.id, status: 'closed' }, order: [['closedAt', 'DESC']] }) });
  } catch (error) {
    return next(error);
  }
};
