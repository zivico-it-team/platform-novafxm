import { Text, View } from 'react-native';
import { BadgeCheck, Clock3, Landmark, Wallet } from 'lucide-react-native';
import { money } from '../../utils/formatters';

const approvedStatuses = ['approved', 'completed'];

function Metric({ label, value, tone = 'default' }) {
  const color = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-primary' : 'text-white';

  return (
    <View className="min-w-[155px] flex-1 rounded-lg border border-border bg-surface p-4">
      <Text className="text-xs font-bold uppercase text-muted">{label}</Text>
      <Text className={`mt-2 text-lg font-black ${color}`}>{money(value)} <Text className="text-xs">USD</Text></Text>
    </View>
  );
}

export default function WalletCard({ summary, transactions = [], user }) {
  const totals = transactions.reduce(
    (values, item) => {
      const amount = Number(item.amount || 0);
      if (item.type === 'deposit') {
        values.submittedDeposits += amount;
        if (approvedStatuses.includes(item.status)) values.approvedDeposits += amount;
        if (item.status === 'pending') values.pendingDeposits += amount;
      }
      if (item.type === 'withdrawal') {
        if (approvedStatuses.includes(item.status)) values.approvedWithdrawals += amount;
        if (item.status === 'pending') values.pendingWithdrawals += amount;
      }
      return values;
    },
    { submittedDeposits: 0, approvedDeposits: 0, pendingDeposits: 0, approvedWithdrawals: 0, pendingWithdrawals: 0 },
  );
  const accountId = String(user?.id || 27075).padStart(5, '0');

  return (
    <View className="mb-5 gap-3">
      <View className="rounded-lg border border-border bg-panel p-5">
        <View className="mb-5 flex-row flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <View>
            <Text className="text-xs font-bold uppercase text-muted">Account Funds Summary</Text>
            <Text className="mt-1 text-lg font-black text-white">{user?.accountType || 'Demo'} Account #{accountId}</Text>
          </View>
          <View className="flex-row items-center rounded-full border border-success/40 bg-success/10 px-3 py-2">
            <BadgeCheck size={15} color="#12cf7a" />
            <Text className="ml-2 text-xs font-bold uppercase text-success">Verified</Text>
          </View>
        </View>

        <View className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <View>
            <View className="flex-row items-center">
              <Wallet size={18} color="#D4AF37" />
              <Text className="ml-2 text-xs font-bold uppercase text-muted">Available Account Balance</Text>
            </View>
            <Text className="mt-2 text-4xl font-black text-white">{money(summary.balance)} <Text className="text-base text-muted">USD</Text></Text>
          </View>

          <View className="gap-2 lg:min-w-[320px]">
            <View className="flex-row items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <View className="flex-row items-center">
                <Landmark size={16} color="#12cf7a" />
                <Text className="ml-2 text-sm font-semibold text-muted">Approved client deposits</Text>
              </View>
              <Text className="font-black text-success">{money(totals.approvedDeposits)} USD</Text>
            </View>
            <View className="flex-row items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <View className="flex-row items-center">
                <Clock3 size={16} color="#D4AF37" />
                <Text className="ml-2 text-sm font-semibold text-muted">Pending deposits</Text>
              </View>
              <Text className="font-black text-primary">{money(totals.pendingDeposits)} USD</Text>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-3">
        <Metric label="Equity" value={summary.equity} />
        <Metric label="Free Funds" value={summary.freeFunds} />
        <Metric label="Used Margin" value={summary.margin} />
        <Metric label="Submitted Deposits" value={totals.submittedDeposits} tone="success" />
        <Metric label="Approved Withdrawals" value={totals.approvedWithdrawals} />
        <Metric label="Pending Withdrawals" value={totals.pendingWithdrawals} tone="warning" />
      </View>
    </View>
  );
}
