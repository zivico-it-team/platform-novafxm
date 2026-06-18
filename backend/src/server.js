require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const sequelize = require('./config/db');
require('./models');
const ensureSchema = require('./config/ensureSchema');
const seedAdmin = require('./seed/seedAdmin');
const tradingView = require('./services/tradingViewService');
const { checkRiskOrders } = require('./services/tradeRiskService');
const { startCandleCatchupScheduler } = require('./services/candleCatchupScheduler');
const { setNotificationIo } = require('./services/notificationService');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN === '*' || !process.env.CORS_ORIGIN ? true : process.env.CORS_ORIGIN }));
app.use(express.json({ limit: '12mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'NOVA FXM API' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/trades', require('./routes/tradeRoutes'));
app.use('/api/market', require('./routes/marketRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, req, res, next) => {
  console.error(error.message);
  res.status(error.status || 500).json({ message: error.status ? error.message : 'Internal server error.' });
});

const port = Number(process.env.PORT || 5000);
const host = process.env.HOST || '0.0.0.0';

async function start() {
  await sequelize.authenticate();
  await sequelize.sync();
  await ensureSchema();
  await seedAdmin();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: process.env.CORS_ORIGIN === '*' || !process.env.CORS_ORIGIN ? true : process.env.CORS_ORIGIN } });
  setNotificationIo(io);
  io.on('connection', async (socket) => {
    const token = socket.handshake.auth?.token;
    if (token && process.env.JWT_SECRET) {
      try {
        socket.data.userId = jwt.verify(token, process.env.JWT_SECRET).id;
      } catch {
        socket.data.userId = null;
      }
    }
    socket.emit('market:prices', await tradingView.getPrices());
    socket.on('notifications:join', (userId) => {
      if (socket.data.userId && String(socket.data.userId) === String(userId)) socket.join(`user_${userId}`);
    });
  });
  const stopPriceStream = tradingView.startPriceStream((prices) => {
    if (io.engine.clientsCount) io.emit('market:prices', prices);
    checkRiskOrders(prices).catch((error) => console.error('Risk order check failed:', error.message));
  });
  const stopCandleCatchupScheduler = startCandleCatchupScheduler();
  const ticker = setInterval(async () => {
    const prices = await tradingView.getPrices();
    if (io.engine.clientsCount) io.emit('market:prices', prices);
    checkRiskOrders(prices).catch((error) => console.error('Risk order check failed:', error.message));
  }, 2000);
  server.on('close', () => {
    clearInterval(ticker);
    stopPriceStream();
    stopCandleCatchupScheduler();
  });
  server.listen(port, host, () => console.log(`NOVA FXM API listening on http://${host}:${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    const connectionRefused = error?.name === 'SequelizeConnectionRefusedError' || error?.parent?.code === 'ECONNREFUSED';
    if (connectionRefused) {
      console.error(
        `Unable to start server: MySQL connection refused at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}. `
        + `Start MySQL and make sure database "${process.env.DB_NAME || 'novafxm_db'}" exists, or update backend/.env DB_HOST/DB_PORT/DB_USER/DB_PASSWORD.`,
      );
    } else {
      console.error('Unable to start server:', error?.message || error?.name || error);
      if (error?.stack) console.error(error.stack);
    }
    process.exitCode = 1;
  });
}

module.exports = { app, start };
