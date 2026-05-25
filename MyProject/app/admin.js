import { useCallback, useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import api from '../src/services/api';
import CustomButton from '../src/components/common/CustomButton';
import { useAuth } from '../src/hooks/useAuth';
import { dateTime, money } from '../src/utils/formatters';

export default function AdminScreen() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState({ users: [], deposits: [], withdrawals: [], trades: [] });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [users, deposits, withdrawals, trades] = await Promise.all([
        api.get('/admin/users'), api.get('/admin/deposits'), api.get('/admin/withdrawals'), api.get('/admin/trades'),
      ]);
      setData({ users: users.data.users, deposits: deposits.data.deposits, withdrawals: withdrawals.data.withdrawals, trades: trades.data.trades });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load administrator data.');
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const review = async (type, id, action) => {
    await api.put(`/admin/${type}/${id}/${action}`);
    await load();
  };

  if (!isAdmin) {
    return (
      <View className="flex-1 items-center justify-center bg-[#080f20] p-6">
        <Text className="mb-3 text-2xl font-bold text-white">Administrator Access</Text>
        <Text className="mb-6 text-center text-muted">Sign in with the seeded administrator account to manage requests and trades.</Text>
        <Link href="/login" asChild><Pressable className="rounded-xl bg-primary px-8 py-4"><Text className="font-bold text-white">Admin Login</Text></Pressable></Link>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#080f20]" contentContainerClassName="p-5">
      <View className="mb-6 flex-row justify-between">
        <Text className="text-2xl font-bold text-white">Admin Panel</Text>
        <Link href="/trading" asChild><Pressable><Text className="text-primary">Trading Platform</Text></Pressable></Link>
      </View>
      {error ? <Text className="mb-4 text-danger">{error}</Text> : null}
      <Text className="mb-3 text-xl font-semibold text-white">Users</Text>
      <View className="mb-7 rounded-2xl border border-border bg-panel p-4">
        {data.users.map((user) => <Text key={user.id} className="border-b border-border py-3 text-white">{user.name}  |  {user.email}  |  {user.accountType}</Text>)}
      </View>
      {['deposits', 'withdrawals'].map((type) => (
        <View key={type} className="mb-7">
          <Text className="mb-3 text-xl font-semibold capitalize text-white">{type}</Text>
          <View className="rounded-2xl border border-border bg-panel p-4">
            {data[type].map((request) => (
              <View key={request.id} className="flex-row flex-wrap items-center gap-3 border-b border-border py-3">
                <Text className="flex-1 text-white">{request.User?.email || `User ${request.userId}`}  |  {money(request.amount)} USD</Text>
                <Text className="capitalize text-muted">{request.status}</Text>
                {request.status === 'pending' ? <>
                  <CustomButton title="Approve" variant="success" className="min-h-[38px]" onPress={() => review(type, request.id, 'approve')} />
                  <CustomButton title="Reject" variant="danger" className="min-h-[38px]" onPress={() => review(type, request.id, 'reject')} />
                </> : null}
              </View>
            ))}
          </View>
        </View>
      ))}
      <Text className="mb-3 text-xl font-semibold text-white">All Trades</Text>
      <View className="rounded-2xl border border-border bg-panel p-4">
        {data.trades.map((trade) => (
          <Text key={trade.id} className="border-b border-border py-3 text-white">{trade.symbol}  {trade.side}  {trade.lots} lots  |  {trade.status}  |  {dateTime(trade.createdAt)}</Text>
        ))}
      </View>
    </ScrollView>
  );
}
