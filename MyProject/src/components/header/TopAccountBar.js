import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { CircleUserRound, Plus, RefreshCw, Settings2 } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { money } from '../../utils/formatters';
import DemoAccountMenu from './DemoAccountMenu';
import ProfileMenu from './ProfileMenu';


export default function TopAccountBar() {
  const { summary, syncAccount } = useDemoTrading();
  const { user } = useAuth();
  const [menu, setMenu] = useState(null);
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
    <View className="relative z-40 border-b border-border bg-[#080f20] px-3 py-3 lg:flex-row lg:items-center lg:gap-3">
      <View className="mb-3 flex-row items-center justify-between lg:mb-0">
        <Text className="text-xl font-black tracking-wider text-white"><Text className="text-primary">NOVA</Text> FXM</Text>
        <Pressable onPress={() => setMenu(menu === 'profile' ? null : 'profile')} className="ml-5 rounded-xl border border-border p-3 lg:hidden">
          <CircleUserRound color="#f3f7ff" size={20} />
        </Pressable>
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
      <Pressable onPress={() => setMenu(menu === 'account' ? null : 'account')} className="mt-3 flex-row items-center rounded-xl border border-border bg-panel px-4 py-3 lg:mt-0 lg:w-[250px]">
        <CircleUserRound color="#8fa0bb" size={23} />
        <View>
          <Text className="ml-4 font-bold text-white">{user?.accountType || 'Demo'}</Text>
          <Text className="ml-4 text-xs text-muted">{user?.accountType === 'Live' ? 'Live account 1' : 'Demo account 1'}</Text>
        </View>
        <View className="ml-auto h-2.5 w-2.5 rounded-full bg-success" />
      </Pressable>
      <Pressable onPress={() => syncAccount?.().catch(() => {})} className="mt-3 hidden h-[58px] w-[58px] items-center justify-center rounded-xl border border-border bg-panel lg:flex">
        <RefreshCw size={21} color="#f3f7ff" />
      </Pressable>
      <Pressable onPress={() => setMenu(menu === 'profile' ? null : 'profile')} className="mt-3 hidden h-[58px] w-[58px] items-center justify-center rounded-xl border border-border bg-panel lg:flex">
        <Settings2 size={21} color="#f3f7ff" />
      </Pressable>
      {menu === 'account' ? <DemoAccountMenu onClose={() => setMenu(null)} /> : null}
      {menu === 'profile' ? <ProfileMenu onClose={() => setMenu(null)} /> : null}
    </View>
  );
}
