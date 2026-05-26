import { Link } from 'expo-router';
import { BarChart3, BriefcaseBusiness, LayoutDashboard, LogOut, ReceiptText, UsersRound } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

const navigation = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'User Wallets', icon: UsersRound },
  { id: 'funding', label: 'Deposits & Withdrawals', icon: ReceiptText },
  { id: 'trades', label: 'All Trades', icon: BarChart3 },
];

export default function AdminSidebar({ section, onChange, stats, pendingCount, onSignOut }) {
  return (
    <View className="w-full border-b border-border bg-panel md:min-h-screen md:w-[270px] md:border-b-0 md:border-r">
      <View className="border-b border-border p-6">
        <Text className="text-xs font-bold tracking-[3px] text-primary">NOVA FXM</Text>
        <Text className="mt-2 text-xl font-bold text-white">Admin Console</Text>
        <Text className="mt-1 text-xs text-muted">Operations and risk control</Text>
      </View>
      <ScrollView horizontal className="md:hidden" contentContainerClassName="p-3">
        {navigation.map(({ id, label }) => (
          <Pressable key={id} onPress={() => onChange(id)} className={`mr-2 rounded-xl px-4 py-3 ${section === id ? 'bg-primary' : 'bg-surface'}`}>
            <Text className="font-semibold text-white">{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View className="hidden p-4 md:flex">
        {navigation.map(({ id, label, icon: Icon }) => (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            className={`mb-2 flex-row items-center rounded-xl px-4 py-4 ${section === id ? 'bg-primary' : 'bg-transparent'}`}
          >
            <Icon size={19} color={section === id ? '#ffffff' : '#8fa0bb'} />
            <Text className={`ml-3 font-semibold ${section === id ? 'text-white' : 'text-muted'}`}>{label}</Text>
            {id === 'funding' && pendingCount ? (
              <Text className="ml-auto rounded-full bg-danger px-2 py-1 text-xs font-bold text-white">{pendingCount}</Text>
            ) : null}
          </Pressable>
        ))}
        <View className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <Text className="text-xs uppercase text-muted">Active Traders</Text>
          <Text className="mt-2 text-2xl font-bold text-white">{stats.activeTraders || 0}</Text>
          <Text className="mt-3 text-xs uppercase text-muted">Open Positions</Text>
          <Text className="mt-2 text-lg font-semibold text-primary">{stats.totalOpenPositions || 0}</Text>
        </View>
      </View>
      <View className="hidden mt-auto border-t border-border p-4 md:flex">
        <Link href="/trading" asChild>
          <Pressable className="mb-2 flex-row items-center rounded-xl bg-surface px-4 py-4">
            <BriefcaseBusiness size={18} color="#8fa0bb" />
            <Text className="ml-3 font-semibold text-muted">Trading Platform</Text>
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
