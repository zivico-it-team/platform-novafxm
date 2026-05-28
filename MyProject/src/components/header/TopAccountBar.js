import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CircleUserRound, Plus, RefreshCw, Settings2 } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { money } from '../../utils/formatters';
import { useAppTheme } from '../../context/ThemeContext';
import NovaLogo from '../brand/NovaLogo';
import DemoAccountMenu from './DemoAccountMenu';
import NewOrderModal from '../order/NewOrderModal';
import ProfileMenu from './ProfileMenu';

export default function TopAccountBar() {
  const { summary, syncAccount } = useDemoTrading();
  const { user } = useAuth();
  const { darkMode, colors } = useAppTheme();
  const [menu, setMenu] = useState(null);
  const [orderModal, setOrderModal] = useState(false);
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
    <View className="relative z-40 border-b px-3 py-3 lg:flex-row lg:items-center lg:gap-3" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
      <View className="mb-3 flex-row items-center justify-between lg:mb-0">
        <NovaLogo dark={darkMode} width={180} height={44} />
        <Pressable onPress={() => setMenu(menu === 'profile' ? null : 'profile')} className="ml-5 rounded-xl border p-3 lg:hidden" style={{ borderColor: colors.border }}>
          <CircleUserRound color={colors.text} size={20} />
        </Pressable>
      </View>
      <Pressable onPress={() => setOrderModal(true)} className="mb-3 flex-row items-center justify-center rounded-xl px-5 py-4 lg:mb-0" style={{ backgroundColor: colors.primary }}>
        <Plus color="#fff" size={18} />
        <Text className="ml-2 font-bold text-white">New Order</Text>
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 rounded-xl border" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
        {metrics.map(([label, value]) => (
          <View key={label} className="min-w-[112px] border-r px-4 py-3" style={{ borderColor: colors.border }}>
            <Text className="text-xs" style={{ color: colors.muted }}>{label}</Text>
            <Text className="mt-1 font-semibold" style={{ color: label === 'Net Profit' && summary.openProfit < 0 ? colors.danger : colors.text }}>{value}</Text>
          </View>
        ))}
      </ScrollView>
      <Pressable onPress={() => setMenu(menu === 'account' ? null : 'account')} className="mt-3 flex-row items-center rounded-xl border px-4 py-3 lg:mt-0 lg:w-[250px]" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
        <CircleUserRound color={colors.muted} size={23} />
        <View>
          <Text className="ml-4 font-bold" style={{ color: colors.text }}>{user?.accountType || 'Demo'}</Text>
          <Text className="ml-4 text-xs" style={{ color: colors.muted }}>{user?.accountType === 'Live' ? 'Live account 1' : 'Demo account 1'}</Text>
        </View>
        <View className="ml-auto h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.success }} />
      </Pressable>
      <Pressable onPress={() => syncAccount?.().catch(() => {})} className="mt-3 hidden h-[58px] w-[58px] items-center justify-center rounded-xl border lg:flex" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
        <RefreshCw size={21} color={colors.text} />
      </Pressable>
      <Pressable onPress={() => setMenu(menu === 'profile' ? null : 'profile')} className="mt-3 hidden h-[58px] w-[58px] items-center justify-center rounded-xl border lg:flex" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
        <Settings2 size={21} color={colors.text} />
      </Pressable>
      {menu === 'account' ? <DemoAccountMenu onClose={() => setMenu(null)} /> : null}
      {menu === 'profile' ? <ProfileMenu onClose={() => setMenu(null)} /> : null}
      <NewOrderModal visible={orderModal} onClose={() => setOrderModal(false)} />
    </View>
  );
}
