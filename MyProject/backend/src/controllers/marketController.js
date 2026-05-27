const tradingView = require('../services/tradingViewService');

exports.symbols = (req, res) => res.json({ symbols: tradingView.instruments.map(({ ticker, scanner, fallback, ...symbol }) => ({ ...symbol, tradingViewSymbol: ticker })) });

exports.prices = async (req, res, next) => {
  try {
    return res.json({ symbols: await tradingView.getPrices() });
  } catch (error) {
    return next(error);
  }
};

exports.candles = async (req, res, next) => {
  try {
    const quote = await tradingView.getPrice(decodeURIComponent(req.params.symbol));
    return res.json({ symbol: quote.symbol, timeframe: req.query.timeframe || '15m', candles: tradingView.generateCandles(quote.symbol, quote.price, req.query.timeframe) });
  } catch (error) {
    return next(error);
  }
};
