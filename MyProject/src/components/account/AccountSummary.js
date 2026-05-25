import { Text, View } from 'react-native';
import { money } from '../../utils/formatters';

export default function AccountSummary({ summary }) {
  const entries = [
    ['Balance', summary.balance],
    ['Equity', summary.equity],
    ['Margin', summary.margin],
    ['Free Funds', summary.freeFunds],
  ];
  return (
    <View className="rounded-2xl border border-border bg-panel p-5">
      <Text className="mb-4 text-lg font-semibold text-white">Account Summary</Text>
      {entries.map(([label, value]) => (
        <View key={label} className="mb-3 flex-row justify-between">
          <Text className="text-muted">{label}</Text>
          <Text className="font-semibold text-white">{money(value)} USD</Text>
        </View>
      ))}
    </View>
  );
}
