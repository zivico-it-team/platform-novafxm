const sequelize = require('../config/db');
const { Wallet, Trade, Transaction } = require('../models');
const tradingView = require('../services/tradingViewService');

const contractSize = (symbol) => (symbol.includes('BTC') || symbol.includes('ETH') || symbol === 'US500' ? 1 : symbol.includes('XAU') || symbol.includes('OIL') ? 100 : 100000);
const pnl = (trade, closePrice) => Number(((Number(closePrice) - Number(trade.openPrice)) * (trade.side === 'BUY' ? 1 : -1) * Number(trade.lots) * contractSize(trade.symbol)).toFixed(2));

exports.open = async (req, res, next) => {
  try {
    const { symbol, side, lots } = req.body;
    if (!symbol || !['BUY', 'SELL'].includes(side) || !(Number(lots) > 0)) return res.status(400).json({ message: 'Valid symbol, side and lots are required.' });
    const [wallet, openTrades, market] = await Promise.all([
      Wallet.findOne({ where: { userId: req.user.id } }),
      Trade.findAll({ where: { userId: req.user.id, status: 'open' } }),
      tradingView.getPrice(symbol),
    ]);
    if (market.source !== 'market') return res.status(503).json({ message: 'A current market quote is unavailable for this symbol.' });
    const margin = Number(lots) * 100;
    const usedMargin = openTrades.reduce((sum, trade) => sum + Number(trade.margin), 0);
    if (Number(wallet.balance) - usedMargin < margin) return res.status(400).json({ message: 'Insufficient free funds.' });
    const price = side === 'BUY' ? market.ask : market.bid;
    const trade = await Trade.create({ userId: req.user.id, symbol, side, lots, margin, openPrice: price });
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
    if (market.source !== 'market') return res.status(503).json({ message: 'A current market quote is unavailable for this symbol.' });
    const closePrice = trade.side === 'BUY' ? market.bid : market.ask;
    const profit = pnl(trade, closePrice);
    await sequelize.transaction(async (transaction) => {
      await trade.update({ closePrice, profit, status: 'closed', closedAt: new Date() }, { transaction });
      const wallet = await Wallet.findOne({ where: { userId: req.user.id }, transaction, lock: transaction.LOCK.UPDATE });
      await wallet.increment({ balance: profit }, { transaction });
      await Transaction.create({
        userId: req.user.id,
        type: profit >= 0 ? 'trade_profit' : 'trade_loss',
        amount: Math.abs(profit),
        status: 'completed',
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
