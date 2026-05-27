const WebSocket = require('ws');

const instrument = (ticker, symbol, name, group, scanner, popular = false) => ({
  ticker, symbol, name, group, scanner, popular,
});

const instruments = [
  instrument('BINANCE:ADAUSDT', 'ADA/USD', 'Cardano / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:APEUSDT', 'APE/USD', 'ApeCoin / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:AXSUSDT', 'AXS/USD', 'Axie Infinity / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:BATUSDT', 'BAT/USD', 'Basic Attention Token / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('COINBASE:BCHEUR', 'BCH/EUR', 'Bitcoin Cash / Euro', 'CRYPTO CFD', 'crypto'),
  instrument('COINBASE:BCHGBP', 'BCH/GBP', 'Bitcoin Cash / Pound', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:BCHUSDT', 'BCH/USD', 'Bitcoin Cash / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('COINBASE:BTCEUR', 'BTC/EUR', 'Bitcoin / Euro', 'CRYPTO CFD', 'crypto'),
  instrument('COINBASE:BTCGBP', 'BTC/GBP', 'Bitcoin / Pound', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:BTCUSDT', 'BTC/USD', 'Bitcoin / US Dollar', 'CRYPTO CFD', 'crypto', true),
  instrument('BINANCE:CHZUSDT', 'CHZ/USD', 'Chiliz / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:CRVUSDT', 'CRV/USD', 'Curve / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:DOTUSDT', 'DOT/USD', 'Polkadot / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:EOSUSDT', 'EOS/USD', 'EOS / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:ETCUSDT', 'ETC/USD', 'Ethereum Classic / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('COINBASE:ETHEUR', 'ETH/EUR', 'Ethereum / Euro', 'CRYPTO CFD', 'crypto'),
  instrument('COINBASE:ETHGBP', 'ETH/GBP', 'Ethereum / Pound', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:ETHUSDT', 'ETH/USD', 'Ethereum / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:FILUSDT', 'FIL/USD', 'Filecoin / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:GALUSDT', 'GAL/USD', 'Galxe / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:GMTUSDT', 'GMT/USD', 'STEPN / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:GRTUSDT', 'GRT/USD', 'The Graph / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:IMXUSDT', 'IMX/USD', 'Immutable / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:KNCUSDT', 'KNC/USD', 'Kyber Network / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:KSMUSDT', 'KSM/USD', 'Kusama / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:LPTUSDT', 'LPT/USD', 'Livepeer / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:LRCUSDT', 'LRC/USD', 'Loopring / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('COINBASE:LTCEUR', 'LTC/EUR', 'Litecoin / Euro', 'CRYPTO CFD', 'crypto'),
  instrument('COINBASE:LTCGBP', 'LTC/GBP', 'Litecoin / Pound', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:LTCUSDT', 'LTC/USD', 'Litecoin / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:MKRUSDT', 'MKR/USD', 'Maker / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:SKLUSDT', 'SKL/USD', 'SKALE / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:SNXUSDT', 'SNX/USD', 'Synthetix / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:SOLUSDT', 'SOL/USD', 'Solana / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:UNIUSDT', 'UNI/USD', 'Uniswap / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:XRPUSDT', 'XRP/USD', 'XRP / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:XTZUSDT', 'XTZ/USD', 'Tezos / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:YFIUSDT', 'YFI/USD', 'yearn.finance / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:ZECUSDT', 'ZEC/USD', 'Zcash / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:ZENUSDT', 'ZEN/USD', 'Horizen / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('BINANCE:ZRXUSDT', 'ZRX/USD', '0x / US Dollar', 'CRYPTO CFD', 'crypto'),
  instrument('OANDA:BCOUSD', 'BRN/USD', 'Brent Crude Oil', 'ENERGIES', 'cfd'),
  instrument('OANDA:NATGASUSD', 'NGC/USD', 'Natural Gas', 'ENERGIES', 'cfd'),
  instrument('OANDA:WTICOUSD', 'WTI/USD', 'West Texas Oil', 'ENERGIES', 'cfd'),
  instrument('FX:AUDCAD', 'AUD/CAD', 'Australian Dollar / Canadian Dollar', 'FOREX', 'forex'),
  instrument('FX:AUDCHF', 'AUD/CHF', 'Australian Dollar / Swiss Franc', 'FOREX', 'forex'),
  instrument('FX:AUDJPY', 'AUD/JPY', 'Australian Dollar / Yen', 'FOREX', 'forex', true),
  instrument('FX:AUDNZD', 'AUD/NZD', 'Australian Dollar / New Zealand Dollar', 'FOREX', 'forex'),
  instrument('FX:AUDSGD', 'AUD/SGD', 'Australian Dollar / Singapore Dollar', 'FOREX', 'forex'),
  instrument('FX:AUDUSD', 'AUD/USD', 'Australian Dollar / US Dollar', 'FOREX', 'forex'),
  instrument('FX:CADCHF', 'CAD/CHF', 'Canadian Dollar / Swiss Franc', 'FOREX', 'forex'),
  instrument('FX:CADJPY', 'CAD/JPY', 'Canadian Dollar / Yen', 'FOREX', 'forex'),
  instrument('FX:CHFJPY', 'CHF/JPY', 'Swiss Franc / Yen', 'FOREX', 'forex'),
  instrument('FX:EURAUD', 'EUR/AUD', 'Euro / Australian Dollar', 'FOREX', 'forex'),
  instrument('FX:EURCAD', 'EUR/CAD', 'Euro / Canadian Dollar', 'FOREX', 'forex'),
  instrument('FX:EURCHF', 'EUR/CHF', 'Euro / Swiss Franc', 'FOREX', 'forex', true),
  instrument('FX:EURGBP', 'EUR/GBP', 'Euro / Pound', 'FOREX', 'forex'),
  instrument('FX:EURJPY', 'EUR/JPY', 'Euro / Yen', 'FOREX', 'forex', true),
  instrument('FX:EURUSD', 'EUR/USD', 'Euro / US Dollar', 'FOREX', 'forex', true),
  instrument('FX:GBPAUD', 'GBP/AUD', 'British Pound / Australian Dollar', 'FOREX', 'forex'),
  instrument('FX:GBPCAD', 'GBP/CAD', 'British Pound / Canadian Dollar', 'FOREX', 'forex'),
  instrument('FX:GBPCHF', 'GBP/CHF', 'British Pound / Swiss Franc', 'FOREX', 'forex'),
  instrument('FX:GBPJPY', 'GBP/JPY', 'British Pound / Yen', 'FOREX', 'forex'),
  instrument('FX:GBPNZD', 'GBP/NZD', 'British Pound / New Zealand Dollar', 'FOREX', 'forex'),
  instrument('FX:GBPUSD', 'GBP/USD', 'British Pound / US Dollar', 'FOREX', 'forex', true),
  instrument('FX:NZDCAD', 'NZD/CAD', 'New Zealand Dollar / Canadian Dollar', 'FOREX', 'forex'),
  instrument('FX:NZDCHF', 'NZD/CHF', 'New Zealand Dollar / Swiss Franc', 'FOREX', 'forex'),
  instrument('FX:NZDJPY', 'NZD/JPY', 'New Zealand Dollar / Yen', 'FOREX', 'forex'),
  instrument('FX:NZDUSD', 'NZD/USD', 'New Zealand Dollar / US Dollar', 'FOREX', 'forex'),
  instrument('FX:USDCAD', 'USD/CAD', 'US Dollar / Canadian Dollar', 'FOREX', 'forex', true),
  instrument('FX:USDCHF', 'USD/CHF', 'US Dollar / Swiss Franc', 'FOREX', 'forex'),
  instrument('FX:USDCNH', 'USD/CNH', 'US Dollar / Chinese Yuan', 'FOREX', 'forex'),
  instrument('FX:USDHKD', 'USD/HKD', 'US Dollar / Hong Kong Dollar', 'FOREX', 'forex'),
  instrument('FX:USDJPY', 'USD/JPY', 'US Dollar / Yen', 'FOREX', 'forex', true),
  instrument('FX:USDMXN', 'USD/MXN', 'US Dollar / Mexican Peso', 'FOREX', 'forex'),
  instrument('FX:USDSGD', 'USD/SGD', 'US Dollar / Singapore Dollar', 'FOREX', 'forex'),
  instrument('FX:USDTRY', 'USD/TRY', 'US Dollar / Turkish Lira', 'FOREX', 'forex'),
  instrument('OANDA:AU200AUD', 'ASX/AUD', 'Australia 200', 'INDICES', 'cfd'),
  instrument('OANDA:DE30EUR', 'DAX/EUR', 'Germany 40', 'INDICES', 'cfd'),
  instrument('OANDA:US30USD', 'DJI/USD', 'Dow Jones', 'INDICES', 'cfd'),
  instrument('OANDA:EU50EUR', 'ESX/EUR', 'Euro Stoxx 50', 'INDICES', 'cfd'),
  instrument('OANDA:FR40EUR', 'F40/EUR', 'France 40', 'INDICES', 'cfd'),
  instrument('OANDA:UK100GBP', 'FTS/GBP', 'UK 100', 'INDICES', 'cfd'),
  instrument('OANDA:HK33HKD', 'HSI/HKD', 'Hong Kong 33', 'INDICES', 'cfd'),
  instrument('OANDA:ESPIXEUR', 'IBX/EUR', 'Spain 35', 'INDICES', 'cfd'),
  instrument('OANDA:NAS100USD', 'NDX/USD', 'Nasdaq 100', 'INDICES', 'cfd'),
  instrument('OANDA:JP225USD', 'NIK/JPY', 'Japan 225', 'INDICES', 'cfd'),
  instrument('OANDA:SPX500USD', 'SPX/USD', 'S&P 500', 'INDICES', 'cfd'),
  instrument('OANDA:XAGAUD', 'XAG/AUD', 'Silver / Australian Dollar', 'METALS', 'forex'),
  instrument('OANDA:XAGCHF', 'XAG/CHF', 'Silver / Swiss Franc', 'METALS', 'forex'),
  instrument('OANDA:XAGEUR', 'XAG/EUR', 'Silver / Euro', 'METALS', 'forex'),
  instrument('OANDA:XAGGBP', 'XAG/GBP', 'Silver / Pound', 'METALS', 'forex'),
  instrument('OANDA:XAGUSD', 'XAG/USD', 'Silver / US Dollar', 'METALS', 'forex'),
  instrument('OANDA:XAUAUD', 'XAU/AUD', 'Gold / Australian Dollar', 'METALS', 'forex'),
  instrument('OANDA:XAUCHF', 'XAU/CHF', 'Gold / Swiss Franc', 'METALS', 'forex'),
  instrument('OANDA:XAUEUR', 'XAU/EUR', 'Gold / Euro', 'METALS', 'forex'),
  instrument('OANDA:XAUGBP', 'XAU/GBP', 'Gold / Pound', 'METALS', 'forex'),
  instrument('OANDA:XAUUSD', 'XAU/USD', 'Gold / US Dollar', 'METALS', 'forex', true),
  instrument('OANDA:XPDUSD', 'XPD/USD', 'Palladium / US Dollar', 'METALS', 'forex'),
  instrument('OANDA:XPTUSD', 'XPT/USD', 'Platinum / US Dollar', 'METALS', 'forex'),
];

let priceCache = { at: 0, data: null };
const latestQuotes = new Map();
const quoteValues = new Map();
const streamListeners = new Set();
const instrumentsByTicker = new Map(instruments.map((item) => [item.ticker, item]));
const STREAM_STALE_MS = 15000;
const STREAM_RECONNECT_MS = 5000;
const CANDLE_CACHE_MS = 15000;
let quoteSocket = null;
let reconnectTimer = null;
const candleCache = new Map();

const decimalsFor = (price, group) => {
  if (group === 'FOREX') return price >= 10 ? 3 : 5;
  if (group === 'CRYPTO CFD') return price >= 100 ? 2 : price >= 1 ? 3 : 6;
  if (group === 'INDICES') return price >= 100 ? 2 : 1;
  if (group === 'ENERGIES') return price >= 10 ? 3 : 4;
  if (group === 'METALS') return price >= 100 ? 2 : 3;
  return 2;
};

function visibleInstrument(item, quoteValues) {
  const { ticker, scanner, ...visible } = item;
  return { ...visible, tradingViewSymbol: ticker, ...quoteValues };
}

const packMessage = (method, params) => {
  const payload = JSON.stringify({ m: method, p: params });
  return `~m~${payload.length}~m~${payload}`;
};

const unpackMessages = (raw) => {
  const messages = [];
  const text = String(raw);
  let offset = 0;
  while (offset < text.length) {
    const header = text.indexOf('~m~', offset);
    if (header === -1) break;
    const lengthStart = header + 3;
    const lengthEnd = text.indexOf('~m~', lengthStart);
    if (lengthEnd === -1) break;
    const length = Number(text.slice(lengthStart, lengthEnd));
    const payloadStart = lengthEnd + 3;
    const payload = text.slice(payloadStart, payloadStart + length);
    offset = payloadStart + length;
    try {
      messages.push(JSON.parse(payload));
    } catch {}
  }
  return messages;
};

const quoteFromTradingView = (instrument, values) => {
  const price = Number(values.lp || values.bid || values.ask || 0);
  if (!price) return fallbackPrice(instrument);
  const decimals = decimalsFor(price, instrument.group);
  const bid = Number(values.bid || price);
  const ask = Number(values.ask || price);
  const spread = Number(Math.max(0, ask - bid).toFixed(decimals));
  const spreadPoints = spread ? Number((spread * (10 ** decimals)).toFixed(1)) : 0;
  return visibleInstrument(instrument, {
    price,
    bid,
    ask,
    decimals,
    spread,
    spreadPoints,
    change: Number(values.chp || 0),
    source: 'tradingview',
    updatedAt: new Date().toISOString(),
  });
};

function fallbackPrice(instrument) {
  return visibleInstrument(instrument, { price: 0, bid: 0, ask: 0, decimals: 2, spread: 0, spreadPoints: 0, change: 0, source: 'fallback' });
}

function keepPreviousPrices(nextPrices) {
  if (!priceCache.data) return nextPrices;
  const previousBySymbol = new Map(priceCache.data.map((item) => [item.symbol, item]));
  return nextPrices.map((item) => {
    const previous = previousBySymbol.get(item.symbol);
    if (previous && item.source === 'fallback' && !Number(item.price)) return previous;
    return item;
  });
}

function snapshotPrices() {
  const previousBySymbol = new Map((priceCache.data || []).map((item) => [item.symbol, item]));
  const now = Date.now();
  const prices = instruments.map((item) => {
    const quote = latestQuotes.get(item.ticker);
    if (quote) {
      const updatedAt = Date.parse(quote.updatedAt);
      if (Number.isFinite(updatedAt) && now - updatedAt > STREAM_STALE_MS) {
        return { ...quote, source: 'stale' };
      }
      return quote;
    }
    return previousBySymbol.get(item.symbol) || fallbackPrice(item);
  });
  priceCache = { at: now, data: prices };
  return prices;
}

function publishPrices() {
  const prices = snapshotPrices();
  streamListeners.forEach((listener) => listener(prices));
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectQuoteStream();
  }, STREAM_RECONNECT_MS);
}

function connectQuoteStream() {
  if (quoteSocket && (
    quoteSocket.readyState === WebSocket.OPEN ||
    quoteSocket.readyState === WebSocket.CONNECTING
  )) return;

  const session = `qs_${Math.random().toString(36).slice(2, 14)}`;
  quoteSocket = new WebSocket('wss://data.tradingview.com/socket.io/websocket', {
    headers: {
      Origin: 'https://www.tradingview.com',
      Referer: 'https://www.tradingview.com/',
      'User-Agent': 'Mozilla/5.0',
    },
  });

  quoteSocket.on('open', () => {
    quoteSocket.send(packMessage('quote_create_session', [session]));
    quoteSocket.send(packMessage('quote_set_fields', [session, 'lp', 'chp', 'bid', 'ask', 'pricescale', 'minmov', 'pro_name']));
    instruments.forEach((item) => quoteSocket.send(packMessage('quote_add_symbols', [session, item.ticker])));
    console.log('TradingView quote stream connected');
  });

  quoteSocket.on('message', (data) => {
    const raw = String(data);
    const heartbeatFrames = raw.match(/~m~\d+~m~~h~\d+/g) || [];
    heartbeatFrames.forEach((heartbeat) => {
      if (quoteSocket.readyState === WebSocket.OPEN) quoteSocket.send(heartbeat);
    });

    let changed = false;
    unpackMessages(raw).forEach((message) => {
      if (message.m !== 'qsd') return;
      const payload = message.p?.[1];
      const item = instrumentsByTicker.get(payload?.n);
      if (payload?.s !== 'ok' || !item) return;

      const values = { ...(quoteValues.get(item.ticker) || {}), ...(payload.v || {}) };
      quoteValues.set(item.ticker, values);
      if (!Number(values.lp || values.bid || values.ask)) return;
      latestQuotes.set(item.ticker, quoteFromTradingView(item, values));
      changed = true;
    });

    if (changed) publishPrices();
  });

  quoteSocket.on('close', () => {
    quoteSocket = null;
    console.warn('TradingView quote stream disconnected; reconnecting');
    scheduleReconnect();
  });

  quoteSocket.on('error', (error) => {
    console.warn('TradingView quote stream error:', error.message);
  });
}

async function getPrices() {
  connectQuoteStream();
  return snapshotPrices();
}

function startPriceStream(listener) {
  if (typeof listener === 'function') streamListeners.add(listener);
  connectQuoteStream();
  return () => streamListeners.delete(listener);
}

async function getPrice(symbol) {
  const prices = await getPrices();
  return prices.find((item) => item.symbol === symbol) || fallbackPrice(instruments[0]);
}

const chartInterval = (timeframe) => ({
  '1s': '1S',
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '30m': '30',
  '1H': '60',
  '4H': '240',
  '1D': '1D',
}[timeframe] || '15');

function requestCandles(item, timeframe = '15m', limit = 240) {
  return new Promise((resolve, reject) => {
    const session = `cs_${Math.random().toString(36).slice(2, 14)}`;
    const socket = new WebSocket('wss://data.tradingview.com/socket.io/websocket', {
      headers: {
        Origin: 'https://www.tradingview.com',
        Referer: 'https://www.tradingview.com/',
        'User-Agent': 'Mozilla/5.0',
      },
    });
    const closeWith = (handler, value) => {
      clearTimeout(timer);
      try {
        socket.close();
      } catch {}
      handler(value);
    };
    const timer = setTimeout(() => closeWith(reject, new Error('TradingView candle request timed out')), 8000);

    socket.on('open', () => {
      const symbol = `=${JSON.stringify({ symbol: item.ticker, adjustment: 'splits', session: 'regular' })}`;
      socket.send(packMessage('chart_create_session', [session, '']));
      socket.send(packMessage('switch_timezone', [session, 'Etc/UTC']));
      socket.send(packMessage('resolve_symbol', [session, 'symbol_1', symbol]));
      socket.send(packMessage('create_series', [session, 's1', 's1', 'symbol_1', chartInterval(timeframe), limit, '']));
    });

    socket.on('message', (data) => {
      const raw = String(data);
      const heartbeatFrames = raw.match(/~m~\d+~m~~h~\d+/g) || [];
      heartbeatFrames.forEach((heartbeat) => {
        if (socket.readyState === WebSocket.OPEN) socket.send(heartbeat);
      });
      unpackMessages(raw).forEach((message) => {
        if (message.m === 'series_error' || message.m === 'symbol_error') {
          closeWith(reject, new Error('TradingView has no chart data for this symbol'));
          return;
        }
        const points = message.m === 'timescale_update' ? message.p?.[1]?.s1?.s : null;
        if (!Array.isArray(points) || !points.length) return;
        const candles = points.map(({ v }) => ({
          time: Number(v[0]),
          open: Number(v[1]),
          high: Number(v[2]),
          low: Number(v[3]),
          close: Number(v[4]),
        })).filter((bar) => Object.values(bar).every(Number.isFinite));
        closeWith(resolve, candles);
      });
    });
    socket.on('error', (error) => closeWith(reject, error));
  });
}

async function getHistoricalCandles(symbol, timeframe = '15m', limit = 240) {
  const item = instruments.find((instrument) => instrument.symbol === symbol);
  if (!item) return [];
  if (timeframe === '1s') return [];
  const boundedLimit = Math.max(20, Math.min(Number(limit) || 240, 500));
  const key = `${symbol}:${timeframe}:${boundedLimit}`;
  const cached = candleCache.get(key);
  if (cached && Date.now() - cached.at < CANDLE_CACHE_MS) return cached.data;

  const candles = await requestCandles(item, timeframe, boundedLimit);
  candleCache.set(key, { at: Date.now(), data: candles });
  return candles;
}

module.exports = { instruments, getPrices, getPrice, getHistoricalCandles, startPriceStream };

