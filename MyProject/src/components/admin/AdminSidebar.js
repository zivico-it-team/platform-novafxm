import { Link } from 'expo-router';
import { BarChart3, BriefcaseBusiness, CreditCard, LayoutDashboard, LogOut, ReceiptText, UsersRound } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import NovaLogo from '../brand/NovaLogo';

const navigation = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'User Wallets', icon: UsersRound },
  { id: 'userManagement', label: 'User Management', icon: UsersRound },
  { id: 'funding', label: 'Deposits & Withdrawals', icon: ReceiptText },
  { id: 'bankAccounts', label: 'Withdrawal Details', icon: CreditCard },
  { id: 'trades', label: 'All Trades', icon: BarChart3 },
];

export default function AdminSidebar({ section, onChange, stats, pendingCount, bankPendingCount, onSignOut }) {
  const { darkMode, colors } = useAppTheme();

  return (
    <View className="w-full border-b md:min-h-screen md:w-[270px] md:border-b-0 md:border-r" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <View className="border-b p-6" style={{ borderColor: colors.border }}>
        <NovaLogo dark={darkMode} width={136} height={34} />
        <Text className="mt-2 text-xl font-bold" style={{ color: colors.text }}>Admin Console</Text>
      </View>
      <ScrollView horizontal className="md:hidden" contentContainerClassName="p-3">
        {navigation.map(({ id, label }) => (
          <Pressable key={id} onPress={() => onChange(id)} className="mr-2 rounded-xl px-4 py-3" style={{ backgroundColor: section === id ? colors.primary : colors.surface }}>
            <Text className="font-semibold" style={{ color: section === id ? '#0B0B0B' : colors.text }}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View className="hidden p-4 md:flex">
        {navigation.map(({ id, label, icon: Icon }) => (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            className="mb-2 flex-row items-center rounded-xl px-4 py-4"
            style={{ backgroundColor: section === id ? colors.primary : 'transparent' }}
          >
            <Icon size={19} color={section === id ? '#0B0B0B' : colors.muted} />
            <Text className="ml-3 font-semibold" style={{ color: section === id ? '#0B0B0B' : colors.muted }}>{label}</Text>
            {id === 'funding' && pendingCount ? (
              <Text className="ml-auto rounded-full bg-danger px-2 py-1 text-xs font-bold text-white">{pendingCount}</Text>
            ) : null}
            {id === 'bankAccounts' && bankPendingCount ? (
              <Text className="ml-auto rounded-full bg-danger px-2 py-1 text-xs font-bold text-white">{bankPendingCount}</Text>
            ) : null}
          </Pressable>
        ))}
        <View className="mt-6 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text className="text-xs uppercase" style={{ color: colors.muted }}>Active Traders</Text>
          <Text className="mt-2 text-2xl font-bold" style={{ color: colors.text }}>{stats.activeTraders || 0}</Text>
          <Text className="mt-3 text-xs uppercase" style={{ color: colors.muted }}>Open Positions</Text>
          <Text className="mt-2 text-lg font-semibold" style={{ color: colors.primary }}>{stats.totalOpenPositions || 0}</Text>
        </View>
      </View>
      <View className="hidden mt-auto border-t p-4 md:flex" style={{ borderColor: colors.border }}>
        <Link href="/trading" asChild>
          <Pressable className="mb-2 flex-row items-center rounded-xl px-4 py-4" style={{ backgroundColor: colors.surface }}>
            <BriefcaseBusiness size={18} color={colors.muted} />
            <Text className="ml-3 font-semibold" style={{ color: colors.muted }}>Trading Platform</Text>
          </Pressable>
        </Link>
        <Pressable onPress={onSignOut} className="flex-row items-center rounded-xl px-4 py-3">
          <LogOut size={18} color="#f24d58" />
          <Text className="ml-3 font-semibold text-danger">Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}
