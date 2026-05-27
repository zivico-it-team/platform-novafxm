const axios = require('axios');
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

const CACHE_MS = 1500;
let priceCache = { at: 0, data: null };

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

async function quoteWebSocket(selected) {
  return new Promise((resolve, reject) => {
    const session = `qs_${Math.random().toString(36).slice(2, 14)}`;
    const quotes = new Map();
    const valuesByTicker = new Map();
    const socket = new WebSocket('wss://data.tradingview.com/socket.io/websocket', {
      headers: {
        Origin: 'https://www.tradingview.com',
        Referer: 'https://www.tradingview.com/',
        'User-Agent': 'Mozilla/5.0',
      },
    });
    const finish = () => {
      clearTimeout(timer);
      try {
        socket.close();
      } catch {}
      resolve(selected.map((instrument) => quotes.get(instrument.ticker) || fallbackPrice(instrument)));
    };
    const timer = setTimeout(() => {
      if (quotes.size) {
        finish();
        return;
      }
      try {
        socket.close();
      } catch {}
      reject(new Error('TradingView websocket quote timeout'));
    }, 6500);

    socket.on('open', () => {
      socket.send(packMessage('quote_create_session', [session]));
      socket.send(packMessage('quote_set_fields', [session, 'lp', 'chp', 'bid', 'ask', 'pricescale', 'minmov', 'pro_name']));
      selected.forEach((instrument) => socket.send(packMessage('quote_add_symbols', [session, instrument.ticker])));
    });
    socket.on('message', (data) => {
      unpackMessages(data).forEach((message) => {
        if (message.m !== 'qsd') return;
        const payload = message.p?.[1];
        if (payload?.s !== 'ok' || !payload.n) return;
        const instrument = selected.find((item) => item.ticker === payload.n);
        if (!instrument) return;
        const values = { ...(valuesByTicker.get(payload.n) || {}), ...(payload.v || {}) };
        valuesByTicker.set(payload.n, values);
        quotes.set(payload.n, quoteFromTradingView(instrument, values));
      });
      if (selected.every((instrument) => quotes.has(instrument.ticker) && valuesByTicker.get(instrument.ticker)?.lp)) finish();
    });
    socket.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function scan(scanner, selected) {
  const response = await axios.post(
    `https://scanner.tradingview.com/${scanner}/scan`,
    {
      columns: ['close', 'change'],
      symbols: { query: { types: [] }, tickers: selected.map((instrument) => instrument.ticker) },
      range: [0, selected.length],
    },
    {
      timeout: 6500,
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://www.tradingview.com',
        Referer: 'https://www.tradingview.com/',
        'User-Agent': 'Mozilla/5.0',
      },
    },
  );
  const byTicker = new Map(response.data.data.map((row) => [row.s, row.d]));
  return selected.map((instrument) => {
    const values = byTicker.get(instrument.ticker);
    if (!values || !Number(values[0])) return fallbackPrice(instrument);
    const price = Number(values[0]);
    const decimals = decimalsFor(price, instrument.group);
    return visibleInstrument(instrument, { price, bid: price, ask: price, decimals, spread: 0, spreadPoints: 0, change: Number(values[1]) || 0, source: 'tradingview' });
  });
}

async function getPrices() {
  if (priceCache.data && Date.now() - priceCache.at < CACHE_MS) return priceCache.data;
  try {
    const prices = keepPreviousPrices(await quoteWebSocket(instruments));
    priceCache = { at: Date.now(), data: prices };
    return prices;
  } catch {}

  const scanners = [...new Set(instruments.map((item) => item.scanner))];
  const batches = await Promise.all(scanners.map(async (scanner) => {
    const selected = instruments.filter((item) => item.scanner === scanner);
    try {
      return await scan(scanner, selected);
    } catch {
      return selected.map(fallbackPrice);
    }
  }));
  const prices = keepPreviousPrices(batches.flat());
  priceCache = { at: Date.now(), data: prices };
  return prices;
}

async function getPrice(symbol) {
  const prices = await getPrices();
  return prices.find((item) => item.symbol === symbol) || fallbackPrice(instruments[0]);
}

function generateCandles(symbol, base, timeframe = '15m') {
  const seconds = { '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '1H': 3600, '4H': 14400, '1D': 86400 }[timeframe] || 900;
  const liveClose = Number(base);
  const time = Math.floor(Math.floor(Date.now() / 1000) / seconds) * seconds;
  const candles = Array.from({ length: 89 }, (_, index) => {
    return {
      time: time - (index + 1) * seconds,
      open: liveClose,
      high: liveClose,
      low: liveClose,
      close: liveClose,
    };
  }).reverse();
  candles.push({
    time,
    open: liveClose,
    high: liveClose,
    low: liveClose,
    close: liveClose,
  });
  return candles;
}

module.exports = { instruments, getPrices, getPrice, generateCandles };

