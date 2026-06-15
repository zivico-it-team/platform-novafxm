import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { money } from '../../utils/formatters';

function Metric({ label, value, color = 'text-white' }) {
  const { colors } = useAppTheme();
  const valueColor = color === 'text-danger' ? colors.danger : color === 'text-success' ? colors.success : colors.text;

  return (
    <View className="mb-3 w-full rounded-xl border p-4 sm:w-[48%]" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <Text className="text-xs uppercase" style={{ color: colors.muted }}>{label}</Text>
      <Text className="mt-2 text-xl font-bold" style={{ color: valueColor }}>{value}</Text>
    </View>
  );
}

export default function UserWalletDetails({ user, wallet, loading, onClose }) {
  const { colors } = useAppTheme();

  if (!user) return null;
  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-black/70 px-4">
      <View className="max-h-[90%] w-full max-w-3xl rounded-2xl border p-6" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
        <View className="mb-5 flex-row justify-between">
          <View>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>Wallet Details</Text>
            <Text className="mt-1" style={{ color: colors.muted }}>{user.name} | {user.email}</Text>
          </View>
          <Pressable onPress={onClose}><Text className="text-xl" style={{ color: colors.muted }}>x</Text></Pressable>
        </View>
        {loading ? <Text className="py-10 text-center" style={{ color: colors.muted }}>Loading wallet...</Text> : (
          <ScrollView>
            <View className="flex-row flex-wrap justify-between">
              <Metric label="Balance" value={`$${money(wallet?.balance)}`} />
              <Metric label="Equity" value={`$${money(wallet?.equity)}`} />
              <Metric label="Margin" value={`$${money(wallet?.margin)}`} />
              <Metric label="Free Funds" value={`$${money(wallet?.freeFunds)}`} />
              <Metric label="Open Profit / Loss" value={`$${money(wallet?.openProfit)}`} color={Number(wallet?.openProfit) < 0 ? 'text-danger' : 'text-success'} />
              <Metric label="Total Deposits" value={`$${money(wallet?.totalDeposits)}`} />
              <Metric label="Total Withdrawals" value={`$${money(wallet?.totalWithdrawals)}`} />
              <Metric label="Total Trades" value={String(wallet?.totalTrades || 0)} />
              <Metric label="Account Leverage" value={`1:${wallet?.leverage || 100}`} />
              <Metric label="Trading Status" value={wallet?.tradingStatus === 'frozen' ? 'Frozen' : 'Active'} color={wallet?.tradingStatus === 'frozen' ? 'text-danger' : 'text-success'} />
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
