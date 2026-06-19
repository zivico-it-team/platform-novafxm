import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { ChevronDown, Plus, Sun, Moon, UserRound, Wallet, ArrowUp } from 'lucide-react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useAuth } from '../../hooks/useAuth';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { money, percent, quote } from '../../utils/formatters';
import { useAppTheme } from '../../context/ThemeContext';
import { dashboardService } from '../../services/dashboardService';
import NovaLogo from '../brand/NovaLogo';
import DemoAccountMenu from './DemoAccountMenu';
import FundingMenu from './FundingMenu';
import HeaderSidePanel from './HeaderSidePanel';
import ProfileMenu from './ProfileMenu';

const visibleMetricCount = 5;

export default function TopAccountBar({ chartFullscreen = false, onOpenNewOrder }) {
  const { width } = useWindowDimensions();
  const { currentSymbol, summary, selectedTradingAccount, setSelectedTradingAccount, sidePanel, setSidePanel } = useDemoTrading();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { darkMode, colors, toggleTheme } = useAppTheme();
  const metricsScrollRef = useRef(null);
  const profileHoverCloseRef = useRef(null);
  const [metricsWidth, setMetricsWidth] = useState(0);
  const [menu, setMenu] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [hasSwitchedToLive, setHasSwitchedToLive] = useState(false);
  const mobile = width < 900;
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
  const desktopMetrics = [
    ['Equity', money(summary.equity)],
    ['Balance', money(summary.balance)],
    ['Margin', money(summary.margin)],
    ['Margin Level', summary.margin ? `${money(summary.marginLevel)}%` : '-'],
    ['P&L', money(summary.openProfit)],
  ];
  const symbolPrice = Number(currentSymbol?.price || currentSymbol?.bid || 0);
  const symbolChange = Number(currentSymbol?.change || 0);
  const desktopHeaderBg = darkMode ? '#02070d' : colors.background;
  const desktopDivider = darkMode ? '#172536' : colors.border;
  const desktopText = colors.text;
  const desktopMuted = darkMode ? '#66758a' : colors.muted;
  const tradeButtonBg = darkMode ? '#3a2f14' : colors.primarySoft;
  const sparklinePoints = symbolChange >= 0
    ? '2,34 15,31 26,32 37,24 48,27 58,10 67,18 78,20 90,7 100,12 112,4'
    : '2,7 15,12 26,10 37,18 48,16 58,29 67,22 78,25 90,33 100,28 112,35';

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

    const liveAccount = tradingAccounts.find((account) => account.type === 'Live');
    if (liveAccount && selectedTradingAccount?.type === 'Demo' && !hasSwitchedToLive) {
      setHasSwitchedToLive(true);
      setSelectedTradingAccount(liveAccount);
      return;
    }

    const selectedExists = tradingAccounts.some((account) => String(account.id) === String(selectedTradingAccount?.id));
    if (!selectedExists) setSelectedTradingAccount(liveAccount || tradingAccounts[0]);
  }, [routeAccountId, selectedTradingAccount?.id, setSelectedTradingAccount, tradingAccounts, hasSwitchedToLive]);

  const selectAccount = (account) => { setSelectedTradingAccount(account); setMenu(null); };
  const openSidePanel = (panel) => {
    setMenu(null);
    setSidePanel(panel);
  };

  const openNewOrder = (side = 'BUY') => {
    if (!user) {
      router.push('/login');
      return;
    }
    onOpenNewOrder?.(side);
  };

  const hoverProps = (action) => ({ onHoverIn: () => setHoveredAction(action), onHoverOut: () => setHoveredAction(null) });

  const cancelProfileHoverClose = () => { if (!profileHoverCloseRef.current) return; clearTimeout(profileHoverCloseRef.current); profileHoverCloseRef.current = null; };

  const openProfileMenu = (action) => { cancelProfileHoverClose(); setHoveredAction(action); setMenu((cur) => (cur === 'profile' ? cur : 'profile')); };

  const profileHoverProps = (action) => ({ onHoverIn: () => openProfileMenu(action), onHoverOut: () => setHoveredAction(null) });
  const openWalletMenu = () => setMenu((current) => (current === 'wallet' ? null : 'wallet'));

  const isMenuActionActive = (action) => {
    if (menu === 'wallet' && (action === 'wallet' || action === 'mobile-wallet')) return true;
    if (menu === 'profile' && (action === 'profile' || action === 'mobile-profile')) return true;
    return false;
  };

  const iconButtonStyle = (action, baseStyle) => {
    const active = isMenuActionActive(action);
    const hovered = hoveredAction === action;
    return [
      baseStyle,
      { cursor: 'pointer' },
      hovered || active
        ? {
            backgroundColor: active ? `${colors.primary}12` : iconButtonHoverBg,
            borderColor: colors.primary,
            shadowColor: colors.primary,
            shadowOpacity: darkMode ? 0.28 : 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            transform: [{ translateY: -1 }],
            elevation: 4,
          }
        : null
    ];
  };

  const iconHoverStyle = (action) => {
    const active = isMenuActionActive(action);
    const hovered = hoveredAction === action;
    return {
      transform: [
        { scale: hovered || active ? 1.15 : 1 },
        { rotate: active ? '15deg' : (hovered ? '8deg' : '0deg') }
      ]
    };
  };

  const iconColor = (action) => (hoveredAction === action || isMenuActionActive(action) ? colors.primary : colors.text);

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
    <View className={`${mobile ? 'relative z-40 gap-1.5 px-2 py-1.5' : 'relative z-40 px-5 py-2'} lg:flex-row lg:items-center lg:gap-3`} style={{ backgroundColor: mobile ? colors.background : desktopHeaderBg, borderColor: colors.border }}>
      {mobile ? (
        <View className="gap-2">
          {/* Row 1: Logo & Utility Icons */}
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => router.push('/')} style={{ cursor: 'pointer' }}>
              <NovaLogo dark={darkMode} width={130} height={34} />
            </Pressable>
            <View className="flex-row items-center gap-1.5">
              <Pressable {...hoverProps('mobile-theme')} onPress={toggleTheme} className="h-[36px] w-[36px] items-center justify-center rounded-md border" style={iconButtonStyle('mobile-theme', { backgroundColor: colors.panel, borderColor: colors.border })}>
                <View style={iconHoverStyle('mobile-theme')}>{darkMode ? <Sun size={16} color={iconColor('mobile-theme')} /> : <Moon size={16} color={iconColor('mobile-theme')} />}</View>
              </Pressable>
              {user ? (
                <Pressable {...hoverProps('mobile-wallet')} onPress={openWalletMenu} className="h-[36px] w-[36px] items-center justify-center rounded-md border" style={iconButtonStyle('mobile-wallet', { backgroundColor: colors.panel, borderColor: colors.border })}>
                  <View style={iconHoverStyle('mobile-wallet')}><Wallet color={iconColor('mobile-wallet')} size={16} /></View>
                </Pressable>
              ) : null}
              {user ? (
                <Pressable {...hoverProps('mobile-profile')} onPress={() => setMenu(menu === 'profile' ? null : 'profile')} className="h-[36px] w-[36px] items-center justify-center rounded-md border" style={iconButtonStyle('mobile-profile', { backgroundColor: colors.panel, borderColor: colors.border })}>
                  <View style={iconHoverStyle('mobile-profile')}><UserRound color={iconColor('mobile-profile')} size={16} /></View>
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Row 2: Account Select & Action Buttons */}
          <View className="flex-row items-center gap-2">
            {user ? (
              <Pressable onPress={() => setMenu(menu === 'account' ? null : 'account')} className="h-[38px] flex-1 flex-row items-center rounded-md px-2" style={{ backgroundColor: colors.panel }}>
                <View className="ml-1 min-w-0 flex-1">
                  <Text className="text-[10px] font-black" numberOfLines={1} style={{ color: colors.primary }}>{selectedAccount?.type || 'Demo'}</Text>
                  <Text className="text-[11px] font-black" numberOfLines={1} style={{ color: colors.text }}>{money(selectedAccountBalance)} USD</Text>
                </View>
                <ChevronDown className="ml-1" size={13} color={colors.muted} />
                <View className="ml-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.success }} />
              </Pressable>
            ) : (
              <AuthButtons />
            )}
            {user ? (
              <Pressable
                {...hoverProps('mobile-trade')}
                onPress={() => openNewOrder('BUY')}
                className="h-[38px] flex-row items-center justify-center rounded-md px-2"
                style={[
                  { backgroundColor: colors.primary, cursor: 'pointer' },
                  hoveredAction === 'mobile-trade' ? { transform: [{ translateY: -1 }] } : null
                ]}
              >
                <Plus color="#0B0B0B" size={14} />
                <Text className="ml-1 text-xs font-bold text-black">Trade</Text>
              </Pressable>
            ) : null}
            {user ? (
              <Pressable
                {...hoverProps('mobile-deposit')}
                onPress={() => openSidePanel('deposit')}
                className="h-[38px] flex-row items-center justify-center rounded-md px-2 border"
                style={[
                  {
                    backgroundColor: darkMode ? '#143a22' : '#e6f7ed',
                    borderColor: colors.success,
                    cursor: 'pointer',
                  },
                  hoveredAction === 'mobile-deposit'
                    ? {
                        shadowColor: colors.success,
                        shadowOpacity: darkMode ? 0.35 : 0.2,
                        shadowRadius: 5,
                        shadowOffset: { width: 0, height: 1.5 },
                        transform: [{ translateY: -1 }],
                        elevation: 1.5,
                      }
                    : null
                ]}
              >
                <ArrowUp color={colors.success} size={13} strokeWidth={2.5} />
                <Text className="ml-1 text-xs font-bold text-success" style={{ color: colors.success }}>Deposit</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : (
        <View className="mb-3 flex-row items-center justify-between lg:mb-0">
          <Pressable onPress={() => router.push('/')} style={{ cursor: 'pointer' }}>
            <NovaLogo dark={darkMode} width={170} height={44} />
          </Pressable>
        </View>
      )}
      {!mobile && (
        <>
          <View className="h-[64px] w-px" style={{ backgroundColor: desktopDivider }} />
          <View className="h-[64px] w-[280px] flex-row items-center justify-between px-6">
            <View>
              <Text className="text-base font-black" numberOfLines={1} style={{ color: desktopText }}>{currentSymbol?.symbol || 'BTC/USD'}</Text>
              <View className="mt-2 flex-row items-center">
                <Text className="text-base font-black" style={{ color: desktopText }}>{quote(symbolPrice, Number(currentSymbol?.decimals ?? 2))}</Text>
                <Text className="ml-5 text-base font-black" style={{ color: symbolChange < 0 ? colors.danger : colors.success }}>{percent(symbolChange)}</Text>
              </View>
            </View>
            <Svg width={92} height={42} viewBox="0 0 114 42">
              <Polyline points={sparklinePoints} fill="none" stroke={symbolChange < 0 ? colors.danger : colors.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View className="h-[64px] w-px" style={{ backgroundColor: desktopDivider }} />
        </>
      )}
      {mobile ? (
        <ScrollView ref={metricsScrollRef} horizontal showsHorizontalScrollIndicator={false} className="h-[40px] flex-1 rounded-md" contentContainerStyle={{ width: `${(metrics.length / visibleMetricCount) * 100}%` }} onLayout={({ nativeEvent }) => setMetricsWidth(nativeEvent.layout.width)} style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
          {metrics.map(([label, value], index) => (
            <View key={label} className="h-full flex-1 justify-center px-2" style={{ borderColor: 'rgba(132, 142, 156, .22)', borderRightWidth: index === metrics.length - 1 ? 0 : 1 }}>
              <Text className="text-[9px]" numberOfLines={1} style={{ color: colors.muted }}>{label}</Text>
              <Text className="text-[11px] font-semibold" numberOfLines={1} style={{ color: label === 'Net Profit' && summary.openProfit < 0 ? colors.danger : colors.text }}>{value}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View className="h-[64px] flex-1 flex-row items-center justify-around px-3">
          {desktopMetrics.map(([label, value]) => (
            <View key={label} className="min-w-[82px] px-1">
              <Text className="text-xs font-semibold" numberOfLines={1} style={{ color: desktopMuted }}>{label}</Text>
              <Text className="mt-2 text-sm font-black" numberOfLines={1} style={{ color: label === 'P&L' && summary.openProfit < 0 ? colors.danger : desktopText }}>
                {label === 'P&L' && summary.openProfit > 0 ? `+${value}` : value}
              </Text>
            </View>
          ))}
        </View>
      )}
      {!mobile && user && !chartFullscreen ? (
        <View className="flex-row gap-2 items-center">
          <Pressable
            {...hoverProps('desktop-trade')}
            onPress={() => openNewOrder('BUY')}
            className="h-[42px] flex-row items-center justify-center rounded-lg px-4"
            style={[
              { backgroundColor: tradeButtonBg, cursor: 'pointer' },
              hoveredAction === 'desktop-trade'
                ? {
                    shadowColor: colors.primary,
                    shadowOpacity: darkMode ? 0.28 : 0.18,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    transform: [{ translateY: -1 }],
                    elevation: 3,
                  }
                : null
            ]}
          >
            <Plus color={colors.primary} size={18} />
            <Text className="ml-1.5 text-sm font-black" style={{ color: colors.primary }}>New Trade</Text>
          </Pressable>

          <Pressable
            {...hoverProps('desktop-deposit')}
            onPress={() => openSidePanel('deposit')}
            className="h-[42px] flex-row items-center justify-center rounded-lg border px-4"
            style={[
              {
                backgroundColor: darkMode ? '#143a22' : '#e6f7ed',
                borderColor: colors.success,
                cursor: 'pointer',
              },
              hoveredAction === 'desktop-deposit'
                ? {
                    shadowColor: colors.success,
                    shadowOpacity: darkMode ? 0.35 : 0.2,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    transform: [{ translateY: -1 }],
                    elevation: 3,
                  }
                : null
            ]}
          >
            <ArrowUp color={colors.success} size={16} strokeWidth={2.4} />
            <Text className="ml-1.5 text-sm font-black" style={{ color: colors.success }}>Deposit</Text>
          </Pressable>
        </View>
      ) : null}
      {!mobile && user ? (
        <Pressable
          onPress={() => setMenu(menu === 'account' ? null : 'account')}
          className="h-[52px] flex-row items-center rounded-md border px-3"
          style={{
            backgroundColor: colors.panel,
            borderColor: menu === 'account' ? colors.primary : colors.border,
            shadowColor: colors.primary,
            shadowOpacity: menu === 'account' ? (darkMode ? 0.28 : 0.18) : 0,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: menu === 'account' ? 4 : 0,
            cursor: 'pointer',
          }}
        >
          <View className="rounded-full px-2 py-1" style={{ backgroundColor: `${colors.primary}22` }}>
            <Text className="text-xs font-black" style={{ color: colors.primary }}>{selectedAccount?.type || 'Demo'}</Text>
          </View>
          <ChevronDown
            className="ml-2"
            size={15}
            color={colors.muted}
            style={{
              transform: [{ rotate: menu === 'account' ? '180deg' : '0deg' }],
            }}
          />
        </Pressable>
      ) : null}
      {!mobile && !user ? <AuthButtons /> : null}
      <Pressable {...hoverProps('theme')} onPress={toggleTheme} className="hidden h-[52px] w-[52px] items-center justify-center rounded-xl border lg:flex" style={iconButtonStyle('theme', { backgroundColor: colors.panel, borderColor: colors.border })}>
        <View style={iconHoverStyle('theme')}>{darkMode ? <Sun size={20} color={iconColor('theme')} /> : <Moon size={20} color={iconColor('theme')} />}</View>
      </Pressable>
      {user ? (
        <Pressable {...hoverProps('wallet')} onPress={openWalletMenu} className="hidden h-[52px] w-[52px] items-center justify-center rounded-xl border lg:flex" style={iconButtonStyle('wallet', { backgroundColor: colors.panel, borderColor: colors.border })}>
          <View style={iconHoverStyle('wallet')}><Wallet size={20} color={iconColor('wallet')} /></View>
        </Pressable>
      ) : null}
      {user ? (
        <Pressable {...hoverProps('profile')} onPress={() => setMenu(menu === 'profile' ? null : 'profile')} className="hidden h-[52px] w-[52px] items-center justify-center rounded-xl border lg:flex" style={iconButtonStyle('profile', { backgroundColor: colors.panel, borderColor: colors.border })}>
          <View style={iconHoverStyle('profile')}><UserRound size={20} color={iconColor('profile')} /></View>
        </Pressable>
      ) : null}
      <Modal visible={Boolean(menu)} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
        <Pressable className="flex-1" style={{ flex: 1 }} onPress={() => setMenu(null)}>
          <Pressable onPress={(event) => event.stopPropagation()}>
            {menu === 'account' ? (
              <DemoAccountMenu
                accounts={tradingAccounts}
                selectedAccount={selectedAccount}
                onSelectAccount={selectAccount}
                onClose={() => setMenu(null)}
                onOpenPanel={openSidePanel}
              />
            ) : null}
            {menu === 'wallet' ? <FundingMenu selectedAccount={selectedAccount} summary={summary} onClose={() => setMenu(null)} onSwitchAccount={() => setMenu('account')} onOpenPanel={openSidePanel} /> : null}
            {menu === 'profile' ? <ProfileMenu onClose={() => setMenu(null)} onHoverIn={cancelProfileHoverClose} onOpenPanel={openSidePanel} /> : null}
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={Boolean(sidePanel)} transparent animationType="fade" onRequestClose={() => setSidePanel(null)}>
        {sidePanel ? (
          <HeaderSidePanel
            type={sidePanel}
            selectedAccount={selectedAccount}
            summary={summary}
            onClose={() => setSidePanel(null)}
            onAccountsChanged={setAccounts}
          />
        ) : null}
      </Modal>
    </View>
  );
}

