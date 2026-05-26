import { Pressable, ScrollView, Text, View } from 'react-native';
import { dateTime, money } from '../../utils/formatters';

function Cell({ width, children, header, muted }) {
  return <Text style={{ width }} className={`px-3 py-4 ${header ? 'text-xs font-bold uppercase text-muted' : `text-sm ${muted ? 'text-muted' : 'text-white'}`}`}>{children}</Text>;
}

export default function UserTransactionsModal({ user, transactions, loading, onClose }) {
  if (!user) return null;
  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-black/70 px-4">
      <View className="max-h-[90%] w-full max-w-6xl rounded-2xl border border-border bg-panel p-6">
        <View className="mb-5 flex-row justify-between">
          <View>
            <Text className="text-xl font-bold text-white">Transaction History</Text>
            <Text className="mt-1 text-muted">{user.name}</Text>
          </View>
          <Pressable onPress={onClose}><Text className="text-xl text-muted">x</Text></Pressable>
        </View>
        {loading ? <Text className="py-10 text-center text-muted">Loading transactions...</Text> : (
          <ScrollView horizontal>
            <View style={{ minWidth: 1030 }}>
              <View className="flex-row border-b border-border bg-surface">
                <Cell width={80} header>ID</Cell>
                <Cell width={185} header>Type</Cell>
                <Cell width={120} header>Amount</Cell>
                <Cell width={135} header>Before</Cell>
                <Cell width={135} header>After</Cell>
                <Cell width={220} header>Note</Cell>
                <Cell width={160} header>Created Date</Cell>
              </View>
              {transactions.map((item) => (
                <View key={item.id} className="flex-row border-b border-border/60">
                  <Cell width={80}>#{item.id}</Cell>
                  <Cell width={185}>{item.type.replace(/_/g, ' ')}</Cell>
                  <Cell width={120}>${money(item.amount)}</Cell>
                  <Cell width={135}>${money(item.balanceBefore)}</Cell>
                  <Cell width={135}>${money(item.balanceAfter)}</Cell>
                  <Cell width={220} muted>{item.note || item.description || '-'}</Cell>
                  <Cell width={160}>{dateTime(item.createdAt)}</Cell>
                </View>
              ))}
              {!transactions.length ? <Text className="p-8 text-center text-muted">No transaction history.</Text> : null}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
