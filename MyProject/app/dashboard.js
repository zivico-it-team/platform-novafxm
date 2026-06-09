import { useEffect, useMemo, useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  ArrowUpRight,
  Award,
  CheckCircle2,
  Clock3,
  Copy,
  Plus,
  ShieldCheck,
  TrendingUp,
  UsersRound,
  Wallet,
} from 'lucide-react-native';
import CustomButton from '../src/components/common/CustomButton';
import DepositForm from '../src/components/wallet/DepositForm';
import WithdrawForm from '../src/components/wallet/WithdrawForm';
import TransactionList from '../src/components/wallet/TransactionList';
import { dashboardService } from '../src/services/dashboardService';
import { useAuth } from '../src/hooks/useAuth';
import { useWallet } from '../src/hooks/useWallet';
import { useAppTheme } from '../src/context/ThemeContext';

function Card({ title, subtitle, children }) {
  return (
    <View className="rounded-2xl border border-border bg-panel p-5">
      <View className="mb-5">
        <Text className="text-xl font-extrabold text-white">{title}</Text>
        {subtitle ? <Text className="mt-1 text-sm text-muted">{subtitle}</Text> : null}
      </View>
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

function referralBaseUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return 'http://localhost:8081';
}

function RewardMetric({ label, value, caption, icon: Icon, tone = 'primary' }) {
  const color = tone === 'success' ? '#12cf7a' : '#D4AF37';

  return (
    <View className="min-w-[220px] flex-1 rounded-2xl border border-border bg-panel p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}22` }}>
          <Icon size={19} color={color} />
        </View>
        <Text className="text-xs font-bold uppercase text-muted">{label}</Text>
      </View>
      <Text className="text-2xl font-black text-white">{value}</Text>
      <Text className="mt-2 text-xs text-muted">{caption}</Text>
    </View>
  );
}

function LinkedReferralList({ referrals }) {
  if (!referrals?.length) {
    return (
      <View className="rounded-2xl border border-dashed border-border bg-surface p-5">
        <Text className="font-bold text-white">No linked clients yet</Text>
        <Text className="mt-1 text-sm text-muted">Share your referral link to connect new client accounts.</Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {referrals.map((item) => (
        <View key={item.id} className="rounded-xl border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <View className="min-w-0 flex-1">
              <Text className="font-black text-white" numberOfLines={1}>{item.name || 'Client'}</Text>
              <Text className="mt-1 text-sm text-muted" numberOfLines={1}>{item.email || '-'}</Text>
            </View>
            <View className="rounded-full bg-panel px-3 py-1">
              <Text className="text-xs font-bold text-primary">{item.accountType || 'Demo'}</Text>
            </View>
          </View>
          <Text className="mt-2 text-xs text-muted">Joined {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</Text>
        </View>
      ))}
    </View>
  );
}

function accountNumber(account) {
  return String(account?.id || '').replace(/\D/g, '').slice(-5).padStart(5, '0');
}

function AccountCard({ account }) {
  const active = account.status === 'active';
  const demo = account.type === 'Demo';
  const tone = active ? '#12cf7a' : '#D4AF37';
  const openTradingAccount = () => {
    if (active) router.push(`/trading?accountId=${account.id}`);
  };

  return (
    <View className="min-w-[260px] flex-1 rounded-2xl border border-border bg-surface p-5">
      <View className="mb-5 flex-row items-start justify-between">
        <View className="flex-row items-center">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: demo ? '#D4AF3722' : '#12cf7a22' }}>
            {demo ? <Wallet size={21} color="#D4AF37" /> : <ShieldCheck size={21} color="#12cf7a" />}
          </View>
          <View>
            <Text className="text-lg font-black text-white">{account.name}</Text>
            <Text className="mt-1 text-xs text-muted">Account ID : {accountNumber(account)}</Text>
          </View>
        </View>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${tone}1f` }}>
          <Text className="text-xs font-bold" style={{ color: tone }}>{account.status || 'active'}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-3">
        <View className="min-w-[130px] flex-1 rounded-xl border border-border bg-panel p-3">
          <Text className="text-xs font-semibold uppercase text-muted">Balance</Text>
          <Text className="mt-2 text-lg font-black text-white">{Number(account.balance || 0).toFixed(2)} {account.currency || 'USD'}</Text>
        </View>
        <View className="min-w-[110px] rounded-xl border border-border bg-panel p-3">
          <Text className="text-xs font-semibold uppercase text-muted">Type</Text>
          <Text className="mt-2 text-lg font-black text-white">{account.type}</Text>
        </View>
      </View>

      <Pressable
        onPress={openTradingAccount}
        disabled={!active}
        className={`mt-4 flex-row items-center justify-between border-t border-border pt-4 ${active ? '' : 'opacity-70'}`}
      >
        <View className="flex-row items-center">
          {active ? <CheckCircle2 size={16} color="#12cf7a" /> : <Clock3 size={16} color="#D4AF37" />}
          <Text className="ml-2 text-xs font-semibold text-muted">{active ? 'Ready for trading' : 'Waiting for activation'}</Text>
        </View>
        <ArrowUpRight size={17} color={active ? '#D4AF37' : '#848e9c'} />
      </Pressable>
    </View>
  );
}

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
  const [accountError, setAccountError] = useState('');

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
  const fundingLocked = Boolean(user && user.verificationStatus !== 'approved');
  const fundingLockedMessage = 'Verification approval is required before deposits and withdrawals.';
  const referral = dashboard?.referral || {};
  const accounts = dashboard?.accounts || [];
  const demoAccountCount = accounts.filter((account) => account.type === 'Demo').length;
  const liveAccountCount = accounts.filter((account) => account.type === 'Live').length;
  const transactions = dashboard?.transactions || [];
  const referrals = referral.referrals || [];
  const sections = [
    ['overview', 'Overview'],
    ['accounts', 'Accounts'],
    ['verification', 'Verification'],
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
    setAccountError('');
    try {
      await dashboardService.createAccount(type);
      await loadDashboard();
    } catch (requestError) {
      setAccountError(requestError.response?.data?.message || 'Account could not be created.');
    }
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
          <Link href="/trading" asChild><Pressable><Text style={{ color: '#D4AF37' }}>Back to Trading</Text></Pressable></Link>
          <Pressable onPress={signOut}><Text className="text-danger">Sign Out</Text></Pressable>
        </View>
      </View>

      <View className="mb-5 rounded-2xl border border-border bg-panel p-2">
        <View className="flex-row flex-wrap gap-2">
        {sections.map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => (key === 'verification' ? router.push('/verification') : setActiveSection(key))}
            className="rounded-xl px-4 py-3"
            style={{ backgroundColor: activeSection === key ? '#D4AF37' : 'transparent', borderColor: activeSection === key ? '#D4AF37' : '#243142', borderWidth: 1 }}
          >
            <Text className="font-bold" style={{ color: activeSection === key ? '#05130d' : '#9CA3AF' }}>{label}</Text>
          </Pressable>
        ))}
        </View>
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
        <Card title="Demo and Live Accounts" subtitle="Create, review, and manage all trading accounts from one clean workspace.">
          <View className="mb-5 flex-row flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
            <View>
              <Text className="text-sm font-bold text-white">Account slots</Text>
              <Text className="mt-1 text-xs text-muted">Demo {demoAccountCount}/2 | Live {liveAccountCount}/2</Text>
            </View>
            <View className="flex-row flex-wrap gap-3">
              <CustomButton title="Create Demo Account" onPress={() => createAccount('Demo')} disabled={demoAccountCount >= 2} className="min-w-[210px]" />
              <CustomButton title="Create Live Account" onPress={() => createAccount('Live')} disabled={liveAccountCount >= 2} variant="secondary" className="min-w-[210px]" />
            </View>
          </View>
          {accountError ? <Text className="mb-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-danger">{accountError}</Text> : null}
          <View className="flex-row flex-wrap gap-4">
            {accounts.map((account) => <AccountCard key={account.id} account={account} />)}
            {!accounts.length && !loading ? (
              <View className="w-full items-center rounded-2xl border border-dashed border-border bg-surface p-8">
                <Plus size={26} color="#D4AF37" />
                <Text className="mt-3 text-lg font-black text-white">No accounts yet</Text>
                <Text className="mt-1 text-center text-muted">Create a demo or live account to start trading.</Text>
              </View>
            ) : null}
          </View>
        </Card>
      ) : null}

      {activeSection === 'deposit' ? (
        <Card title="Deposit Funds">
          <DepositForm onSubmit={(values) => deposit(values, Boolean(user)).then(loadDashboard)} loading={walletLoading} disabled={fundingLocked} disabledMessage={fundingLockedMessage} />
        </Card>
      ) : null}

      {activeSection === 'withdraw' ? (
        <Card title="Withdraw Funds">
          <WithdrawForm onSubmit={(values) => withdraw(values, Boolean(user)).then(loadDashboard)} loading={walletLoading} disabled={fundingLocked} disabledMessage={fundingLockedMessage} />
        </Card>
      ) : null}

      {activeSection === 'rewards' ? (
        <View className="gap-4">
          <View className="overflow-hidden rounded-2xl border border-primary/40 bg-panel">
            <View className="p-5 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
              <View className="max-w-[720px] flex-1">
                <View className="mb-3 self-start rounded-full border border-primary/40 bg-primary/10 px-3 py-1">
                  <Text className="text-xs font-black uppercase tracking-[1px] text-primary">Broker Rewards</Text>
                </View>
                <Text className="text-2xl font-black text-white">Referral performance</Text>
                <Text className="mt-2 max-w-[620px] text-muted">Track your linked clients, approved deposits, and estimated commission.</Text>
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
                  <Text className="text-xs font-bold uppercase tracking-[1px] text-muted">Commission</Text>
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
                <RewardMetric label="Clients" value={String(linkedClients)} caption="Linked through your referral link" icon={UsersRound} tone="success" />
                <RewardMetric label="Approved" value={`${approvedReferralDeposits.toFixed(2)} USD`} caption="Confirmed referral deposits" icon={Award} tone="success" />
                <RewardMetric label="Pending" value={`${pendingReferralDeposits.toFixed(2)} USD`} caption="Deposits waiting for approval" icon={TrendingUp} />
              </View>
              <Card title="Linked Clients" subtitle="Clients registered under your referral code.">
                <LinkedReferralList referrals={referrals} />
              </Card>
            </View>

            <View className="rounded-2xl border border-border bg-panel p-5 lg:w-[360px]">
              <View className="mb-4">
                <Text className="text-base font-black text-white">Referral Link</Text>
                <Text className="mt-1 text-sm text-muted">Copy and share with new clients.</Text>
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
            </View>
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
              <Text className="font-bold" style={{ color: '#D4AF37' }}>Enabled</Text>
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
