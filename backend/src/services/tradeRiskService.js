const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { Trade, TradingAccount, Transaction, Wallet } = require('../models');
const { createNotification } = require('./notificationService');

const money = (value) => Number(Number(value || 0).toFixed(2));
const contractSize = (symbol) => (
  symbol.includes('BTC') || symbol.includes('ETH') || symbol === 'US500'
    ? 1
    : symbol.includes('XAU') || symbol.includes('OIL') ? 100 : 100000
);
const pnl = (trade, closePrice) => money(
  (Number(closePrice) - Number(trade.openPrice))
  * (trade.side === 'BUY' ? 1 : -1)
  * Number(trade.lots)
  * contractSize(trade.symbol),
);

const RISK_CHECK_INTERVAL_MS = Math.max(250, Number(process.env.RISK_CHECK_INTERVAL_MS) || 1000);
let lastCheckAt = 0;
let checking = false;

function closePriceFor(trade, quote) {
  const bid = Number(quote?.bid || quote?.price);
  const ask = Number(quote?.ask || quote?.price);
  return trade.side === 'BUY' ? bid : ask;
}

function triggerFor(trade, quote) {
  const closePrice = closePriceFor(trade, quote);
  if (!(closePrice > 0)) return null;

  const stopLoss = Number(trade.stopLoss);
  const takeProfit = Number(trade.takeProfit);
  if (trade.side === 'BUY') {
    if (stopLoss > 0 && closePrice <= stopLoss) return { reason: 'stop_loss', closePrice };
    if (takeProfit > 0 && closePrice >= takeProfit) return { reason: 'take_profit', closePrice };
  } else {
    if (stopLoss > 0 && closePrice >= stopLoss) return { reason: 'stop_loss', closePrice };
    if (takeProfit > 0 && closePrice <= takeProfit) return { reason: 'take_profit', closePrice };
  }

  return null;
}

async function closeTriggeredTrade(tradeId, trigger) {
  let closedTrade;
  let tradingAccount;
  const profit = pnl(trigger.trade, trigger.closePrice);

  await sequelize.transaction(async (transaction) => {
    const trade = await Trade.findOne({
      where: { id: tradeId, status: 'open' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!trade) return;

    tradingAccount = await TradingAccount.findOne({
      where: { id: trade.tradingAccountId, userId: trade.userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!tradingAccount) return;

    const wallet = await Wallet.findOne({
      where: { userId: trade.userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const realizedProfit = pnl(trade, trigger.closePrice);
    await trade.update({
      closePrice: trigger.closePrice,
      profit: realizedProfit,
      status: 'closed',
      closedAt: new Date(),
    }, { transaction });

    const before = money(tradingAccount.balance);
    const after = money(before + realizedProfit);
    const remainingMargin = Number(await Trade.sum('margin', {
      where: { userId: trade.userId, tradingAccountId: tradingAccount.id, status: { [Op.in]: ['pending', 'open'] } },
      transaction,
    }) || 0);
    const margin = money(Math.max(0, remainingMargin));

    await tradingAccount.update({ balance: after }, { transaction });
    if (tradingAccount.isPrimary && wallet) {
      await wallet.update({ balance: after, equity: after, margin, freeFunds: money(after - margin) }, { transaction });
    }

    await Transaction.create({
      userId: trade.userId,
      type: realizedProfit >= 0 ? 'trade_profit' : 'trade_loss',
      amount: Math.abs(realizedProfit),
      status: 'completed',
      balanceBefore: before,
      balanceAfter: after,
      note: `${trigger.reason === 'stop_loss' ? 'Stop loss' : 'Take profit'} auto close`,
      referenceType: 'trade',
      referenceId: trade.id,
      description: `${trade.side} ${trade.symbol} auto closed by ${trigger.reason === 'stop_loss' ? 'stop loss' : 'take profit'}`,
    }, { transaction });

    closedTrade = trade;
  });

  if (!closedTrade) return;

  await createNotification({
    userId: closedTrade.userId,
    title: trigger.reason === 'stop_loss' ? 'Stop Loss Triggered' : 'Take Profit Triggered',
    message: `${closedTrade.side} ${closedTrade.symbol} auto closed at ${Number(trigger.closePrice).toFixed(5)} with ${profit >= 0 ? 'profit' : 'loss'} of $${Math.abs(profit).toFixed(2)}.`,
    type: 'trade',
  }).catch((error) => console.error('Risk notification failed:', error.message));
}

async function checkRiskOrders(prices) {
  if (checking || Date.now() - lastCheckAt < RISK_CHECK_INTERVAL_MS) return;
  checking = true;
  lastCheckAt = Date.now();

  try {
    const quotesBySymbol = new Map((prices || []).map((price) => [price.symbol, price]));
    const trades = await Trade.findAll({
      where: {
        status: 'open',
        [Op.or]: [
          { stopLoss: { [Op.ne]: null } },
          { takeProfit: { [Op.ne]: null } },
        ],
      },
      order: [['createdAt', 'ASC']],
    });

    for (const trade of trades) {
      const quote = quotesBySymbol.get(trade.symbol);
      const trigger = quote ? triggerFor(trade, quote) : null;
      if (trigger) await closeTriggeredTrade(trade.id, { ...trigger, trade });
    }
  } catch (error) {
    console.error('Risk order check failed:', error.message);
  } finally {
    checking = false;
  }
}

module.exports = { checkRiskOrders, triggerFor };
