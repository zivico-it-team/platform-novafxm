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
  ['ASX/AUD', 'ASX:XJO', ['TVC:AXJO'], 7800, 1, 0, 12],
  ['DAX/EUR', 'TVC:DAX', ['XETR:DAX'], 18000, 1, 0, 20],
  ['DJI/USD', 'TVC:DJI', ['FOREXCOM:DJI'], 38500, 1, 0, 30],
  ['ESX/EUR', 'TVC:SX5E', ['EUREX:FESX1!'], 5000, 1, 0, 15],
  ['F40/EUR', 'TVC:CAC40', ['EURONEXT:PX1'], 7600, 1, 0, 15],
  ['FTS/GBP', 'TVC:UKX', ['FOREXCOM:UKXGBP'], 7600, 1, 0, 15],
  ['HSI/HKD', 'TVC:HSI', ['HKEX:HSI'], 17000, 1, 0, 25],
  ['IBX/EUR', 'BME:IBC', ['TVC:IBEX35'], 11000, 1, 0, 15],
  ['NDX/USD', 'NASDAQ:NDX', ['TVC:NDX', 'CME_MINI:NQ1!'], 18000, 1, 0, 25],
  ['NIK/JPY', 'TVC:NI225', ['OSE:NK2251!'], 39000, 1, 0, 25],
  ['SPX/USD', 'SP:SPX', ['TVC:SPX'], 5200, 0.1, 1, 5],
];

const METAL_META = [
  ['XAG/AUD', 'OANDA:XAGAUD', ['FX_IDC:XAGAUD'], 115, 0.001, 3, 30, 5000],
  ['XAG/CHF', 'OANDA:XAGCHF', ['FX_IDC:XAGCHF'], 70, 0.001, 3, 30, 5000],
  ['XAG/EUR', 'OANDA:XAGEUR', ['FX_IDC:XAGEUR'], 70, 0.001, 3, 30, 5000],
  ['XAG/GBP', 'OANDA:XAGGBP', ['FX_IDC:XAGGBP'], 60, 0.001, 3, 30, 5000],
  ['XAG/USD', 'TVC:SILVER', ['OANDA:XAGUSD', 'FOREXCOM:XAGUSD'], 76.5, 0.001, 3, 30, 5000],
  ['XAU/AUD', 'OANDA:XAUAUD', ['FX_IDC:XAUAUD'], 7000, 0.01, 2, 40, 100],
  ['XAU/CHF', 'OANDA:XAUCHF', ['FX_IDC:XAUCHF'], 4200, 0.01, 2, 40, 100],
  ['XAU/EUR', 'OANDA:XAUEUR', ['FX_IDC:XAUEUR'], 4300, 0.01, 2, 40, 100],
  ['XAU/GBP', 'OANDA:XAUGBP', ['FX_IDC:XAUGBP'], 3700, 0.01, 2, 40, 100],
  ['XAU/USD', 'OANDA:XAUUSD', ['TVC:GOLD', 'FOREXCOM:XAUUSD'], 4685.6, 0.01, 2, 40, 100],
  ['XPD/USD', 'TVC:PALLADIUM', ['OANDA:XPDUSD'], 1000, 0.01, 2, 60, 100],
  ['XPT/USD', 'TVC:PLATINUM', ['OANDA:XPTUSD'], 950, 0.01, 2, 50, 100],
];

const ENERGY_META = [
  ['BRN/USD', 'TVC:UKOIL', ['BLACKBULL:BRENT'], 85, 0.01, 2, 5, 1000],
  ['NGC/USD', 'TVC:NATGAS', ['NYMEX:NG1!'], 2.5, 0.001, 3, 8, 10000],
  ['WTI/USD', 'TVC:USOIL', ['BLACKBULL:WTI'], 80, 0.01, 2, 5, 1000],
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
    contractSize: 100000,
  };
};

const getListMeta = (category, [symbol, tv, fallbackTv, base, pip, digits, spread, contractSize = 1]) => ({
  symbol,
  category,
  tv,
  fallbackTv,
  base,
  pip,
  digits,
  spread,
  contractSize,
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
    contractSize: 1,
  };
};

export const SYMBOL_META = [
  ...FOREX_SYMBOLS.map(getForexMeta),
  ...METAL_META.map((meta) => getListMeta('metals', meta)),
  ...ENERGY_META.map((meta) => getListMeta('energies', meta)),
  ...INDEX_META.map((meta) => getListMeta('indices', meta)),
  ...CRYPTO_SYMBOLS.map(getCryptoMeta),
];

export const getSymbolMeta = (symbol) => SYMBOL_META.find((item) => item.symbol === symbol);
export const getSymbolsByCategory = (category) => SYMBOL_META.filter((item) => item.category === category);
export const getCategories = () => ['forex', 'metals', 'energies', 'indices', 'crypto'];
