import { getSymbolMeta } from './symbolMeta';

export const getNumericPrice = (value, fallback = 0) => {
  const candidate = typeof value === 'object' && value !== null
    ? value.mid ?? value.price ?? value.bid ?? value.ask
    : value;
  const numericValue = Number(candidate);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

// Generate simulated prices with random movement
export const generatePrice = (basePrice, volatility = 0.0005) => {
  basePrice = getNumericPrice(basePrice, 0.0001);
  const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
  return Math.max(basePrice + change, 0.0001);
};

export const getVolatilityForSymbol = (symbol) => {
  const meta = getSymbolMeta(symbol);
  if (!meta) return 0.0005;

  switch (meta.category) {
    case 'forex':
      return 0.00025;
    case 'metals':
      return 0.00015;
    case 'indices':
      return 0.00012;
    case 'crypto':
      return 0.0005;
    default:
      return 0.0003;
  }
};

// Calculate margin required
export const calculateMargin = (lot, contractSize, price, leverage) => {
  return (getNumericPrice(lot) * getNumericPrice(contractSize) * getNumericPrice(price)) / getNumericPrice(leverage, 1);
};

// Calculate pip value
export const calculatePipValue = (symbol, lot) => {
  const meta = getSymbolMeta(symbol);
  if (!meta) return 0;
  return meta.pip * lot * meta.contractSize;
};

// Calculate spread in monetary value
export const calculateSpreadValue = (symbol, lot) => {
  const meta = getSymbolMeta(symbol);
  if (!meta) return 0;
  return meta.spread * meta.pip * lot * meta.contractSize;
};

// Calculate bid/ask from mid price
export const getQuotePrices = (symbol, midPrice) => {
  midPrice = getNumericPrice(midPrice);
  const meta = getSymbolMeta(symbol);
  if (!meta) return { bid: midPrice, ask: midPrice, mid: midPrice };

  const spreadAmount = meta.spread * meta.pip;
  return {
    mid: midPrice,
    bid: midPrice - spreadAmount / 2,
    ask: midPrice + spreadAmount / 2,
  };
};

// Calculate floating PnL
export const calculatePnL = (trade, currentPrice) => {
  currentPrice = getNumericPrice(currentPrice);
  const meta = getSymbolMeta(trade.symbol);
  const lot = getNumericPrice(trade.lot ?? trade.lot_size);
  const contractSize = getNumericPrice(meta?.contractSize, 1);
  const priceDiff = currentPrice - trade.openPrice;
  const positionValue = priceDiff * lot * contractSize;
  
  if (trade.type === 'BUY') {
    return positionValue;
  }

  return -positionValue;
};

// Calculate margin level percentage
export const calculateMarginLevel = (equity, usedMargin) => {
  equity = getNumericPrice(equity);
  usedMargin = getNumericPrice(usedMargin);
  if (usedMargin === 0) return 0;
  return (equity / usedMargin) * 100;
};

// Check if margin call should trigger
export const isMargincall = (marginLevel) => {
  return marginLevel <= 50;
};

// Check if stop out should trigger
export const isStopOut = (marginLevel) => {
  return marginLevel <= 20;
};

// Format price based on digits
export const formatPrice = (price, digits) => {
  return getNumericPrice(price).toFixed(digits);
};

export const formatSymbolPrice = (symbol, price) => {
  const meta = getSymbolMeta(symbol);
  return formatPrice(price, meta?.digits ?? 2);
};

// Create a trade object
export const createTrade = (symbol, type, lot, openPrice, timestamp = Date.now()) => {
  const meta = getSymbolMeta(symbol);
  
  return {
    id: `trade_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
    symbol,
    type, // 'BUY' or 'SELL'
    lot,
    openPrice,
    closePrice: null,
    openTime: timestamp,
    closeTime: null,
    takeProfit: null,
    stopLoss: null,
    pnl: 0,
    status: 'OPEN', // 'OPEN', 'CLOSED', 'PENDING'
  };
};

// Close a trade
export const closeTrade = (trade, closePrice, currentTime = Date.now()) => {
  const meta = getSymbolMeta(trade.symbol);
  const pipValue = calculatePipValue(trade.symbol, trade.lot);
  
  return {
    ...trade,
    closePrice,
    closeTime: currentTime,
    status: 'CLOSED',
    pnl: calculatePnL({ ...trade, openPrice: trade.openPrice }, closePrice),
  };
};

export const getBrokerQuote = (symbol, price) => {
  if (price && typeof price === 'object') {
    const mid = getNumericPrice(price.mid ?? price.price, NaN);
    const bid = getNumericPrice(price.bid, NaN);
    const ask = getNumericPrice(price.ask, NaN);

    if (Number.isFinite(bid) && Number.isFinite(ask)) {
      return {
        bid,
        ask,
        mid: Number.isFinite(mid) ? mid : (bid + ask) / 2,
      };
    }
  }

  return getQuotePrices(symbol, getNumericPrice(price));
};
