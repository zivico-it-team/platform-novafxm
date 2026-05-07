const express = require('express');
const { pool, isDatabaseAvailable } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const localStore = require('../lib/localStore');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/accounts', async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.json(localStore.getAdminAccounts());
    }

    const connection = await pool.getConnection();
    const [accounts] = await connection.execute(
      `SELECT
        ta.id, ta.user_id, ta.account_number, ta.account_type, ta.name, ta.balance, ta.equity,
        ta.used_margin, ta.free_margin, ta.leverage, ta.status, ta.created_at, ta.updated_at,
        u.email, u.username, u.role
       FROM trading_accounts ta
       JOIN users u ON u.id = ta.user_id
       WHERE ta.status = 'active'
        AND COALESCE(u.role, 'customer') <> 'admin'
        AND u.email <> ?
       ORDER BY ta.created_at DESC`
      ,
      [process.env.ADMIN_EMAIL || '']
    );

    const [transactions] = await connection.execute(
      `SELECT id, admin_user_id, account_id, user_id, account_number, type, amount,
        previous_balance, new_balance, note, created_at
       FROM admin_transactions
       ORDER BY created_at DESC
       LIMIT 100`
    );
    connection.release();

    const mappedAccounts = accounts.map((account) => ({
      id: account.id,
      user_id: account.user_id,
      account_number: account.account_number,
      account_type: account.account_type,
      name: account.name,
      balance: Number(account.balance || 0),
      equity: Number(account.equity || 0),
      used_margin: Number(account.used_margin || 0),
      free_margin: Number(account.free_margin || 0),
      leverage: Number(account.leverage || 0),
      status: account.status,
      created_at: account.created_at,
      updated_at: account.updated_at,
      user: {
        id: account.user_id,
        email: account.email,
        username: account.username,
        role: account.role,
      },
    }));
    const demo = mappedAccounts.filter((account) => account.account_type === 'demo');
    const live = mappedAccounts.filter((account) => account.account_type === 'live');

    return res.json({
      demo,
      live,
      totals: {
        demoAccounts: demo.length,
        liveAccounts: live.length,
        demoBalance: demo.reduce((sum, account) => sum + Number(account.balance || 0), 0),
        liveBalance: live.reduce((sum, account) => sum + Number(account.balance || 0), 0),
      },
      transactions,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/live-accounts/:accountId/adjust', async (req, res) => {
  try {
    const { accountId } = req.params;
    const amount = Number(req.body.amount);
    const note = req.body.note || '';

    if (!Number.isFinite(amount) || amount === 0) {
      return res.status(400).json({ error: 'Amount must be a non-zero number' });
    }

    if (!isDatabaseAvailable()) {
      const result = localStore.adjustLiveAccountBalance({
        adminUserId: req.userId,
        accountId,
        amount,
        note,
      });

      if (result.error) {
        return res.status(result.status || 400).json({ error: result.error });
      }

      return res.json(result);
    }

    const connection = await pool.getConnection();
    const [accounts] = await connection.execute(
      `SELECT ta.id, ta.user_id, ta.account_number, ta.account_type, ta.balance, ta.equity,
        ta.used_margin, ta.free_margin, u.email, u.role
       FROM trading_accounts ta
       JOIN users u ON u.id = ta.user_id
       WHERE ta.id = ? AND ta.account_type = 'live' AND ta.status = 'active'
        AND COALESCE(u.role, 'customer') <> 'admin'
        AND u.email <> ?`,
      [accountId, process.env.ADMIN_EMAIL || '']
    );

    const account = accounts[0];
    if (!account) {
      connection.release();
      return res.status(404).json({ error: 'Live account not found' });
    }

    const previousBalance = Number(account.balance || 0);
    const newBalance = previousBalance + amount;
    const newEquity = Number(account.equity || 0) + amount;
    const newFreeMargin = newBalance - Number(account.used_margin || 0);

    await connection.execute(
      `UPDATE trading_accounts
       SET balance = ?, equity = ?, free_margin = ?, updated_at = NOW()
       WHERE id = ?`,
      [newBalance, newEquity, newFreeMargin, accountId]
    );

    const [transactionResult] = await connection.execute(
      `INSERT INTO admin_transactions
        (admin_user_id, account_id, user_id, account_number, type, amount, previous_balance, new_balance, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        account.id,
        account.user_id,
        account.account_number,
        amount > 0 ? 'credit' : 'debit',
        amount,
        previousBalance,
        newBalance,
        note,
      ]
    );

    connection.release();

    return res.json({
      account: {
        ...account,
        balance: newBalance,
        equity: newEquity,
        free_margin: newFreeMargin,
      },
      transaction: {
        id: transactionResult.insertId,
        account_id: account.id,
        amount,
        previous_balance: previousBalance,
        new_balance: newBalance,
        note,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
