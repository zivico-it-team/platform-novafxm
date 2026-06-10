import { useEffect, useMemo, useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Plus,
  ShieldCheck,
  Wallet,
} from 'lucide-react-native';
import CustomButton from '../src/components/common/CustomButton';
import DepositForm from '../src/components/wallet/DepositForm';
import WithdrawForm from '../src/components/wallet/WithdrawForm';
import TransactionList from '../src/components/wallet/TransactionList';
import { dashboardService } from '../src/services/dashboardService';
import { useAuth } from '../src/hooks/useAuth';
import { useWallet } from '../src/hooks/useWallet';

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
        <ArrowUpRight size={17} color={active ? '#D4AF37' : '#8fa0bb'} />
      </Pressable>
    </View>
  );
}

export default function DashboardScreen() {
  const params = useLocalSearchParams();
  const { user, logout } = useAuth();
  const { deposit, withdraw, loading: walletLoading } = useWallet();
  const [activeSection, setActiveSection] = useState(String(params.section || 'overview'));
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [accountError, setAccountError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      setDashboard(await dashboardService.getDashboard());
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
  const depositTransactions = transactions.filter((item) => item.type === 'deposit');
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

  const referralText = useMemo(() => referral.url || '', [referral.url]);

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
            onPress={() => {
              if (key === 'verification') {
                router.push('/verification');
                return;
              }
              if (key === 'rewards') {
                router.push('/broker-rewards');
                return;
              }
              if (key === 'settings') {
                router.push('/settings');
                return;
              }
              setActiveSection(key);
            }}
            className="rounded-xl px-4 py-3"
            style={{ backgroundColor: activeSection === key ? '#D4AF37' : 'transparent', borderColor: activeSection === key ? '#D4AF37' : '#243142', borderWidth: 1 }}
          >
            <Text className="font-bold" style={{ color: activeSection === key ? '#05130d' : '#9CA3AF' }}>{label}</Text>
          </Pressable>
        ))}
        </View>
      </View>

      {activeSection === 'overview' ? (
        <View className="mb-5 flex-row flex-wrap gap-3">
          <Stat label="Balance" value={`${Number(wallet.balance || 0).toFixed(2)} ${wallet.currency || 'USD'}`} />
          <Stat label="Equity" value={`${Number(wallet.equity || wallet.balance || 0).toFixed(2)} ${wallet.currency || 'USD'}`} />
          <Stat label="Free Funds" value={`${Number(wallet.freeFunds || 0).toFixed(2)} ${wallet.currency || 'USD'}`} />
          <Stat label="Referral Commission" value={`${Number(referral.commission || 0).toFixed(2)} USD`} />
        </View>
      ) : null}

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
              <TextInput
                editable={false}
                value={referralText}
                className="mt-4 rounded-xl border border-border bg-surface p-3 text-white"
              />
              <CustomButton title={copied ? 'Copied' : 'Copy Referral URL'} onPress={copyReferral} className="mt-4" />
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
        <Card title="Deposit" subtitle="Submit a funding request with your payment reference.">
          <DepositForm onSubmit={(values) => deposit(values, Boolean(user)).then(loadDashboard)} loading={walletLoading} disabled={fundingLocked} disabledMessage={fundingLockedMessage} />
          <TransactionList transactions={depositTransactions} title="Deposit History" />
        </Card>
      ) : null}

      {activeSection === 'withdraw' ? (
        <Card title="Withdraw Funds">
          <WithdrawForm onSubmit={(values) => withdraw(values, Boolean(user)).then(loadDashboard)} loading={walletLoading} disabled={fundingLocked} disabledMessage={fundingLockedMessage} />
        </Card>
      ) : null}

    </ScrollView>
  );
}
