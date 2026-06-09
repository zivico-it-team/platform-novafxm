import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SYMBOL, SYMBOLS } from '../constants/symbols';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../utils/storage';
import { calculateProfit, calculateSummary } from '../utils/calculations';
import { tradeService } from '../services/tradeService';
import { walletService } from '../services/walletService';

export const TradingContext = createContext(null);
const INITIAL_BALANCE = 5000;

export function TradingProvider({ children }) {
  const { user } = useAuth();
  const { prices, connected } = useMarketPrices();
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOL);
  const [positions, setPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [wallet, setWallet] = useState({ balance: INITIAL_BALANCE });
  const [transactions, setTransactions] = useState([]);
  const [selectedTradingAccount, setSelectedTradingAccount] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function restore() {
      const stored = await Promise.all([
        storage.get('positions', []),
        storage.get('closed', []),
        storage.get('wallet', { balance: INITIAL_BALANCE }),
        storage.get('transactions', []),
      ]);
      setPositions(stored[0]);
      setClosedPositions(stored[1]);
      setWallet(stored[2]);
      setTransactions(stored[3]);
      setReady(true);
    }
    restore();
  }, []);

  const syncAccount = useCallback(async () => {
    if (!user) return;
    const accountId = selectedTradingAccount?.id;
    const [open, closed, account, history] = await Promise.all([
      tradeService.openTrades(accountId), tradeService.closedTrades(accountId), walletService.getWallet(), walletService.getTransactions(),
    ]);
    setPositions(open.trades);
    setClosedPositions(closed.trades);
    setWallet({ balance: Number(account.summary.balance) });
    setTransactions(history.transactions);
  }, [selectedTradingAccount?.id, user]);

  useEffect(() => {
    syncAccount().catch(() => {});
  }, [syncAccount]);

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
  const summary = useMemo(
    () => ({ ...calculateSummary(selectedTradingAccount ? Number(selectedTradingAccount.balance || 0) : wallet.balance, livePositions), ...depositTotals }),
    [selectedTradingAccount, wallet.balance, livePositions, depositTotals],
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
    if (ready) storage.set('wallet', wallet);
  }, [wallet, ready]);
  useEffect(() => {
    if (ready) storage.set('transactions', transactions);
  }, [transactions, ready]);

  const openPosition = useCallback(
    async (side, lots) => {
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
      if (user) {
        const result = await tradeService.open({ symbol: selectedSymbol, side, lots: quantity, tradingAccountId: selectedTradingAccount?.id });
        position = result.trade;
      } else if (selectedTradingAccount?.id) {
        position.tradingAccountId = selectedTradingAccount.id;
      }
      setPositions((existing) => [position, ...existing]);
    },
    [currentSymbol, selectedSymbol, selectedTradingAccount?.id, summary.freeFunds, user],
  );

  const closePosition = useCallback(
    async (id) => {
      const position = livePositions.find((item) => String(item.id) === String(id));
      if (!position) return;
      const response = user ? await tradeService.close(id, position.currentPrice) : null;
      const closed = response?.trade || { ...position, status: 'closed', closedAt: new Date().toISOString(), closePrice: position.currentPrice };
      closed.profit = Number(closed.profit ?? position.profit);
      setPositions((existing) => existing.filter((item) => String(item.id) !== String(id)));
      setClosedPositions((existing) => [closed, ...existing]);
      setWallet((existing) => ({ ...existing, balance: existing.balance + closed.profit }));
    },
    [livePositions, user],
  );

  const submitDeposit = useCallback((values) => {
    const transaction = { id: String(Date.now()), type: 'deposit', status: 'pending', createdAt: new Date().toISOString(), ...values };
    setTransactions((existing) => [transaction, ...existing]);
    return transaction;
  }, []);

  const submitWithdrawal = useCallback(
    (values) => {
      if (Number(values.amount) > summary.freeFunds) throw new Error('Withdrawal exceeds available free funds.');
      const transaction = { id: String(Date.now()), type: 'withdrawal', status: 'pending', createdAt: new Date().toISOString(), ...values };
      setTransactions((existing) => [transaction, ...existing]);
      return transaction;
    },
    [summary.freeFunds],
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
      summary,
      selectedTradingAccount,
      setSelectedTradingAccount,
      transactions,
      openPosition,
      closePosition,
      submitDeposit,
      submitWithdrawal,
      syncAccount,
      ready,
    }),
    [prices, connected, selectedSymbol, currentSymbol, livePositions, closedPositions, summary, selectedTradingAccount, transactions, openPosition, closePosition, submitDeposit, submitWithdrawal, syncAccount, ready],
  );

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
}
