const authRoutes = require('../modules/auth/auth.routes');
const accountRoutes = require('../modules/users/account.routes');
const tradesRoutes = require('../modules/trading/trades.routes');
const pricesRoutes = require('../modules/trading/prices.routes');
const adminRoutes = require('../modules/analytics/admin.routes');

const registerRoutes = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/account', accountRoutes);
  app.use('/api/trades', tradesRoutes);
  app.use('/api/prices', pricesRoutes);
  app.use('/api/admin', adminRoutes);
};

module.exports = { registerRoutes };
