import { router } from 'expo-router';
import { BriefcaseBusiness, CreditCard, Gift, LayoutDashboard, LogOut, ReceiptText, Settings, ShieldCheck, UsersRound } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../context/ThemeContext';
import { money } from '../../utils/formatters';
import NovaLogo from '../brand/NovaLogo';

const accountNavigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, section: 'overview' },
  { id: 'accounts', label: 'Accounts', icon: UsersRound, section: 'accounts' },
  { id: 'verification', label: 'Verification', icon: ShieldCheck, route: '/verification' },
  { id: 'deposit', label: 'Deposit', icon: ReceiptText, section: 'deposit' },
  { id: 'withdraw', label: 'Withdraw', icon: CreditCard, section: 'withdraw' },
  { id: 'rewards', label: 'Broker Rewards', icon: Gift, route: '/broker-rewards' },
  { id: 'settings', label: 'Settings', icon: Settings, route: '/settings' },
];

export default function AccountSidebar({ activeKey = 'overview', onSectionChange, wallet = {}, referral = {}, onSignOut }) {
  const { user } = useAuth();
  const { darkMode, colors } = useAppTheme();

  const openItem = (item) => {
    if (item.section && onSectionChange) {
      onSectionChange(item.section);
      return;
    }
    router.push(item.section ? `/dashboard?section=${item.section}` : item.route);
  };

  return (
    <View className="w-full border-b md:min-h-screen md:w-[270px] md:border-b-0 md:border-r" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <View className="border-b p-6" style={{ borderColor: colors.border }}>
        <NovaLogo dark={darkMode} width={136} height={34} />
        <Text className="mt-2 text-xl font-bold" style={{ color: colors.text }}>Account Console</Text>
        <Text className="mt-1 text-xs" numberOfLines={1} style={{ color: colors.muted }}>{user?.email || 'Client workspace'}</Text>
      </View>

      <ScrollView horizontal className="md:hidden" showsHorizontalScrollIndicator={false} contentContainerClassName="p-3">
        {accountNavigation.map((item) => {
          const active = activeKey === item.id;
          return (
            <Pressable key={item.id} onPress={() => openItem(item)} className="mr-2 rounded-xl px-4 py-3" style={{ backgroundColor: active ? colors.primary : colors.surface }}>
              <Text className="font-semibold" style={{ color: active ? '#0B0B0B' : colors.text }}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="hidden p-4 md:flex">
        {accountNavigation.map(({ id, label, icon: Icon, ...item }) => {
          const active = activeKey === id;
          return (
            <Pressable
              key={id}
              onPress={() => openItem({ id, label, icon: Icon, ...item })}
              className="mb-2 flex-row items-center rounded-xl px-4 py-4"
              style={{ backgroundColor: active ? colors.primary : 'transparent' }}
            >
              <Icon size={19} color={active ? '#0B0B0B' : colors.muted} />
              <Text className="ml-3 font-semibold" style={{ color: active ? '#0B0B0B' : colors.muted }}>{label}</Text>
            </Pressable>
          );
        })}

        <View className="mt-6 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text className="text-xs uppercase" style={{ color: colors.muted }}>Balance</Text>
          <Text className="mt-2 text-2xl font-bold" style={{ color: colors.text }}>{money(wallet.balance || 0)}</Text>
          <Text className="mt-3 text-xs uppercase" style={{ color: colors.muted }}>Free Funds</Text>
          <Text className="mt-2 text-lg font-semibold" style={{ color: colors.primary }}>{money(wallet.freeFunds || 0)} USD</Text>
          <Text className="mt-3 text-xs uppercase" style={{ color: colors.muted }}>Referral</Text>
          <Text className="mt-2 text-lg font-semibold" style={{ color: colors.text }}>{money(referral.commission || 0)} USD</Text>
        </View>
      </View>

      <View className="hidden mt-auto border-t p-4 md:flex" style={{ borderColor: colors.border }}>
        <Pressable onPress={() => router.push('/trading')} className="mb-2 flex-row items-center rounded-xl px-4 py-4" style={{ backgroundColor: colors.surface }}>
          <BriefcaseBusiness size={18} color={colors.muted} />
          <Text className="ml-3 font-semibold" style={{ color: colors.muted }}>Trading Platform</Text>
        </Pressable>
        <Pressable onPress={onSignOut} className="flex-row items-center rounded-xl px-4 py-3">
          <LogOut size={18} color="#f24d58" />
          <Text className="ml-3 font-semibold text-danger">Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}
