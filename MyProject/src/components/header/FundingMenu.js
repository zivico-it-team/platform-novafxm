import { ArrowDownLeft, ArrowUpRight, ChevronRight, History, Repeat2, Wallet, X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { money } from '../../utils/formatters';

function accountId(account) {
  return String(account?.id || '').replace(/\D/g, '').slice(-8).padStart(8, '0');
}

function FundingAction({ icon: Icon, title, subtitle, onPress, colors, primary = false }) {
  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation?.();
        onPress();
      }}
      className="mb-3 flex-row items-center justify-between rounded-2xl border px-4 py-4"
      style={{
        backgroundColor: primary ? colors.primary : colors.surface,
        borderColor: primary ? colors.primary : colors.border,
      }}
    >
      <View className="flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: primary ? '#0B0B0B18' : `${colors.primary}22` }}>
          <Icon size={20} color={primary ? '#0B0B0B' : colors.primary} />
        </View>
        <View className="ml-3">
          <Text className="font-black" style={{ color: primary ? '#0B0B0B' : colors.text }}>{title}</Text>
          <Text className="mt-0.5 text-xs" style={{ color: primary ? '#29311f' : colors.muted }}>{subtitle}</Text>
        </View>
      </View>
      <ChevronRight size={18} color={primary ? '#0B0B0B' : colors.muted} />
    </Pressable>
  );
}

export default function FundingMenu({ selectedAccount, summary, onClose, onSwitchAccount, onOpenPanel }) {
  const { colors } = useAppTheme();
  const balance = Number.isFinite(Number(selectedAccount?.balance))
    ? Number(selectedAccount.balance)
    : Number(summary?.balance || 0);
  const accountName = selectedAccount?.name || `${selectedAccount?.type || 'Demo'} account 1`;

  const openPanel = (panel) => {
    onClose?.();
    onOpenPanel?.(panel);
  };

  return (
    <View
      className="absolute right-3 top-[74px] z-50 w-[410px] max-w-[94vw] overflow-hidden rounded-lg border p-5 shadow-2xl lg:right-[74px]"
      style={{
        backgroundColor: colors.panel,
        borderColor: colors.border,
        shadowColor: colors.primary,
        shadowOpacity: 0.18,
        shadowRadius: 24,
        transform: [{ translateY: 4 }],
      }}
    >
      <View className="mb-5 flex-row items-start justify-between">
        <View>
          <Text className="text-2xl font-black" style={{ color: colors.text }}>Funding</Text>
          <Text className="mt-1 text-xs" style={{ color: colors.muted }}>Wallet balance, deposit and withdrawal</Text>
        </View>
        <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
          <X size={21} color={colors.text} />
        </Pressable>
      </View>

      <View className="mb-5 rounded-3xl border p-4" style={{ borderColor: colors.border, backgroundColor: `${colors.primary}10` }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl" style={{ backgroundColor: colors.primary }}>
              <Wallet size={25} color="#0B0B0B" />
            </View>
            <View className="ml-3">
              <Text className="font-black" style={{ color: colors.text }}>{selectedAccount?.type || 'Demo'} Wallet</Text>
              <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>#{accountId(selectedAccount)} | {accountName}</Text>
            </View>
          </View>
        </View>
        <Text className="mt-5 text-4xl font-black" style={{ color: colors.text }}>{money(balance)} USD</Text>
        <Text className="mt-1 text-xs" style={{ color: colors.muted }}>Available balance for selected trading account</Text>
      </View>

      <FundingAction
        icon={ArrowDownLeft}
        title="Deposit"
        subtitle="Submit a funding request"
        onPress={() => openPanel('deposit')}
        colors={colors}
        primary
      />
      <FundingAction
        icon={ArrowUpRight}
        title="Withdraw"
        subtitle="Request withdrawal after verification"
        onPress={() => openPanel('withdraw')}
        colors={colors}
      />
      <FundingAction
        icon={History}
        title="Transaction History"
        subtitle="Deposits, withdrawals and account updates"
        onPress={() => openPanel('history')}
        colors={colors}
      />
      <FundingAction
        icon={Repeat2}
        title="Switch Account"
        subtitle="Choose another trading account"
        onPress={() => {
          onClose?.();
          onSwitchAccount?.();
        }}
        colors={colors}
      />
    </View>
  );
}
