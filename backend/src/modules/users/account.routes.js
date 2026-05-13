const express = require('express');
const { pool, isDatabaseAvailable } = require('../../config/database');
const authMiddleware = require('../../middleware/auth');
const localStore = require('../../lib/localStore');
const { calculateAccountMetrics } = require('../../lib/brokerEngine');

const router = express.Router();

const getStartingBalance = (accountType) => (accountType === 'live' ? 0 : 10000);
const normalizeAccountType = (accountType) => (accountType === 'live' ? 'live' : 'demo');

const isAdminUser = async (userId) => {
  if (!isDatabaseAvailable()) {
    return localStore.isAdmin(userId);
  }

  const connection = await pool.getConnection();
  const [users] = await connection.execute(
    'SELECT email, role FROM users WHERE id = ?',
    [userId]
  );
  connection.release();

  const user = users[0];
  return Boolean(user && (user.role === 'admin' || user.email === process.env.ADMIN_EMAIL));
};

// Get user account
router.get('/account', authMiddleware, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      const user = localStore.getUser(req.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(user);
    }

    const connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT id, email, username, account_type, balance, equity, used_margin, free_margin, margin_level, leverage FROM users WHERE id = ?',
      [req.userId]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update account leverage
router.put('/account/leverage', authMiddleware, async (req, res) => {
  try {
    const { leverage } = req.body;

    if (!leverage || leverage < 1 || leverage > 500) {
      return res.status(400).json({ error: 'Leverage must be between 1 and 500' });
    }

    if (!isDatabaseAvailable()) {
      const updated = localStore.updateLeverage(req.userId, leverage);

      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ message: 'Leverage updated successfully' });
    }

    const connection = await pool.getConnection();

    await connection.execute(
      'UPDATE users SET leverage = ? WHERE id = ?',
      [leverage, req.userId]
    );

    connection.release();

    res.json({ message: 'Leverage updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/trading-accounts', authMiddleware, async (req, res) => {
  try {
    if (await isAdminUser(req.userId)) {
      return res.json([]);
    }

    if (!isDatabaseAvailable()) {
      return res.json(localStore.getTradingAccounts(req.userId));
    }

    const connection = await pool.getConnection();
    const [accounts] = await connection.execute(
      `SELECT ta.id, ta.account_number, ta.account_type, ta.name, ta.balance, ta.bonus, ta.equity,
        ta.used_margin, ta.free_margin, ta.margin_level, ta.leverage, ta.status, ta.created_at,
        u.username
       FROM trading_accounts ta
       JOIN users u ON u.id = ta.user_id
       WHERE ta.user_id = ? AND ta.status = 'active'
       ORDER BY created_at DESC`,
      [req.userId]
    );

    const syncedAccounts = [];
    for (const account of accounts) {
      const [openTrades] = await connection.execute(
        `SELECT symbol, type, lot_size, open_price
         FROM trades
         WHERE user_id = ? AND account_id = ? AND status = 'open'`,
        [req.userId, account.id]
      );
      const metrics = calculateAccountMetrics(account, openTrades);
      await connection.execute(
        `UPDATE trading_accounts
         SET equity = ?, used_margin = ?, free_margin = ?, margin_level = ?, updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [metrics.equity, metrics.used_margin, metrics.free_margin, metrics.margin_level, account.id, req.userId]
      );
      syncedAccounts.push({ ...account, ...metrics });
    }

    connection.release();
    res.json(syncedAccounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/trading-accounts', authMiddleware, async (req, res) => {
  try {
    if (await isAdminUser(req.userId)) {
      return res.status(403).json({ error: 'Admin users do not use trading accounts' });
    }

    const accountType = normalizeAccountType(req.body.account_type);
    const startingBalance = getStartingBalance(accountType);

    if (!isDatabaseAvailable()) {
      const result = localStore.createTradingAccount(req.userId, accountType);

      if (result.error) {
        return res.status(result.status || 400).json({ error: result.error });
      }

      return res.status(201).json(result.account);
    }

    const connection = await pool.getConnection();
    const [[nextAccount]] = await connection.execute(
      'SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM trading_accounts'
    );
    const accountNumber = `${accountType.toUpperCase()}-${String(nextAccount.next_id).padStart(6, '0')}`;
    const name = accountType === 'live' ? 'NovaFXM Live Account' : 'NovaFXM Demo Account';

    const [result] = await connection.execute(
      `INSERT INTO trading_accounts
        (user_id, account_number, account_type, name, balance, bonus, equity, free_margin, margin_level)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0)`,
      [req.userId, accountNumber, accountType, name, startingBalance, startingBalance, startingBalance]
    );

    const [accounts] = await connection.execute(
      `SELECT ta.id, ta.account_number, ta.account_type, ta.name, ta.balance, ta.bonus, ta.equity,
        ta.used_margin, ta.free_margin, ta.margin_level, ta.leverage, ta.status, ta.created_at,
        u.username
       FROM trading_accounts ta
       JOIN users u ON u.id = ta.user_id
       WHERE ta.id = ?`,
      [result.insertId]
    );

    connection.release();
    res.status(201).json(accounts[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    if (await isAdminUser(req.userId)) {
      return res.json([]);
    }

    if (!isDatabaseAvailable()) {
      return res.json(localStore.getAccountTransactions(req.userId));
    }

    const connection = await pool.getConnection();
    const [transactions] = await connection.execute(
      `SELECT id, admin_user_id, account_id, user_id, account_number, type, amount,
        previous_balance, new_balance, note, created_at
       FROM admin_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.userId]
    );

    connection.release();
    return res.json(transactions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/bank-info', authMiddleware, async (req, res) => {
  try {
    if (await isAdminUser(req.userId)) {
      return res.json([]);
    }

    if (!isDatabaseAvailable()) {
      return res.json(localStore.getBankInfos(req.userId));
    }

    const connection = await pool.getConnection();
    const [bankInfos] = await connection.execute(
      `SELECT id, user_id, bank_account_number, account_holder_name, bank_name,
        branch, swift_code, bank_account_alias, created_at, updated_at
       FROM bank_infos
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.userId]
    );

    connection.release();
    return res.json(bankInfos);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/bank-info', authMiddleware, async (req, res) => {
  try {
    if (await isAdminUser(req.userId)) {
      return res.status(403).json({ error: 'Admin users do not use bank information' });
    }

    const bankAccountNumber = String(req.body.bank_account_number || '').trim();
    const accountHolderName = String(req.body.account_holder_name || '').trim();
    const bankName = String(req.body.bank_name || '').trim();
    const branch = String(req.body.branch || '').trim();

    if (!bankAccountNumber || !accountHolderName || !bankName || !branch) {
      return res.status(400).json({ error: 'Bank account number, account holder name, bank name, and branch are required' });
    }

    if (!isDatabaseAvailable()) {
      const result = localStore.createBankInfo(req.userId, req.body);

      if (result.error) {
        return res.status(result.status || 400).json({ error: result.error });
      }

      return res.status(201).json(result.bankInfo);
    }

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO bank_infos
        (user_id, bank_account_number, account_holder_name, bank_name, branch, swift_code, bank_account_alias)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        bankAccountNumber,
        accountHolderName,
        bankName,
        branch,
        req.body.swift_code || '',
        req.body.bank_account_alias || '',
      ]
    );

    const [bankInfos] = await connection.execute(
      `SELECT id, user_id, bank_account_number, account_holder_name, bank_name,
        branch, swift_code, bank_account_alias, created_at, updated_at
       FROM bank_infos
       WHERE id = ?`,
      [result.insertId]
    );

    connection.release();
    return res.status(201).json(bankInfos[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/documents', authMiddleware, async (req, res) => {
  try {
    if (await isAdminUser(req.userId)) {
      return res.json([]);
    }

    if (!isDatabaseAvailable()) {
      return res.json(localStore.getDocuments(req.userId));
    }

    const connection = await pool.getConnection();
    const [documents] = await connection.execute(
      `SELECT id, user_id, document_type, file_name, file_size, mime_type, link, status,
        reason, created_at, processed_at, processed_by
       FROM account_documents
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.userId]
    );

    connection.release();
    return res.json(documents);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/documents', authMiddleware, async (req, res) => {
  try {
    if (await isAdminUser(req.userId)) {
      return res.status(403).json({ error: 'Admin users do not upload account documents' });
    }

    const documentType = String(req.body.document_type || '').trim();
    const fileName = String(req.body.file_name || '').trim();

    if (!documentType || !fileName) {
      return res.status(400).json({ error: 'Document type and file name are required' });
    }

    if (!isDatabaseAvailable()) {
      const result = localStore.createDocument(req.userId, req.body);

      if (result.error) {
        return res.status(result.status || 400).json({ error: result.error });
      }

      return res.status(201).json(result.document);
    }

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO account_documents
        (user_id, document_type, file_name, file_size, mime_type, link, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        req.userId,
        documentType,
        fileName,
        Number(req.body.file_size || 0),
        req.body.mime_type || '',
        req.body.link || fileName,
      ]
    );

    const [documents] = await connection.execute(
      `SELECT id, user_id, document_type, file_name, file_size, mime_type, link, status,
        reason, created_at, processed_at, processed_by
       FROM account_documents
       WHERE id = ?`,
      [result.insertId]
    );

    connection.release();
    return res.status(201).json(documents[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get account stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.json(localStore.getStats(req.userId));
    }

    const connection = await pool.getConnection();

    const [account] = await connection.execute(
      'SELECT balance, equity, used_margin, free_margin, margin_level FROM users WHERE id = ?',
      [req.userId]
    );

    const [trades] = await connection.execute(
      'SELECT COUNT(*) as total_trades, SUM(CASE WHEN status = "open" THEN 1 ELSE 0 END) as open_trades FROM trades WHERE user_id = ?',
      [req.userId]
    );

    const [history] = await connection.execute(
      'SELECT SUM(pnl) as total_pnl, COUNT(*) as closed_trades FROM trade_history WHERE user_id = ?',
      [req.userId]
    );

    connection.release();

    res.json({
      account: account[0],
      trades: trades[0],
      history: history[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
