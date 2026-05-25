import { Text, View } from 'react-native';
import { money } from '../../utils/formatters';

export default function WalletCard({ summary }) {
  return (
    <View className="mb-5 flex-row flex-wrap gap-3">
      {[['Balance', summary.balance], ['Equity', summary.equity], ['Margin', summary.margin], ['Free Funds', summary.freeFunds]].map(([label, value]) => (
        <View key={label} className="min-w-[155px] flex-1 rounded-2xl border border-border bg-panel p-4">
          <Text className="text-sm text-muted">{label}</Text>
          <Text className="mt-2 text-xl font-bold text-white">{money(value)} <Text className="text-xs">USD</Text></Text>
        </View>
      ))}
    </View>
  );
}
