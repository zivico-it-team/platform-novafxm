'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context/useAuth';
import { getSymbolMeta } from './symbolMeta';
import {
  calculatePnL,
  calculateMargin,
  calculateMarginLevel,
} from './tradingEngine';
import { getCloseExecutionPrice, getLiveQuote, getOpenExecutionPrice } from './marketQuotes';
import { accountAPI, tradesAPI, pricesAPI } from './api';

const INITIAL_BALANCE = 10000;
const LEVERAGE = 200;

const toNumberOrNull = (value) => {
  const numericPrice = Number(value);
  return Number.isFinite(numericPrice) ? numericPrice : null;
};

const normalizeQuote = (price) => {
  if (price == null) return null;

  if (typeof price === 'object') {
    const bid = toNumberOrNull(price.bid);
    const ask = toNumberOrNull(price.ask);
    const mid = toNumberOrNull(price.mid ?? price.price);

    if (bid != null && ask != null) {
      return {
        bid,
        ask,
        mid: mid ?? (bid + ask) / 2,
      };
    }

    return normalizeQuote(price.mid ?? price.price ?? price.bid ?? price.ask);
  }

  return toNumberOrNull(price);
};

const normalizePriceMap = (priceMap = {}) => (
  Object.entries(priceMap).reduce((acc, [symbol, price]) => {
    const quote = normalizeQuote(price);
    if (quote != null) {
      acc[symbol] = quote;
    }
    return acc;
  }, {})
);

const mapApiAccount = (apiAccount) => ({
  id: apiAccount.id ?? null,
  accountNumber: apiAccount.account_number ?? null,
  username: apiAccount.username ?? apiAccount.user?.username ?? null,
  name: apiAccount.name ?? (apiAccount.account_type === 'live' ? 'Live Account' : 'Demo Account'),
  accountType: apiAccount.account_type || 'demo',
  balance: Number(apiAccount.balance ?? INITIAL_BALANCE),
  equity: Number(apiAccount.equity ?? INITIAL_BALANCE),
  usedMargin: Number(apiAccount.used_margin ?? 0),
  freeMargin: Number(apiAccount.free_margin ?? INITIAL_BALANCE),
  marginLevel: Number(apiAccount.margin_level ?? 0),
  leverage: Number(apiAccount.leverage ?? LEVERAGE),
});

const mapApiTrade = (trade) => ({
  id: trade.id,
  symbol: trade.symbol,
  type: trade.type?.toUpperCase() === 'SELL' ? 'SELL' : 'BUY',
  lot: Number(trade.lot_size),
  openPrice: Number(trade.open_price),
  closePrice: trade.close_price != null ? Number(trade.close_price) : null,
  takeProfit: trade.take_profit != null ? Number(trade.take_profit) : null,
  stopLoss: trade.stop_loss != null ? Number(trade.stop_loss) : null,
  pnl: trade.pnl != null ? Number(trade.pnl) : 0,
  status: trade.status?.toUpperCase() === 'CLOSED' ? 'CLOSED' : 'OPEN',
  openedAt: trade.opened_at,
  closedAt: trade.closed_at,
  floatingPnL: 0,
});

export const useTrading = () => {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [account, setAccount] = useState({
    id: null,
    accountNumber: null,
    username: null,
    name: 'Demo Account',
    accountType: 'demo',
    balance: INITIAL_BALANCE,
    equity: INITIAL_BALANCE,
    usedMargin: 0,
    freeMargin: INITIAL_BALANCE,
    marginLevel: 0,
    leverage: LEVERAGE,
  });
  const [trades, setTrades] = useState([]);
  const [history, setHistory] = useState([]);
  const [prices, setPrices] = useState({});
  const [selectedSymbol, setSelectedSymbol] = useState('EUR/USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const closingTradeIds = useRef(new Set());
  const accountStorageKey = token ? `novafxm-active-account:${token.slice(-12)}` : null;

  const refreshPrices = useCallback(async () => {
    if (!token) return;

    try {
      const result = await pricesAPI.getPrices();
      if (result?.error) {
        throw new Error(result.error);
      }

      const apiPrices = normalizePriceMap(
        (result || []).reduce((acc, item) => {
          if (item.symbol) {
            acc[item.symbol] = item;
          }
          return acc;
        }, {})
      );

      setPrices((prev) => ({ ...prev, ...apiPrices }));
    } catch (err) {
      console.warn('Could not load backend prices, falling back to local pricing.');
    }
  }, [token]);

  const refreshAccount = useCallback(async () => {
    if (!token) return;

    try {
      const accountsResult = await accountAPI.getTradingAccounts(token);
      if (accountsResult?.error) {
        throw new Error(accountsResult.error);
      }

      const mappedAccounts = (accountsResult || []).map(mapApiAccount);
      setAccounts(mappedAccounts);

      if (mappedAccounts.length > 0) {
        const storedAccountId = accountStorageKey && typeof window !== 'undefined'
          ? window.localStorage.getItem(accountStorageKey)
          : null;
        const nextSelectedId = selectedAccountId
          ?? (storedAccountId != null ? Number(storedAccountId) : null)
          ?? mappedAccounts[0].id;
        const nextAccount = mappedAccounts.find((item) => item.id === nextSelectedId) || mappedAccounts[0];

        setSelectedAccountId(nextAccount.id);
        setAccount(nextAccount);
        return;
      }

      const result = await accountAPI.getAccount(token);
      if (result?.error) {
        throw new Error(result.error);
      }

      setAccount(mapApiAccount(result));
    } catch (err) {
      setError(err.message);
    }
  }, [token, selectedAccountId, accountStorageKey]);

  const refreshTrades = useCallback(async () => {
    if (!token) return;
    if (accounts.length > 0 && !account.id) return;

    try {
      const openResult = await tradesAPI.getOpenTrades(token, account.id);
      const historyResult = await tradesAPI.getHistory(token, account.id);

      if (openResult?.error) throw new Error(openResult.error);
      if (historyResult?.error) throw new Error(historyResult.error);

      setTrades((openResult || []).map(mapApiTrade));
      setHistory((historyResult || []).map((trade) => ({
        ...mapApiTrade(trade),
        openTime: trade.opened_at,
        closeTime: trade.closed_at,
      })));
    } catch (err) {
      setError(err.message);
    }
  }, [token, account.id, accounts.length]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([refreshAccount(), refreshTrades(), refreshPrices()])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, refreshAccount, refreshTrades, refreshPrices]);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    const socketUrl = apiBase.replace(/^http/, 'ws') + '/ws/prices';
    let socket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout;

    const connect = () => {
      try {
        socket = new WebSocket(socketUrl);

        socket.addEventListener('open', () => {
          console.log('WebSocket connected');
          reconnectAttempts = 0;
        });

        socket.addEventListener('message', (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload?.type === 'priceUpdate' && payload.data) {
              setPrices((prev) => ({ ...prev, ...normalizePriceMap(payload.data) }));
            }
          } catch (err) {
            console.warn('Invalid WebSocket message:', err);
          }
        });

        socket.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
        });

        socket.addEventListener('close', () => {
          console.warn('WebSocket disconnected');
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);
            console.log(`Attempting to reconnect WebSocket in ${delay}ms...`);
            reconnectTimeout = setTimeout(connect, delay);
          }
        });
      } catch (err) {
        console.error('Failed to create WebSocket:', err);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
    };
  }, []);

  useEffect(() => {
    const totalFloatingPnL = trades.reduce((sum, trade) => {
      if (trade.status === 'OPEN') {
        const closePrice = getCloseExecutionPrice(prices, trade);
        return sum + calculatePnL(trade, closePrice);
      }
      return sum;
    }, 0);

    const totalUsedMargin = trades.reduce((sum, trade) => {
      if (trade.status === 'OPEN') {
        const meta = getSymbolMeta(trade.symbol);
        const currentPrice = getLiveQuote(prices, trade.symbol).mid;
        return sum + calculateMargin(trade.lot, meta.contractSize, currentPrice, account.leverage || LEVERAGE);
      }
      return sum;
    }, 0);

    const equity = account.balance + totalFloatingPnL;
    const freeMargin = equity - totalUsedMargin;
    const marginLevel = calculateMarginLevel(equity, totalUsedMargin);

    setAccount((prev) => ({
      ...prev,
      equity,
      usedMargin: totalUsedMargin,
      freeMargin,
      marginLevel,
    }));
  }, [trades, prices, account.balance, account.leverage]);

  const openTradesWithPnL = useMemo(
    () => trades
      .filter((trade) => trade.status === 'OPEN')
      .map((trade) => {
        const currentPrice = getCloseExecutionPrice(prices, trade);

        return {
          ...trade,
          currentPrice,
          floatingPnL: calculatePnL(trade, currentPrice),
        };
      }),
    [trades, prices]
  );

  const getPrice = useCallback(
    (symbol, type) => {
      return getOpenExecutionPrice(prices, symbol, type);
    },
    [prices]
  );

  const openTrade = useCallback(
    async (symbol, type, lot, takeProfit = null, stopLoss = null) => {
      const payload = {
        account_id: account.id,
        symbol,
        type: type.toLowerCase(),
        lot_size: lot,
        take_profit: takeProfit,
        stop_loss: stopLoss,
      };

      if (!token) {
        alert('You must be logged in to open a trade');
        return false;
      }

      if (!account.id) {
        alert('Select a trading account before opening a trade');
        return false;
      }

      const result = await tradesAPI.openTrade(token, payload);
      if (result?.error) {
        alert(result.error);
        return false;
      }

      await refreshTrades();
      await refreshAccount();
      return true;
    },
    [account.id, refreshTrades, refreshAccount, token]
  );

  const closeTradeFn = useCallback(
    async (tradeId, closePrice = null) => {
      const trade = trades.find((t) => t.id === tradeId);
      if (!trade || trade.status !== 'OPEN') return;

      const price = closePrice || getCloseExecutionPrice(prices, trade);

      if (!token) {
        alert('You must be logged in to close a trade');
        return;
      }

      try {
        const result = await tradesAPI.closeTrade(token, tradeId, price, account.id);
        if (result?.error) {
          alert(result.error);
          return;
        }

        await refreshTrades();
        await refreshAccount();
      } finally {
        closingTradeIds.current.delete(tradeId);
      }
    },
    [account.id, trades, prices, refreshTrades, refreshAccount, token]
  );

  const switchAccount = useCallback((accountId) => {
    const numericId = Number(accountId);
    const nextAccount = accounts.find((item) => item.id === numericId);

    if (!nextAccount) return;

    setSelectedAccountId(numericId);
    setAccount(nextAccount);
    setTrades([]);
    setHistory([]);

    if (accountStorageKey && typeof window !== 'undefined') {
      window.localStorage.setItem(accountStorageKey, String(numericId));
    }
  }, [accounts, accountStorageKey]);

  useEffect(() => {
    if (!token) return;

    openTradesWithPnL.forEach((trade) => {
      if (closingTradeIds.current.has(trade.id)) return;

      const takeProfit = Number(trade.takeProfit);
      const stopLoss = Number(trade.stopLoss);
      const hasTakeProfit = Number.isFinite(takeProfit) && takeProfit > 0;
      const hasStopLoss = Number.isFinite(stopLoss) && stopLoss > 0;

      if (!hasTakeProfit && !hasStopLoss) return;

      const currentPrice = Number(trade.currentPrice);
      if (!Number.isFinite(currentPrice)) return;

      const takeProfitHit = hasTakeProfit && (
        trade.type === 'BUY' ? currentPrice >= takeProfit : currentPrice <= takeProfit
      );
      const stopLossHit = hasStopLoss && (
        trade.type === 'BUY' ? currentPrice <= stopLoss : currentPrice >= stopLoss
      );

      if (!takeProfitHit && !stopLossHit) return;

      closingTradeIds.current.add(trade.id);
      closeTradeFn(trade.id, currentPrice);
    });
  }, [openTradesWithPnL, closeTradeFn, token]);

  return {
    account,
    accounts,
    selectedAccountId,
    switchAccount,
    trades: openTradesWithPnL,
    closedTrades: history,
    openTrade,
    closeTrade: closeTradeFn,
    getPrice,
    selectedSymbol,
    setSelectedSymbol,
    prices,
    loading,
    error,
  };
};
