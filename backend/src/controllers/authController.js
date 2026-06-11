const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { User, Wallet, TradingAccount } = require('../models');
const { ensureReferralCode } = require('../services/dashboardService');
const { sendPasswordResetCode } = require('../services/mailService');

const publicUser = (user) => {
  const values = user.toJSON ? user.toJSON() : user;
  delete values.password;
  delete values.resetPasswordToken;
  delete values.resetPasswordExpires;
  return values;
};

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required.');
  return process.env.JWT_SECRET;
};

const tokenFor = (user) => jwt.sign({ id: user.id, role: user.role }, secret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, accountType, referralCode } = req.body;
    if (!name || !email || !password || password.length < 8) return res.status(400).json({ message: 'Name, email and password of at least 8 characters are required.' });
    const selectedAccountType = accountType === 'Live' ? 'Live' : 'Demo';
    const startingBalance = selectedAccountType === 'Demo' ? 5000 : 0;
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ where: { email: normalizedEmail } })) return res.status(409).json({ message: 'Email already registered.' });
    const referrer = referralCode
      ? await User.findOne({ where: { referralCode: String(referralCode).trim() } })
      : null;
    const user = await sequelize.transaction(async (transaction) => {
      const created = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phone,
        password: await bcrypt.hash(password, 12),
        accountType: selectedAccountType,
        tradingStatus: 'frozen',
        verificationStatus: 'unverified',
        referredById: referrer?.id || null,
      }, { transaction });
      await Wallet.create({ userId: created.id, balance: startingBalance, equity: startingBalance, freeFunds: startingBalance }, { transaction });
      await TradingAccount.create({
        userId: created.id,
        type: selectedAccountType,
        name: `${selectedAccountType} account 1`,
        balance: startingBalance,
        status: 'active',
        isPrimary: true,
      }, { transaction });
      return created;
    });
    await ensureReferralCode(user);
    return res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: String(email || '').trim().toLowerCase() }, include: [{ model: Wallet, as: 'wallet' }] });
    if (!user || !(await bcrypt.compare(String(password || ''), user.password))) return res.status(401).json({ message: 'Invalid email or password.' });
    return res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] }, include: [{ model: Wallet, as: 'wallet' }] });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.json({ message: 'If that email exists, a reset code has been sent.' });

    const resetToken = String(crypto.randomInt(100000, 1000000));
    await user.update({
      resetPasswordToken: hashResetToken(resetToken),
      resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    try {
      await sendPasswordResetCode({ to: user.email, code: resetToken });
    } catch (mailError) {
      await user.update({ resetPasswordToken: null, resetPasswordExpires: null });
      return res.status(500).json({ message: mailError.message || 'Reset code email could not be sent.' });
    }

    return res.json({ message: 'Password reset code sent to your email. Use it within 15 minutes.' });
  } catch (error) {
    return next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const resetToken = String(req.body.resetToken || '').trim();
    const password = String(req.body.password || '');
    if (!resetToken) return res.status(400).json({ message: 'Reset code is required.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashResetToken(resetToken),
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });
    if (!user) return res.status(400).json({ message: 'Reset code is invalid or expired.' });

    await user.update({
      password: await bcrypt.hash(password, 12),
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    return next(error);
  }
};
