import { Check, Copy, Repeat2, WalletCards, X } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../context/ThemeContext';
import { money } from '../../utils/formatters';

function accountId(account) {
  return String(account?.id || '').replace(/\D/g, '').slice(-8).padStart(8, '0');
}

function accountLabel(account) {
  return account?.name || `${account?.type || 'Demo'} account`;
}

export default function DemoAccountMenu({ accounts = [], selectedAccount, onSelectAccount, onClose, onOpenPanel }) {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const fallbackAccount = {
    id: `user-${user?.id || 27075}`,
    type: user?.accountType || 'Demo',
    name: user?.accountType === 'Live' ? 'Live account 1' : 'Demo account 1',
    status: user?.tradingStatus === 'frozen' ? 'frozen' : 'active',
    balance: user?.wallet?.balance || 0,
    currency: 'USD',
  };
  const tradingAccounts = accounts.length ? accounts : [fallbackAccount];
  const activeAccount = selectedAccount || tradingAccounts[0];

  const openPanel = (panel) => {
    onClose?.();
    onOpenPanel?.(panel);
  };

  return (
    <View
      className="absolute right-3 top-[242px] z-50 w-[390px] max-w-[94vw] overflow-hidden rounded-lg border p-5 shadow-2xl lg:right-[132px] lg:top-[74px]"
      style={{
        backgroundColor: colors.panel,
        borderColor: colors.border,
        shadowColor: colors.primary,
        shadowOpacity: 0.18,
        shadowRadius: 24,
        transform: [{ translateY: 4 }],
      }}
    >
      <View className="mb-4 flex-row items-start justify-between">
        <View>
          <Text className="text-2xl font-black" style={{ color: colors.text }}>Account Center</Text>
          <Text className="mt-1 text-xs" style={{ color: colors.muted }}>Switch accounts and manage trading access</Text>
        </View>
        <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
          <X size={21} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 620 }}>
      <View className="mb-4 rounded-3xl border p-4" style={{ borderColor: colors.border, backgroundColor: `${colors.primary}10` }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.primary }}>
              <WalletCards size={23} color="#0B0B0B" />
            </View>
            <View className="ml-3">
              <Text className="font-black" style={{ color: colors.text }}>{activeAccount?.type || 'Demo'} Account</Text>
              <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>{accountLabel(activeAccount)}</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-xs" style={{ color: colors.muted }}>Balance</Text>
            <Text className="text-lg font-black" style={{ color: colors.text }}>
              {money(activeAccount?.balance || 0)} {activeAccount?.currency || 'USD'}
            </Text>
          </View>
        </View>
        <View className="mt-4 flex-row items-center justify-between rounded-2xl px-3 py-2" style={{ backgroundColor: colors.surface }}>
          <Text className="text-xs font-semibold" style={{ color: colors.muted }}>Account ID</Text>
          <View className="flex-row items-center">
            <Text className="mr-2 text-xs font-black" style={{ color: colors.text }}>#{accountId(activeAccount)}</Text>
            <Copy size={13} color={colors.muted} />
          </View>
        </View>
      </View>

      <View className="mb-4">
        <Text className="mb-2 text-xs font-black uppercase tracking-wide" style={{ color: colors.muted }}>Switch account</Text>
        {tradingAccounts.map((account) => {
          const selected = String(account.id) === String(activeAccount?.id);
          const statusTone = account.status === 'pending' ? colors.primary : colors.success;
          return (
            <Pressable
              key={account.id}
              onPress={() => onSelectAccount?.(account)}
              className="mb-2 flex-row items-center rounded-2xl border p-3"
              style={{
                backgroundColor: selected ? `${colors.primary}18` : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
              }}
            >
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: selected ? colors.primary : colors.panel }}>
                {selected ? <Check size={18} color="#0B0B0B" /> : <Repeat2 size={17} color={colors.muted} />}
              </View>
              <View className="flex-1">
                <Text className="font-black" style={{ color: colors.text }}>{account.type || 'Demo'} - {accountLabel(account)}</Text>
                <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>#{accountId(account)} | {money(account.balance || 0)} {account.currency || 'USD'}</Text>
              </View>
              <Text className="text-xs font-black" style={{ color: statusTone }}>{account.status || 'active'}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={() => openPanel('account')} className="mb-4 rounded-xl px-4 py-3" style={{ backgroundColor: colors.primary }}>
        <Text className="text-center font-black text-black">Manage Accounts</Text>
      </Pressable>

      </ScrollView>
    </View>
  );
}
