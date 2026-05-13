const TIMEFRAME_SECONDS = {
  1: 60,
  5: 300,
  15: 900,
  30: 1800,
  45: 2700,
  60: 3600,
  120: 7200,
  240: 14400,
  D: 86400,
  W: 604800,
  M: 2592000,
};

const DEFAULT_TIMEFRAMES = Object.keys(TIMEFRAME_SECONDS);
const MAX_CANDLES_PER_SERIES = 1200;
const DEFAULT_HISTORY_LIMIT = 240;

const candleCache = new Map();

const getSeriesKey = (symbol, timeframe) => `${symbol}:${timeframe}`;

const getTimeframeSeconds = (timeframe = '15') => (
  TIMEFRAME_SECONDS[String(timeframe)] || TIMEFRAME_SECONDS['15']
);

const getSlotTime = (timeframe, timestamp = Date.now()) => {
  const seconds = getTimeframeSeconds(timeframe);
  return Math.floor(timestamp / 1000 / seconds) * seconds;
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getQuoteMid = (quote) => {
  const mid = toNumber(quote?.mid ?? quote?.midPrice ?? quote?.price);
  if (mid != null) return mid;

  const bid = toNumber(quote?.bid);
  const ask = toNumber(quote?.ask);
  return bid != null && ask != null ? (bid + ask) / 2 : null;
};

const normalizeLimit = (limit) => {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed)) return DEFAULT_HISTORY_LIMIT;
  return Math.min(Math.max(Math.floor(parsed), 1), MAX_CANDLES_PER_SERIES);
};

const getVolatility = (price, pip = 0.01) => (
  Math.max(price * 0.00045, Number(pip || 0.01) * 18)
);

const seedCandles = ({ symbol, price, timeframe, pip, limit = DEFAULT_HISTORY_LIMIT }) => {
  const seconds = getTimeframeSeconds(timeframe);
  const end = getSlotTime(timeframe);
  const candles = [];
  const volatility = getVolatility(price, pip);
  const symbolSeed = symbol.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  let previousClose = price - volatility * 8;

  for (let index = limit - 1; index >= 0; index -= 1) {
    const time = end - index * seconds;
    const step = limit - index + symbolSeed;
    const wave = Math.sin(step / 7) * volatility * 1.7;
    const drift = Math.cos(step / 13) * volatility * 0.8;
    const close = previousClose + wave * 0.14 + drift * 0.1;
    const open = previousClose;
    const high = Math.max(open, close) + volatility * (0.55 + (step % 5) * 0.1);
    const low = Math.min(open, close) - volatility * (0.55 + (step % 3) * 0.12);

    candles.push({ time, open, high, low, close });
    previousClose = close;
  }

  const last = candles[candles.length - 1];
  candles[candles.length - 1] = {
    ...last,
    high: Math.max(last.high, price),
    low: Math.min(last.low, price),
    close: price,
  };

  return candles;
};

const updateSeries = (candles, price, timeframe, timestamp) => {
  const time = getSlotTime(timeframe, timestamp);
  const nextCandles = Array.isArray(candles) ? candles.slice() : [];

  if (nextCandles.length === 0) {
    return [{ time, open: price, high: price, low: price, close: price }];
  }

  const last = nextCandles[nextCandles.length - 1];

  if (last.time === time) {
    nextCandles[nextCandles.length - 1] = {
      ...last,
      high: Math.max(last.high, price),
      low: Math.min(last.low, price),
      close: price,
    };
  } else if (last.time < time) {
    nextCandles.push({
      time,
      open: last.close,
      high: Math.max(last.close, price),
      low: Math.min(last.close, price),
      close: price,
    });
  }

  return nextCandles.slice(-MAX_CANDLES_PER_SERIES);
};

const setSeries = (symbol, timeframe, candles) => {
  candleCache.set(getSeriesKey(symbol, timeframe), candles);
};

const getSeries = (symbol, timeframe) => (
  candleCache.get(getSeriesKey(symbol, timeframe)) || []
);

const seedSymbolHistory = (symbol, quote, meta = null) => {
  const price = getQuoteMid(quote);
  if (price == null || price <= 0) return;

  DEFAULT_TIMEFRAMES.forEach((timeframe) => {
    const current = getSeries(symbol, timeframe);
    if (current.length > 0) return;
    setSeries(symbol, timeframe, seedCandles({
      symbol,
      price,
      timeframe,
      pip: meta?.pip,
      limit: DEFAULT_HISTORY_LIMIT,
    }));
  });
};

const seedCandleHistory = (priceMap, metas = []) => {
  const metaBySymbol = new Map(metas.map((meta) => [meta.symbol, meta]));
  Object.entries(priceMap || {}).forEach(([symbol, quote]) => {
    seedSymbolHistory(symbol, quote, metaBySymbol.get(symbol));
  });
};

const updateCandleHistory = (priceMap, timestamp = Date.now()) => {
  Object.entries(priceMap || {}).forEach(([symbol, quote]) => {
    const price = getQuoteMid(quote);
    if (price == null || price <= 0) return;

    DEFAULT_TIMEFRAMES.forEach((timeframe) => {
      const current = getSeries(symbol, timeframe);
      setSeries(symbol, timeframe, updateSeries(current, price, timeframe, timestamp));
    });
  });
};

const getHistoricalCandles = ({ symbol, timeframe = '15', limit, quote = null, meta = null }) => {
  if (quote) {
    seedSymbolHistory(symbol, quote, meta);
    const price = getQuoteMid(quote);
    if (price != null) {
      const current = getSeries(symbol, timeframe);
      setSeries(symbol, timeframe, updateSeries(current, price, timeframe, Date.now()));
    }
  }

  return getSeries(symbol, timeframe).slice(-normalizeLimit(limit));
};

module.exports = {
  seedCandleHistory,
  updateCandleHistory,
  getHistoricalCandles,
};
