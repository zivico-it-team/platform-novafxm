import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock3,
  Copy,
  Gift,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react-native';
import CustomButton from '../src/components/common/CustomButton';
import DepositForm from '../src/components/wallet/DepositForm';
import WithdrawForm from '../src/components/wallet/WithdrawForm';
import TransactionList from '../src/components/wallet/TransactionList';
import NotificationMenu from '../src/components/header/NotificationMenu';
import AccountSidebar from '../src/components/layout/AccountSidebar';
import { dashboardService } from '../src/services/dashboardService';
import { useAuth } from '../src/hooks/useAuth';
import { useWallet } from '../src/hooks/useWallet';
import { useNotifications } from '../src/hooks/useNotifications';
import { useAppTheme } from '../src/context/ThemeContext';
import { dateTime, money } from '../src/utils/formatters';

const DEMO_ACCOUNT_LIMIT = 2;
const LIVE_ACCOUNT_LIMIT = 3;

function Card({ title, subtitle, children, colors, className = '' }) {
  return (
    <View className={`rounded-2xl border p-5 ${className}`} style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <View className="mb-5">
        <Text className="text-xl font-extrabold" style={{ color: colors.text }}>{title}</Text>
        {subtitle ? <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function OverviewMetric({ label, value, helper, icon: Icon, tone, colors }) {
  return (
    <View className="min-w-[210px] flex-1 rounded-2xl border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-black uppercase" style={{ color: colors.muted }}>{label}</Text>
          <Text className="mt-2 text-2xl font-black" numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.text }}>{value}</Text>
          {helper ? <Text className="mt-2 text-xs" style={{ color: colors.muted }}>{helper}</Text> : null}
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${tone}22` }}>
          <Icon size={21} color={tone} />
        </View>
      </View>
    </View>
  );
}

function OverviewHero({ user, wallet, liveAccountCount, demoAccountCount, colors }) {
  const displayName = String(user?.name || user?.email || 'Trader').split(' ')[0];
  const verificationApproved = user?.verificationStatus === 'approved';
  return (
    <View className="mb-5 overflow-hidden rounded-2xl border" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <View className="p-5 md:p-6" style={{ backgroundColor: colors.mode === 'dark' ? '#111820' : '#fffaf0' }}>
        <View className="flex-row flex-wrap items-center justify-between gap-4">
          <View className="min-w-[240px] flex-1">
            <View className="mb-3 self-start rounded-full px-3 py-1" style={{ backgroundColor: `${colors.primary}26` }}>
              <Text className="text-xs font-black uppercase" style={{ color: colors.primary }}>Client overview</Text>
            </View>
            <Text className="text-3xl font-black md:text-4xl" style={{ color: colors.text }}>Welcome back, {displayName}</Text>
            <Text className="mt-2 max-w-[620px] text-sm leading-5" style={{ color: colors.muted }}>
              Track funds, accounts, rewards, and live activity from a cleaner workspace built for quick decisions.
            </Text>
          </View>
          <View className="min-w-[220px] rounded-2xl border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
            <Text className="text-xs font-black uppercase" style={{ color: colors.muted }}>Portfolio balance</Text>
            <Text className="mt-2 text-3xl font-black" numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.text }}>
              {Number(wallet.balance || 0).toFixed(2)} {wallet.currency || 'USD'}
            </Text>
            <View className="mt-4 flex-row flex-wrap gap-2">
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: verificationApproved ? `${colors.success}1f` : `${colors.primary}24` }}>
                <Text className="text-xs font-bold" style={{ color: verificationApproved ? colors.success : colors.primary }}>
                  {verificationApproved ? 'Verified' : 'Verification pending'}
                </Text>
              </View>
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: colors.surface }}>
                <Text className="text-xs font-bold" style={{ color: colors.muted }}>{liveAccountCount} live / {demoAccountCount} demo</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function InfoRow({ label, value, colors, last = false }) {
  return (
    <View className={`flex-row flex-wrap items-center justify-between gap-2 py-3 ${last ? '' : 'border-b'}`} style={{ borderColor: colors.border }}>
      <Text className="text-sm font-semibold" style={{ color: colors.muted }}>{label}</Text>
      <Text className="text-sm font-black" style={{ color: colors.text }}>{value || '-'}</Text>
    </View>
  );
}

function AccountProfileCard({ user, colors }) {
  const tradingStatus = user?.tradingStatus || 'active';
  return (
    <Card title="Account Details" subtitle="Your profile and trading access at a glance." colors={colors} className="flex-1">
      <View className="mb-4 flex-row items-center">
        <View className="mr-3 h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border" style={{ backgroundColor: `${colors.primary}22`, borderColor: colors.border }}>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <Text className="text-lg font-black" style={{ color: colors.primary }}>{initialsFor(user)}</Text>
          )}
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-lg font-black" numberOfLines={1} style={{ color: colors.text }}>{user?.name || 'Client account'}</Text>
          <Text className="mt-1 text-xs" numberOfLines={1} style={{ color: colors.muted }}>{user?.email || 'No email available'}</Text>
        </View>
      </View>
      <InfoRow label="Phone" value={user?.phone} colors={colors} />
      <InfoRow label="Trading status" value={tradingStatus} colors={colors} />
      <InfoRow label="Verification" value={user?.verificationStatus || 'pending'} colors={colors} last />
    </Card>
  );
}

function ReferralOverviewCard({ referralText, commission, copied, onCopy, colors }) {
  return (
    <Card title="Broker Referral" subtitle="Share your invite and follow commission progress." colors={colors} className="flex-1">
      <View className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text className="text-xs font-black uppercase" style={{ color: colors.muted }}>Commission earned</Text>
        <Text className="mt-2 text-2xl font-black" style={{ color: colors.text }}>{Number(commission || 0).toFixed(2)} USD</Text>
      </View>
      <View className="flex-row items-center rounded-xl border p-2" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <TextInput
          editable={false}
          value={referralText}
          className="min-w-0 flex-1 px-2 py-2"
          style={{ color: colors.text }}
        />
        <Pressable
          onPress={onCopy}
          className="h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: colors.primary }}
        >
          <Copy size={18} color="#0B0B0B" />
        </Pressable>
      </View>
      <Text className="mt-3 text-xs font-semibold" style={{ color: copied ? colors.success : colors.muted }}>
        {copied ? 'Referral URL copied.' : 'New users from this link are connected to your broker profile.'}
      </Text>
    </Card>
  );
}

function initialsFor(user) {
  const source = user?.name || user?.email || 'U';
  return String(source).trim().slice(0, 1).toUpperCase() || 'U';
}

function HeaderProfilePhoto({ user, colors }) {
  return (
    <Pressable
      onPress={() => router.push('/settings')}
      className="h-[46px] w-[46px] items-center justify-center rounded-xl border"
      style={{ backgroundColor: colors.panel, borderColor: colors.border }}
    >
      <View className="h-8 w-8 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: colors.surface }}>
        {user?.profileImage ? (
          <Image source={{ uri: user.profileImage }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <Text className="text-sm font-black" style={{ color: colors.primary }}>{initialsFor(user)}</Text>
        )}
      </View>
    </Pressable>
  );
}

function accountNumber(account) {
  return String(account?.id || '').replace(/\D/g, '').slice(-5).padStart(5, '0');
}

function AccountCard({ account, colors }) {
  const active = account.status === 'active';
  const demo = account.type === 'Demo';
  const tone = active ? '#12cf7a' : '#D4AF37';
  const openTradingAccount = () => {
    if (active) router.push(`/trading?accountId=${account.id}`);
  };

  return (
    <View className="min-w-[260px] flex-1 rounded-2xl border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <View className="mb-5 flex-row items-start justify-between">
        <View className="flex-row items-center">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: demo ? '#D4AF3722' : '#12cf7a22' }}>
            {demo ? <Wallet size={21} color="#D4AF37" /> : <ShieldCheck size={21} color="#12cf7a" />}
          </View>
          <View>
            <Text className="text-lg font-black" style={{ color: colors.text }}>{account.name}</Text>
            <Text className="mt-1 text-xs" style={{ color: colors.muted }}>Account ID : {accountNumber(account)}</Text>
          </View>
        </View>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${tone}1f` }}>
          <Text className="text-xs font-bold" style={{ color: tone }}>{account.status || 'active'}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-3">
        <View className="min-w-[130px] flex-1 rounded-xl border p-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
          <Text className="text-xs font-semibold uppercase" style={{ color: colors.muted }}>Balance</Text>
          <Text className="mt-2 text-lg font-black" style={{ color: colors.text }}>{Number(account.balance || 0).toFixed(2)} {account.currency || 'USD'}</Text>
        </View>
        <View className="min-w-[110px] rounded-xl border p-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
          <Text className="text-xs font-semibold uppercase" style={{ color: colors.muted }}>Type</Text>
          <Text className="mt-2 text-lg font-black" style={{ color: colors.text }}>{account.type}</Text>
        </View>
      </View>

      <Pressable
        onPress={openTradingAccount}
        disabled={!active}
        className={`mt-4 flex-row items-center justify-between border-t pt-4 ${active ? '' : 'opacity-70'}`}
        style={{ borderColor: colors.border }}
      >
        <View className="flex-row items-center">
          {active ? <CheckCircle2 size={16} color="#12cf7a" /> : <Clock3 size={16} color="#D4AF37" />}
          <Text className="ml-2 text-xs font-semibold" style={{ color: colors.muted }}>{active ? 'Ready for trading' : 'Waiting for activation'}</Text>
        </View>
        <ArrowUpRight size={17} color={active ? '#D4AF37' : '#8fa0bb'} />
      </Pressable>
    </View>
  );
}

function AccountGroup({ title, subtitle, accounts, emptyText, colors }) {
  return (
    <View className="rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <View className="mb-4">
        <Text className="text-lg font-black" style={{ color: colors.text }}>{title}</Text>
        <Text className="mt-1 text-xs" style={{ color: colors.muted }}>{subtitle}</Text>
      </View>
      <View className="flex-row flex-wrap gap-4">
        {accounts.map((account) => <AccountCard key={account.id} account={account} colors={colors} />)}
        {!accounts.length ? (
          <View className="w-full items-center rounded-2xl border border-dashed p-8" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
            <Plus size={26} color="#D4AF37" />
            <Text className="mt-3 text-lg font-black" style={{ color: colors.text }}>{emptyText}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function EmptyActivity({ title, description, colors }) {
  return (
    <View className="rounded-xl border border-dashed p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <Text className="font-bold" style={{ color: colors.text }}>{title}</Text>
      <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{description}</Text>
    </View>
  );
}

function TradeActivityList({ trades = [], colors }) {
  return (
    <View>
      {trades.length ? trades.map((trade) => {
        const profit = Number(trade.profit || 0);
        return (
          <View key={trade.id} className="mb-3 rounded-xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-bold" style={{ color: colors.text }}>{trade.side} {trade.symbol}</Text>
                <Text className="mt-1 text-xs" style={{ color: colors.muted }}>{trade.accountName || 'Live account'} | {dateTime(trade.createdAt)}</Text>
              </View>
              <View className="items-end">
                <Text className="font-semibold" style={{ color: colors.text }}>{Number(trade.lots || 0)} lots</Text>
                <Text className="mt-1 text-xs capitalize" style={{ color: trade.status === 'closed' ? colors.muted : colors.success }}>{trade.status}</Text>
              </View>
            </View>
            <View className="mt-2 flex-row flex-wrap justify-between gap-3">
              <Text className="text-xs" style={{ color: colors.muted }}>Open: {Number(trade.openPrice || 0).toFixed(5)}</Text>
              {trade.closePrice ? <Text className="text-xs" style={{ color: colors.muted }}>Close: {Number(trade.closePrice || 0).toFixed(5)}</Text> : null}
              <Text className="text-xs font-bold" style={{ color: profit < 0 ? colors.danger : colors.success }}>P/L: {money(profit)} USD</Text>
            </View>
          </View>
        );
      }) : (
        <EmptyActivity
          title="No live trades yet"
          description="Live account trades will appear here after orders are opened from a Live account."
          colors={colors}
        />
      )}
    </View>
  );
}

function LiveTransactionActivityList({ transactions = [], colors }) {
  return (
    <View>
      {transactions.length ? transactions.map((item) => (
        <View key={item.id} className="mb-3 flex-row items-center justify-between rounded-xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="min-w-0 flex-1">
            <Text className="capitalize font-bold" style={{ color: colors.text }}>{String(item.type || '').replace(/_/g, ' ')}</Text>
            <Text className="mt-1 text-xs" style={{ color: colors.muted }}>{dateTime(item.createdAt)}</Text>
          </View>
          <View className="items-end">
            <Text className="font-semibold" style={{ color: colors.text }}>{money(item.amount)} USD</Text>
            <Text
              className="mt-1 capitalize text-xs font-bold"
              style={{ color: ['approved', 'completed'].includes(item.status) ? colors.success : item.status === 'rejected' ? colors.danger : colors.primary }}
            >
              {item.status}
            </Text>
          </View>
        </View>
      )) : (
        <EmptyActivity
          title="No live transactions yet"
          description="Approved deposits, withdrawals, balance updates, and live trade results will appear here."
          colors={colors}
        />
      )}
    </View>
  );
}

function ActivitySelector({ active, tradesCount, transactionsCount, onChange, colors }) {
  const items = [
    { key: 'trades', label: 'Trades', count: tradesCount },
    { key: 'transactions', label: 'Transactions', count: transactionsCount },
  ];
  return (
    <View className="mb-4 flex-row rounded-xl border p-1" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      {items.map((item) => {
        const selected = active === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            className="flex-1 flex-row items-center justify-center rounded-lg px-3 py-2"
            style={{ backgroundColor: selected ? colors.primary : 'transparent' }}
          >
            <Text className="text-sm font-bold" style={{ color: selected ? '#0B0B0B' : colors.text }}>{item.label}</Text>
            <View className="ml-2 rounded-full px-2 py-0.5" style={{ backgroundColor: selected ? 'rgba(11,11,11,0.12)' : colors.panel }}>
              <Text className="text-[10px] font-black" style={{ color: selected ? '#0B0B0B' : colors.muted }}>{item.count}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function LiveActivityPanel({ activeView, onChangeView, trades, transactions, colors }) {
  return (
    <View>
      <ActivitySelector
        active={activeView}
        tradesCount={trades.length}
        transactionsCount={transactions.length}
        onChange={onChangeView}
        colors={colors}
      />
      <View className="rounded-2xl border" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          className="max-h-[440px]"
          contentContainerClassName="p-3"
        >
          {activeView === 'trades'
            ? <TradeActivityList trades={trades} colors={colors} />
            : <LiveTransactionActivityList transactions={transactions} colors={colors} />}
        </ScrollView>
      </View>
    </View>
  );
}

function CreateAccountConfirm({ type, loading, onCancel, onConfirm, colors }) {
  return (
    <Modal visible={Boolean(type)} transparent animationType="fade" onRequestClose={loading ? undefined : onCancel}>
      <View className="flex-1 items-center justify-center bg-black/70 p-5">
        <View className="w-full max-w-[420px] rounded-2xl border p-5" style={{ backgroundColor: colors.panel, borderColor: colors.primary }}>
          <Text className="text-xl font-black" style={{ color: colors.text }}>Create {type || ''} account?</Text>
          <Text className="mt-2 text-sm leading-5" style={{ color: colors.muted }}>
            Please verify this action. The {String(type || '').toLowerCase()} account will be created only after you confirm.
          </Text>
          <View className="mt-5 flex-row flex-wrap gap-3">
            <CustomButton title={loading ? 'Creating...' : 'Verify & Create'} onPress={onConfirm} loading={loading} disabled={loading} className="min-w-[170px]" />
            <CustomButton title="Cancel" variant="secondary" onPress={onCancel} disabled={loading} className="min-w-[120px]" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function DashboardScreen() {
  const params = useLocalSearchParams();
  const { user, logout, loading: authLoading, isAdmin } = useAuth();
  const { darkMode, colors, toggleTheme } = useAppTheme();
  const { deposit, withdraw, loading: walletLoading } = useWallet();
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    refresh: refreshNotifications,
    markRead,
    markAllRead,
  } = useNotifications();
  const [activeSection, setActiveSection] = useState(String(params.section || 'overview'));
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [pendingAccountType, setPendingAccountType] = useState(null);
  const [accountCreating, setAccountCreating] = useState(false);
  const [activityView, setActivityView] = useState('trades');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setDashboard(await dashboardService.getDashboard());
      setAccountError('');
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        await logout();
        router.replace('/login');
        return;
      }
      setAccountError(requestError.response?.data?.message || 'Dashboard could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) {
      router.replace('/admin');
      return;
    }
    if (!user) {
      router.replace('/login');
      return;
    }
    loadDashboard().catch(() => {});
  }, [authLoading, isAdmin, user]);

  useEffect(() => {
    if (params.section) setActiveSection(String(params.section));
  }, [params.section]);

  useEffect(() => {
    const latest = notifications[0];
    if (!latest || !['deposit', 'withdraw', 'trade', 'admin'].includes(latest.type)) return;
    loadDashboard().catch(() => {});
  }, [notifications[0]?.id]);

  const wallet = dashboard?.wallet || user?.wallet || {};
  const withdrawalLocked = Boolean(user && user.verificationStatus !== 'approved');
  const withdrawalLockedMessage = 'Verification approval is required before withdrawals.';
  const referral = dashboard?.referral || {};
  const accounts = dashboard?.accounts || [];
  const demoAccounts = accounts.filter((account) => account.type === 'Demo');
  const liveAccounts = accounts.filter((account) => account.type === 'Live');
  const demoAccountCount = demoAccounts.length;
  const liveAccountCount = liveAccounts.length;
  const transactions = dashboard?.transactions || [];
  const liveTrades = dashboard?.liveTrades || [];
  const depositTransactions = transactions.filter((item) => item.type === 'deposit');
  const referrals = referral.referrals || [];
  const referralText = useMemo(() => referral.url || '', [referral.url]);

  const askCreateAccount = (type) => {
    setAccountError('');
    setPendingAccountType(type);
  };

  const createAccount = async () => {
    const type = pendingAccountType;
    if (!type) return;
    setAccountError('');
    if (!user) {
      router.replace('/login');
      return;
    }
    setAccountCreating(true);
    try {
      await dashboardService.createAccount(type, true);
      setPendingAccountType(null);
      await loadDashboard();
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        await logout();
        router.replace('/login');
        return;
      }
      setAccountError(requestError.response?.data?.message || 'Account could not be created.');
    } finally {
      setAccountCreating(false);
    }
  };

  const copyReferral = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && referralText) {
      await navigator.clipboard.writeText(referralText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  const toggleNotifications = () => {
    if (!notificationsOpen) refreshNotifications().catch(() => {});
    setNotificationsOpen((open) => !open);
  };

  if (authLoading || !user || isAdmin) {
    return <View className="flex-1" style={{ backgroundColor: colors.background }} />;
  }

  return (
    <View className="flex-1 md:flex-row" style={{ backgroundColor: colors.background }}>
      <AccountSidebar
        activeKey={activeSection}
        onSectionChange={setActiveSection}
        wallet={wallet}
        referral={referral}
        onSignOut={signOut}
      />
      <Modal visible={notificationsOpen} transparent animationType="none" onRequestClose={() => setNotificationsOpen(false)}>
        <Pressable className="flex-1" style={{ flex: 1 }} onPress={() => setNotificationsOpen(false)}>
          <Pressable onPress={(event) => event.stopPropagation()}>
            <NotificationMenu
              notifications={notifications}
              unreadCount={unreadCount}
              loading={notificationsLoading}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onClose={() => setNotificationsOpen(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerClassName="p-5 md:p-8">
        <View className="mb-7 flex-row flex-wrap items-center justify-between gap-3">
          <View>
            <Text className="text-3xl font-extrabold" style={{ color: colors.text }}>
              {activeSection === 'overview' ? 'Dashboard' : activeSection === 'accounts' ? 'Trading Accounts' : activeSection === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
            </Text>
            <Text className="mt-2" style={{ color: colors.muted }}>Manage accounts, funds, verification and rewards.</Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            <HeaderProfilePhoto user={dashboard?.user || user} colors={colors} />
            <Pressable onPress={toggleNotifications} className="relative h-[46px] w-[46px] items-center justify-center rounded-xl border" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
              <Bell size={20} color={colors.text} />
              {unreadCount > 0 ? (
                <View className="absolute -right-1 -top-1 min-w-[18px] items-center justify-center rounded-full px-1" style={{ height: 18, backgroundColor: colors.danger }}>
                  <Text className="text-[10px] font-black text-white">{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={toggleTheme}
              accessibilityLabel={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              className="h-[46px] w-[46px] items-center justify-center rounded-xl border"
              style={{ backgroundColor: colors.panel, borderColor: colors.border }}
            >
              {darkMode ? <Sun size={20} color={colors.primary} /> : <Moon size={20} color={colors.primary} />}
            </Pressable>
            <Pressable onPress={() => router.push('/trading')} className="rounded-xl border px-4 py-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
              <Text className="font-bold" style={{ color: '#D4AF37' }}>Back to Trading</Text>
            </Pressable>
            <Pressable onPress={signOut} className="rounded-xl border px-4 py-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
              <Text className="font-bold text-danger">Sign Out</Text>
            </Pressable>
          </View>
        </View>

        {activeSection === 'overview' ? (
          <>
            <OverviewHero
              user={dashboard?.user || user}
              wallet={wallet}
              liveAccountCount={liveAccountCount}
              demoAccountCount={demoAccountCount}
              colors={colors}
            />
            <View className="mb-5 flex-row flex-wrap gap-3">
              <OverviewMetric label="Balance" value={`${Number(wallet.balance || 0).toFixed(2)} ${wallet.currency || 'USD'}`} helper="Total wallet value" icon={Wallet} tone={colors.primary} colors={colors} />
              <OverviewMetric label="Equity" value={`${Number(wallet.equity || wallet.balance || 0).toFixed(2)} ${wallet.currency || 'USD'}`} helper="Balance plus open P/L" icon={TrendingUp} tone={colors.success} colors={colors} />
              <OverviewMetric label="Free funds" value={`${Number(wallet.freeFunds || 0).toFixed(2)} ${wallet.currency || 'USD'}`} helper="Available for trading" icon={Zap} tone="#38bdf8" colors={colors} />
              <OverviewMetric label="Referral" value={`${Number(referral.commission || 0).toFixed(2)} USD`} helper={`${referrals.length} invited clients`} icon={Gift} tone="#a78bfa" colors={colors} />
            </View>
          </>
        ) : null}

      {activeSection === 'overview' ? (
        <View className="gap-4">
          <View className="gap-4 lg:flex-row">
            <View className="flex-1">
            <AccountProfileCard user={dashboard?.user || user} colors={colors} />
            </View>
            <View className="flex-1">
            <ReferralOverviewCard
              referralText={referralText}
              commission={referral.commission}
              copied={copied}
              onCopy={copyReferral}
              colors={colors}
            />
            </View>
          </View>
          <View>
            <Card title="Live Account Activity" subtitle="Recent trades and wallet movements in one scrollable feed." colors={colors}>
              <LiveActivityPanel
                activeView={activityView}
                onChangeView={setActivityView}
                trades={liveTrades}
                transactions={transactions}
                colors={colors}
              />
            </Card>
          </View>
        </View>
      ) : null}

      {activeSection === 'accounts' ? (
        <Card title="Demo and Live Accounts" subtitle="Create, review, and manage all trading accounts from one clean workspace." colors={colors}>
          <View className="mb-5 flex-row flex-wrap items-center justify-between gap-3 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <View>
              <Text className="text-sm font-bold" style={{ color: colors.text }}>Account slots</Text>
              <Text className="mt-1 text-xs" style={{ color: colors.muted }}>Demo {demoAccountCount}/{DEMO_ACCOUNT_LIMIT} | Live {liveAccountCount}/{LIVE_ACCOUNT_LIMIT}</Text>
            </View>
            <View className="flex-row flex-wrap gap-3">
              <CustomButton title="Create Demo Account" onPress={() => askCreateAccount('Demo')} disabled={demoAccountCount >= DEMO_ACCOUNT_LIMIT || accountCreating} className="min-w-[210px]" />
              <CustomButton title="Create Live Account" onPress={() => askCreateAccount('Live')} disabled={liveAccountCount >= LIVE_ACCOUNT_LIMIT || accountCreating} variant="secondary" className="min-w-[210px]" />
            </View>
          </View>
          {accountError ? <Text className="mb-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-danger">{accountError}</Text> : null}
          <View className="gap-4">
            <AccountGroup
              title="Demo Accounts"
              subtitle={`${demoAccountCount}/${DEMO_ACCOUNT_LIMIT} demo account slots used`}
              accounts={demoAccounts}
              emptyText={loading ? 'Loading demo accounts...' : 'No demo accounts yet'}
              colors={colors}
            />
            <AccountGroup
              title="Live Accounts"
              subtitle={`${liveAccountCount}/${LIVE_ACCOUNT_LIMIT} live account slots used`}
              accounts={liveAccounts}
              emptyText={loading ? 'Loading live accounts...' : 'No live accounts yet'}
              colors={colors}
            />
          </View>
        </Card>
      ) : null}

      <CreateAccountConfirm
        type={pendingAccountType}
        loading={accountCreating}
        onCancel={() => setPendingAccountType(null)}
        onConfirm={createAccount}
        colors={colors}
      />

      {activeSection === 'deposit' ? (
        <Card title="Deposit" subtitle="Submit a funding request with your payment reference." colors={colors}>
          <DepositForm onSubmit={(values) => deposit(values, Boolean(user)).then(loadDashboard)} loading={walletLoading} />
          <TransactionList transactions={depositTransactions} title="Deposit History" />
        </Card>
      ) : null}

      {activeSection === 'withdraw' ? (
        <Card title="Withdraw Funds" colors={colors}>
          <WithdrawForm
            onSubmit={(values) => withdraw(values, Boolean(user)).then(loadDashboard)}
            loading={walletLoading}
            disabled={withdrawalLocked}
            disabledMessage={withdrawalLockedMessage}
            summary={wallet}
            transactions={transactions}
          />
        </Card>
      ) : null}

      </ScrollView>
    </View>
  );
}
