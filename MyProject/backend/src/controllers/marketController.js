const tradingView = require('../services/tradingViewService');

exports.symbols = (req, res) => res.json({ symbols: tradingView.instruments.map(({ ticker, scanner, fallback, ...symbol }) => symbol) });

exports.prices = async (req, res, next) => {
  try {
    return res.json({ symbols: await tradingView.getPrices() });
  } catch (error) {
    return next(error);
  }
};

exports.candles = async (req, res, next) => {
  try {
    const symbol = decodeURIComponent(req.params.symbol);
    const timeframe = req.query.timeframe || '15m';
    return res.json({ symbol, timeframe, candles: await tradingView.getCandles(symbol, timeframe) });
  } catch (error) {
    return next(error);
  }
};
