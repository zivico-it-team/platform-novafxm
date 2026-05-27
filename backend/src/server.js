require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/db');
require('./models');
const seedAdmin = require('./seed/seedAdmin');
const tradingView = require('./services/tradingViewService');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN === '*' || !process.env.CORS_ORIGIN ? true : process.env.CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'NOVA FXM API' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/trades', require('./routes/tradeRoutes'));
app.use('/api/market', require('./routes/marketRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, req, res, next) => {
  console.error(error.message);
  res.status(error.status || 500).json({ message: error.status ? error.message : 'Internal server error.' });
});

const port = Number(process.env.PORT || 5000);
const marketRefreshMs = Number(process.env.MARKET_REFRESH_MS || 15000);
const marketLogSymbols = (process.env.MARKET_LOG_SYMBOLS || 'AUD/JPY')
  .split(',')
  .map((symbol) => symbol.trim())
  .filter(Boolean);
let lastFeedWarning = '';

function logMarketPrices(prices) {
  const displayed = marketLogSymbols.includes('*')
    ? prices
    : prices.filter((price) => marketLogSymbols.includes(price.symbol));
  const marketCount = prices.filter((price) => price.source === 'market').length;
  const problems = tradingView.getFeedStatus();
  if (!marketCount) {
    const signature = JSON.stringify(problems);
    if (signature !== lastFeedWarning) {
      console.warn(`[${new Date().toISOString()}] No upstream market prices. Display values are unavailable placeholders.`);
      console.warn('Upstream feed errors:', problems);
      lastFeedWarning = signature;
    }
    return;
  }
  lastFeedWarning = '';
  console.log(`[${new Date().toISOString()}] Market quotes: ${marketCount}/${prices.length} upstream prices`);
  console.table(displayed.map((price) => ({
    symbol: price.symbol,
    price: Number(price.price).toFixed(price.decimals),
    bid: Number(price.bid).toFixed(price.decimals),
    ask: Number(price.ask).toFixed(price.decimals),
    source: price.source,
  })));
}

async function start() {
  await sequelize.authenticate();
  await sequelize.sync();
  await seedAdmin();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: process.env.CORS_ORIGIN === '*' || !process.env.CORS_ORIGIN ? true : process.env.CORS_ORIGIN } });
  let latestPrices = [];
  const publishPrices = (prices) => {
    latestPrices = prices;
    logMarketPrices(latestPrices);
    if (io.engine.clientsCount) io.emit('market:prices', latestPrices);
  };
  const stopPriceStream = tradingView.startPriceStream(publishPrices);
  let refreshingPrices = false;
  const refreshPrices = async () => {
    if (refreshingPrices) return;
    refreshingPrices = true;
    try {
      publishPrices(await tradingView.getPrices());
    } catch (error) {
      console.error('Market quote refresh failed:', error.message);
    } finally {
      refreshingPrices = false;
    }
  };
  io.on('connection', (socket) => {
    if (latestPrices.length) socket.emit('market:prices', latestPrices);
  });
  refreshPrices();
  const ticker = setInterval(refreshPrices, marketRefreshMs);
  server.on('close', () => {
    clearInterval(ticker);
    stopPriceStream();
  });
  server.listen(port, () => console.log(`NOVA FXM API listening on port ${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, start };
