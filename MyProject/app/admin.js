import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Alert, DeviceEventEmitter, Image, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import {
  Activity,
  ArrowRight,
  Bell,
  CircleDollarSign,
  Clock3,
  LogOut,
  Moon,
  RefreshCw,
  ShieldAlert,
  Sun,
  UsersRound,
} from 'lucide-react-native';
import api from '../src/services/api';
import CustomButton from '../src/components/common/CustomButton';
import AdminSidebar from '../src/components/admin/AdminSidebar';
import AdminUsersTable from '../src/components/admin/AdminUsersTable';
import UserManagement from '../src/components/admin/UserManagement';
import UpdateBalanceModal from '../src/components/admin/UpdateBalanceModal';
import UserWalletDetails from '../src/components/admin/UserWalletDetails';
import UserTransactionsModal from '../src/components/admin/UserTransactionsModal';
import UserSettingsModal from '../src/components/admin/UserSettingsModal';
import NotificationMenu from '../src/components/header/NotificationMenu';
import { useAuth } from '../src/hooks/useAuth';
import { useNotifications } from '../src/hooks/useNotifications';
import { useAppTheme } from '../src/context/ThemeContext';
import { dateTime, money } from '../src/utils/formatters';

const empty = { users: [], deposits: [], withdrawals: [], bankAccounts: [], trades: [], stats: {} };

const payoutTypeFor = (item) => (
  String(`${item?.bankName || ''} ${item?.branchName || ''}`).toLowerCase().includes('trc20') ? 'TRC20' : 'Bank'
);

const payoutFieldsFor = (item) => {
  const payoutType = payoutTypeFor(item);
  if (payoutType === 'TRC20') {
    return [
      ['Wallet Holder', item.accountHolderName],
      ['Network', item.bankName || 'USDT TRC20'],
      ['Token Standard', item.branchName || 'TRC20'],
      ['Wallet Address', item.accountNumber],
    ];
  }
  return [
    ['Account Holder', item.accountHolderName],
    ['Bank Name', item.bankName],
    ['Branch', item.branchName || '-'],
    ['Account Number', item.accountNumber],
  ];
};

function ask(message, onConfirm) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm(message)) onConfirm();
    return;
  }
  Alert.alert('Confirm admin action', message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', style: 'destructive', onPress: onConfirm }]);
}

function StatCard({ title, value, accent, helper, icon: Icon }) {
  const { colors } = useAppTheme();
  const valueColor = accent === 'text-danger' ? colors.danger : accent === 'text-success' ? colors.success : accent === 'text-primary' ? colors.primary : colors.text;

  return (
    <View className="min-w-[190px] flex-1 rounded-2xl border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-black uppercase" style={{ color: colors.muted }}>{title}</Text>
          <Text className="mt-2 text-2xl font-black" numberOfLines={1} adjustsFontSizeToFit style={{ color: valueColor }}>{value}</Text>
          <Text className="mt-2 text-xs" style={{ color: colors.muted }}>{helper}</Text>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${valueColor}20` }}>
          <Icon size={21} color={valueColor} />
        </View>
      </View>
    </View>
  );
}

function ReviewQueueRow({ icon: Icon, title, description, count, tone, onPress }) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} className="mb-3 flex-row items-center rounded-xl border p-3.5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${tone}20` }}>
        <Icon size={19} color={tone} />
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <Text className="font-extrabold" style={{ color: colors.text }}>{title}</Text>
        <Text className="mt-0.5 text-xs" numberOfLines={1} style={{ color: colors.muted }}>{description}</Text>
      </View>
      <View className="ml-3 min-w-[32px] items-center rounded-full px-2 py-1" style={{ backgroundColor: `${tone}20` }}>
        <Text className="text-xs font-black" style={{ color: tone }}>{count}</Text>
      </View>
      <ArrowRight size={17} color={colors.muted} style={{ marginLeft: 8 }} />
    </Pressable>
  );
}

function EmptyRow({ children }) {
  const { colors } = useAppTheme();

  return <Text className="rounded-xl p-5" style={{ backgroundColor: colors.surface, color: colors.muted }}>{children}</Text>;
}

export default function AdminScreen() {
  const { isAdmin, logout } = useAuth();
  const { darkMode, colors, toggleTheme } = useAppTheme();
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    refresh: refreshNotifications,
    markRead,
    markAllRead,
  } = useNotifications();
  const router = useRouter();
  const [section, setSection] = useState('overview');
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [balanceModal, setBalanceModal] = useState(null);
  const [settingsUser, setSettingsUser] = useState(null);
  const [walletModal, setWalletModal] = useState(null);
  const [transactionsModal, setTransactionsModal] = useState(null);
  const [verificationUser, setVerificationUser] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [depositDetails, setDepositDetails] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [users, deposits, withdrawals, bankAccounts, trades] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/deposits'),
        api.get('/admin/withdrawals'),
        api.get('/admin/bank-accounts'),
        api.get('/admin/trades'),
      ]);
      setData({
        users: users.data.users,
        stats: users.data.stats || {},
        deposits: deposits.data.deposits,
        withdrawals: withdrawals.data.withdrawals,
        bankAccounts: bankAccounts.data.accounts,
        trades: trades.data.trades,
      });
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load administrator dashboard.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const subscription = DeviceEventEmitter.addListener('novafxm:new-notification', () => {
      load();
    });
    return () => subscription.remove();
  }, [isAdmin, load]);

  const pendingCount = useMemo(() => (
    [...data.deposits, ...data.withdrawals].filter((item) => item.status === 'pending').length
  ), [data.deposits, data.withdrawals]);
  const bankPendingCount = useMemo(() => (
    data.bankAccounts.filter((item) => ['pending', 'delete_pending'].includes(item.status)).length
  ), [data.bankAccounts]);
  const verificationPendingCount = useMemo(() => (
    data.users.filter((item) => item.role !== 'admin' && item.verificationStatus === 'pending').length
  ), [data.users]);
  const userManagementNotificationCount = useMemo(() => (
    notifications.filter((item) => !item.isRead && item.title === 'New User Registered').length
  ), [notifications]);
  const sidebarBadgeCounts = useMemo(() => ({
    users: verificationPendingCount,
    userManagement: userManagementNotificationCount,
    funding: pendingCount,
    bankAccounts: bankPendingCount,
  }), [bankPendingCount, pendingCount, userManagementNotificationCount, verificationPendingCount]);

  const action = async (id, request, success, closeModal) => {
    setBusyId(id);
    setMessage('');
    setError('');
    try {
      await request();
      await load();
      setMessage(success);
      if (closeModal) closeModal();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'The admin action could not be completed.');
    } finally {
      setBusyId(null);
    }
  };

  const openWallet = async (user) => {
    setWalletModal({ user, loading: true, wallet: null });
    try {
      const result = await api.get(`/admin/users/${user.id}/wallet`);
      setWalletModal({ user: result.data.user, loading: false, wallet: result.data.wallet });
    } catch (requestError) {
      setWalletModal(null);
      setError(requestError.response?.data?.message || 'Unable to load wallet.');
    }
  };

  const openTransactions = async (user) => {
    setTransactionsModal({ user, loading: true, transactions: [] });
    try {
      const result = await api.get(`/admin/users/${user.id}/transactions`);
      setTransactionsModal({ user: result.data.user, loading: false, transactions: result.data.transactions });
    } catch (requestError) {
      setTransactionsModal(null);
      setError(requestError.response?.data?.message || 'Unable to load transaction history.');
    }
  };

  const updateBalance = ({ operation, amount, note }) => {
    const endpoint = operation === 'add_balance' ? 'add-balance' : 'deduct-balance';
    return action(
      balanceModal.user.id,
      () => api.put(`/admin/users/${balanceModal.user.id}/${endpoint}`, { amount, note }),
      operation === 'add_balance' ? 'Balance added successfully.' : 'Balance deducted successfully.',
      () => setBalanceModal(null),
    );
  };

  const setTrading = (user) => {
    const endpoint = user.tradingStatus === 'frozen' ? 'unfreeze' : 'freeze';
    return action(user.id, () => api.put(`/admin/users/${user.id}/${endpoint}`), endpoint === 'freeze' ? 'Trading frozen for this user.' : 'Trading restored for this user.', () => setSettingsUser(null));
  };

  const resetDemo = (user) => action(user.id, () => api.put(`/admin/users/${user.id}/reset-demo`), 'Demo account balance reset to $5,000.', () => setSettingsUser(null));

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  const toggleNotifications = () => {
    if (!notificationsOpen) refreshNotifications().catch(() => {});
    setNotificationsOpen((open) => !open);
  };

  const saveSettings = ({ leverage, adminNotes }) => action(
    settingsUser.id,
    () => Promise.all([
      api.put(`/admin/users/${settingsUser.id}/leverage`, { leverage }),
      api.put(`/admin/users/${settingsUser.id}/notes`, { adminNotes }),
    ]),
    'User account settings saved.',
    () => setSettingsUser(null),
  );

  const createManagedUser = async (values) => {
    setBusyId('create-user');
    setMessage('');
    setError('');
    try {
      await api.post('/admin/users', values);
      await load();
      setMessage('User account created.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create user account.');
      throw requestError;
    } finally {
      setBusyId(null);
    }
  };

  const updateManagedUser = async (id, values) => {
    setBusyId(id);
    setMessage('');
    setError('');
    try {
      await api.put(`/admin/users/${id}`, values);
      await load();
      setMessage('User details updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update user details.');
      throw requestError;
    } finally {
      setBusyId(null);
    }
  };

  const removeManagedUser = async (user) => {
    setBusyId(user.id);
    setMessage('');
    setError('');
    try {
      await api.delete(`/admin/users/${user.id}`);
      await load();
      setMessage('User account removed.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to remove user account.');
    } finally {
      setBusyId(null);
    }
  };

  const reviewFunding = (type, item, decision) => ask(
    `${decision === 'approve' ? 'Approve' : 'Reject'} this ${type === 'deposits' ? 'deposit' : 'withdrawal'} for $${money(item.amount)}?`,
    () => action(
      item.id,
      () => api.put(`/admin/${type}/${item.id}/${decision}`),
      `${type === 'deposits' ? 'Deposit' : 'Withdrawal'} ${decision}d.`,
      type === 'deposits' ? closeDepositDetails : undefined,
    ),
  );

  const reviewVerification = (user, decision) => ask(
    `${decision === 'approve' ? 'Verify' : 'Unverify'} this account?`,
    () => action(
      user.id,
      () => api.put(`/admin/users/${user.id}/verification/${decision}`),
      decision === 'approve' ? 'Verification approved.' : 'Verification rejected.',
      () => setVerificationUser(null),
    ),
  );
  const reviewBankAccount = (item, decision) => ask(
    `${decision === 'approve' ? 'Approve' : 'Reject'} ${item.status === 'delete_pending' ? 'this delete request' : `${payoutTypeFor(item)} withdrawal details`} for ${item.User?.name || item.User?.email || 'this user'}?`,
    () => action(
      item.id,
      () => api.put(`/admin/bank-accounts/${item.id}/${decision}`),
      item.status === 'delete_pending'
        ? `${payoutTypeFor(item)} delete request ${decision === 'approve' ? 'approved' : 'rejected'}.`
        : `${payoutTypeFor(item)} withdrawal details ${decision}d.`,
    ),
  );
  const openDepositReceipt = (item) => {
    if (!item.receiptImage) return;
    setReceiptModal(item);
  };
  const closeDepositDetails = () => setDepositDetails(null);
  const downloadDepositReceipt = (item) => {
    if (!item.receiptImage || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const link = document.createElement('a');
    link.href = item.receiptImage;
    link.download = `deposit-receipt-${item.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const downloadVerificationImages = (user) => {
  const images = [
    user?.idProofImage,
    user?.addressProofImage,
  ].filter(Boolean);

  images.forEach((url, index) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `verification-${user.id}-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
};

  if (!isAdmin) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.background }}>
        <Text className="mb-3 text-2xl font-bold" style={{ color: colors.text }}>Administrator Access</Text>
        <Text className="mb-6 text-center" style={{ color: colors.muted }}>Please login with an administrator account.</Text>
        <Link href="/login" asChild><Pressable className="rounded-xl bg-primary px-8 py-4"><Text className="font-bold text-black">Login</Text></Pressable></Link>
      </View>
    );
  }

  const renderCards = () => (
    <View className="flex-row flex-wrap gap-3">
      <StatCard title="Total Wallet Funds" value={`$${money(data.stats.totalWalletFunds)}`} helper="Funds across client wallets" icon={CircleDollarSign} accent="text-primary" />
      <StatCard title="Active Traders" value={String(data.stats.activeTraders || 0)} helper="Clients currently enabled" icon={UsersRound} accent="text-success" />
      <StatCard title="Open Positions" value={String(data.stats.totalOpenPositions || 0)} helper="Positions requiring monitoring" icon={Activity} />
      <StatCard title="Frozen Accounts" value={String(data.stats.frozenAccounts || 0)} helper="Restricted trading accounts" icon={ShieldAlert} accent="text-danger" />
    </View>
  );

  const renderFunding = () => (
    <View>
      {['deposits', 'withdrawals'].map((type) => (
        <View key={type} className="mb-7">
          <Text className="mb-4 text-xl font-bold capitalize" style={{ color: colors.text }}>{type}</Text>
          <View className="rounded-2xl border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
            {data[type].map((item) => (
              <View key={item.id} className="mb-3 flex-row flex-wrap items-center justify-between rounded-xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <View className="mb-2 mr-4">
                  <Text className="font-semibold" style={{ color: colors.text }}>{item.User?.name || item.User?.email || 'User'}</Text>
                  <Text className="mt-1 text-sm" style={{ color: colors.muted }}>${money(item.amount)} | {item.status} | {dateTime(item.createdAt)}</Text>
                </View>
                <View className="flex-row flex-wrap items-center">
                  {type === 'deposits' ? (
                    <Pressable
                      onPress={() => setDepositDetails(item)}
                      className="mb-2 mr-2 min-h-[38px] justify-center rounded-lg border border-primary/50 bg-primary/10 px-4"
                    >
                      <Text className="text-xs font-bold text-primary">View Details</Text>
                    </Pressable>
                  ) : null}
                  {item.status === 'pending' ? (
                    <>
                    <Pressable
                      disabled={busyId === item.id}
                      onPress={() => reviewFunding(type, item, 'approve')}
                      className={`mr-2 min-h-[38px] justify-center rounded-lg border px-4 ${busyId === item.id ? 'opacity-50' : ''}`}
                      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                    >
                      <Text className="text-xs font-bold" style={{ color: colors.text }}>Approve</Text>
                    </Pressable>
                    <Pressable
                      disabled={busyId === item.id}
                      onPress={() => reviewFunding(type, item, 'reject')}
                      className={`min-h-[38px] justify-center rounded-lg border border-danger/70 bg-danger/10 px-4 ${busyId === item.id ? 'opacity-50' : ''}`}
                    >
                      <Text className="text-xs font-bold text-danger">Reject</Text>
                    </Pressable>
                    </>
                  ) : null}
                </View>
              </View>
            ))}
            {!data[type].length ? <EmptyRow>No {type} requests found.</EmptyRow> : null}
          </View>
        </View>
      ))}
    </View>
  );
  
  const renderBankAccounts = () => (
    <View className="rounded-2xl border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      {data.bankAccounts.map((item) => (
        <View key={item.id} className="mb-3 rounded-xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="flex-row flex-wrap items-start justify-between gap-3">
            <View className="flex-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="font-semibold" style={{ color: colors.text }}>{item.User?.name || item.User?.email || 'User'}</Text>
                <Text className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{payoutTypeFor(item)}</Text>
              </View>
              <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{item.User?.email || '-'} | {item.status} | {dateTime(item.createdAt)}</Text>
              {item.status === 'delete_pending' ? (
                <Text className="mt-2 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm font-bold text-danger">User requested deletion for this {payoutTypeFor(item)} withdrawal detail.</Text>
              ) : null}
              <View className="mt-4 flex-row flex-wrap gap-3">
                {payoutFieldsFor(item).map(([label, value]) => (
                  <View key={label} className="min-w-[180px] flex-1 rounded-xl border p-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                    <Text className="text-xs font-bold uppercase" style={{ color: colors.muted }}>{label}</Text>
                    <Text className="mt-1 text-sm font-semibold" style={{ color: colors.text }}>{value || '-'}</Text>
                  </View>
                ))}
              </View>
            </View>
            {['pending', 'delete_pending'].includes(item.status) ? (
              <View className="flex-row">
                <Pressable
                  disabled={busyId === item.id}
                  onPress={() => reviewBankAccount(item, 'approve')}
                  className={`mr-2 min-h-[38px] justify-center rounded-lg border px-4 ${busyId === item.id ? 'opacity-50' : ''}`}
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                  <Text className="text-xs font-bold" style={{ color: colors.text }}>{item.status === 'delete_pending' ? 'Approve Delete' : 'Approve'}</Text>
                </Pressable>
                <Pressable
                  disabled={busyId === item.id}
                  onPress={() => reviewBankAccount(item, 'reject')}
                  className={`min-h-[38px] justify-center rounded-lg border border-danger/70 bg-danger/10 px-4 ${busyId === item.id ? 'opacity-50' : ''}`}
                >
                  <Text className="text-xs font-bold text-danger">{item.status === 'delete_pending' ? 'Reject Delete' : 'Reject'}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      ))}
      {!data.bankAccounts.length ? <EmptyRow>No bank or TRC20 withdrawal details submitted.</EmptyRow> : null}
    </View>
  );


  const renderTrades = () => (
    <View className="overflow-hidden rounded-2xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <ScrollView horizontal contentContainerStyle={{ minWidth: '100%' }}>
        <View style={{ minWidth: 800, flexGrow: 1 }}>
          <View className="flex-row border-b p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            {['Client', 'Symbol', 'Side', 'Lots', 'Status', 'Profit / Loss', 'Created'].map((heading) => (
              <Text key={heading} className="text-xs font-bold uppercase" style={{ width: heading === 'Created' ? 150 : 115, flexGrow: 1, color: colors.muted }}>{heading}</Text>
            ))}
          </View>
          {data.trades.map((trade) => (
            <View key={trade.id} className="flex-row border-b p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className="text-sm" style={{ width: 115, flexGrow: 1, color: colors.text }}>{trade.User?.name || '-'}</Text>
              <Text className="text-sm" style={{ width: 115, flexGrow: 1, color: colors.text }}>{trade.symbol}</Text>
              <Text className={`text-sm font-bold ${trade.side === 'BUY' ? 'text-success' : 'text-danger'}`} style={{ width: 115, flexGrow: 1 }}>{trade.side}</Text>
              <Text className="text-sm" style={{ width: 115, flexGrow: 1, color: colors.text }}>{trade.lots}</Text>
              <Text className="text-sm" style={{ width: 115, flexGrow: 1, color: colors.text }}>{trade.status}</Text>
              <Text className={`text-sm ${Number(trade.profit) < 0 ? 'text-danger' : 'text-success'}`} style={{ width: 115, flexGrow: 1 }}>${money(trade.profit)}</Text>
              <Text className="text-sm" style={{ width: 150, flexGrow: 1, color: colors.muted }}>{dateTime(trade.createdAt)}</Text>
            </View>
          ))}
          {!data.trades.length ? <Text className="p-8" style={{ color: colors.muted }}>No trades found.</Text> : null}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View className="flex-1 md:flex-row" style={{ backgroundColor: colors.background }}>
      <AdminSidebar section={section} onChange={setSection} stats={data.stats} badgeCounts={sidebarBadgeCounts} onSignOut={signOut} />
      <ScrollView className="flex-1" contentContainerClassName="px-3 py-4 sm:p-5 md:p-8" style={{ backgroundColor: colors.background }}>
        <View className="mb-7 flex-row flex-wrap items-center justify-between gap-3">
          <View className="min-w-[220px] flex-1">

            <Text className="text-3xl font-bold" style={{ color: colors.text }}>{section === 'overview' ? 'Dashboard' : section === 'users' ? 'User Wallet Management' : section === 'funding' ? 'Funding Requests' : section === 'bankAccounts' ? 'Withdrawal Detail Approvals' : 'Trade Monitor'}</Text>
            <Text className="mt-2" style={{ color: colors.muted }}>Manage client balances, trading access and financial operations.</Text>
          </View>
          <View className="flex-row flex-wrap items-center gap-2">
            <Pressable onPress={toggleNotifications} className="relative rounded-xl border p-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
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
            <Pressable onPress={load} className="rounded-xl border p-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
              <RefreshCw size={20} color={loading ? '#27a8e9' : colors.muted} />
            </Pressable>
            <Pressable onPress={signOut} className="rounded-xl border p-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
              <LogOut size={20} color={colors.danger} />
            </Pressable>
          </View>
        </View>
        {message ? <Text className="mb-5 rounded-xl border border-success/40 bg-success/10 p-4 text-success">{message}</Text> : null}
        {error ? <Text className="mb-5 rounded-xl border border-danger/40 bg-danger/10 p-4 text-danger">{error}</Text> : null}
        {section === 'overview' ? (
          <View>
            <View className="mb-5 overflow-hidden rounded-2xl border" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
              <View className="p-5 md:p-6" style={{ backgroundColor: darkMode ? '#111820' : '#fffaf0' }}>
                <View className="flex-row flex-wrap items-center justify-between gap-4">
                  <View className="min-w-[240px] flex-1">
                    <View className="mb-3 self-start rounded-full px-3 py-1" style={{ backgroundColor: `${colors.primary}26` }}>
                      <Text className="text-xs font-black uppercase" style={{ color: colors.primary }}>Admin command center</Text>
                    </View>
                    <Text className="text-3xl font-black md:text-4xl" style={{ color: colors.text }}>Operations overview</Text>
                    <Text className="mt-2 max-w-[620px] text-sm leading-5" style={{ color: colors.muted }}>
                      Monitor platform health, resolve client requests, and review trading activity from one workspace.
                    </Text>
                    <View className="mt-4 flex-row flex-wrap gap-2">
                      <Pressable onPress={() => setSection('users')} className="flex-row items-center rounded-lg px-3 py-2" style={{ backgroundColor: colors.primary }}>
                        <UsersRound size={16} color="#0B0B0B" />
                        <Text className="ml-2 text-xs font-black" style={{ color: '#0B0B0B' }}>Manage users</Text>
                      </Pressable>
                      <Pressable onPress={() => setSection('funding')} className="flex-row items-center rounded-lg border px-3 py-2" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                        <Clock3 size={16} color={colors.text} />
                        <Text className="ml-2 text-xs font-bold" style={{ color: colors.text }}>Review funding</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View className="min-w-[220px] rounded-2xl border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                    <Text className="text-xs font-black uppercase" style={{ color: colors.muted }}>Awaiting review</Text>
                    <Text className="mt-2 text-4xl font-black" style={{ color: colors.primary }}>{pendingCount + bankPendingCount + verificationPendingCount}</Text>
                    <Text className="mt-1 text-xs" style={{ color: colors.muted }}>items across funding, payouts, and KYC</Text>
                    <View className="mt-4 flex-row flex-wrap gap-2">
                      <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${colors.success}1f` }}><Text className="text-[10px] font-bold" style={{ color: colors.success }}>{data.stats.activeTraders || 0} active traders</Text></View>
                      <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: colors.surface }}><Text className="text-[10px] font-bold" style={{ color: colors.muted }}>{data.users.filter((item) => item.role !== 'admin').length} clients</Text></View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            {renderCards()}
            <View className="mt-5 gap-4 lg:flex-row">
              <View className="flex-1 rounded-2xl border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                <View className="mb-4">
                  <Text className="text-xl font-black" style={{ color: colors.text }}>Review queue</Text>
                  <Text className="mt-1 text-sm" style={{ color: colors.muted }}>Prioritized tasks waiting for an administrator.</Text>
                </View>
                <ReviewQueueRow icon={CircleDollarSign} title="Funding requests" description="Deposits and withdrawals" count={pendingCount} tone={colors.primary} onPress={() => setSection('funding')} />
                <ReviewQueueRow icon={ShieldAlert} title="Verification reviews" description="Client identity checks" count={verificationPendingCount} tone={colors.danger} onPress={() => setSection('users')} />
                <ReviewQueueRow icon={Clock3} title="Withdrawal details" description="Bank and TRC20 approvals" count={bankPendingCount} tone="#38bdf8" onPress={() => setSection('bankAccounts')} />
              </View>
              <View className="flex-1 rounded-2xl border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                <View className="mb-4 flex-row items-center justify-between">
                  <View>
                    <Text className="text-xl font-black" style={{ color: colors.text }}>Recent trades</Text>
                    <Text className="mt-1 text-sm" style={{ color: colors.muted }}>Latest platform activity.</Text>
                  </View>
                  <Pressable onPress={() => setSection('trades')} className="rounded-lg px-3 py-2" style={{ backgroundColor: colors.surface }}><Text className="text-xs font-bold" style={{ color: colors.primary }}>View all</Text></Pressable>
                </View>
                {data.trades.slice(0, 4).map((trade) => {
                  const profit = Number(trade.profit || 0);
                  return (
                    <View key={trade.id} className="mb-3 flex-row items-center rounded-xl border p-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                      <View className="h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: trade.side === 'BUY' ? `${colors.success}20` : `${colors.danger}20` }}>
                        <Text className="text-[10px] font-black" style={{ color: trade.side === 'BUY' ? colors.success : colors.danger }}>{trade.side}</Text>
                      </View>
                      <View className="ml-3 min-w-0 flex-1">
                        <Text className="font-extrabold" style={{ color: colors.text }}>{trade.symbol}</Text>
                        <Text className="mt-0.5 text-xs capitalize" style={{ color: colors.muted }}>{trade.status} · {Number(trade.lots || 0)} lots</Text>
                      </View>
                      <Text className="font-black" style={{ color: profit < 0 ? colors.danger : colors.success }}>{profit >= 0 ? '+' : ''}${money(profit)}</Text>
                    </View>
                  );
                })}
                {!data.trades.length ? <EmptyRow>No trading activity yet.</EmptyRow> : null}
              </View>
            </View>
          </View>
        ) : null}
        {section === 'users' ? (
          <View>
            {renderCards()}
            <AdminUsersTable
              users={data.users}
              busyId={busyId}
              onBalance={(user, operation) => setBalanceModal({ user, operation })}
              onStatus={setTrading}
              onReset={resetDemo}
              onWallet={openWallet}
              onTransactions={openTransactions}
              onVerification={setVerificationUser}
              onVerificationDecision={reviewVerification}
              onSettings={setSettingsUser}
            />
          </View>
        ) : null}
        {section === 'userManagement' ? (
          <UserManagement
            users={data.users}
            loading={loading}
            busyId={busyId}
            onCreate={createManagedUser}
            onUpdate={updateManagedUser}
            onRemove={removeManagedUser}
          />
        ) : null}
        {section === 'funding' ? renderFunding() : null}
        {section === 'bankAccounts' ? renderBankAccounts() : null}
        {section === 'trades' ? renderTrades() : null}
      </ScrollView>
      <UpdateBalanceModal user={balanceModal?.user} initialOperation={balanceModal?.operation} loading={busyId === balanceModal?.user?.id} onClose={() => setBalanceModal(null)} onConfirm={updateBalance} />
      <UserSettingsModal user={settingsUser} loading={busyId === settingsUser?.id} onClose={() => setSettingsUser(null)} onSave={saveSettings} onStatus={() => setTrading(settingsUser)} onReset={() => resetDemo(settingsUser)} />
      <UserWalletDetails user={walletModal?.user} wallet={walletModal?.wallet} loading={walletModal?.loading} onClose={() => setWalletModal(null)} />
      <UserTransactionsModal user={transactionsModal?.user} transactions={transactionsModal?.transactions || []} loading={transactionsModal?.loading} onClose={() => setTransactionsModal(null)} />
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
      {depositDetails ? (
        <View className="absolute inset-0 z-50 items-center justify-center bg-black/70 p-4">
          <View className="max-h-[92vh] w-full max-w-[900px] rounded-2xl border p-5" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold" style={{ color: colors.text }}>Deposit Details</Text>
                <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{depositDetails.User?.name || depositDetails.User?.email || 'User'} | {dateTime(depositDetails.createdAt)}</Text>
              </View>
              <Pressable onPress={closeDepositDetails}><Text style={{ color: colors.muted }}>Close</Text></Pressable>
            </View>
            <ScrollView>
              <View className="gap-4 lg:flex-row">
                <View className="flex-1 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <Text className="mb-4 text-sm font-bold uppercase" style={{ color: colors.muted }}>Request Info</Text>
                  {[
                    ['Client', depositDetails.User?.name || depositDetails.User?.email || '-'],
                    ['Email', depositDetails.User?.email || '-'],
                    ['Amount', `$${money(depositDetails.amount)}`],
                    ['Payment Method', depositDetails.paymentMethod || '-'],
                    ['Status', depositDetails.status || '-'],
                    ['Submitted', dateTime(depositDetails.createdAt)],
                    ['Note', depositDetails.note || '-'],
                  ].map(([label, value]) => (
                    <View key={label} className="mb-3 rounded-xl border p-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                      <Text className="text-xs font-bold uppercase" style={{ color: colors.muted }}>{label}</Text>
                      <Text className="mt-1 text-sm font-semibold" style={{ color: colors.text }}>{value}</Text>
                    </View>
                  ))}
                </View>
                <View className="flex-1 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <Text className="mb-4 text-sm font-bold uppercase" style={{ color: colors.muted }}>Receipt</Text>
                  {depositDetails.receiptImage ? (
                    <>
                      <Image source={{ uri: depositDetails.receiptImage }} className="h-[360px] w-full rounded-xl bg-black" resizeMode="contain" />
                      <View className="mt-4 flex-row flex-wrap justify-end gap-2">
                        <CustomButton title="Download Receipt" variant="success" className="min-w-[170px]" onPress={() => downloadDepositReceipt(depositDetails)} />
                      </View>
                    </>
                  ) : (
                    <Text className="rounded-xl p-6" style={{ backgroundColor: colors.panel, color: colors.muted }}>No receipt uploaded.</Text>
                  )}
                </View>
              </View>
              {depositDetails.status === 'pending' ? (
                <View className="mt-5 flex-row justify-end">
                  <Pressable
                    disabled={busyId === depositDetails.id}
                    onPress={() => reviewFunding('deposits', depositDetails, 'approve')}
                    className={`mr-2 min-h-[42px] justify-center rounded-lg border px-5 ${busyId === depositDetails.id ? 'opacity-50' : ''}`}
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  >
                    <Text className="text-xs font-bold" style={{ color: colors.text }}>Approve</Text>
                  </Pressable>
                  <Pressable
                    disabled={busyId === depositDetails.id}
                    onPress={() => reviewFunding('deposits', depositDetails, 'reject')}
                    className={`min-h-[42px] justify-center rounded-lg border border-danger/70 bg-danger/10 px-5 ${busyId === depositDetails.id ? 'opacity-50' : ''}`}
                  >
                    <Text className="text-xs font-bold text-danger">Reject</Text>
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      ) : null}
      {receiptModal ? (
        <View className="absolute inset-0 z-50 items-center justify-center bg-black/70 p-4">
          <View className="max-h-[92vh] w-full max-w-[760px] rounded-2xl border p-5" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
            <View className="mb-4 flex-row items-center justify-between">
              <View>

                <Text className="text-2xl font-bold" style={{ color: colors.text }}>Deposit Receipt</Text>
                <Text className="mt-1 text-sm" style={{ color: colors.muted }}>${money(receiptModal.amount)} | {receiptModal.referenceNumber || 'No reference'}</Text>
              </View>
              <Pressable onPress={() => setReceiptModal(null)}><Text style={{ color: colors.muted }}>Close</Text></Pressable>
            </View>
            <View className="rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className="mb-3 text-sm font-bold uppercase" style={{ color: colors.muted }}>Receipt Preview</Text>
              <Image source={{ uri: receiptModal.receiptImage }} className="h-[520px] w-full rounded-xl bg-black" resizeMode="contain" />
            </View>
            <View className="mt-4 flex-row justify-end">
              <CustomButton title="Download Receipt" variant="success" className="min-w-[170px]" onPress={() => downloadDepositReceipt(receiptModal)} />
            </View>
          </View>
        </View>
      ) : null}
      {verificationUser ? (
        <View className="absolute inset-0 z-50 items-center justify-center bg-black/70 p-4">
          <View className="max-h-[92vh] w-full max-w-[980px] rounded-2xl border p-5" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold" style={{ color: colors.text }}>Verification Documents</Text>
              </View>
              <Pressable onPress={() => setVerificationUser(null)}><Text style={{ color: colors.muted }}>Close</Text></Pressable>
            </View>
            <ScrollView>
              
              <View className="gap-4 lg:flex-row">
                {[
                  ['ID Proof', verificationUser.idProofImage],
                  ['Address Proof', verificationUser.addressProofImage],
                ].map(([title, source]) => (
                  <View key={title} className="flex-1 rounded-xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <Text className="mb-3 font-bold" style={{ color: colors.text }}>{title}</Text>
                    {source ? (
                      <Image source={{ uri: source }} className="h-[320px] w-full rounded-lg bg-black" resizeMode="contain" />
                    ) : (
                      <Text className="rounded-lg p-6" style={{ backgroundColor: colors.panel, color: colors.muted }}>No image uploaded.</Text>
                    )}
                  </View>
                ))}
              </View>
              <View className="mt-5 flex-row justify-end">
                
                <CustomButton
  title="Download"
  variant="success"
  className="min-w-[130px]"
  onPress={() => downloadVerificationImages(verificationUser)}
/>
              </View>
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}
