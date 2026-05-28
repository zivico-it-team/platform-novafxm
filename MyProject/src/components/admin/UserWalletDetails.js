import { Pressable, ScrollView, Text, View } from 'react-native';
import { money } from '../../utils/formatters';

function Metric({ label, value, color = 'text-white' }) {
  return (
    <View className="mb-3 w-full rounded-xl border border-border bg-surface p-4 sm:w-[48%]">
      <Text className="text-xs uppercase text-muted">{label}</Text>
      <Text className={`mt-2 text-xl font-bold ${color}`}>{value}</Text>
    </View>
  );
}

export default function UserWalletDetails({ user, wallet, loading, onClose }) {
  if (!user) return null;
  const live = user.accountType === 'Live';
  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-black/70 px-4">
      <View className="max-h-[90%] w-full max-w-3xl rounded-2xl border border-border bg-panel p-6">
        <View className="mb-5 flex-row justify-between">
          <View>
            <Text className="text-xl font-bold text-white">Wallet Details</Text>
            <Text className="mt-1 text-muted">{user.name} | {user.email}</Text>
            <Text className={`mt-2 self-start rounded-full border px-3 py-1 text-xs font-bold ${live ? 'border-success/50 bg-success/10 text-success' : 'border-primary/50 bg-primary/10 text-primary'}`}>
              {live ? 'Live Account Wallet' : 'Demo Account Wallet'}
            </Text>
          </View>
          <Pressable onPress={onClose}><Text className="text-xl text-muted">x</Text></Pressable>
        </View>
        {loading ? <Text className="py-10 text-center text-muted">Loading wallet...</Text> : (
          <ScrollView>
            <View className="flex-row flex-wrap justify-between">
              <Metric label="Balance" value={`$${money(wallet?.balance)}`} />
              <Metric label="Account Type" value={live ? 'Live' : 'Demo'} color={live ? 'text-success' : 'text-primary'} />
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
