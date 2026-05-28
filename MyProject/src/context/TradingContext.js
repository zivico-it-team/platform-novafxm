import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { SYMBOLS } from '../constants/symbols';
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
  const [selectedSymbol, setSelectedSymbol] = useState('AUD/JPY');
  const [positions, setPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [wallet, setWallet] = useState({ balance: INITIAL_BALANCE });
  const [transactions, setTransactions] = useState([]);
  const [activeAccount, setActiveAccountState] = useState('Demo');
  const [ready, setReady] = useState(false);
  const isLiveAccount = Boolean(user && activeAccount === 'Live');

  useEffect(() => {
    async function restore() {
      const stored = await Promise.all([
        storage.get('positions', []),
        storage.get('closed', []),
        storage.get('wallet', { balance: INITIAL_BALANCE }),
        storage.get('transactions', []),
        storage.get('activeAccount', 'Demo'),
      ]);
      setPositions(stored[0]);
      setClosedPositions(stored[1]);
      setWallet(stored[2]);
      setTransactions(stored[3]);
      setActiveAccountState(stored[4] === 'Live' ? 'Live' : 'Demo');
      setReady(true);
    }
    restore();
  }, []);

  const syncAccount = useCallback(async () => {
    if (!isLiveAccount) return;
    const [open, closed, account, history] = await Promise.all([
      tradeService.openTrades(), tradeService.closedTrades(), walletService.getWallet(), walletService.getTransactions(),
    ]);
    setPositions(open.trades);
    setClosedPositions(closed.trades);
    setWallet({ balance: Number(account.summary.balance) });
    setTransactions(history.transactions);
  }, [isLiveAccount]);

  useEffect(() => {
    syncAccount().catch(() => {});
  }, [syncAccount]);

  const setActiveAccount = useCallback(async (account) => {
    const next = account === 'Live' ? 'Live' : 'Demo';
    setActiveAccountState(next);
    await storage.set('activeAccount', next);

    if (next === 'Demo') {
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
    }
  }, []);

  const livePositions = useMemo(
    () =>
      positions.map((position) => {
        const quote = prices.find((item) => item.symbol === position.symbol);
        const currentPrice = quote?.price || position.openPrice;
        return { ...position, currentPrice, profit: calculateProfit(position, currentPrice) };
      }),
    [positions, prices],
  );

  const summary = useMemo(() => calculateSummary(wallet.balance, livePositions), [wallet.balance, livePositions]);
  const currentSymbol = prices.find((item) => item.symbol === selectedSymbol) || prices[0] || SYMBOLS[0];

  useEffect(() => {
    if (ready && activeAccount === 'Demo') storage.set('positions', positions);
  }, [positions, ready, activeAccount]);
  useEffect(() => {
    if (ready && activeAccount === 'Demo') storage.set('closed', closedPositions);
  }, [closedPositions, ready, activeAccount]);
  useEffect(() => {
    if (ready && activeAccount === 'Demo') storage.set('wallet', wallet);
  }, [wallet, ready, activeAccount]);
  useEffect(() => {
    if (ready && activeAccount === 'Demo') storage.set('transactions', transactions);
  }, [transactions, ready, activeAccount]);

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
      if (isLiveAccount) {
        const result = await tradeService.open({ symbol: selectedSymbol, side, lots: quantity });
        position = result.trade;
      }
      setPositions((existing) => [position, ...existing]);
    },
    [currentSymbol, selectedSymbol, summary.freeFunds, isLiveAccount],
  );

  const closePosition = useCallback(
    async (id) => {
      const position = livePositions.find((item) => String(item.id) === String(id));
      if (!position) return;
      const response = isLiveAccount ? await tradeService.close(id, position.currentPrice) : null;
      const closed = response?.trade || { ...position, status: 'closed', closedAt: new Date().toISOString(), closePrice: position.currentPrice };
      closed.profit = Number(closed.profit ?? position.profit);
      setPositions((existing) => existing.filter((item) => String(item.id) !== String(id)));
      setClosedPositions((existing) => [closed, ...existing]);
      setWallet((existing) => ({ ...existing, balance: existing.balance + closed.profit }));
    },
    [livePositions, isLiveAccount],
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
      activeAccount,
      setActiveAccount,
      currentSymbol,
      positions: livePositions,
      closedPositions,
      summary,
      transactions,
      openPosition,
      closePosition,
      submitDeposit,
      submitWithdrawal,
      syncAccount,
      ready,
    }),
    [prices, connected, selectedSymbol, activeAccount, setActiveAccount, currentSymbol, livePositions, closedPositions, summary, transactions, openPosition, closePosition, submitDeposit, submitWithdrawal, syncAccount, ready],
  );

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
}
