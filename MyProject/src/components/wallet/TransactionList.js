import { Text, View } from 'react-native';
import { dateTime, money } from '../../utils/formatters';

export default function TransactionList({ transactions }) {
  return (
    <View className="mt-5 rounded-2xl border border-border bg-panel p-5">
      <Text className="mb-4 text-lg font-bold text-white">Transaction History</Text>
      {transactions.length ? transactions.map((item) => (
        <View key={item.id} className="flex-row items-center justify-between border-b border-border py-3">
          <View>
            <Text className="capitalize text-white">{item.type}</Text>
            <Text className="text-xs text-muted">{dateTime(item.createdAt)}</Text>
          </View>
          <Text className="font-semibold text-white">{money(item.amount)} USD</Text>
          <Text className={`capitalize ${item.status === 'approved' ? 'text-success' : item.status === 'rejected' ? 'text-danger' : 'text-primary'}`}>{item.status}</Text>
        </View>
      )) : <Text className="text-muted">No transactions submitted yet.</Text>}
    </View>
  );
}
