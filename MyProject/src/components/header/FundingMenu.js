import { ArrowDownLeft, ArrowUpRight, ChevronRight, History, Repeat2, Wallet, X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
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
      className="mb-3 flex-row items-center justify-between rounded-xl border px-4 py-4"
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
          <Text className="font-extrabold" style={{ color: primary ? '#0B0B0B' : colors.text }}>{title}</Text>
          <Text className="mt-0.5 text-xs" style={{ color: primary ? '#29311f' : colors.muted }}>{subtitle}</Text>
        </View>
      </View>
      <ChevronRight size={18} color={primary ? '#0B0B0B' : colors.muted} />
    </Pressable>
  );
}

export default function FundingMenu({ selectedAccount, summary, onClose, onSwitchAccount, onOpenPanel }) {
  const { colors } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(-28)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const panelWidth = Math.min(430, Math.max(320, width * 0.94));
  const panelTop = width < 760 ? 58 : 74;
  const panelHeight = height - panelTop;
  const balance = Number.isFinite(Number(selectedAccount?.balance))
    ? Number(selectedAccount.balance)
    : Number(summary?.balance || 0);
  const accountName = selectedAccount?.name || `${selectedAccount?.type || 'Demo'} account 1`;

  const openPanel = (panel) => {
    onClose?.();
    onOpenPanel?.(panel);
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      className="overflow-hidden rounded-l-xl border-l p-5 shadow-2xl"
      style={{
        position: 'absolute',
        right: 0,
        top: panelTop,
        zIndex: 50,
        width: panelWidth,
        height: panelHeight,
        backgroundColor: colors.panel,
        borderColor: colors.border,
        shadowColor: colors.primary,
        shadowOpacity: 0.14,
        shadowRadius: 24,
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-5 flex-row items-start justify-between">
          <View>
            <Text className="text-2xl font-extrabold" style={{ color: colors.text }}>Funding</Text>
            <Text className="mt-1 text-sm" style={{ color: colors.muted }}>Wallet, deposits and withdrawals</Text>
          </View>
          <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
            <X size={21} color={colors.text} />
          </Pressable>
        </View>

        <View className="mb-5 rounded-xl border p-4" style={{ borderColor: colors.border, backgroundColor: `${colors.primary}10` }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl" style={{ backgroundColor: colors.primary }}>
                <Wallet size={25} color="#0B0B0B" />
              </View>
              <View className="ml-3">
                <Text className="font-extrabold" style={{ color: colors.text }}>{selectedAccount?.type || 'Demo'} Wallet</Text>
                <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>#{accountId(selectedAccount)} | {accountName}</Text>
              </View>
            </View>
          </View>
          <Text className="mt-5 text-4xl font-extrabold" style={{ color: colors.text }}>{money(balance)} USD</Text>
          <Text className="mt-1 text-xs" style={{ color: colors.muted }}>Available balance for selected trading account</Text>
        </View>

        <Text className="mb-3 text-lg font-extrabold" style={{ color: colors.text }}>Funding Options</Text>
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
      </ScrollView>
    </Animated.View>
  );
}
