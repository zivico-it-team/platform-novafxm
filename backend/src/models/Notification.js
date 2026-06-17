const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, field: 'user_id', allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: {
    type: DataTypes.ENUM('deposit', 'withdraw', 'trade', 'system', 'kyc', 'admin'),
    allowNull: false,
    defaultValue: 'system',
  },
  isRead: { type: DataTypes.BOOLEAN, field: 'is_read', allowNull: false, defaultValue: false },
}, {
  tableName: 'notifications',
  indexes: [{ fields: ['user_id', 'is_read', 'created_at'] }],
});

module.exports = Notification;
