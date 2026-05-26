const axios = require('axios');

const instrument = (ticker, symbol, name, group, scanner, decimals, fallback, spreadPoints, popular = false) => ({
  ticker, symbol, name, group, scanner, decimals, fallback, spreadPoints, popular,
});

const instruments = [
  instrument('BINANCE:ADAUSDT', 'ADA/USD', 'Cardano / US Dollar', 'CRYPTO CFD', 'crypto', 6, 0.2453, 10),
  instrument('BINANCE:APEUSDT', 'APE/USD', 'ApeCoin / US Dollar', 'CRYPTO CFD', 'crypto', 4, 0.1369, 0.3),
  instrument('BINANCE:AXSUSDT', 'AXS/USD', 'Axie Infinity / US Dollar', 'CRYPTO CFD', 'crypto', 3, 1.16, 0.2),
  instrument('BINANCE:BATUSDT', 'BAT/USD', 'Basic Attention Token / US Dollar', 'CRYPTO CFD', 'crypto', 6, 0.09999, 10),
  instrument('COINBASE:BCHEUR', 'BCH/EUR', 'Bitcoin Cash / Euro', 'CRYPTO CFD', 'crypto', 3, 302.09, 0.3),
  instrument('COINBASE:BCHGBP', 'BCH/GBP', 'Bitcoin Cash / Pound', 'CRYPTO CFD', 'crypto', 3, 260.54, 0.3),
  instrument('BINANCE:BCHUSDT', 'BCH/USD', 'Bitcoin Cash / US Dollar', 'CRYPTO CFD', 'crypto', 3, 352.1, 0.3),
  instrument('COINBASE:BTCEUR', 'BTC/EUR', 'Bitcoin / Euro', 'CRYPTO CFD', 'crypto', 2, 66615.13, 0.3),
  instrument('COINBASE:BTCGBP', 'BTC/GBP', 'Bitcoin / Pound', 'CRYPTO CFD', 'crypto', 2, 57490.49, 0.3),
  instrument('BINANCE:BTCUSDT', 'BTC/USD', 'Bitcoin / US Dollar', 'CRYPTO CFD', 'crypto', 2, 77557.49, 0.3, true),
  instrument('BINANCE:CHZUSDT', 'CHZ/USD', 'Chiliz / US Dollar', 'CRYPTO CFD', 'crypto', 6, 0.03714, 10),
  instrument('BINANCE:CRVUSDT', 'CRV/USD', 'Curve / US Dollar', 'CRYPTO CFD', 'crypto', 4, 0.228, 0.3),
  instrument('BINANCE:DOTUSDT', 'DOT/USD', 'Polkadot / US Dollar', 'CRYPTO CFD', 'crypto', 3, 1.268, 0.3),
  instrument('BINANCE:EOSUSDT', 'EOS/USD', 'EOS / US Dollar', 'CRYPTO CFD', 'crypto', 4, 0.415, 0.3),
  instrument('BINANCE:ETCUSDT', 'ETC/USD', 'Ethereum Classic / US Dollar', 'CRYPTO CFD', 'crypto', 3, 9.01, 0.3),
  instrument('COINBASE:ETHEUR', 'ETH/EUR', 'Ethereum / Euro', 'CRYPTO CFD', 'crypto', 2, 1818.5, 0.3),
  instrument('COINBASE:ETHGBP', 'ETH/GBP', 'Ethereum / Pound', 'CRYPTO CFD', 'crypto', 2, 1569.27, 0.3),
  instrument('BINANCE:ETHUSDT', 'ETH/USD', 'Ethereum / US Dollar', 'CRYPTO CFD', 'crypto', 2, 2119.15, 0.3),
  instrument('BINANCE:FILUSDT', 'FIL/USD', 'Filecoin / US Dollar', 'CRYPTO CFD', 'crypto', 3, 0.973, 0.2),
  instrument('BINANCE:GALUSDT', 'GAL/USD', 'Galxe / US Dollar', 'CRYPTO CFD', 'crypto', 3, 1.42, 0.3),
  instrument('BINANCE:GMTUSDT', 'GMT/USD', 'STEPN / US Dollar', 'CRYPTO CFD', 'crypto', 5, 0.03284, 1.2),
  instrument('BINANCE:GRTUSDT', 'GRT/USD', 'The Graph / US Dollar', 'CRYPTO CFD', 'crypto', 6, 0.0263, 10),
  instrument('BINANCE:IMXUSDT', 'IMX/USD', 'Immutable / US Dollar', 'CRYPTO CFD', 'crypto', 5, 0.1695, 1.2),
  instrument('BINANCE:KNCUSDT', 'KNC/USD', 'Kyber Network / US Dollar', 'CRYPTO CFD', 'crypto', 4, 0.1492, 0.3),
  instrument('BINANCE:KSMUSDT', 'KSM/USD', 'Kusama / US Dollar', 'CRYPTO CFD', 'crypto', 3, 4.89, 0.2),
  instrument('BINANCE:LPTUSDT', 'LPT/USD', 'Livepeer / US Dollar', 'CRYPTO CFD', 'crypto', 3, 2.26, 0.3),
  instrument('BINANCE:LRCUSDT', 'LRC/USD', 'Loopring / US Dollar', 'CRYPTO CFD', 'crypto', 5, 0.016, 1.2),
  instrument('COINBASE:LTCEUR', 'LTC/EUR', 'Litecoin / Euro', 'CRYPTO CFD', 'crypto', 2, 45.39, 0.3),
  instrument('COINBASE:LTCGBP', 'LTC/GBP', 'Litecoin / Pound', 'CRYPTO CFD', 'crypto', 2, 39.17, 0.3),
  instrument('BINANCE:LTCUSDT', 'LTC/USD', 'Litecoin / US Dollar', 'CRYPTO CFD', 'crypto', 3, 52.91, 10),
  instrument('BINANCE:MKRUSDT', 'MKR/USD', 'Maker / US Dollar', 'CRYPTO CFD', 'crypto', 2, 1785, 0.3),
  instrument('BINANCE:SKLUSDT', 'SKL/USD', 'SKALE / US Dollar', 'CRYPTO CFD', 'crypto', 6, 0.0061, 10),
  instrument('BINANCE:SNXUSDT', 'SNX/USD', 'Synthetix / US Dollar', 'CRYPTO CFD', 'crypto', 4, 0.308, 0.3),
  instrument('BINANCE:SOLUSDT', 'SOL/USD', 'Solana / US Dollar', 'CRYPTO CFD', 'crypto', 3, 85.93, 0.3),
  instrument('BINANCE:UNIUSDT', 'UNI/USD', 'Uniswap / US Dollar', 'CRYPTO CFD', 'crypto', 4, 3.379, 1.2),
  instrument('BINANCE:XRPUSDT', 'XRP/USD', 'XRP / US Dollar', 'CRYPTO CFD', 'crypto', 5, 1.3601, 10),
  instrument('BINANCE:XTZUSDT', 'XTZ/USD', 'Tezos / US Dollar', 'CRYPTO CFD', 'crypto', 4, 0.3372, 0.3),
  instrument('BINANCE:YFIUSDT', 'YFI/USD', 'yearn.finance / US Dollar', 'CRYPTO CFD', 'crypto', 1, 2503, 0.2),
  instrument('BINANCE:ZECUSDT', 'ZEC/USD', 'Zcash / US Dollar', 'CRYPTO CFD', 'crypto', 3, 668.42, 0.3),
  instrument('BINANCE:ZENUSDT', 'ZEN/USD', 'Horizen / US Dollar', 'CRYPTO CFD', 'crypto', 4, 6.2063, 0.3),
  instrument('BINANCE:ZRXUSDT', 'ZRX/USD', '0x / US Dollar', 'CRYPTO CFD', 'crypto', 5, 0.10609, 1.2),
  instrument('OANDA:BCOUSD', 'BRN/USD', 'Brent Crude Oil', 'ENERGIES', 'cfd', 3, 97.651, 7),
  instrument('OANDA:NATGASUSD', 'NGC/USD', 'Natural Gas', 'ENERGIES', 'cfd', 4, 2.849, 13.2),
  instrument('OANDA:WTICOUSD', 'WTI/USD', 'West Texas Oil', 'ENERGIES', 'cfd', 3, 91.083, 3.6),
  instrument('FX:AUDCAD', 'AUD/CAD', 'Australian Dollar / Canadian Dollar', 'FOREX', 'forex', 5, 0.9903, 0.3),
  instrument('FX:AUDCHF', 'AUD/CHF', 'Australian Dollar / Swiss Franc', 'FOREX', 'forex', 5, 0.56026, 0.3),
  instrument('FX:AUDJPY', 'AUD/JPY', 'Australian Dollar / Yen', 'FOREX', 'forex', 3, 113.935, 1.2, true),
  instrument('FX:AUDNZD', 'AUD/NZD', 'Australian Dollar / New Zealand Dollar', 'FOREX', 'forex', 5, 1.22101, 0.3),
  instrument('FX:AUDSGD', 'AUD/SGD', 'Australian Dollar / Singapore Dollar', 'FOREX', 'forex', 5, 0.91566, 0.3),
  instrument('FX:AUDUSD', 'AUD/USD', 'Australian Dollar / US Dollar', 'FOREX', 'forex', 5, 0.71687, 0.3),
  instrument('FX:CADCHF', 'CAD/CHF', 'Canadian Dollar / Swiss Franc', 'FOREX', 'forex', 5, 0.56574, 0.3),
  instrument('FX:CADJPY', 'CAD/JPY', 'Canadian Dollar / Yen', 'FOREX', 'forex', 3, 115.051, 1.2),
  instrument('FX:CHFJPY', 'CHF/JPY', 'Swiss Franc / Yen', 'FOREX', 'forex', 3, 203.364, 1.2),
  instrument('FX:EURAUD', 'EUR/AUD', 'Euro / Australian Dollar', 'FOREX', 'forex', 5, 1.62412, 0.3),
  instrument('FX:EURCAD', 'EUR/CAD', 'Euro / Canadian Dollar', 'FOREX', 'forex', 5, 1.60838, 0.3),
  instrument('FX:EURCHF', 'EUR/CHF', 'Euro / Swiss Franc', 'FOREX', 'forex', 5, 0.90993, 0.3, true),
  instrument('FX:EURGBP', 'EUR/GBP', 'Euro / Pound', 'FOREX', 'forex', 5, 0.86296, 0.3),
  instrument('FX:EURJPY', 'EUR/JPY', 'Euro / Yen', 'FOREX', 'forex', 3, 185.047, 1.2, true),
  instrument('FX:EURUSD', 'EUR/USD', 'Euro / US Dollar', 'FOREX', 'forex', 5, 1.16429, 0.3, true),
  instrument('FX:GBPAUD', 'GBP/AUD', 'British Pound / Australian Dollar', 'FOREX', 'forex', 5, 1.88207, 0.3),
  instrument('FX:GBPCAD', 'GBP/CAD', 'British Pound / Canadian Dollar', 'FOREX', 'forex', 5, 1.86381, 0.3),
  instrument('FX:GBPCHF', 'GBP/CHF', 'British Pound / Swiss Franc', 'FOREX', 'forex', 5, 1.05446, 0.3),
  instrument('FX:GBPJPY', 'GBP/JPY', 'British Pound / Yen', 'FOREX', 'forex', 3, 214.433, 1.2),
  instrument('FX:GBPNZD', 'GBP/NZD', 'British Pound / New Zealand Dollar', 'FOREX', 'forex', 5, 2.29803, 0.3),
  instrument('FX:GBPUSD', 'GBP/USD', 'British Pound / US Dollar', 'FOREX', 'forex', 5, 1.34918, 0.3, true),
  instrument('FX:NZDCAD', 'NZD/CAD', 'New Zealand Dollar / Canadian Dollar', 'FOREX', 'forex', 5, 0.81105, 0.3),
  instrument('FX:NZDCHF', 'NZD/CHF', 'New Zealand Dollar / Swiss Franc', 'FOREX', 'forex', 5, 0.45883, 0.3),
  instrument('FX:NZDJPY', 'NZD/JPY', 'New Zealand Dollar / Yen', 'FOREX', 'forex', 3, 93.311, 1.2),
  instrument('FX:NZDUSD', 'NZD/USD', 'New Zealand Dollar / US Dollar', 'FOREX', 'forex', 5, 0.5871, 0.3),
  instrument('FX:USDCAD', 'USD/CAD', 'US Dollar / Canadian Dollar', 'FOREX', 'forex', 5, 1.38144, 0.3, true),
  instrument('FX:USDCHF', 'USD/CHF', 'US Dollar / Swiss Franc', 'FOREX', 'forex', 5, 0.78151, 0.3),
  instrument('FX:USDCNH', 'USD/CNH', 'US Dollar / Chinese Yuan', 'FOREX', 'forex', 4, 6.7851, 0.2),
  instrument('FX:USDHKD', 'USD/HKD', 'US Dollar / Hong Kong Dollar', 'FOREX', 'forex', 5, 7.83431, 0.3),
  instrument('FX:USDJPY', 'USD/JPY', 'US Dollar / Yen', 'FOREX', 'forex', 3, 158.936, 1.2, true),
  instrument('FX:USDMXN', 'USD/MXN', 'US Dollar / Mexican Peso', 'FOREX', 'forex', 4, 17.2796, 0.2),
  instrument('FX:USDSGD', 'USD/SGD', 'US Dollar / Singapore Dollar', 'FOREX', 'forex', 5, 1.27731, 0.3),
  instrument('FX:USDTRY', 'USD/TRY', 'US Dollar / Turkish Lira', 'FOREX', 'forex', 5, 45.71861, 0.3),
  instrument('OANDA:AU200AUD', 'ASX/AUD', 'Australia 200', 'INDICES', 'cfd', 1, 28.8, 0),
  instrument('OANDA:DE30EUR', 'DAX/EUR', 'Germany 40', 'INDICES', 'cfd', 2, 42.65, 0),
  instrument('OANDA:US30USD', 'DJI/USD', 'Dow Jones', 'INDICES', 'cfd', 2, 500.29, 0),
  instrument('OANDA:EU50EUR', 'ESX/EUR', 'Euro Stoxx 50', 'INDICES', 'cfd', 2, 66.8, 0),
  instrument('OANDA:FR40EUR', 'F40/EUR', 'France 40', 'INDICES', 'cfd', 2, 45.24, 0),
  instrument('OANDA:UK100GBP', 'FTS/GBP', 'UK 100', 'INDICES', 'cfd', 2, 47.03, 0),
  instrument('OANDA:HK33HKD', 'HSI/HKD', 'Hong Kong 33', 'INDICES', 'cfd', 1, 23.6, 0),
  instrument('OANDA:ESPIXEUR', 'IBX/EUR', 'Spain 35', 'INDICES', 'cfd', 2, 56.89, 0),
  instrument('OANDA:NAS100USD', 'NDX/USD', 'Nasdaq 100', 'INDICES', 'cfd', 2, 710.71, 0),
  instrument('OANDA:JP225USD', 'NIK/JPY', 'Japan 225', 'INDICES', 'cfd', 1, 90.4, 0),
  instrument('OANDA:SPX500USD', 'SPX/USD', 'S&P 500', 'INDICES', 'cfd', 2, 739.88, 0),
  instrument('OANDA:XAGAUD', 'XAG/AUD', 'Silver / Australian Dollar', 'METALS', 'forex', 3, 109.05, 1.2),
  instrument('OANDA:XAGCHF', 'XAG/CHF', 'Silver / Swiss Franc', 'METALS', 'forex', 3, 61.093, 1.2),
  instrument('OANDA:XAGEUR', 'XAG/EUR', 'Silver / Euro', 'METALS', 'forex', 3, 67.141, 1.2),
  instrument('OANDA:XAGGBP', 'XAG/GBP', 'Silver / Pound', 'METALS', 'forex', 3, 57.941, 1.2),
  instrument('OANDA:XAGUSD', 'XAG/USD', 'Silver / US Dollar', 'METALS', 'forex', 3, 78.173, 1.2),
  instrument('OANDA:XAUAUD', 'XAU/AUD', 'Gold / Australian Dollar', 'METALS', 'forex', 2, 6378.17, 0.3),
  instrument('OANDA:XAUCHF', 'XAU/CHF', 'Gold / Swiss Franc', 'METALS', 'forex', 2, 3573.27, 0.3),
  instrument('OANDA:XAUEUR', 'XAU/EUR', 'Gold / Euro', 'METALS', 'forex', 2, 3927.02, 0.3),
  instrument('OANDA:XAUGBP', 'XAU/GBP', 'Gold / Pound', 'METALS', 'forex', 2, 3388.91, 0.3),
  instrument('OANDA:XAUUSD', 'XAU/USD', 'Gold / US Dollar', 'METALS', 'forex', 2, 4572.26, 2.1, true),
  instrument('OANDA:XPDUSD', 'XPD/USD', 'Palladium / US Dollar', 'METALS', 'forex', 2, 1393.14, 0.3),
  instrument('OANDA:XPTUSD', 'XPT/USD', 'Platinum / US Dollar', 'METALS', 'forex', 2, 1972.62, 0.3),
];

const spreadFor = (item) => Number(item.spreadPoints) * (10 ** -item.decimals);

function visibleInstrument(item, quoteValues) {
  const { ticker, scanner, fallback, ...visible } = item;
  return { ...visible, ...quoteValues };
}

function fallbackPrice(instrument) {
  const price = instrument.fallback * (1 + (Math.random() - 0.5) * 0.002);
  const spread = spreadFor(instrument);
  return visibleInstrument(instrument, { price, bid: price, ask: price + spread, spread, change: (Math.random() - 0.5) * 0.6 });
}

async function scan(scanner, selected) {
  const response = await axios.post(
    `https://scanner.tradingview.com/${scanner}/scan`,
    {
      columns: ['name', 'description', 'close', 'change', 'bid', 'ask'],
      symbols: { query: { types: [] }, tickers: selected.map((instrument) => instrument.ticker) },
      range: [0, selected.length],
    },
    { timeout: 6500, headers: { 'Content-Type': 'application/json' } },
  );
  const byTicker = new Map(response.data.data.map((row) => [row.s, row.d]));
  return selected.map((instrument) => {
    const values = byTicker.get(instrument.ticker);
    if (!values || !Number(values[2])) return fallbackPrice(instrument);
    const price = Number(values[2]);
    const bid = Number(values[4]) || price;
    const ask = Number(values[5]) || bid + spreadFor(instrument);
    return visibleInstrument(instrument, { price, bid, ask, spread: ask - bid, change: Number(values[3]) || 0 });
  });
}

async function getPrices() {
  const scanners = [...new Set(instruments.map((item) => item.scanner))];
  const batches = await Promise.all(scanners.map(async (scanner) => {
    const selected = instruments.filter((item) => item.scanner === scanner);
    try {
      return await scan(scanner, selected);
    } catch {
      return selected.map(fallbackPrice);
    }
  }));
  return batches.flat();
}

async function getPrice(symbol) {
  const prices = await getPrices();
  return prices.find((item) => item.symbol === symbol) || fallbackPrice(instruments[0]);
}

function generateCandles(symbol, base, timeframe = '15m') {
  const seconds = { '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '1H': 3600, '4H': 14400, '1D': 86400 }[timeframe] || 900;
  const liveClose = Number(base);
  const time = Math.floor(Math.floor(Date.now() / 1000) / seconds) * seconds;
  let nextClose = liveClose;
  const candles = Array.from({ length: 89 }, (_, index) => {
    const close = nextClose;
    const open = Math.max(0.00001, close + (Math.random() - 0.5) * close * 0.003);
    const range = Math.random() * close * 0.001;
    nextClose = open;
    return {
      time: time - (index + 1) * seconds,
      open,
      high: Math.max(open, close) + range,
      low: Math.min(open, close) - range,
      close,
    };
  }).reverse();
  const previousClose = candles[candles.length - 1].close;
  candles.push({
    time,
    open: previousClose,
    high: Math.max(previousClose, liveClose),
    low: Math.min(previousClose, liveClose),
    close: liveClose,
  });
  return candles;
}

module.exports = { instruments, getPrices, getPrice, generateCandles };
