import { Text, View } from 'react-native';
import { dateTime, money } from '../../utils/formatters';
import { useAppTheme } from '../../context/ThemeContext';

export default function TransactionList({ transactions, title = 'Transaction History' }) {
  const { colors } = useAppTheme();

  return (
    <View className="mt-5 rounded-2xl border p-5" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <Text className="mb-4 text-lg font-bold" style={{ color: colors.text }}>{title}</Text>
      {transactions.length ? transactions.map((item) => (
        <View key={item.id} className="flex-row items-center justify-between border-b py-3" style={{ borderColor: colors.border }}>
          <View>
            <Text className="capitalize" style={{ color: colors.text }}>{item.type}</Text>
            <Text className="text-xs" style={{ color: colors.muted }}>{dateTime(item.createdAt)}</Text>
          </View>
          <Text className="font-semibold" style={{ color: colors.text }}>{money(item.amount)} USD</Text>
          <Text
            className="capitalize"
            style={{ color: ['approved', 'completed'].includes(item.status) ? colors.success : item.status === 'rejected' ? colors.danger : colors.primary }}
          >
            {item.status}
          </Text>
        </View>
      )) : <Text style={{ color: colors.muted }}>No transactions submitted yet.</Text>}
    </View>
  );
}
