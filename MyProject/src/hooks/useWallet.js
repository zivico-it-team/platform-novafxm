import { useCallback, useEffect, useState } from 'react';
import { walletService } from '../services/walletService';
import { useDemoTrading } from './useDemoTrading';
import { useAuth } from './useAuth';

export function useWallet() {
  const demo = useDemoTrading();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) demo.syncAccount().catch(() => {});
  }, [user, demo.syncAccount]);

  const deposit = useCallback(
    async (values, authenticated) => {
      setLoading(true);
      setError('');
      try {
        if (isAdmin) throw new Error('Admin accounts cannot deposit as clients.');
        if (!authenticated) return demo.submitDeposit(values);
        const result = await walletService.deposit(values);
        await demo.syncAccount();
        return result;
      } catch (requestError) {
        const message = requestError.response?.data?.message || requestError.message;
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [demo, isAdmin],
  );

  const withdraw = useCallback(
    async (values, authenticated) => {
      setLoading(true);
      setError('');
      try {
        if (isAdmin) throw new Error('Admin accounts cannot withdraw as clients.');
        if (!authenticated) return demo.submitWithdrawal(values);
        const result = await walletService.withdraw(values);
        await demo.syncAccount();
        return result;
      } catch (requestError) {
        const message = requestError.response?.data?.message || requestError.message;
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [demo, isAdmin],
  );

  return { summary: demo.summary, transactions: demo.transactions, deposit, withdraw, loading, error };
}
