const {
  seedCandleHistory,
  updateCandleHistory,
  getHistoricalCandles: readHistoricalCandles,
} = require('../lib/candleHistory');

const FOREX_SYMBOLS = [
  'AUD/CAD', 'AUD/CHF', 'AUD/JPY', 'AUD/NOK', 'AUD/NZD', 'AUD/SEK', 'AUD/SGD', 'AUD/USD',
  'CAD/CHF', 'CAD/JPY',
  'CHF/HUF', 'CHF/JPY', 'CHF/NOK', 'CHF/PLN', 'CHF/SEK', 'CHF/SGD',
  'EUR/AUD', 'EUR/CAD', 'EUR/CHF', 'EUR/CZK', 'EUR/GBP', 'EUR/HKD', 'EUR/HUF', 'EUR/JPY', 'EUR/MXN', 'EUR/NOK', 'EUR/NZD', 'EUR/PLN', 'EUR/SEK', 'EUR/SGD', 'EUR/TRY', 'EUR/USD', 'EUR/ZAR',
  'GBP/AUD', 'GBP/CAD', 'GBP/CHF', 'GBP/DKK', 'GBP/HUF', 'GBP/JPY', 'GBP/MXN', 'GBP/NOK', 'GBP/NZD', 'GBP/PLN', 'GBP/SEK', 'GBP/SGD', 'GBP/TRY', 'GBP/USD', 'GBP/ZAR',
  'HKD/JPY',
  'NOK/JPY', 'NOK/SEK',
  'NZD/CAD', 'NZD/CHF', 'NZD/HUF', 'NZD/JPY', 'NZD/SGD', 'NZD/USD',
  'SEK/JPY', 'SGD/JPY',
  'USD/CAD', 'USD/CNH', 'USD/CZK', 'USD/DKK', 'USD/HKD', 'USD/HUF', 'USD/ILS', 'USD/JPY', 'USD/MXN', 'USD/NOK', 'USD/PLN', 'USD/SEK', 'USD/SGD', 'USD/TRY', 'USD/ZAR',
  'ZAR/JPY',
];

const INDEX_META = [
  ['ASX/AUD', 'cfd', 'ASX:XJO', ['TVC:AXJO'], 7800, 1, 0, 12],
  ['DAX/EUR', 'cfd', 'TVC:DAX', ['XETR:DAX'], 18000, 1, 0, 20],
  ['DJI/USD', 'cfd', 'TVC:DJI', ['FOREXCOM:DJI'], 38500, 1, 0, 30],
  ['ESX/EUR', 'cfd', 'TVC:SX5E', ['EUREX:FESX1!'], 5000, 1, 0, 15],
  ['F40/EUR', 'cfd', 'TVC:CAC40', ['EURONEXT:PX1'], 7600, 1, 0, 15],
  ['FTS/GBP', 'cfd', 'TVC:UKX', ['FOREXCOM:UKXGBP'], 7600, 1, 0, 15],
  ['HSI/HKD', 'cfd', 'TVC:HSI', ['HKEX:HSI'], 17000, 1, 0, 25],
  ['IBX/EUR', 'cfd', 'BME:IBC', ['TVC:IBEX35'], 11000, 1, 0, 15],
  ['NDX/USD', 'america', 'NASDAQ:NDX', ['TVC:NDX', 'CME_MINI:NQ1!'], 18000, 1, 0, 25],
  ['NIK/JPY', 'cfd', 'TVC:NI225', ['OSE:NK2251!'], 39000, 1, 0, 25],
  ['SPX/USD', 'cfd', 'SP:SPX', ['TVC:SPX'], 5200, 0.1, 1, 5],
];

const METAL_META = [
  ['XAG/AUD', 'OANDA:XAGAUD', ['FX_IDC:XAGAUD'], 115, 0.001, 3, 30],
  ['XAG/CHF', 'OANDA:XAGCHF', ['FX_IDC:XAGCHF'], 70, 0.001, 3, 30],
  ['XAG/EUR', 'OANDA:XAGEUR', ['FX_IDC:XAGEUR'], 70, 0.001, 3, 30],
  ['XAG/GBP', 'OANDA:XAGGBP', ['FX_IDC:XAGGBP'], 60, 0.001, 3, 30],
  ['XAG/USD', 'TVC:SILVER', ['OANDA:XAGUSD', 'FOREXCOM:XAGUSD'], 76.5, 0.001, 3, 30],
  ['XAU/AUD', 'OANDA:XAUAUD', ['FX_IDC:XAUAUD'], 7000, 0.01, 2, 40],
  ['XAU/CHF', 'OANDA:XAUCHF', ['FX_IDC:XAUCHF'], 4200, 0.01, 2, 40],
  ['XAU/EUR', 'OANDA:XAUEUR', ['FX_IDC:XAUEUR'], 4300, 0.01, 2, 40],
  ['XAU/GBP', 'OANDA:XAUGBP', ['FX_IDC:XAUGBP'], 3700, 0.01, 2, 40],
  ['XAU/USD', 'OANDA:XAUUSD', ['TVC:GOLD', 'FOREXCOM:XAUUSD'], 4685.6, 0.01, 2, 40],
  ['XPD/USD', 'TVC:PALLADIUM', ['OANDA:XPDUSD'], 1000, 0.01, 2, 60],
  ['XPT/USD', 'TVC:PLATINUM', ['OANDA:XPTUSD'], 950, 0.01, 2, 50],
];

const ENERGY_META = [
  ['BRN/USD', 'TVC:UKOIL', ['BLACKBULL:BRENT'], 85, 0.01, 2, 5],
  ['NGC/USD', 'TVC:NATGAS', ['NYMEX:NG1!'], 2.5, 0.001, 3, 8],
  ['WTI/USD', 'TVC:USOIL', ['BLACKBULL:WTI'], 80, 0.01, 2, 5],
];

const CRYPTO_SYMBOLS = [
  'ADA/USD', 'APE/USD', 'AXS/USD', 'BAT/USD', 'BCH/EUR', 'BCH/GBP', 'BCH/USD', 'BTC/EUR', 'BTC/GBP', 'BTC/USD',
  'CHZ/USD', 'CRV/USD', 'DOT/USD', 'EOS/USD', 'ETC/USD', 'ETH/EUR', 'ETH/GBP', 'ETH/USD', 'FIL/USD', 'GAL/USD',
  'GMT/USD', 'GRT/USD', 'IMX/USD', 'KNC/USD', 'KSM/USD', 'LPT/USD', 'LRC/USD', 'LTC/EUR', 'LTC/GBP', 'LTC/USD',
  'MKR/USD', 'SKL/USD', 'SNX/USD', 'SOL/USD', 'UNI/USD', 'XRP/USD', 'XTZ/USD', 'YFI/USD', 'ZEC/USD', 'ZEN/USD', 'ZRX/USD',
];

const CRYPTO_BASES = {
  'ADA/USD': 0.45, 'APE/USD': 1.2, 'AXS/USD': 6, 'BAT/USD': 0.2,
  'BCH/EUR': 420, 'BCH/GBP': 360, 'BCH/USD': 450,
  'BTC/EUR': 60000, 'BTC/GBP': 52000, 'BTC/USD': 65000,
  'CHZ/USD': 0.08, 'CRV/USD': 0.5, 'DOT/USD': 6, 'EOS/USD': 0.8, 'ETC/USD': 26,
  'ETH/EUR': 3000, 'ETH/GBP': 2600, 'ETH/USD': 3200,
  'FIL/USD': 5, 'GAL/USD': 2, 'GMT/USD': 0.2, 'GRT/USD': 0.2, 'IMX/USD': 2,
  'KNC/USD': 0.8, 'KSM/USD': 35, 'LPT/USD': 16, 'LRC/USD': 0.25,
  'LTC/EUR': 75, 'LTC/GBP': 65, 'LTC/USD': 80,
  'MKR/USD': 2500, 'SKL/USD': 0.06, 'SNX/USD': 3, 'SOL/USD': 150,
  'UNI/USD': 8, 'XRP/USD': 0.6, 'XTZ/USD': 1, 'YFI/USD': 8000,
  'ZEC/USD': 35, 'ZEN/USD': 10, 'ZRX/USD': 0.4,
};

const getForexMeta = (symbol) => {
  const [base, quote] = symbol.split('/');
  const code = `${base}${quote}`;
  const isJpy = quote === 'JPY';
  const isExotic = ['CNH', 'CZK', 'DKK', 'HKD', 'HUF', 'ILS', 'MXN', 'NOK', 'PLN', 'SEK', 'SGD', 'TRY', 'ZAR'].includes(quote);

  return {
    symbol,
    category: 'forex',
    tv: `FX:${code}`,
    fallbackTv: [`OANDA:${code}`, `FX_IDC:${code}`],
    base: isJpy ? 150 : 1,
    pip: isJpy ? 0.001 : 0.00001,
    digits: isJpy ? 3 : 5,
    spread: isExotic ? 8 : 2,
    maxDeviationPct: 100000,
  };
};

const getMarketMeta = (category, [symbol, scannerGroup, tv, fallbackTv, base, pip, digits, spread], maxDeviationPct) => ({
  symbol,
  category,
  scannerGroup,
  tv,
  fallbackTv,
  base,
  pip,
  digits,
  spread,
  maxDeviationPct,
});

const getCryptoMeta = (symbol) => {
  const [base, quote] = symbol.split('/');
  const tvQuote = quote === 'USD' ? 'USDT' : quote;
  const exchange = quote === 'USD' ? 'BINANCE' : 'COINBASE';
  const numericBase = CRYPTO_BASES[symbol] || 1;
  const digits = numericBase >= 1000 ? 0 : numericBase >= 10 ? 2 : numericBase >= 1 ? 3 : 4;
  const pip = digits === 0 ? 1 : Number(`0.${'0'.repeat(digits - 1)}1`);

  return {
    symbol,
    category: 'crypto',
    tv: `${exchange}:${base}${tvQuote}`,
    fallbackTv: [`COINBASE:${base}${quote}`, `KRAKEN:${base}${quote}`],
    base: numericBase,
    pip,
    digits,
    spread: numericBase >= 1000 ? 50 : 10,
    maxDeviationPct: 10000,
  };
};

const SYMBOL_META = [
  ...FOREX_SYMBOLS.map(getForexMeta),
  ...METAL_META.map(([symbol, tv, fallbackTv, base, pip, digits, spread]) => (
    getMarketMeta('metals', [symbol, 'cfd', tv, fallbackTv, base, pip, digits, spread], 500)
  )),
  ...ENERGY_META.map(([symbol, tv, fallbackTv, base, pip, digits, spread]) => (
    getMarketMeta('energies', [symbol, 'cfd', tv, fallbackTv, base, pip, digits, spread], 500)
  )),
  ...INDEX_META.map((meta) => getMarketMeta('indices', meta, 500)),
  ...CRYPTO_SYMBOLS.map(getCryptoMeta),
];

const TRADINGVIEW_GROUPS = {
  forex: 'forex',
  metals: 'forex',
  crypto: 'crypto',
};

const currentPrices = {};
const rateLimitedUntilByGroup = {};
let groupCursor = 0;

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getMaxDeviation = (meta) => {
  if (meta.maxDeviationPct) return meta.maxDeviationPct;

  switch (meta.category) {
    case 'forex':
    case 'metals':
      return 35;
    case 'indices':
      return 70;
    case 'crypto':
      return 90;
    default:
      return 50;
  }
};

const isReasonableBrokerPrice = (symbol, mid) => {
  const meta = SYMBOL_META.find((item) => item.symbol === symbol);
  if (!meta || mid == null || mid <= 0) return false;

  const baseDeviationPct = Math.abs((mid - meta.base) / meta.base) * 100;
  if (baseDeviationPct > getMaxDeviation(meta)) {
    console.warn(`Rejected out-of-range ${symbol} price ${mid}; base ${meta.base}, deviation ${baseDeviationPct.toFixed(2)}%`);
    return false;
  }

  const previous = currentPrices[symbol];
  if (previous?.source === 'live' && previous.mid > 0) {
    const tickDeviationPct = Math.abs((mid - previous.mid) / previous.mid) * 100;
    if (tickDeviationPct > 5) {
      console.warn(`Rejected jumpy ${symbol} price ${mid}; previous ${previous.mid}, move ${tickDeviationPct.toFixed(2)}%`);
      return false;
    }
  }

  return true;
};

const getPriceQuotes = (symbol, mid, source = 'live') => {
  const meta = SYMBOL_META.find((item) => item.symbol === symbol);
  if (!meta) {
    return { bid: mid, ask: mid, mid, source, updatedAt: new Date().toISOString() };
  }

  const spreadAmount = meta.spread * meta.pip;
  return {
    bid: Number((mid - spreadAmount / 2).toFixed(meta.digits)),
    ask: Number((mid + spreadAmount / 2).toFixed(meta.digits)),
    mid: Number(mid.toFixed(meta.digits)),
    source,
    updatedAt: new Date().toISOString(),
  };
};

const initPrices = () => {
  SYMBOL_META.forEach((meta) => {
    currentPrices[meta.symbol] = getPriceQuotes(meta.symbol, meta.base, 'initial');
  });
  seedCandleHistory(currentPrices, SYMBOL_META);
};

const groupSymbols = () => SYMBOL_META.reduce((groups, meta) => {
  const group = meta.scannerGroup || TRADINGVIEW_GROUPS[meta.category];
  if (!group) return groups;

  if (!groups[group]) {
    groups[group] = [];
  }

  groups[group].push(meta);
  return groups;
}, {});

const fetchTradingViewGroup = async (group, metas) => {
  if (Date.now() < (rateLimitedUntilByGroup[group] || 0)) {
    return {};
  }

  const tickerMeta = new Map();
  const tickers = [];

  metas.forEach((meta) => {
    [meta.tv, ...(meta.fallbackTv || [])].forEach((ticker, priority) => {
      if (!ticker) return;
      tickerMeta.set(ticker, { symbol: meta.symbol, priority });
      tickers.push(ticker);
    });
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`https://scanner.tradingview.com/${group}/scan`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NovaFXM/1.0',
      },
      body: JSON.stringify({
        symbols: { tickers },
        columns: ['close'],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        rateLimitedUntilByGroup[group] = Date.now() + 30000;
      }
      throw new Error(`TradingView ${group} responded with ${response.status}`);
    }

    const payload = await response.json();
    const candidates = (payload.data || []).reduce((prices, item) => {
      const meta = tickerMeta.get(item.s);
      const mid = toNumber(item.d?.[0]);

      if (meta && mid != null) {
        const existing = prices[meta.symbol];
        if (!existing || meta.priority < existing.priority) {
          prices[meta.symbol] = { mid, priority: meta.priority };
        }
      }

      return prices;
    }, {});

    return Object.entries(candidates).reduce((prices, [symbol, candidate]) => {
      prices[symbol] = candidate.mid;
      return prices;
    }, {});
  } finally {
    clearTimeout(timeout);
  }
};

const fetchTradingViewPrices = async () => {
  const groupEntries = Object.entries(groupSymbols());
  if (groupEntries.length === 0) return {};

  const orderedGroups = [
    ...groupEntries.slice(groupCursor % groupEntries.length),
    ...groupEntries.slice(0, groupCursor % groupEntries.length),
  ];
  groupCursor++;

  const results = await Promise.allSettled(
    orderedGroups.map(async ([group, metas]) => {
      const prices = await fetchTradingViewGroup(group, metas);
      return [group, prices];
    })
  );

  return results.reduce((prices, result) => {
    if (result.status !== 'fulfilled') {
      console.warn('Live price fetch failed:', result.reason?.message || result.reason);
      return prices;
    }

    const [group, groupPrices] = result.value;
    if (!groupPrices || Object.keys(groupPrices).length === 0) {
      return prices;
    }

    return { ...prices, ...groupPrices };
  }, {});
};

const fetchLivePrices = async () => {
  return fetchTradingViewPrices();
};

const updateLivePrices = async () => {
  const livePrices = await fetchLivePrices();
  let updatedCount = 0;

  Object.entries(livePrices).forEach(([symbol, mid]) => {
    if (!isReasonableBrokerPrice(symbol, mid)) return;

    currentPrices[symbol] = getPriceQuotes(symbol, mid, 'live');
    updatedCount++;
  });

  updateCandleHistory(currentPrices);
  return updatedCount;
};

const broadcastPrices = (wss) => {
  const payload = JSON.stringify({ type: 'priceUpdate', data: currentPrices });
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
};

const getRefreshInterval = () => {
  const configuredInterval = Number(process.env.PRICE_REFRESH_MS);
  if (Number.isFinite(configuredInterval) && configuredInterval >= 1000) {
    return configuredInterval;
  }

  return 3000;
};

const startPriceBroadcast = (wss, intervalMs = getRefreshInterval(), onPricesUpdated = null) => {
  initPrices();
  broadcastPrices(wss);
  let isRefreshing = false;

  const refreshAndBroadcast = async () => {
    if (isRefreshing) return;

    isRefreshing = true;
    try {
      const updatedCount = await updateLivePrices();
      if (updatedCount > 0) {
        console.log(`Updated ${updatedCount} live prices`);
      }
      if (onPricesUpdated) {
        await onPricesUpdated(currentPrices);
      }
      broadcastPrices(wss);
    } catch (error) {
      console.warn('Price refresh failed:', error.message);
      broadcastPrices(wss);
    } finally {
      isRefreshing = false;
    }
  };

  refreshAndBroadcast();
  setInterval(refreshAndBroadcast, intervalMs);
};

const getCurrentPrices = () => currentPrices;
const getHistoricalCandles = (symbol, timeframe = '15', limit = 240) => {
  const quote = currentPrices[symbol];
  const meta = SYMBOL_META.find((item) => item.symbol === symbol);

  return readHistoricalCandles({ symbol, timeframe, limit, quote, meta });
};
const getCurrentPriceList = () => Object.entries(currentPrices).map(([symbol, price]) => ({
  symbol,
  ...price,
}));
const getPriceCoverage = () => SYMBOL_META.map((meta) => {
  const price = currentPrices[meta.symbol];

  return {
    symbol: meta.symbol,
    category: meta.category,
    source: price?.source || 'missing',
    isLive: price?.source === 'live',
    updatedAt: price?.updatedAt || null,
    tv: meta.tv,
    fallbackTv: meta.fallbackTv || [],
  };
});

module.exports = {
  startPriceBroadcast,
  getCurrentPrices,
  getCurrentPriceList,
  getPriceCoverage,
  getHistoricalCandles,
};
