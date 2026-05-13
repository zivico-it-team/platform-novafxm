const express = require('express');
const { pool, isDatabaseAvailable } = require('../../config/database');
const authMiddleware = require('../../middleware/auth');
const localStore = require('../../lib/localStore');
const {
  calculateAccountMetrics,
  calculateMarginRequired,
  calculatePnL,
  getExecutionPrice,
  normalizeOrderType,
  validateNewOrder,
  validateStops,
} = require('../../lib/brokerEngine');

const router = express.Router();

const getAccountId = (req) => req.query.account_id || req.body.account_id;

const getTradingAccount = async (connection, userId, accountId) => {
  const [accounts] = await connection.execute(
    `SELECT id, user_id, account_type, balance, bonus, equity, used_margin, free_margin, margin_level, leverage
     FROM trading_accounts
     WHERE id = ? AND user_id = ? AND status = 'active'`,
    [accountId, userId]
  );

  return accounts[0] || null;
};

const getOpenTradesForAccount = async (connection, userId, accountId) => {
  const [trades] = await connection.execute(
    `SELECT id, account_id, symbol, type, lot_size, open_price, close_price, take_profit, stop_loss, pnl, status, opened_at
     FROM trades WHERE user_id = ? AND account_id = ? AND status = "open"`,
    [userId, accountId]
  );

  return trades;
};

const syncAccountMetrics = async (connection, account) => {
  const openTrades = await getOpenTradesForAccount(connection, account.user_id, account.id);
  const metrics = calculateAccountMetrics(account, openTrades);

  await connection.execute(
    `UPDATE trading_accounts
     SET equity = ?, used_margin = ?, free_margin = ?, margin_level = ?, updated_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [metrics.equity, metrics.used_margin, metrics.free_margin, metrics.margin_level, account.id, account.user_id]
  );

  return { ...account, ...metrics };
};

// Get all open trades
router.get('/open', authMiddleware, async (req, res) => {
  try {
    const accountId = getAccountId(req);

    if (!accountId) {
      return res.status(400).json({ error: 'account_id is required' });
    }

    if (!isDatabaseAvailable()) {
      return res.json(localStore.getOpenTrades(req.userId, accountId));
    }

    const connection = await pool.getConnection();

    const [trades] = await connection.execute(
      `SELECT id, account_id, symbol, type, lot_size, open_price, close_price, take_profit, stop_loss, pnl, status, opened_at
       FROM trades WHERE user_id = ? AND account_id = ? AND status = "open"`,
      [req.userId, accountId]
    );

    connection.release();

    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all trades (open and closed)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const accountId = getAccountId(req);

    if (!accountId) {
      return res.status(400).json({ error: 'account_id is required' });
    }

    if (!isDatabaseAvailable()) {
      return res.json(localStore.getTrades(req.userId, accountId));
    }

    const connection = await pool.getConnection();

    const [trades] = await connection.execute(
      `SELECT id, account_id, symbol, type, lot_size, open_price, close_price, take_profit, stop_loss, pnl, status, opened_at, closed_at
       FROM trades WHERE user_id = ? AND account_id = ? ORDER BY opened_at DESC`,
      [req.userId, accountId]
    );

    connection.release();

    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trade history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const accountId = getAccountId(req);

    if (!accountId) {
      return res.status(400).json({ error: 'account_id is required' });
    }

    if (!isDatabaseAvailable()) {
      return res.json(localStore.getHistory(req.userId, accountId));
    }

    const connection = await pool.getConnection();

    const [history] = await connection.execute(
      `SELECT id, account_id, symbol, type, lot_size, open_price, close_price, pnl, opened_at, closed_at
       FROM trade_history WHERE user_id = ? AND account_id = ? ORDER BY closed_at DESC LIMIT 100`,
      [req.userId, accountId]
    );

    connection.release();

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Open a new trade
router.post('/open', authMiddleware, async (req, res) => {
  try {
    const { symbol, type, lot_size, take_profit, stop_loss, account_id } = req.body;

    if (!account_id || !symbol || !type || !lot_size) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const orderError = validateNewOrder({ symbol, type, lotSize: lot_size });
    if (orderError) {
      return res.status(400).json({ error: orderError });
    }

    const normalizedType = normalizeOrderType(type);
    const openPrice = getExecutionPrice({ symbol, type: normalizedType, action: 'open' });
    if (!openPrice) {
      return res.status(422).json({ error: 'No executable broker quote is available for this symbol' });
    }

    const stopError = validateStops({ type: normalizedType, openPrice, takeProfit: take_profit, stopLoss: stop_loss });
    if (stopError) {
      return res.status(400).json({ error: stopError });
    }

    if (!isDatabaseAvailable()) {
      const account = localStore.getTradingAccounts(req.userId).find((item) => item.id === Number(account_id));
      if (!account) return res.status(404).json({ error: 'Trading account not found' });

      const marginRequired = calculateMarginRequired({
        symbol,
        lotSize: lot_size,
        price: openPrice,
        leverage: account.leverage,
      });
      const result = localStore.openTrade(
        req.userId,
        account_id,
        { symbol, type: normalizedType, lot_size, open_price: openPrice, take_profit, stop_loss },
        marginRequired
      );

      if (result.error) {
        return res.status(result.status || 400).json({ error: result.error });
      }

      return res.status(201).json({
        message: 'Trade opened successfully',
        tradeId: result.tradeId,
      });
    }

    const connection = await pool.getConnection();

    let account = await getTradingAccount(connection, req.userId, account_id);

    if (!account) {
      connection.release();
      return res.status(404).json({ error: 'Trading account not found' });
    }

    account = await syncAccountMetrics(connection, account);

    const marginRequired = calculateMarginRequired({
      symbol,
      lotSize: lot_size,
      price: openPrice,
      leverage: account.leverage,
    });

    if (marginRequired > Number(account.free_margin)) {
      connection.release();
      return res.status(400).json({ error: 'Insufficient margin' });
    }

    // Insert trade
    const [result] = await connection.execute(
      `INSERT INTO trades (user_id, account_id, symbol, type, lot_size, open_price, take_profit, stop_loss, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
      [req.userId, account_id, symbol, normalizedType, lot_size, openPrice, take_profit || null, stop_loss || null]
    );

    // Update trading account margin
    const newUsedMargin = Number(account.used_margin) + Number(marginRequired);
    const newFreeMargin = Number(account.equity) - newUsedMargin;
    const newMarginLevel = newUsedMargin > 0 ? (Number(account.equity) / newUsedMargin) * 100 : 0;
    await connection.execute(
      'UPDATE trading_accounts SET used_margin = ?, free_margin = ?, margin_level = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [newUsedMargin, newFreeMargin, newMarginLevel, account_id, req.userId]
    );

    connection.release();

    res.status(201).json({
      message: 'Trade opened successfully',
      tradeId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Close a trade
router.post('/:tradeId/close', authMiddleware, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { account_id } = req.body;

    if (!account_id) {
      return res.status(400).json({ error: 'account_id is required' });
    }

    if (!isDatabaseAvailable()) {
      const result = localStore.closeTrade(req.userId, account_id, tradeId);

      if (result.error) {
        return res.status(result.status || 400).json({ error: result.error });
      }

      return res.json({
        message: 'Trade closed successfully',
        pnl: result.pnl,
      });
    }

    const connection = await pool.getConnection();

    // Get trade
    const [trades] = await connection.execute(
      'SELECT * FROM trades WHERE id = ? AND user_id = ? AND account_id = ? AND status = "open"',
      [tradeId, req.userId, account_id]
    );

    if (trades.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = trades[0];
    const closePrice = getExecutionPrice({ symbol: trade.symbol, type: trade.type, action: 'close' });

    if (!closePrice) {
      connection.release();
      return res.status(422).json({ error: 'No executable broker quote is available for this symbol' });
    }

    const pnl = calculatePnL({
      symbol: trade.symbol,
      type: trade.type,
      lotSize: trade.lot_size,
      openPrice: trade.open_price,
      closePrice,
    });

    // Update trade
    await connection.execute(
      'UPDATE trades SET close_price = ?, pnl = ?, status = "closed", closed_at = NOW() WHERE id = ?',
      [closePrice, pnl, tradeId]
    );

    // Move to history
    await connection.execute(
      `INSERT INTO trade_history (user_id, account_id, symbol, type, lot_size, open_price, close_price, pnl, opened_at, closed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [req.userId, account_id, trade.symbol, trade.type, trade.lot_size, trade.open_price, closePrice, pnl, trade.opened_at]
    );

    // Update trading account balance and margin
    const account = await getTradingAccount(connection, req.userId, account_id);
    if (!account) {
      connection.release();
      return res.status(404).json({ error: 'Trading account not found' });
    }

    const newBalance = Number(account.balance) + pnl;
    const openTrades = (await getOpenTradesForAccount(connection, req.userId, account_id)).filter(
      (item) => Number(item.id) !== Number(tradeId)
    );
    const metrics = calculateAccountMetrics({ ...account, balance: newBalance }, openTrades);

    await connection.execute(
      'UPDATE trading_accounts SET balance = ?, equity = ?, used_margin = ?, free_margin = ?, margin_level = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [newBalance, metrics.equity, metrics.used_margin, metrics.free_margin, metrics.margin_level, account_id, req.userId]
    );

    connection.release();

    res.json({
      message: 'Trade closed successfully',
      pnl,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update trade (SL/TP)
router.put('/:tradeId', authMiddleware, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const accountId = getAccountId(req);
    const { take_profit, stop_loss } = req.body;

    if (!isDatabaseAvailable()) {
      if (take_profit === undefined && stop_loss === undefined) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const updated = localStore.updateTrade(req.userId, accountId, tradeId, { take_profit, stop_loss });

      if (!updated) {
        return res.status(404).json({ error: 'Trade not found' });
      }

      return res.json({ message: 'Trade updated successfully' });
    }

    const connection = await pool.getConnection();

    const updates = [];
    const params = [];

    if (take_profit !== undefined) {
      updates.push('take_profit = ?');
      params.push(take_profit);
    }

    if (stop_loss !== undefined) {
      updates.push('stop_loss = ?');
      params.push(stop_loss);
    }

    if (updates.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(tradeId);
    params.push(req.userId);
    if (accountId) params.push(accountId);

    const query = `UPDATE trades SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND user_id = ?${accountId ? ' AND account_id = ?' : ''}`;

    await connection.execute(query, params);

    connection.release();

    res.json({ message: 'Trade updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
