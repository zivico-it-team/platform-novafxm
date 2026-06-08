import { useEffect, useMemo, useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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

export default function DashboardScreen() {
  const params = useLocalSearchParams();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useAppTheme();
  const { deposit, withdraw, loading: walletLoading } = useWallet();
  const [activeSection, setActiveSection] = useState(String(params.section || 'overview'));
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const referralText = useMemo(() => referral.url || '', [referral.url]);

  const createAccount = async (type) => {
    await dashboardService.createAccount(type);
    await loadDashboard();
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
            style={{ backgroundColor: activeSection === key ? '#00B76A' : '#111827' }}
          >
            <Text className="font-bold" style={{ color: activeSection === key ? '#05130d' : '#9CA3AF' }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View className="mb-5 flex-row flex-wrap gap-3">
        <Stat label="Balance" value={`${Number(wallet.balance || 0).toFixed(2)} ${wallet.currency || 'USD'}`} />
        <Stat label="Equity" value={`${Number(wallet.equity || wallet.balance || 0).toFixed(2)} ${wallet.currency || 'USD'}`} />
        <Stat label="Free Funds" value={`${Number(wallet.freeFunds || 0).toFixed(2)} ${wallet.currency || 'USD'}`} />
        <Stat label="Referral Commission" value={`${Number(referral.commission || 0).toFixed(2)} USD`} />
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
        <Card title="Referral Commission and My Referrals">
          <Text className="text-white">Referral Code: {referral.code || '-'}</Text>
          <Text className="mt-2 text-white">Commission Rate: {Number(referral.commissionRate || 0) * 100}%</Text>
          <Text className="mt-2 text-white">Estimated Commission: {Number(referral.commission || 0).toFixed(2)} USD</Text>
          <TextInput
            editable={false}
            value={referralText}
            className="mt-4 rounded-xl border border-border bg-surface p-3 text-white"
          />
          <CustomButton title={copied ? 'Copied' : 'Copy Referral URL'} onPress={copyReferral} className="mt-4 max-w-[260px]" />
          <Text className="mb-3 mt-6 text-lg font-bold text-white">My Referrals</Text>
          <View className="gap-2">
            {referrals.map((item) => (
              <View key={item.id} className="rounded-xl border border-border bg-surface p-3">
                <Text className="font-bold text-white">{item.name}</Text>
                <Text className="text-muted">{item.email}</Text>
                <Text className="text-muted">{item.accountType} | Joined {new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            ))}
            {!referrals.length ? <Text className="text-muted">No referrals yet.</Text> : null}
          </View>
        </Card>
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
