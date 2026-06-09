const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/db');
const { User, Wallet, TradingAccount } = require('../models');
const { ensureReferralCode } = require('../services/dashboardService');

const publicUser = (user) => {
  const values = user.toJSON ? user.toJSON() : user;
  delete values.password;
  return values;
};

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required.');
  return process.env.JWT_SECRET;
};

const tokenFor = (user) => jwt.sign({ id: user.id, role: user.role }, secret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, accountType, referralCode } = req.body;
    if (!name || !email || !password || password.length < 8) return res.status(400).json({ message: 'Name, email and password of at least 8 characters are required.' });
    const selectedAccountType = accountType === 'Live' ? 'Live' : 'Demo';
    const startingBalance = selectedAccountType === 'Demo' ? 5000 : 0;
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ where: { email: normalizedEmail } })) return res.status(409).json({ message: 'Email already registered.' });
    const normalizedReferralCode = String(referralCode || '').trim().toUpperCase();
    const referrer = normalizedReferralCode
      ? await User.findOne({ where: { referralCode: normalizedReferralCode } })
      : null;
    if (normalizedReferralCode && !referrer) return res.status(400).json({ message: 'Invalid referral code.' });
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
    const { email, password, referralCode } = req.body;
    const user = await User.findOne({ where: { email: String(email || '').trim().toLowerCase() }, include: [{ model: Wallet, as: 'wallet' }] });
    if (!user || !(await bcrypt.compare(String(password || ''), user.password))) return res.status(401).json({ message: 'Invalid email or password.' });
    const normalizedReferralCode = String(referralCode || '').trim().toUpperCase();
    if (normalizedReferralCode && !user.referredById) {
      const referrer = await User.findOne({ where: { referralCode: normalizedReferralCode } });
      if (!referrer) return res.status(400).json({ message: 'Invalid referral code.' });
      if (referrer.id !== user.id) await user.update({ referredById: referrer.id });
    }
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

exports.claimReferral = async (req, res, next) => {
  try {
    const normalizedReferralCode = String(req.body.referralCode || '').trim().toUpperCase();
    if (!normalizedReferralCode) return res.status(400).json({ message: 'Referral code is required.' });
    const [user, referrer] = await Promise.all([
      User.findByPk(req.user.id, { include: [{ model: Wallet, as: 'wallet' }] }),
      User.findOne({ where: { referralCode: normalizedReferralCode } }),
    ]);
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    if (!referrer) return res.status(400).json({ message: 'Invalid referral code.' });
    if (referrer.id === user.id) return res.status(400).json({ message: 'You cannot refer your own account.' });
    if (user.referredById && user.referredById !== referrer.id) {
      return res.status(409).json({ message: 'This account is already linked to another broker.' });
    }
    if (!user.referredById) await user.update({ referredById: referrer.id });
    return res.json({ user: publicUser(user), referralCode: normalizedReferralCode });
  } catch (error) {
    return next(error);
  }
};
