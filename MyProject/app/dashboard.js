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
import DashboardTabs from '../src/components/layout/DashboardTabs';
import { dashboardService } from '../src/services/dashboardService';
import { useAuth } from '../src/hooks/useAuth';
import { useWallet } from '../src/hooks/useWallet';
import { useAppTheme } from '../src/context/ThemeContext';

const DEMO_ACCOUNT_LIMIT = 2;
const LIVE_ACCOUNT_LIMIT = 3;

function Card({ title, subtitle, children, colors }) {
  return (
    <View className="rounded-2xl border p-5" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <View className="mb-5">
        <Text className="text-xl font-extrabold" style={{ color: colors.text }}>{title}</Text>
        {subtitle ? <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Stat({ label, value, colors }) {
  return (
    <View className="min-w-[150px] flex-1 rounded-xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <Text className="text-xs font-semibold uppercase" style={{ color: colors.muted }}>{label}</Text>
      <Text className="mt-2 text-xl font-extrabold" style={{ color: colors.text }}>{value}</Text>
    </View>
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

export default function DashboardScreen() {
  const params = useLocalSearchParams();
  const { user, logout, loading: authLoading } = useAuth();
  const { colors } = useAppTheme();
  const { deposit, withdraw, loading: walletLoading } = useWallet();
  const [activeSection, setActiveSection] = useState(String(params.section || 'overview'));
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [accountError, setAccountError] = useState('');

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
    if (!user) {
      router.replace('/login');
      return;
    }
    loadDashboard().catch(() => {});
  }, [authLoading, user]);

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
  const referralText = useMemo(() => referral.url || '', [referral.url]);

  const createAccount = async (type) => {
    setAccountError('');
    if (!user) {
      router.replace('/login');
      return;
    }
    try {
      await dashboardService.createAccount(type);
      await loadDashboard();
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        await logout();
        router.replace('/login');
        return;
      }
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

  if (authLoading || !user) {
    return <View className="flex-1" style={{ backgroundColor: colors.background }} />;
  }

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerClassName="p-4 lg:p-8">
      <View className="mb-6 flex-row flex-wrap items-center justify-between gap-3">
        <View>
          <Text className="text-3xl font-extrabold" style={{ color: colors.text }}>Account Dashboard</Text>
          <Text className="mt-1" style={{ color: colors.muted }}>{user?.email || 'Manage accounts, funds, and rewards'}</Text>
        </View>
        <View className="flex-row gap-3">
          <Link href="/trading" asChild><Pressable><Text style={{ color: '#D4AF37' }}>Back to Trading</Text></Pressable></Link>
          <Pressable onPress={signOut}><Text className="text-danger">Sign Out</Text></Pressable>
        </View>
      </View>

      <DashboardTabs activeKey={activeSection} onSectionChange={setActiveSection} />

      {activeSection === 'overview' ? (
        <View className="mb-5 flex-row flex-wrap gap-3">
          <Stat label="Balance" value={`${Number(wallet.balance || 0).toFixed(2)} ${wallet.currency || 'USD'}`} colors={colors} />
          <Stat label="Equity" value={`${Number(wallet.equity || wallet.balance || 0).toFixed(2)} ${wallet.currency || 'USD'}`} colors={colors} />
          <Stat label="Free Funds" value={`${Number(wallet.freeFunds || 0).toFixed(2)} ${wallet.currency || 'USD'}`} colors={colors} />
          <Stat label="Referral Commission" value={`${Number(referral.commission || 0).toFixed(2)} USD`} colors={colors} />
        </View>
      ) : null}

      {activeSection === 'overview' ? (
        <View className="gap-4 lg:flex-row">
          <View className="flex-1 gap-4">
            <Card title="Account Details" colors={colors}>
              <Text style={{ color: colors.text }}>Name: {dashboard?.user?.name || user?.name || '-'}</Text>
              <Text className="mt-2" style={{ color: colors.text }}>Email: {dashboard?.user?.email || user?.email || '-'}</Text>
              <Text className="mt-2" style={{ color: colors.text }}>Phone: {dashboard?.user?.phone || '-'}</Text>
              <Text className="mt-2" style={{ color: colors.text }}>Trading Status: {dashboard?.user?.tradingStatus || 'active'}</Text>
            </Card>
            <Card title="Recent Transactions" colors={colors}>
              <TransactionList transactions={transactions} />
            </Card>
          </View>
          <View className="flex-1">
            <Card title="Broker Referral" colors={colors}>
              <Text style={{ color: colors.muted }}>Share this URL. New users who register from it are linked to you.</Text>
              <TextInput
                editable={false}
                value={referralText}
                className="mt-4 rounded-xl border p-3"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
              />
              <CustomButton title={copied ? 'Copied' : 'Copy Referral URL'} onPress={copyReferral} className="mt-4" />
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
              <CustomButton title="Create Demo Account" onPress={() => createAccount('Demo')} disabled={demoAccountCount >= DEMO_ACCOUNT_LIMIT} className="min-w-[210px]" />
              <CustomButton title="Create Live Account" onPress={() => createAccount('Live')} disabled={liveAccountCount >= LIVE_ACCOUNT_LIMIT} variant="secondary" className="min-w-[210px]" />
            </View>
          </View>
          {accountError ? <Text className="mb-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-danger">{accountError}</Text> : null}
          <View className="flex-row flex-wrap gap-4">
            {accounts.map((account) => <AccountCard key={account.id} account={account} colors={colors} />)}
            {!accounts.length && !loading ? (
              <View className="w-full items-center rounded-2xl border border-dashed p-8" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <Plus size={26} color="#D4AF37" />
                <Text className="mt-3 text-lg font-black" style={{ color: colors.text }}>No accounts yet</Text>
                <Text className="mt-1 text-center" style={{ color: colors.muted }}>Create a demo or live account to start trading.</Text>
              </View>
            ) : null}
          </View>
        </Card>
      ) : null}

      {activeSection === 'deposit' ? (
        <Card title="Deposit" subtitle="Submit a funding request with your payment reference." colors={colors}>
          <DepositForm onSubmit={(values) => deposit(values, Boolean(user)).then(loadDashboard)} loading={walletLoading} disabled={fundingLocked} disabledMessage={fundingLockedMessage} />
          <TransactionList transactions={depositTransactions} title="Deposit History" />
        </Card>
      ) : null}

      {activeSection === 'withdraw' ? (
        <Card title="Withdraw Funds" colors={colors}>
          <WithdrawForm
            onSubmit={(values) => withdraw(values, Boolean(user)).then(loadDashboard)}
            loading={walletLoading}
            disabled={fundingLocked}
            disabledMessage={fundingLockedMessage}
            summary={wallet}
            transactions={transactions}
          />
        </Card>
      ) : null}

    </ScrollView>
  );
}
