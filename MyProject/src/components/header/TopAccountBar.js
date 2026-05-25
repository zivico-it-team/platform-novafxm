import { Pressable, ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { CircleUserRound, Plus, Wallet } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { money } from '../../utils/formatters';

export default function TopAccountBar() {
  const { summary } = useDemoTrading();
  const { user } = useAuth();
  const metrics = [
    ['Balance', `${money(summary.balance)} USD`],
    ['Equity', `${money(summary.equity)} USD`],
    ['Margin', `${money(summary.margin)} USD`],
    ['Margin Level', summary.margin ? `${money(summary.marginLevel)} %` : '-'],
    ['Net Profit', `${money(summary.openProfit)} USD`],
    ['Bonus', `${money(summary.bonus)} USD`],
    ['Free Funds', `${money(summary.freeFunds)} USD`],
  ];

  return (
    <View className="border-b border-border bg-[#080f20] px-3 py-3 lg:flex-row lg:items-center lg:gap-3">
      <View className="mb-3 flex-row items-center justify-between lg:mb-0">
        <Text className="text-xl font-black tracking-wider text-white"><Text className="text-primary">NOVA</Text> FXM</Text>
        <Link href="/profile" asChild>
          <Pressable className="ml-5 rounded-xl border border-border p-3 lg:hidden">
            <CircleUserRound color="#f3f7ff" size={20} />
          </Pressable>
        </Link>
      </View>
      <Link href="/trading" asChild>
        <Pressable className="mb-3 flex-row items-center justify-center rounded-xl bg-primary px-5 py-4 lg:mb-0">
          <Plus color="#fff" size={18} />
          <Text className="ml-2 font-bold text-white">New Order</Text>
        </Pressable>
      </Link>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 rounded-xl border border-border bg-panel">
        {metrics.map(([label, value]) => (
          <View key={label} className="min-w-[112px] border-r border-border px-4 py-3">
            <Text className="text-xs text-muted">{label}</Text>
            <Text className={`mt-1 font-semibold ${label === 'Net Profit' && summary.openProfit < 0 ? 'text-danger' : 'text-white'}`}>{value}</Text>
          </View>
        ))}
      </ScrollView>
      <View className="mt-3 flex-row items-center justify-between rounded-xl border border-border bg-panel px-5 py-3 lg:mt-0 lg:w-[230px]">
        <View>
          <Text className="font-bold text-white">{user?.accountType || 'Demo'}</Text>
          <Text className="text-xs text-muted">{user?.name || 'Demo account 1'}</Text>
        </View>
        <View className="h-2.5 w-2.5 rounded-full bg-success" />
        <Link href="/wallet" asChild>
          <Pressable><Wallet size={20} color="#8fa0bb" /></Pressable>
        </Link>
      </View>
    </View>
  );
}
