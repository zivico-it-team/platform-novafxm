const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(190), allowNull: false, unique: true, validate: { isEmail: true } },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('user', 'admin'), allowNull: false, defaultValue: 'user' },
  accountType: { type: DataTypes.ENUM('Demo', 'Live'), field: 'account_type', defaultValue: 'Demo' },
  leverage: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 100 },
  tradingStatus: { type: DataTypes.ENUM('active', 'frozen'), field: 'trading_status', allowNull: false, defaultValue: 'active' },
  verificationStatus: { type: DataTypes.ENUM('unverified', 'pending', 'approved', 'rejected'), field: 'verification_status', allowNull: false, defaultValue: 'unverified' },
  idProofImage: { type: DataTypes.TEXT('long'), field: 'id_proof_image', allowNull: true },
  addressProofImage: { type: DataTypes.TEXT('long'), field: 'address_proof_image', allowNull: true },
  verificationReviewedAt: { type: DataTypes.DATE, field: 'verification_reviewed_at', allowNull: true },
  verificationReviewedBy: { type: DataTypes.INTEGER.UNSIGNED, field: 'verification_reviewed_by', allowNull: true },
  adminNotes: { type: DataTypes.TEXT, field: 'admin_notes', allowNull: true },
  referralCode: { type: DataTypes.STRING(40), unique: true, field: 'referral_code', allowNull: true },
  referredById: { type: DataTypes.INTEGER.UNSIGNED, field: 'referred_by_id', allowNull: true },
}, { tableName: 'users' });

module.exports = User;
