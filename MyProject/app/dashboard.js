import { useEffect, useMemo, useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Award, CheckCircle2, Copy, RefreshCcw, TrendingUp, UsersRound } from 'lucide-react-native';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import CustomButton from '../src/components/common/CustomButton';
import DepositForm from '../src/components/wallet/DepositForm';
import WithdrawForm from '../src/components/wallet/WithdrawForm';
import TransactionList from '../src/components/wallet/TransactionList';
import { dashboardService } from '../src/services/dashboardService';
import { useAuth } from '../src/hooks/useAuth';
import { useWallet } from '../src/hooks/useWallet';
import { useAppTheme } from '../src/context/ThemeContext';

function Card({ title, children }) {
  return (
    <View className="rounded-2xl border border-border bg-panel p-5">
      <Text className="mb-4 text-lg font-extrabold text-white">{title}</Text>
      {children}
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View className="min-w-[150px] flex-1 rounded-xl border border-border bg-surface p-4">
      <Text className="text-xs font-semibold uppercase text-muted">{label}</Text>
      <Text className="mt-2 text-xl font-extrabold text-white">{value}</Text>
    </View>
  );
}

function RewardMetric({ label, value, caption, icon: Icon, tone = 'primary' }) {
  const toneClasses = {
    primary: 'border-primary/50 bg-primary/10',
    success: 'border-success/40 bg-success/10',
    muted: 'border-border bg-surface',
  };
  const iconColors = {
    primary: '#D4AF37',
    success: '#12cf7a',
    muted: '#848e9c',
  };

  return (
    <View className={`min-w-[190px] flex-1 rounded-xl border p-4 ${toneClasses[tone] || toneClasses.muted}`}>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xs font-bold uppercase tracking-[1px] text-muted">{label}</Text>
        {Icon ? <Icon size={18} color={iconColors[tone] || iconColors.muted} /> : null}
      </View>
      <Text className="text-xl font-black text-white">{value}</Text>
      {caption ? <Text className="mt-1 text-xs text-muted">{caption}</Text> : null}
    </View>
  );
}

function RewardProgress({ approved, pending }) {
  const total = approved + pending;
  const approvedPercent = total ? Math.min(100, Math.round((approved / total) * 100)) : 0;

  return (
    <View className="rounded-xl border border-border bg-surface p-4">
      <View className="mb-4 flex-row flex-wrap items-start justify-between gap-3">
        <View>
          <Text className="text-xs font-bold uppercase tracking-[1px] text-muted">Deposit Approval Flow</Text>
          <Text className="mt-1 text-base font-black text-white">{approvedPercent}% approved volume</Text>
        </View>
        <Text className="rounded-full bg-panel px-3 py-1 text-xs font-bold text-primary">{total.toFixed(2)} USD tracked</Text>
      </View>
      <View className="h-3 overflow-hidden rounded-full bg-panel">
        <View className="h-full rounded-full bg-success" style={{ width: `${approvedPercent}%` }} />
      </View>
      <View className="mt-4 flex-row flex-wrap gap-3">
        <View className="min-w-[150px] flex-1 rounded-lg border border-success/30 bg-success/10 p-3">
          <Text className="text-xs font-bold uppercase text-muted">Approved</Text>
          <Text className="mt-1 text-base font-black text-success">{approved.toFixed(2)} USD</Text>
        </View>
        <View className="min-w-[150px] flex-1 rounded-lg border border-primary/30 bg-primary/10 p-3">
          <Text className="text-xs font-bold uppercase text-muted">Pending</Text>
          <Text className="mt-1 text-base font-black text-primary">{pending.toFixed(2)} USD</Text>
        </View>
      </View>
    </View>
  );
}

function ReferralStep({ number, title, description }) {
  return (
    <View className="min-w-[210px] flex-1 flex-row rounded-xl border border-border bg-surface p-4">
      <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-primary">
        <Text className="text-sm font-black text-black">{number}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-bold text-white">{title}</Text>
        <Text className="mt-1 text-sm text-muted">{description}</Text>
      </View>
    </View>
  );
}

function LinkedReferralList({ referrals }) {
  return (
    <View className="overflow-hidden rounded-xl border border-border bg-surface">
      <View className="hidden flex-row border-b border-border bg-panel px-4 py-3 md:flex">
        <Text className="flex-[1.4] text-xs font-bold uppercase text-muted">Client</Text>
        <Text className="flex-1 text-xs font-bold uppercase text-muted">Account</Text>
        <Text className="flex-1 text-xs font-bold uppercase text-muted">Joined</Text>
        <Text className="flex-1 text-right text-xs font-bold uppercase text-muted">Reward</Text>
      </View>
      {referrals.length ? referrals.map((item) => (
        <View key={item.id} className="border-b border-border px-4 py-4 last:border-b-0">
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <View className="min-w-[190px] flex-[1.4]">
              <Text className="font-bold text-white">{item.name}</Text>
              <Text className="mt-1 text-xs text-muted">{item.email}</Text>
            </View>
            <View className="min-w-[110px] flex-1">
              <Text className="mb-1 text-[10px] font-bold uppercase text-muted md:hidden">Account</Text>
              <View className="self-start rounded-full border border-primary/40 bg-primary/10 px-3 py-1">
                <Text className="text-xs font-bold text-primary">{item.accountType} Account</Text>
              </View>
            </View>
            <View className="min-w-[120px] flex-1">
              <Text className="mb-1 text-[10px] font-bold uppercase text-muted md:hidden">Joined</Text>
              <Text className="text-sm text-muted">{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View className="min-w-[140px] flex-1 items-start md:items-end">
              <Text className="mb-1 text-[10px] font-bold uppercase text-muted md:hidden">Reward</Text>
              <Text className="text-base font-black text-primary">{Number(item.commission || 0).toFixed(2)} USD</Text>
            </View>
          </View>
        </View>
      )) : (
        <View className="items-center px-4 py-10">
          <UsersRound size={28} color="#848e9c" />
          <Text className="mt-3 text-center font-bold text-white">No linked clients yet</Text>
          <Text className="mt-1 text-center text-sm text-muted">Share your referral URL to connect new registrations.</Text>
        </View>
      )}
    </View>
  );
}

const referralBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:8081';
};

export default function DashboardScreen() {
  const params = useLocalSearchParams();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useAppTheme();
  const { deposit, withdraw, loading: walletLoading } = useWallet();
  const [activeSection, setActiveSection] = useState(String(params.section || 'overview'));
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [copied, setCopied] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setDashboardError('');
    try {
      setDashboard(await dashboardService.getDashboard());
    } catch (requestError) {
      setDashboardError(requestError.response?.data?.message || requestError.message || 'Unable to load dashboard data.');
      throw requestError;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard().catch(() => {});
  }, []);

  useEffect(() => {
    if (params.section) setActiveSection(String(params.section));
  }, [params.section]);

  const wallet = dashboard?.wallet || user?.wallet || {};
  const referral = dashboard?.referral || {};
  const accounts = dashboard?.accounts || [];
  const transactions = dashboard?.transactions || [];
  const referrals = referral.referrals || [];
  const sections = [
    ['overview', 'Overview'],
    ['accounts', 'Accounts'],
    ['deposit', 'Deposit'],
    ['withdraw', 'Withdraw'],
    ['rewards', 'Broker Rewards'],
    ['settings', 'Settings'],
  ];

  const referralText = useMemo(() => {
    if (referral.url) return referral.url;
    if (!referral.code) return '';
    return `${referralBaseUrl()}/register?ref=${encodeURIComponent(referral.code)}`;
  }, [referral.code, referral.url]);
  const referralRate = Number(referral.commissionRate || 0);
  const linkedClients = Number(referral.referralCount || referrals.length || 0);
  const pendingReferralDeposits = Number(referral.pendingDeposits || 0);
  const approvedReferralDeposits = Number(referral.approvedDeposits || 0);
  const estimatedReferralCommission = Number(referral.commission || 0);
  const totalReferralVolume = pendingReferralDeposits + approvedReferralDeposits;

  const createAccount = async (type) => {
    await dashboardService.createAccount(type);
    await loadDashboard();
  };

  const copyReferral = async () => {
    if (!referralText) return;
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

  return (
    <ScrollView className="flex-1 bg-[#0B0B0B]" contentContainerClassName="p-4 lg:p-8">
      <View className="mb-6 flex-row flex-wrap items-center justify-between gap-3">
        <View>
          <Text className="text-3xl font-extrabold text-white">Account Dashboard</Text>
          <Text className="mt-1 text-muted">{user?.email || 'Manage accounts, funds, and rewards'}</Text>
        </View>
        <View className="flex-row gap-3">
          <Link href="/trading" asChild><Pressable><Text className="text-primary">Back to Trading</Text></Pressable></Link>
          <Pressable onPress={signOut}><Text className="text-danger">Sign Out</Text></Pressable>
        </View>
      </View>

      <View className="mb-5 flex-row flex-wrap gap-2">
        {sections.map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setActiveSection(key)}
            className="rounded-xl px-4 py-2"
            style={{ backgroundColor: activeSection === key ? '#00B76A' : '#181a20' }}
          >
            <Text className="font-bold" style={{ color: activeSection === key ? '#05130d' : '#9CA3AF' }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {dashboardError ? (
        <View className="mb-4 rounded-xl border border-danger/50 bg-danger/10 p-4">
          <Text className="font-bold text-danger">Dashboard data failed to load</Text>
          <Text className="mt-1 text-white">{dashboardError}</Text>
          <CustomButton title="Retry" onPress={() => loadDashboard().catch(() => {})} className="mt-3 max-w-[160px]" />
        </View>
      ) : null}

      <View className="mb-5 flex-row flex-wrap gap-3">
        <Stat label="Balance" value={`${Number(wallet.balance || 0).toFixed(2)} ${wallet.currency || 'USD'}`} />
        <Stat label="Equity" value={`${Number(wallet.equity || wallet.balance || 0).toFixed(2)} ${wallet.currency || 'USD'}`} />
        <Stat label="Free Funds" value={`${Number(wallet.freeFunds || 0).toFixed(2)} ${wallet.currency || 'USD'}`} />
        <Stat label="Linked Clients" value={String(linkedClients)} />
        <Stat label="Referral Commission" value={`${estimatedReferralCommission.toFixed(2)} USD`} />
      </View>

      {activeSection === 'overview' ? (
        <View className="gap-4 lg:flex-row">
          <View className="flex-1 gap-4">
            <Card title="Account Details">
              <Text className="text-white">Name: {dashboard?.user?.name || user?.name || '-'}</Text>
              <Text className="mt-2 text-white">Email: {dashboard?.user?.email || user?.email || '-'}</Text>
              <Text className="mt-2 text-white">Phone: {dashboard?.user?.phone || '-'}</Text>
              <Text className="mt-2 text-white">Trading Status: {dashboard?.user?.tradingStatus || 'active'}</Text>
            </Card>
            <Card title="Recent Transactions">
              <TransactionList transactions={transactions} />
            </Card>
          </View>
          <View className="flex-1">
            <Card title="Broker Referral">
              <Text className="text-muted">Share this URL. New users who register from it are linked to you.</Text>
              <Text className="mt-3 text-white">Linked Clients: {linkedClients}</Text>
              <Text className="mt-1 text-white">Pending Referral Deposits: {pendingReferralDeposits.toFixed(2)} USD</Text>
              <Text className="mt-1 text-white">Approved Referral Deposits: {approvedReferralDeposits.toFixed(2)} USD</Text>
              <TextInput
                editable={false}
                value={referralText}
                className="mt-4 rounded-xl border border-border bg-surface p-3 text-white"
              />
              <CustomButton title={copied ? 'Copied' : 'Copy Referral URL'} onPress={copyReferral} className="mt-4" />
              <Text className="mb-3 mt-6 text-lg font-bold text-white">Linked Clients</Text>
              <LinkedReferralList referrals={referrals} />
            </Card>
          </View>
        </View>
      ) : null}

      {activeSection === 'accounts' ? (
        <Card title="Demo and Live Accounts">
          <View className="mb-4 flex-row flex-wrap gap-3">
            <CustomButton title="Create Demo Account" onPress={() => createAccount('Demo')} className="min-w-[210px]" />
            <CustomButton title="Create Live Account" onPress={() => createAccount('Live')} variant="secondary" className="min-w-[210px]" />
          </View>
          <View className="gap-3">
            {accounts.map((account) => (
              <View key={account.id} className="rounded-xl border border-border bg-surface p-4">
                <Text className="text-lg font-extrabold text-white">{account.name}</Text>
                <Text className="mt-1 text-muted">{account.type} | {account.status}</Text>
                <Text className="mt-2 text-white">{Number(account.balance || 0).toFixed(2)} {account.currency}</Text>
              </View>
            ))}
            {!accounts.length && !loading ? <Text className="text-muted">No accounts yet.</Text> : null}
          </View>
        </Card>
      ) : null}

      {activeSection === 'deposit' ? (
        <Card title="Deposit Funds">
          <DepositForm onSubmit={(values) => deposit(values, Boolean(user)).then(loadDashboard)} loading={walletLoading} />
        </Card>
      ) : null}

      {activeSection === 'withdraw' ? (
        <Card title="Withdraw Funds">
          <WithdrawForm onSubmit={(values) => withdraw(values, Boolean(user)).then(loadDashboard)} loading={walletLoading} />
        </Card>
      ) : null}

      {activeSection === 'rewards' ? (
        <View className="gap-4">
          <View className="overflow-hidden rounded-2xl border border-primary/40 bg-panel">
            <View className="p-5 lg:flex-row lg:items-stretch lg:justify-between lg:gap-5">
              <View className="max-w-[720px] flex-1">
                <View className="mb-3 self-start rounded-full border border-primary/40 bg-primary/10 px-3 py-1">
                  <Text className="text-xs font-black uppercase tracking-[1px] text-primary">Broker Rewards</Text>
                </View>
                <Text className="text-2xl font-black text-white">Partner performance dashboard</Text>
                <Text className="mt-2 max-w-[620px] text-muted">Share your broker link, review connected clients, and track commission progress without leaving the dashboard.</Text>
                <View className="mt-5 flex-row flex-wrap gap-3">
                  <View className="rounded-xl border border-border bg-panel/80 px-4 py-3">
                    <Text className="text-xs font-bold uppercase text-muted">Referral Code</Text>
                    <Text className="mt-1 text-base font-black text-white">{referral.code || '-'}</Text>
                  </View>
                  <View className="rounded-xl border border-border bg-panel/80 px-4 py-3">
                    <Text className="text-xs font-bold uppercase text-muted">Tracked Volume</Text>
                    <Text className="mt-1 text-base font-black text-white">{totalReferralVolume.toFixed(2)} USD</Text>
                  </View>
                </View>
              </View>
              <View className="mt-5 justify-between rounded-xl border border-primary/40 bg-primary/10 p-5 lg:mt-0 lg:min-w-[300px]">
                <View>
                  <Text className="text-xs font-bold uppercase tracking-[1px] text-muted">Estimated Commission</Text>
                  <Text className="mt-3 text-3xl font-black text-primary">{estimatedReferralCommission.toFixed(2)}</Text>
                  <Text className="mt-1 text-sm font-bold text-primary">USD</Text>
                </View>
                <View className="mt-5 border-t border-primary/20 pt-4">
                  <Text className="text-sm text-muted">Commission rate</Text>
                  <Text className="mt-1 text-lg font-black text-white">{(referralRate * 100).toFixed(2)}%</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="gap-4 lg:flex-row">
            <View className="flex-1 gap-4">
              <View className="flex-row flex-wrap gap-3">
                <RewardMetric label="Linked Clients" value={String(linkedClients)} caption="Accounts registered through your link" icon={UsersRound} tone="success" />
                <RewardMetric label="Pending Deposits" value={`${pendingReferralDeposits.toFixed(2)} USD`} caption="Waiting for funding approval" icon={TrendingUp} />
                <RewardMetric label="Approved Deposits" value={`${approvedReferralDeposits.toFixed(2)} USD`} caption="Confirmed referral volume" icon={Award} tone="success" />
              </View>
              <RewardProgress approved={approvedReferralDeposits} pending={pendingReferralDeposits} />
              <View className="gap-3 lg:flex-row">
                <ReferralStep number="1" title="Share link" description="Copy your referral link and send it to new clients." />
                <ReferralStep number="2" title="Client registers" description="New accounts are linked to your broker code automatically." />
                <ReferralStep number="3" title="Track rewards" description="Approved deposits update your estimated commission." />
              </View>
            </View>

            <View className="rounded-2xl border border-border bg-panel p-5 lg:w-[360px]">
              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-base font-black text-white">Referral Link</Text>
                  <Text className="mt-1 text-sm text-muted">Share this link with new clients.</Text>
                </View>
                <Pressable
                  onPress={() => loadDashboard().catch(() => {})}
                  disabled={loading}
                  className={`h-[40px] w-[40px] items-center justify-center rounded-xl border border-border bg-surface ${loading ? 'opacity-60' : ''}`}
                >
                  <RefreshCcw size={16} color="#D4AF37" />
                </Pressable>
              </View>
              {!referralText ? (
                <View className="mb-3 rounded-xl border border-primary/30 bg-primary/10 p-3">
                  <Text className="text-sm font-bold text-primary">Referral link is not ready yet</Text>
                  <Text className="mt-1 text-xs text-muted">Refresh after your referral code is available.</Text>
                </View>
              ) : null}
              <TextInput
                editable={false}
                value={referralText || 'Referral link will appear here'}
                className="min-h-[92px] rounded-xl border border-border bg-surface p-4 text-white"
                multiline
              />
              <Pressable
                onPress={copyReferral}
                disabled={!referralText}
                className={`mt-4 min-h-[48px] flex-row items-center justify-center rounded-xl bg-primary px-5 ${!referralText ? 'opacity-50' : ''}`}
              >
                {copied ? <CheckCircle2 size={16} color="#0B0B0B" /> : <Copy size={16} color="#0B0B0B" />}
                <Text className="ml-2 font-black text-black">{copied ? 'Link Copied' : 'Copy Referral Link'}</Text>
              </Pressable>
              <View className="mt-4 rounded-xl border border-border bg-surface p-4">
                <Text className="text-xs font-bold uppercase text-muted">Payout Snapshot</Text>
                <View className="mt-3 gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-muted">Rate</Text>
                    <Text className="font-bold text-white">{(referralRate * 100).toFixed(2)}%</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted">Approved Volume</Text>
                    <Text className="font-bold text-white">{approvedReferralDeposits.toFixed(2)} USD</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted">Estimated Reward</Text>
                    <Text className="font-black text-primary">{estimatedReferralCommission.toFixed(2)} USD</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="rounded-2xl border border-border bg-panel p-5">
            <View className="mb-4 flex-row flex-wrap items-center justify-between gap-3">
              <View>
                <Text className="text-lg font-black text-white">My Referrals</Text>
                <Text className="mt-1 text-sm text-muted">Client accounts linked to your broker code.</Text>
              </View>
              <Text className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-muted">{referrals.length} clients</Text>
            </View>
            <LinkedReferralList referrals={referrals} />
          </View>
        </View>
      ) : null}

      {activeSection === 'settings' ? (
        <Card title="Mode, Sounds, and Session">
          <View className="gap-3">
            <View className="flex-row items-center justify-between rounded-xl border border-border bg-surface p-4">
              <View>
                <Text className="font-bold text-white">Mode</Text>
                <Text className="text-muted">{darkMode ? 'Dark mode enabled' : 'Light mode enabled'}</Text>
              </View>
              <CustomButton title={darkMode ? 'Switch Light' : 'Switch Dark'} onPress={toggleTheme} className="min-w-[150px]" />
            </View>
            <View className="flex-row items-center justify-between rounded-xl border border-border bg-surface p-4">
              <View>
                <Text className="font-bold text-white">Sounds</Text>
                <Text className="text-muted">Sound preference placeholder for trade alerts.</Text>
              </View>
              <Text className="font-bold text-primary">Enabled</Text>
            </View>
            <View className="flex-row items-center justify-between rounded-xl border border-border bg-surface p-4">
              <View>
                <Text className="font-bold text-white">Sign Out</Text>
                <Text className="text-muted">End this account session.</Text>
              </View>
              <CustomButton title="Sign Out" variant="secondary" onPress={signOut} className="min-w-[150px]" />
            </View>
          </View>
        </Card>
      ) : null}
    </ScrollView>
  );
}
