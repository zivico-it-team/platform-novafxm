const express = require('express');
const { pool, isDatabaseAvailable } = require('../../config/database');
const localStore = require('../../lib/localStore');
const {
  getCurrentPrices,
  getCurrentPriceList,
  getPriceCoverage,
  getHistoricalCandles,
} = require('../../websocket/priceFeed');

const router = express.Router();

router.get('/coverage', async (req, res) => {
  try {
    const coverage = getPriceCoverage();
    const live = coverage.filter((item) => item.isLive).length;

    res.json({
      total: coverage.length,
      live,
      fallback: coverage.length - live,
      symbols: coverage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const sendCandles = (res, symbol, timeframe, limit) => {
  const candles = getHistoricalCandles(symbol, timeframe, limit);

  if (!candles || candles.length === 0) {
    return res.status(404).json({ error: 'No candle history found for symbol' });
  }

  return res.json({
    symbol,
    timeframe: String(timeframe || '15'),
    candles,
  });
};

router.get('/candles', async (req, res) => {
  try {
    const symbol = String(req.query.symbol || '').trim();

    if (!symbol) {
      return res.status(400).json({ error: 'Missing symbol query parameter' });
    }

    return sendCandles(res, symbol, req.query.timeframe, req.query.limit);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:base/:quote/candles', async (req, res) => {
  try {
    const symbol = `${req.params.base}/${req.params.quote}`;
    return sendCandles(res, symbol, req.query.timeframe, req.query.limit);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:symbol/candles', async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.symbol);
    return sendCandles(res, symbol, req.query.timeframe, req.query.limit);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get current prices
router.get('/', async (req, res) => {
  try {
    const livePrices = getCurrentPriceList();
    if (livePrices.length > 0) {
      return res.json(livePrices);
    }

    if (!isDatabaseAvailable()) {
      return res.json(localStore.getPrices());
    }

    const connection = await pool.getConnection();

    const [prices] = await connection.execute(
      'SELECT symbol, bid, ask, mid FROM prices ORDER BY updated_at DESC'
    );

    connection.release();

    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get price for specific symbol
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const decodedSymbol = decodeURIComponent(symbol);
    const livePrice = getCurrentPrices()[decodedSymbol];

    if (livePrice) {
      return res.json({ symbol: decodedSymbol, ...livePrice });
    }

    if (!isDatabaseAvailable()) {
      const price = localStore.getPrice(decodedSymbol);

      if (!price) {
        return res.status(404).json({ error: 'Price not found' });
      }

      return res.json(price);
    }

    const connection = await pool.getConnection();

    const [prices] = await connection.execute(
      'SELECT symbol, bid, ask, mid, updated_at FROM prices WHERE symbol = ?',
      [decodedSymbol]
    );

    connection.release();

    if (prices.length === 0) {
      return res.status(404).json({ error: 'Price not found' });
    }

    res.json(prices[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update price (internal use)
router.post('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { bid, ask, mid } = req.body;

    if (!bid || !ask || !mid) {
      return res.status(400).json({ error: 'Missing price data' });
    }

    if (!isDatabaseAvailable()) {
      localStore.upsertPrice(symbol, { bid, ask, mid });
      return res.json({ message: 'Price updated successfully' });
    }

    const connection = await pool.getConnection();

    // Check if price exists
    const [existing] = await connection.execute(
      'SELECT id FROM prices WHERE symbol = ?',
      [symbol]
    );

    if (existing.length > 0) {
      await connection.execute(
        'UPDATE prices SET bid = ?, ask = ?, mid = ?, updated_at = NOW() WHERE symbol = ?',
        [bid, ask, mid, symbol]
      );
    } else {
      await connection.execute(
        'INSERT INTO prices (symbol, bid, ask, mid) VALUES (?, ?, ?, ?)',
        [symbol, bid, ask, mid]
      );
    }

    connection.release();

    res.json({ message: 'Price updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
