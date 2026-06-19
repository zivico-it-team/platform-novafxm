import { ArrowDown, ArrowUp, Clock, Repeat2, X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { money } from '../../utils/formatters';

function accountId(account) {
  return String(account?.id || '').replace(/\D/g, '').slice(-8).padStart(8, '0');
}

function FundingAction({ icon: Icon, title, onPress, colors }) {
  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation?.();
        onPress();
      }}
      style={({ pressed }) => ({
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 18,
        paddingVertical: 12,
        backgroundColor: pressed ? colors.surface : 'transparent',
      })}
    >
      <Icon size={20} color={colors.text} strokeWidth={1.8} />
      <Text className="ml-3 text-base font-semibold" style={{ color: colors.text }}>
        {title}
      </Text>
    </Pressable>
  );
}

export default function FundingMenu({ selectedAccount, summary, onClose, onSwitchAccount, onOpenPanel }) {
  const { colors } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(410)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const panelWidth = width < 500 ? width : 410;
  const panelHeight = height;
  const balance = Number.isFinite(Number(selectedAccount?.balance))
    ? Number(selectedAccount.balance)
    : Number(summary?.balance || 0);
  const accountTier = selectedAccount?.tier || 'Standard';
  const accountType = selectedAccount?.type || 'Demo';
  const realAccount = accountType.toLowerCase() === 'live';

  const openPanel = (panel) => {
    onClose?.();
    onOpenPanel?.(panel);
  };

  useEffect(() => {
    slideAnim.setValue(panelWidth);
    fadeAnim.setValue(0);
    contentAnim.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, contentAnim, panelWidth]);

  return (
    <Animated.View
      className="overflow-hidden shadow-2xl"
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 50,
        width: panelWidth,
        height: panelHeight,
        paddingTop: 24,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: colors.panel,
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 28,
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: contentAnim,
            transform: [
              {
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [15, 0],
                }),
              },
            ],
          }}
        >
          <View className="mb-5 flex-row items-center justify-between pl-[18px]">
            <Text className="text-2xl font-extrabold" style={{ color: colors.text }}>Funding</Text>
            <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center">
              <X size={26} color={colors.text} strokeWidth={1.8} />
            </Pressable>
          </View>

          <View className="mb-5 rounded-xl p-4" style={{ backgroundColor: colors.surface }}>
            <View className="flex-row flex-wrap items-center">
              <Text className="text-base font-bold" style={{ color: colors.text }}>{accountTier}</Text>
              <View
                className="ml-2 rounded px-2 py-0.5"
                style={{ backgroundColor: realAccount ? `${colors.success}22` : `${colors.primary}22` }}
              >
                <Text className="text-[11px] font-bold" style={{ color: realAccount ? colors.success : colors.primary }}>
                  {realAccount ? 'Real' : 'Demo'}
                </Text>
              </View>
            </View>
            <Text className="mt-2 text-[26px] font-extrabold" style={{ color: colors.text }}>
              {money(balance)} USD
            </Text>
            <Text className="mt-2 text-sm" style={{ color: colors.muted }}>
              #{accountId(selectedAccount)}
            </Text>
          </View>

          <Text className="mb-4 pl-[18px] text-xl font-extrabold" style={{ color: colors.text }}>Funding Options</Text>

          <FundingAction
            icon={ArrowUp}
            title="Deposit"
            onPress={() => openPanel('deposit')}
            colors={colors}
          />
          <FundingAction
            icon={ArrowDown}
            title="Withdraw"
            onPress={() => openPanel('withdraw')}
            colors={colors}
          />
          <FundingAction
            icon={Repeat2}
            title="Internal Transfer"
            onPress={() => openPanel('transfer')}
            colors={colors}
          />
          <FundingAction
            icon={Clock}
            title="Transactions History"
            onPress={() => openPanel('history')}
            colors={colors}
          />
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}