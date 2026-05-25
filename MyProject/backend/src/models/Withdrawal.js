const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Withdrawal = sequelize.define('Withdrawal', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  bankName: { type: DataTypes.STRING(120), allowNull: false, field: 'bank_name' },
  accountNumber: { type: DataTypes.STRING(80), allowNull: false, field: 'account_number' },
  accountHolderName: { type: DataTypes.STRING(120), allowNull: false, field: 'account_holder_name' },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
  reviewedAt: { type: DataTypes.DATE, field: 'reviewed_at' },
  reviewedBy: { type: DataTypes.INTEGER.UNSIGNED, field: 'reviewed_by' },
}, { tableName: 'withdrawals' });

module.exports = Withdrawal;
