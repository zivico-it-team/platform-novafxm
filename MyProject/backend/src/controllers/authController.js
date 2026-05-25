const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/db');
const { User, Wallet } = require('../models');

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
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password || password.length < 8) return res.status(400).json({ message: 'Name, email and password of at least 8 characters are required.' });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ where: { email: normalizedEmail } })) return res.status(409).json({ message: 'Email already registered.' });
    const user = await sequelize.transaction(async (transaction) => {
      const created = await User.create({ name: name.trim(), email: normalizedEmail, phone, password: await bcrypt.hash(password, 12) }, { transaction });
      await Wallet.create({ userId: created.id, balance: 5000 }, { transaction });
      return created;
    });
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
