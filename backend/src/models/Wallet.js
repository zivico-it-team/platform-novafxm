const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Wallet = sequelize.define('Wallet', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true, field: 'user_id' },
  balance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 5000 },
  bonus: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
}, { tableName: 'wallets' });

module.exports = Wallet;
