import { useCallback, useEffect, useState } from 'react';
import { walletService } from '../services/walletService';
import { useDemoTrading } from './useDemoTrading';
import { useAuth } from './useAuth';

export function useWallet() {
  const demo = useDemoTrading();
  const { user } = useAuth();
  const isLiveAccount = Boolean(user && demo.activeAccount === 'Live');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLiveAccount) demo.syncAccount().catch(() => {});
  }, [isLiveAccount, demo.syncAccount]);

  const deposit = useCallback(
    async (values, authenticated) => {
      setLoading(true);
      setError('');
      try {
        if (!authenticated || !isLiveAccount) return demo.submitDeposit(values);
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
    [demo, isLiveAccount],
  );

  const withdraw = useCallback(
    async (values, authenticated) => {
      setLoading(true);
      setError('');
      try {
        if (!authenticated || !isLiveAccount) return demo.submitWithdrawal(values);
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
    [demo, isLiveAccount],
  );

  return { summary: demo.summary, transactions: demo.transactions, deposit, withdraw, loading, error };
}
