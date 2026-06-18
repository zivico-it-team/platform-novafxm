import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { DEFAULT_SYMBOL, SYMBOLS } from '../constants/symbols';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../utils/storage';
import { calculateProfit, calculateSummary } from '../utils/calculations';
import { tradeService } from '../services/tradeService';
import { walletService } from '../services/walletService';

export const TradingContext = createContext(null);
const INITIAL_BALANCE = 5000;
const CLIENT_ONLY_MESSAGE = 'Admin accounts cannot trade, deposit, or withdraw as clients.';

export function TradingProvider({ children }) {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { prices, connected } = useMarketPrices();
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOL);
  const [positions, setPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [wallet, setWallet] = useState({ balance: INITIAL_BALANCE });
  const [transactions, setTransactions] = useState([]);
  const [selectedTradingAccount, setSelectedTradingAccount] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function restore() {
      const stored = await Promise.all([
        storage.get('positions', []),
        storage.get('closed', []),
        storage.get('pendingOrders', []),
        storage.get('wallet', { balance: INITIAL_BALANCE }),
        storage.get('transactions', []),
      ]);
      setPositions(stored[0]);
      setClosedPositions(stored[1]);
      setPendingOrders(stored[2]);
      setWallet(stored[3]);
      setTransactions(stored[4]);
      setReady(true);
    }
    restore();
  }, []);

  const selectedAccountId = useMemo(() => {
    const id = selectedTradingAccount?.id;
    return id && /^\d+$/.test(String(id)) ? id : undefined;
  }, [selectedTradingAccount?.id]);
  const serverAccount = Boolean(user);

  const syncAccount = useCallback(async () => {
    if (!user || !serverAccount) return;
    const [open, closed, account, history] = await Promise.all([
      tradeService.openTrades(selectedAccountId), tradeService.closedTrades(selectedAccountId), walletService.getWallet(selectedAccountId), walletService.getTransactions(),
    ]);
    setPositions(open.trades || []);
    setClosedPositions(closed.trades || []);
    setWallet({ balance: Number(account.summary.balance) });
    if (account.tradingAccount) {
      setSelectedTradingAccount((current) => (
        current && String(current.id) === String(account.tradingAccount.id)
          ? { ...current, ...account.tradingAccount }
          : current
      ));
    }
    setTransactions(history.transactions || []);
  }, [selectedAccountId, serverAccount, user]);

  useEffect(() => {
    syncAccount().catch(() => {});
  }, [syncAccount]);

  useEffect(() => {
    if (!user) return undefined;
    const subscription = DeviceEventEmitter.addListener('novafxm:new-notification', (notification) => {
      if (['deposit', 'withdraw', 'trade', 'admin'].includes(notification?.type)) {
        syncAccount().catch(() => {});
      }
    });
    return () => subscription.remove();
  }, [syncAccount, user]);

  useEffect(() => {
    if (authLoading || user) return;
    setPositions([]);
    setClosedPositions([]);
    setPendingOrders([]);
    setWallet({ balance: INITIAL_BALANCE });
    setTransactions([]);
    setSelectedTradingAccount(null);
  }, [authLoading, user]);

  const livePositions = useMemo(
    () =>
      positions.map((position) => {
        const quote = prices.find((item) => item.symbol === position.symbol);
        const currentPrice = quote?.price || position.openPrice;
        return { ...position, currentPrice, profit: calculateProfit(position, currentPrice) };
      }),
    [positions, prices],
  );

  const depositTotals = useMemo(
    () =>
      transactions.reduce(
        (values, item) => {
          if (item.type !== 'deposit') return values;
          const amount = Number(item.amount || 0);
          values.totalDeposits += amount;
          if (item.status === 'pending') values.pendingDeposits += amount;
          return values;
        },
        { totalDeposits: 0, pendingDeposits: 0 },
      ),
    [transactions],
  );
  const summaryBalance = Number.isFinite(Number(selectedTradingAccount?.balance))
    ? Number(selectedTradingAccount.balance)
    : wallet.balance;
  const summary = useMemo(
    () => ({ ...calculateSummary(summaryBalance, livePositions), ...depositTotals }),
    [summaryBalance, livePositions, depositTotals],
  );
  const currentSymbol =
    prices.find((item) => item.symbol === selectedSymbol) ||
    prices.find((item) => item.symbol === DEFAULT_SYMBOL) ||
    SYMBOLS.find((item) => item.symbol === DEFAULT_SYMBOL) ||
    prices[0] ||
    SYMBOLS[0];

  useEffect(() => {
    if (ready) storage.set('positions', positions);
  }, [positions, ready]);
  useEffect(() => {
    if (ready) storage.set('closed', closedPositions);
  }, [closedPositions, ready]);
  useEffect(() => {
    if (ready) storage.set('pendingOrders', pendingOrders);
  }, [pendingOrders, ready]);
  useEffect(() => {
    if (ready) storage.set('wallet', wallet);
  }, [wallet, ready]);
  useEffect(() => {
    if (ready) storage.set('transactions', transactions);
  }, [transactions, ready]);

  const openPosition = useCallback(
    async (side, lots) => {
      if (!user) throw new Error('Please log in to place trades.');
      if (isAdmin) throw new Error(CLIENT_ONLY_MESSAGE);
      const quantity = Number(lots);
      if (!quantity || quantity <= 0) throw new Error('Enter a valid lot size.');
      const requiredMargin = quantity * 100;
      if (summary.freeFunds < requiredMargin) throw new Error('Insufficient free funds.');
      const price = side === 'BUY' ? currentSymbol.ask : currentSymbol.bid;
      let position = {
        id: String(Date.now()),
        symbol: selectedSymbol,
        side,
        lots: quantity,
        openPrice: price,
        openedAt: new Date().toISOString(),
      };
      const result = await tradeService.open({ symbol: selectedSymbol, side, lots: quantity, tradingAccountId: selectedAccountId });
      position = result.trade;
      setPositions((existing) => [position, ...existing]);
    },
    [currentSymbol, isAdmin, selectedAccountId, selectedSymbol, summary.freeFunds, user],
  );

  const createPendingOrder = useCallback(
    (values) => {
      if (!user) throw new Error('Please log in to place trades.');
      if (isAdmin) throw new Error(CLIENT_ONLY_MESSAGE);
      const quantity = Number(values.lots);
      if (!quantity || quantity <= 0) throw new Error('Enter a valid lot size.');
      const order = {
        id: String(Date.now()),
        symbol: selectedSymbol,
        side: values.side,
        lots: quantity,
        orderType: values.orderType,
        entryPrice: Number(values.entryPrice),
        stopLoss: values.stopLoss ? Number(values.stopLoss) : null,
        takeProfit: values.takeProfit ? Number(values.takeProfit) : null,
        status: 'pending',
        openedAt: new Date().toISOString(),
        tradingAccountId: selectedTradingAccount?.id,
      };
      setPendingOrders((existing) => [order, ...existing]);
      return order;
    },
    [isAdmin, selectedSymbol, selectedTradingAccount?.id, user],
  );

  const closePosition = useCallback(
    async (id) => {
      if (!user) throw new Error('Please log in to manage trades.');
      if (isAdmin) throw new Error(CLIENT_ONLY_MESSAGE);
      const position = livePositions.find((item) => String(item.id) === String(id));
      if (!position) return;
      const response = await tradeService.close(id, position.currentPrice);
      const closed = response?.trade || { ...position, status: 'closed', closedAt: new Date().toISOString(), closePrice: position.currentPrice };
      closed.profit = Number(closed.profit ?? position.profit);
      setPositions((existing) => existing.filter((item) => String(item.id) !== String(id)));
      setClosedPositions((existing) => [closed, ...existing]);
      const nextBalance = response?.tradingAccount?.balance ?? (wallet.balance + closed.profit);
      setWallet((existing) => ({ ...existing, balance: Number(nextBalance) }));
      if (response?.tradingAccount) {
        setSelectedTradingAccount((current) => (
          current && String(current.id) === String(response.tradingAccount.id)
            ? { ...current, ...response.tradingAccount }
            : current
        ));
      }
    },
    [isAdmin, livePositions, selectedAccountId, user, wallet.balance],
  );

  const submitDeposit = useCallback((values) => {
    if (isAdmin) throw new Error(CLIENT_ONLY_MESSAGE);
    const transaction = { id: String(Date.now()), type: 'deposit', status: 'pending', createdAt: new Date().toISOString(), ...values };
    setTransactions((existing) => [transaction, ...existing]);
    return transaction;
  }, [isAdmin]);

  const submitWithdrawal = useCallback(
    (values) => {
      if (isAdmin) throw new Error(CLIENT_ONLY_MESSAGE);
      if (Number(values.amount) > summary.freeFunds) throw new Error('Withdrawal exceeds available free funds.');
      const transaction = { id: String(Date.now()), type: 'withdrawal', status: 'pending', createdAt: new Date().toISOString(), ...values };
      setTransactions((existing) => [transaction, ...existing]);
      return transaction;
    },
    [isAdmin, summary.freeFunds],
  );

  const value = useMemo(
    () => ({
      prices,
      connected,
      selectedSymbol,
      setSelectedSymbol,
      currentSymbol,
      positions: livePositions,
      closedPositions,
      pendingOrders,
      summary,
      selectedTradingAccount,
      setSelectedTradingAccount,
      transactions,
      openPosition,
      closePosition,
      createPendingOrder,
      submitDeposit,
      submitWithdrawal,
      syncAccount,
      ready,
    }),
    [prices, connected, selectedSymbol, currentSymbol, livePositions, closedPositions, pendingOrders, summary, selectedTradingAccount, transactions, openPosition, closePosition, createPendingOrder, submitDeposit, submitWithdrawal, syncAccount, ready],
  );

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
}
