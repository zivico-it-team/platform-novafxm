const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Deposit = sequelize.define('Deposit', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  paymentMethod: { type: DataTypes.STRING(80), allowNull: false, field: 'payment_method' },
  referenceNumber: { type: DataTypes.STRING(120), allowNull: false, field: 'reference_number' },
  receiptImage: { type: DataTypes.TEXT('medium'), allowNull: true, field: 'receipt_image' },
  note: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
  reviewedAt: { type: DataTypes.DATE, field: 'reviewed_at' },
  reviewedBy: { type: DataTypes.INTEGER.UNSIGNED, field: 'reviewed_by' },
}, { tableName: 'deposits' });

module.exports = Deposit;
