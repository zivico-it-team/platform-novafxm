const { WebSocketServer } = require('ws');
const { startPriceBroadcast, getCurrentPrices } = require('./priceFeed');

const createPriceSocketServer = (server, { onPricesUpdated } = {}) => {
  const wss = new WebSocketServer({ server, path: '/ws/prices' });

  wss.on('connection', (socket) => {
    console.log('WebSocket client connected');
    socket.send(JSON.stringify({ type: 'priceUpdate', data: getCurrentPrices() }));

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socket.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return {
    wss,
    start: () => startPriceBroadcast(wss, undefined, onPricesUpdated),
  };
};

module.exports = { createPriceSocketServer };
