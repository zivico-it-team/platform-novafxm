require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { initializeDatabase } = require('./config/database');
const { validateEnv } = require('./config/env');
const { processBrokerStops } = require('./lib/stopProcessor');
const { errorHandler } = require('./middleware/errorHandler');
const { registerRoutes } = require('./routes');
const { createPriceSocketServer } = require('./websocket/priceSocket');

const env = validateEnv();
const app = express();

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.allowedOrigins.length === 0 || env.allowedOrigins.includes(origin)) {
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

registerRoutes(app);

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
const priceSocket = createPriceSocketServer(server, { onPricesUpdated: processBrokerStops });

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    priceSocket.start();
    server.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
      console.log(`WebSocket price feed available on ws://localhost:${env.port}/ws/prices`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
