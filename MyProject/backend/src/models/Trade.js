const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Trade = sequelize.define('Trade', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
  symbol: { type: DataTypes.STRING(30), allowNull: false },
  side: { type: DataTypes.ENUM('BUY', 'SELL'), allowNull: false },
  lots: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  openPrice: { type: DataTypes.DECIMAL(18, 8), allowNull: false, field: 'open_price' },
  closePrice: { type: DataTypes.DECIMAL(18, 8), field: 'close_price' },
  profit: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  margin: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  status: { type: DataTypes.ENUM('open', 'closed'), allowNull: false, defaultValue: 'open' },
  closedAt: { type: DataTypes.DATE, field: 'closed_at' },
}, { tableName: 'trades' });

module.exports = Trade;
