const { getCurrentPrices } = require('../websocket/priceFeed');
const { getSymbolMeta } = require('./symbolMeta');

const toNumber = (value, fallback = null) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const roundMoney = (value) => Number(toNumber(value, 0).toFixed(2));

const getBrokerQuote = (symbol) => {
  const meta = getSymbolMeta(symbol);
  if (!meta) return null;

  const liveQuote = getCurrentPrices()[symbol];
  if (liveQuote?.bid != null && liveQuote?.ask != null) {
    const bid = toNumber(liveQuote.bid);
    const ask = toNumber(liveQuote.ask);
    const mid = toNumber(liveQuote.mid, (bid + ask) / 2);

    if (bid != null && ask != null) {
      return { bid, ask, mid };
    }
  }

  const spreadAmount = meta.spread * meta.pip;
  const mid = meta.base;
  return {
    bid: Number((mid - spreadAmount / 2).toFixed(meta.digits)),
    ask: Number((mid + spreadAmount / 2).toFixed(meta.digits)),
    mid: Number(mid.toFixed(meta.digits)),
  };
};

const normalizeOrderType = (type) => {
  const normalized = String(type || '').toLowerCase();
  return normalized === 'sell' ? 'sell' : normalized === 'buy' ? 'buy' : null;
};

const getExecutionPrice = ({ symbol, type, action }) => {
  const quote = getBrokerQuote(symbol);
  const normalizedType = normalizeOrderType(type);

  if (!quote || !normalizedType) return null;
  if (action === 'open') return normalizedType === 'buy' ? quote.ask : quote.bid;
  return normalizedType === 'buy' ? quote.bid : quote.ask;
};

const calculateMarginRequired = ({ symbol, lotSize, price, leverage }) => {
  const meta = getSymbolMeta(symbol);
  const lot = toNumber(lotSize, 0);
  const executionPrice = toNumber(price, 0);
  const accountLeverage = Math.max(1, toNumber(leverage, 1));
  return (lot * (meta?.contractSize || 100000) * executionPrice) / accountLeverage;
};

const calculatePnL = ({ symbol, type, lotSize, openPrice, closePrice }) => {
  const meta = getSymbolMeta(symbol);
  const priceDiff = toNumber(closePrice, 0) - toNumber(openPrice, 0);
  const value = priceDiff * toNumber(lotSize, 0) * (meta?.contractSize || 100000);
  return roundMoney(normalizeOrderType(type) === 'buy' ? value : -value);
};

const calculateAccountMetrics = (account, openTrades = []) => {
  const balance = toNumber(account.balance, 0);
  const bonus = toNumber(account.bonus, 0);
  const leverage = toNumber(account.leverage, 200);

  const totals = openTrades.reduce((acc, trade) => {
    const closePrice = getExecutionPrice({ symbol: trade.symbol, type: trade.type, action: 'close' });
    const quote = getBrokerQuote(trade.symbol);
    if (!closePrice || !quote) return acc;

    acc.floatingPnL += calculatePnL({
      symbol: trade.symbol,
      type: trade.type,
      lotSize: trade.lot_size,
      openPrice: trade.open_price,
      closePrice,
    });
    acc.usedMargin += calculateMarginRequired({
      symbol: trade.symbol,
      lotSize: trade.lot_size,
      price: quote.mid,
      leverage,
    });
    return acc;
  }, { floatingPnL: 0, usedMargin: 0 });

  const equity = roundMoney(balance + bonus + totals.floatingPnL);
  const usedMargin = roundMoney(totals.usedMargin);
  const freeMargin = roundMoney(equity - usedMargin);
  const marginLevel = usedMargin > 0 ? roundMoney((equity / usedMargin) * 100) : 0;

  return { balance: roundMoney(balance), bonus: roundMoney(bonus), equity, used_margin: usedMargin, free_margin: freeMargin, margin_level: marginLevel };
};

const validateNewOrder = ({ symbol, type, lotSize }) => {
  if (!getSymbolMeta(symbol)) return 'Unsupported symbol';
  if (!normalizeOrderType(type)) return 'type must be buy or sell';

  const lot = toNumber(lotSize);
  if (lot == null || lot <= 0) return 'lot_size must be greater than zero';
  if (lot > 100) return 'lot_size is above the maximum order size';

  return null;
};

const validateStops = ({ type, openPrice, takeProfit, stopLoss }) => {
  const normalizedType = normalizeOrderType(type);
  const price = toNumber(openPrice);
  const tp = takeProfit == null || takeProfit === '' ? null : toNumber(takeProfit);
  const sl = stopLoss == null || stopLoss === '' ? null : toNumber(stopLoss);

  if (tp != null && tp <= 0) return 'take_profit must be greater than zero';
  if (sl != null && sl <= 0) return 'stop_loss must be greater than zero';
  if (normalizedType === 'buy' && tp != null && tp <= price) return 'BUY take profit must be above the entry price';
  if (normalizedType === 'buy' && sl != null && sl >= price) return 'BUY stop loss must be below the entry price';
  if (normalizedType === 'sell' && tp != null && tp >= price) return 'SELL take profit must be below the entry price';
  if (normalizedType === 'sell' && sl != null && sl <= price) return 'SELL stop loss must be above the entry price';

  return null;
};

const getTriggeredExit = (trade) => {
  const closePrice = getExecutionPrice({ symbol: trade.symbol, type: trade.type, action: 'close' });
  if (!closePrice) return null;

  const normalizedType = normalizeOrderType(trade.type);
  const takeProfit = toNumber(trade.take_profit);
  const stopLoss = toNumber(trade.stop_loss);
  const hasTakeProfit = takeProfit != null && takeProfit > 0;
  const hasStopLoss = stopLoss != null && stopLoss > 0;

  const takeProfitHit = hasTakeProfit && (
    normalizedType === 'buy' ? closePrice >= takeProfit : closePrice <= takeProfit
  );
  const stopLossHit = hasStopLoss && (
    normalizedType === 'buy' ? closePrice <= stopLoss : closePrice >= stopLoss
  );

  if (!takeProfitHit && !stopLossHit) return null;

  return {
    reason: takeProfitHit ? 'take_profit' : 'stop_loss',
    closePrice,
  };
};

const shouldStopOut = (metrics) => metrics.used_margin > 0 && metrics.margin_level <= 20;

module.exports = {
  calculateAccountMetrics,
  calculateMarginRequired,
  calculatePnL,
  getBrokerQuote,
  getExecutionPrice,
  getTriggeredExit,
  normalizeOrderType,
  roundMoney,
  shouldStopOut,
  validateNewOrder,
  validateStops,
};
