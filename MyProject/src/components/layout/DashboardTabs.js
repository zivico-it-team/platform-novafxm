import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

const tabs = [
  { key: 'overview', label: 'Overview', section: 'overview' },
  { key: 'accounts', label: 'Accounts', section: 'accounts' },
  { key: 'verification', label: 'Verification', route: '/verification' },
  { key: 'deposit', label: 'Deposit', section: 'deposit' },
  { key: 'withdraw', label: 'Withdraw', section: 'withdraw' },
  { key: 'rewards', label: 'Referral Programme', route: '/broker-rewards' },
  { key: 'settings', label: 'Settings', route: '/settings' },
];

export default function DashboardTabs({ activeKey, onSectionChange }) {
  const { colors } = useAppTheme();

  const openTab = (tab) => {
    if (tab.section) {
      if (onSectionChange) {
        onSectionChange(tab.section);
        return;
      }
      router.push(`/dashboard?section=${tab.section}`);
      return;
    }
    router.push(tab.route);
  };

  return (
    <View className="mb-5 rounded-2xl border p-2" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <View className="flex-row flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = activeKey === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => openTab(tab)}
              className="rounded-xl px-4 py-3"
              style={{
                backgroundColor: active ? colors.primary : 'transparent',
                borderColor: active ? colors.primary : colors.border,
                borderWidth: 1,
              }}
            >
              <Text className="font-bold" style={{ color: active ? '#05130d' : colors.muted }}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
