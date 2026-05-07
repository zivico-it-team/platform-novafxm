const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, isDatabaseAvailable } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateInput } = require('../middleware/validation');
const localStore = require('../lib/localStore');

const router = express.Router();

const ACCOUNT_TYPES = new Set(['demo', 'live']);
const getAccountSettings = (accountType) => {
  const normalizedType = ACCOUNT_TYPES.has(accountType) ? accountType : 'demo';
  const startingBalance = normalizedType === 'live' ? 0 : 10000;

  return {
    accountType: normalizedType,
    startingBalance,
  };
};

// Register validation schema
const registerSchema = {
  email: { required: true, type: 'email' },
  username: { required: true, type: 'string', minLength: 3 },
  password: { required: true, type: 'string', minLength: 6 },
};

// Login validation schema
const loginSchema = {
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string' },
};

// Register
router.post('/register', validateInput(registerSchema), asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  const { accountType, startingBalance } = getAccountSettings(req.body.account_type);
  let connection;

  try {
    if (!isDatabaseAvailable()) {
      const existingUser = localStore.findUserByEmailOrUsername(email, username);

      if (existingUser) {
        return res.status(409).json({ error: 'Email or username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = localStore.createUser({
        email,
        username,
        password: hashedPassword,
        accountType,
        startingBalance,
      });

      return res.status(201).json({
        message: 'User registered successfully',
        userId,
      });
    }

    connection = await pool.getConnection();

    // Check if user exists
    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await connection.execute(
      `INSERT INTO users
        (email, username, password, account_type, balance, equity, free_margin)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, username, hashedPassword, accountType, startingBalance, startingBalance, startingBalance]
    );

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId,
    });
  } catch (error) {
    throw error;
  } finally {
    if (connection) connection.release();
  }
}));

// Login
router.post('/login', validateInput(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  let connection;

  try {
    if (!isDatabaseAvailable()) {
      const user = localStore.findUserByEmail(email);

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: '24h',
      });

      return res.json({
        token,
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role || (user.email === process.env.ADMIN_EMAIL ? 'admin' : 'customer'),
      });
    }

    connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT id, email, username, password, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      token,
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role || (user.email === process.env.ADMIN_EMAIL ? 'admin' : 'customer'),
    });
  } catch (error) {
    throw error;
  } finally {
    if (connection) connection.release();
  }
}));

module.exports = router;
