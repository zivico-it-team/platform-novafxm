const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(190), allowNull: false, unique: true, validate: { isEmail: true } },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  profileImage: { type: DataTypes.TEXT('long'), field: 'profile_image', allowNull: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('user', 'admin'), allowNull: false, defaultValue: 'user' },
  accountType: { type: DataTypes.ENUM('Demo', 'Live'), field: 'account_type', defaultValue: 'Demo' },
  leverage: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 100 },
  tradingStatus: { type: DataTypes.ENUM('active', 'frozen'), field: 'trading_status', allowNull: false, defaultValue: 'active' },
  adminNotes: { type: DataTypes.TEXT, field: 'admin_notes', allowNull: true },
}, { tableName: 'users' });

module.exports = User;
