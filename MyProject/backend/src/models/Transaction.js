const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
  type: { type: DataTypes.ENUM('deposit', 'withdrawal', 'trade_profit', 'trade_loss'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'), allowNull: false, defaultValue: 'pending' },
  referenceType: { type: DataTypes.STRING(40), field: 'reference_type' },
  referenceId: { type: DataTypes.INTEGER.UNSIGNED, field: 'reference_id' },
  description: { type: DataTypes.STRING(255) },
}, { tableName: 'transactions' });

module.exports = Transaction;
