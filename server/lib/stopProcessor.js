const { pool, isDatabaseAvailable } = require('../config/database');
const localStore = require('./localStore');
const {
  calculateAccountMetrics,
  calculatePnL,
  getExecutionPrice,
  getTriggeredExit,
} = require('./brokerEngine');

let isProcessing = false;

const getOpenTradesForAccount = async (connection, userId, accountId) => {
  const [trades] = await connection.execute(
    `SELECT symbol, type, lot_size, open_price
     FROM trades
     WHERE user_id = ? AND account_id = ? AND status = 'open'`,
    [userId, accountId]
  );

  return trades;
};

const closeTriggeredDbTrade = async (connection, trade, triggeredExit) => {
  const closePrice = getExecutionPrice({ symbol: trade.symbol, type: trade.type, action: 'close' });
  if (!closePrice) return false;

  const pnl = calculatePnL({
    symbol: trade.symbol,
    type: trade.type,
    lotSize: trade.lot_size,
    openPrice: trade.open_price,
    closePrice,
  });

  await connection.beginTransaction();

  try {
    const [result] = await connection.execute(
      `UPDATE trades
       SET close_price = ?, pnl = ?, status = 'closed', closed_at = NOW(), updated_at = NOW()
       WHERE id = ? AND status = 'open'`,
      [closePrice, pnl, trade.id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return false;
    }

    await connection.execute(
      `INSERT INTO trade_history (user_id, account_id, symbol, type, lot_size, open_price, close_price, pnl, opened_at, closed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [trade.user_id, trade.account_id, trade.symbol, trade.type, trade.lot_size, trade.open_price, closePrice, pnl, trade.opened_at]
    );

    const [accounts] = await connection.execute(
      `SELECT id, user_id, balance, leverage
       FROM trading_accounts
       WHERE id = ? AND user_id = ? AND status = 'active'`,
      [trade.account_id, trade.user_id]
    );
    const account = accounts[0];

    if (account) {
      const nextBalance = Number(account.balance) + pnl;
      const openTrades = await getOpenTradesForAccount(connection, trade.user_id, trade.account_id);
      const metrics = calculateAccountMetrics({ ...account, balance: nextBalance }, openTrades);

      await connection.execute(
        `UPDATE trading_accounts
         SET balance = ?, equity = ?, used_margin = ?, free_margin = ?, margin_level = ?, updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [nextBalance, metrics.equity, metrics.used_margin, metrics.free_margin, metrics.margin_level, trade.account_id, trade.user_id]
      );
    }

    await connection.commit();
    console.log(`Closed ${trade.symbol} #${trade.id} by ${triggeredExit.reason}`);
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
};

const processBrokerStops = async () => {
  if (isProcessing) return 0;
  isProcessing = true;

  try {
    if (!isDatabaseAvailable()) {
      return localStore.processTriggeredStops();
    }

    const connection = await pool.getConnection();
    try {
      const [trades] = await connection.execute(
        `SELECT id, user_id, account_id, symbol, type, lot_size, open_price, take_profit, stop_loss, opened_at
         FROM trades
         WHERE status = 'open' AND (take_profit IS NOT NULL OR stop_loss IS NOT NULL)`
      );

      let closedCount = 0;
      for (const trade of trades) {
        const triggeredExit = getTriggeredExit(trade);
        if (!triggeredExit) continue;
        if (await closeTriggeredDbTrade(connection, trade, triggeredExit)) {
          closedCount++;
        }
      }

      return closedCount;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Broker stop processor failed:', error.message);
    return 0;
  } finally {
    isProcessing = false;
  }
};

module.exports = {
  processBrokerStops,
};
