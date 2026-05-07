require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { WebSocketServer } = require('ws');
const { initializeDatabase } = require('./config/database');
const { startPriceBroadcast, getCurrentPrices } = require('./priceUpdater');
const { processBrokerStops } = require('./lib/stopProcessor');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const tradesRoutes = require('./routes/trades');
const pricesRoutes = require('./routes/prices');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/trades', tradesRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/prices' });

wss.on('connection', (socket) => {
  console.log('WebSocket client connected');
  const initialPayload = JSON.stringify({ type: 'priceUpdate', data: getCurrentPrices() });
  socket.send(initialPayload);

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  socket.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    startPriceBroadcast(wss, undefined, processBrokerStops);
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`WebSocket price feed available on ws://localhost:${PORT}/ws/prices`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
