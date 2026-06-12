import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { CircleUserRound, Plus, RefreshCw, Settings2, Sun, Moon } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { money } from '../../utils/formatters';
import { useAppTheme } from '../../context/ThemeContext';
import { dashboardService } from '../../services/dashboardService';
import NovaLogo from '../brand/NovaLogo';
import DemoAccountMenu from './DemoAccountMenu';
import NewOrderModal from '../order/NewOrderModal';
import ProfileMenu from './ProfileMenu';

const visibleMetricCount = 5;

export default function TopAccountBar() {
  const { width } = useWindowDimensions();
  const { summary, syncAccount, selectedTradingAccount, setSelectedTradingAccount } = useDemoTrading();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { darkMode, colors, toggleTheme } = useAppTheme();
  const metricsScrollRef = useRef(null);
  const profileHoverCloseRef = useRef(null);
  const [metricsWidth, setMetricsWidth] = useState(0);
  const [menu, setMenu] = useState(null);
  const [orderModal, setOrderModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [hoveredAction, setHoveredAction] = useState(null);
  const mobile = width < 760;
  const iconButtonHoverBg = darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(11, 11, 11, 0.04)';

  const fallbackAccount = useMemo(() => ({
    id: `user-${user?.id || 'demo'}`,
    type: user?.accountType || 'Demo',
    name: user?.accountType === 'Live' ? 'Live account 1' : 'Demo account 1',
    status: user?.tradingStatus === 'frozen' ? 'frozen' : 'active',
    balance: summary.balance,
    currency: 'USD',
  }), [summary.balance, user?.accountType, user?.id, user?.tradingStatus]);

  const tradingAccounts = useMemo(() => {
    const list = accounts.length ? accounts : [fallbackAccount];
    if (!selectedTradingAccount?.id) return list;
    return list.map((account) => (
      String(account.id) === String(selectedTradingAccount.id)
        ? { ...account, ...selectedTradingAccount }
        : account
    ));
  }, [accounts, fallbackAccount, selectedTradingAccount]);
  const selectedAccount = tradingAccounts.find((account) => String(account.id) === String(selectedTradingAccount?.id)) || selectedTradingAccount || tradingAccounts[0];
  const selectedAccountBalance = Number.isFinite(Number(selectedAccount?.balance)) ? Number(selectedAccount.balance) : summary.balance;
  const routeAccountId = params.accountId ? String(params.accountId) : '';

  const metrics = [
    ['Balance', `${money(summary.balance)} USD`],
    ['Equity', `${money(summary.equity)} USD`],
    ['Margin', `${money(summary.margin)} USD`],
    ['Margin Level', summary.margin ? `${money(summary.marginLevel)} %` : '-'],
    ['Net Profit', `${money(summary.openProfit)} USD`],
    ['Bonus', `${money(summary.bonus)} USD`],
    ['Client Deposits', `${money(summary.totalDeposits)} USD`],
    ['Pending Deposits', `${money(summary.pendingDeposits)} USD`],
    ['Free Funds', `${money(summary.freeFunds)} USD`],
  ];

  const maxMetricStep = Math.max(metrics.length - visibleMetricCount, 0);

  useEffect(() => {
    let active = true;
    if (!user) {
      setAccounts([]);
      setSelectedTradingAccount(null);
      return undefined;
    }
    dashboardService.getDashboard()
      .then((result) => {
        if (!active) return;
        setAccounts(result.accounts || []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [setSelectedTradingAccount, user]);

  useEffect(() => {
    if (!tradingAccounts.length) return;
    const routeAccount = routeAccountId ? tradingAccounts.find((account) => String(account.id) === routeAccountId) : null;
    if (routeAccount && String(selectedTradingAccount?.id) !== String(routeAccount.id)) { setSelectedTradingAccount(routeAccount); return; }
    const selectedExists = tradingAccounts.some((account) => String(account.id) === String(selectedTradingAccount?.id));
    if (!selectedExists) setSelectedTradingAccount(tradingAccounts[0]);
  }, [routeAccountId, selectedTradingAccount?.id, setSelectedTradingAccount, tradingAccounts]);

  const selectAccount = (account) => { setSelectedTradingAccount(account); setMenu(null); };

  const hoverProps = (action) => ({ onHoverIn: () => setHoveredAction(action), onHoverOut: () => setHoveredAction(null) });

  const cancelProfileHoverClose = () => { if (!profileHoverCloseRef.current) return; clearTimeout(profileHoverCloseRef.current); profileHoverCloseRef.current = null; };

  const openProfileMenu = (action) => { cancelProfileHoverClose(); setHoveredAction(action); setMenu((cur) => (cur === 'profile' ? cur : 'profile')); };

  const profileHoverProps = (action) => ({ onHoverIn: () => openProfileMenu(action), onHoverOut: () => setHoveredAction(null) });

  const iconButtonStyle = (action, baseStyle) => [baseStyle, { cursor: 'pointer' }, hoveredAction === action ? { backgroundColor: iconButtonHoverBg, borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: darkMode ? 0.28 : 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, transform: [{ translateY: -1 }], elevation: 4 } : null];

  const iconHoverStyle = (action) => ({ transform: [{ scale: hoveredAction === action ? 1.12 : 1 }, { rotate: hoveredAction === action ? '8deg' : '0deg' }] });

  const iconColor = (action) => (hoveredAction === action ? colors.primary : colors.text);

  const AuthButtons = () => (
    <View className="flex-row items-center gap-2">
      <Pressable onPress={() => router.push('/login')} className="h-[40px] justify-center rounded-md px-4" style={{ backgroundColor: colors.panel }}>
        <Text className="text-sm font-semibold" style={{ color: colors.text }}>Log In</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/register')} className="h-[40px] justify-center rounded-md px-4" style={{ backgroundColor: colors.primary }}>
        <Text className="text-sm font-bold text-black">Sign Up</Text>
      </Pressable>
    </View>
  );

  useEffect(() => () => cancelProfileHoverClose(), []);

  useEffect(() => {
    if (!metricsWidth || maxMetricStep === 0) return undefined;
    let step = 0;
    const interval = setInterval(() => {
      step = step >= maxMetricStep ? 0 : step + 1;
      metricsScrollRef.current?.scrollTo({ x: (metricsWidth / visibleMetricCount) * step, animated: true });
    }, 3800);
    return () => clearInterval(interval);
  }, [maxMetricStep, metricsWidth]);

  return (
    <View className={`${mobile ? 'relative z-40 gap-1.5 px-2 py-1.5' : 'relative z-40 border-b px-2 py-1.5'} lg:flex-row lg:items-center lg:gap-3 lg:px-3 lg:py-3`} style={{ backgroundColor: colors.background, borderColor: colors.border }}>
      {mobile ? (
        <View className="flex-row items-center gap-2">
          {user ? (
            <Pressable onPress={() => setMenu(menu === 'account' ? null : 'account')} className="h-[40px] flex-1 flex-row items-center rounded-md border px-2" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
              <CircleUserRound color={colors.muted} size={18} />
              <View className="ml-2 min-w-0 flex-1">
                <Text className="text-xs font-bold" numberOfLines={1} style={{ color: colors.text }}>{selectedAccount?.type || 'Demo'}</Text>
                <Text className="text-[10px]" numberOfLines={1} style={{ color: colors.muted }}>{selectedAccount?.name || 'Demo account 1'}</Text>
              </View>
              <View className="ml-1 h-2 w-2 rounded-full" style={{ backgroundColor: colors.success }} />
            </Pressable>
          ) : (
            <AuthButtons />
          )}
          <Pressable onPress={() => setOrderModal(true)} className="h-[40px] flex-row items-center justify-center rounded-md px-3" style={{ backgroundColor: colors.primary }}>
            <Plus color="#0B0B0B" size={16} />
            <Text className="ml-1.5 text-xs font-bold text-black">New Order</Text>
          </Pressable>
          <Pressable {...hoverProps('mobile-theme')} onPress={toggleTheme} className="h-[40px] w-[40px] items-center justify-center rounded-md border" style={iconButtonStyle('mobile-theme', { backgroundColor: colors.panel, borderColor: colors.border })}>
            <View style={iconHoverStyle('mobile-theme')}>{darkMode ? <Sun size={18} color={iconColor('mobile-theme')} /> : <Moon size={18} color={iconColor('mobile-theme')} />}</View>
          </Pressable>
          {user ? (
            <Pressable {...profileHoverProps('mobile-profile')} onPress={() => setMenu(menu === 'profile' ? null : 'profile')} className="h-[40px] w-[40px] items-center justify-center rounded-md border" style={iconButtonStyle('mobile-profile', { backgroundColor: colors.panel, borderColor: colors.border })}>
              <View style={iconHoverStyle('mobile-profile')}><Settings2 color={iconColor('mobile-profile')} size={18} /></View>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View className="mb-3 flex-row items-center justify-between lg:mb-0">
          <NovaLogo dark={darkMode} width={180} height={44} />
        </View>
      )}
      {!mobile ? (
        <Pressable onPress={() => setOrderModal(true)} className="mb-3 flex-row items-center justify-center rounded-xl px-5 py-4 lg:mb-0" style={{ backgroundColor: colors.primary }}>
          <Plus color="#0B0B0B" size={18} />
          <Text className="ml-2 font-bold text-black">New Order</Text>
        </Pressable>
      ) : null}
      <ScrollView ref={metricsScrollRef} horizontal showsHorizontalScrollIndicator={false} className={`${mobile ? 'h-[40px] rounded-md' : 'h-[58px] rounded-lg border'} flex-1`} contentContainerStyle={{ width: `${(metrics.length / visibleMetricCount) * 100}%` }} onLayout={({ nativeEvent }) => setMetricsWidth(nativeEvent.layout.width)} style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
        {metrics.map(([label, value], index) => (
          <View key={label} className={`${mobile ? 'px-2' : 'px-4'} h-full flex-1 justify-center`} style={{ borderColor: mobile ? 'rgba(132, 142, 156, .22)' : colors.border, borderRightWidth: index === metrics.length - 1 ? 0 : 1 }}>
            <Text className={mobile ? 'text-[9px]' : 'text-xs'} numberOfLines={1} style={{ color: colors.muted }}>{label}</Text>
            <Text className={`${mobile ? 'text-[11px]' : 'mt-1'} font-semibold`} numberOfLines={1} style={{ color: label === 'Net Profit' && summary.openProfit < 0 ? colors.danger : colors.text }}>{value}</Text>
          </View>
        ))}
      </ScrollView>
      {!mobile && user ? (
        <Pressable onPress={() => setMenu(menu === 'account' ? null : 'account')} className="mt-3 flex-row items-center rounded-xl border px-4 py-3 lg:mt-0 lg:w-[250px]" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
          <CircleUserRound color={colors.muted} size={23} />
          <View>
            <Text className="ml-4 font-bold" style={{ color: colors.text }}>{selectedAccount?.type || 'Demo'}</Text>
            <Text className="ml-4 text-xs" style={{ color: colors.muted }}>{selectedAccount?.name || 'Demo account 1'}</Text>
          </View>
          <View className="ml-auto h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.success }} />
        </Pressable>
      ) : null}
      {!mobile && !user ? <AuthButtons /> : null}
      {user ? (
        <Pressable {...hoverProps('sync')} onPress={() => syncAccount?.().catch(() => {})} className="mt-3 hidden h-[58px] w-[58px] items-center justify-center rounded-xl border lg:flex" style={iconButtonStyle('sync', { backgroundColor: colors.panel, borderColor: colors.border })}>
          <View style={iconHoverStyle('sync')}><RefreshCw size={21} color={iconColor('sync')} /></View>
        </Pressable>
      ) : null}
      <Pressable {...hoverProps('theme')} onPress={toggleTheme} className="mt-3 hidden h-[58px] w-[58px] items-center justify-center rounded-xl border lg:flex" style={iconButtonStyle('theme', { backgroundColor: colors.panel, borderColor: colors.border })}>
        <View style={iconHoverStyle('theme')}>{darkMode ? <Sun size={21} color={iconColor('theme')} /> : <Moon size={21} color={iconColor('theme')} />}</View>
      </Pressable>
      {user ? (
        <Pressable {...profileHoverProps('profile')} onPress={() => setMenu(menu === 'profile' ? null : 'profile')} className="mt-3 hidden h-[58px] w-[58px] items-center justify-center rounded-xl border lg:flex" style={iconButtonStyle('profile', { backgroundColor: colors.panel, borderColor: colors.border })}>
          <View style={iconHoverStyle('profile')}><Settings2 size={21} color={iconColor('profile')} /></View>
        </Pressable>
      ) : null}
      <Modal visible={Boolean(menu)} transparent animationType="none" onRequestClose={() => setMenu(null)}>
        <Pressable className="flex-1" style={{ flex: 1 }} onPress={() => setMenu(null)}>
          <Pressable onPress={(event) => event.stopPropagation()}>
            {menu === 'account' ? <DemoAccountMenu accounts={tradingAccounts} selectedAccount={selectedAccount} onSelectAccount={selectAccount} onClose={() => setMenu(null)} /> : null}
            {menu === 'profile' ? <ProfileMenu onClose={() => setMenu(null)} onHoverIn={cancelProfileHoverClose} toggleTheme={toggleTheme} darkMode={darkMode} /> : null}
          </Pressable>
        </Pressable>
      </Modal>
      <NewOrderModal visible={orderModal} onClose={() => setOrderModal(false)} />
    </View>
  );
}