import { useEffect, useMemo, useState } from 'react';
import { Link, router } from 'expo-router';
import { RefreshCcw, UsersRound } from 'lucide-react-native';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import CustomButton from '../src/components/common/CustomButton';
import { dashboardService } from '../src/services/dashboardService';
import { useAuth } from '../src/hooks/useAuth';
import { useAppTheme } from '../src/context/ThemeContext';

import AccountSidebar from '../src/components/layout/AccountSidebar';

function Metric({ label, value, hint, colors }) {
  return (
    <View className="min-w-[190px] flex-1 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <Text className="text-xs font-bold uppercase" style={{ color: colors.muted }}>{label}</Text>
      <Text className="mt-2 text-2xl font-black" style={{ color: colors.text }}>{value}</Text>
      {hint ? <Text className="mt-1 text-xs" style={{ color: colors.muted }}>{hint}</Text> : null}
    </View>
  );
}

function ReferralCard({ referral, colors }) {
  return (
    <View className="rounded-xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <View className="flex-row items-center justify-between">
        <View className="min-w-0 flex-1">
          <Text className="font-black" style={{ color: colors.text }} numberOfLines={1}>{referral.name || 'Client'}</Text>
          <Text className="mt-1 text-sm" style={{ color: colors.muted }} numberOfLines={1}>{referral.email || '-'}</Text>
        </View>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: colors.panel }}>
          <Text className="text-xs font-bold" style={{ color: colors.primary }}>{referral.accountType || 'Demo'}</Text>
        </View>
      </View>
      <Text className="mt-2 text-xs" style={{ color: colors.muted }}>
        Joined {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : '-'}
      </Text>
    </View>
  );
}

export default function BrokerRewardsScreen() {
  const { user, logout, loading: authLoading } = useAuth();
  const { colors } = useAppTheme();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setDashboard(await dashboardService.getDashboard());
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        await logout();
        router.replace('/login');
      }
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

  const referral = dashboard?.referral || {};
  const referrals = referral.referrals || [];
  const referralUrl = useMemo(() => referral.url || '', [referral.url]);
  const approvedDeposits = Number(referral.approvedDeposits || 0);
  const pendingDeposits = Number(referral.pendingDeposits || 0);
  const commission = Number(referral.commission || 0);
  const commissionRate = Number(referral.commissionRate || 0);

  const copyReferral = async () => {
    if (!referralUrl) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(referralUrl);
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
    <View className="flex-1 md:flex-row" style={{ backgroundColor: colors.background }}>
      <AccountSidebar
        activeKey="rewards"
        wallet={dashboard?.wallet || user?.wallet || {}}
        referral={referral}
        onSignOut={signOut}
      />
      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerClassName="p-4 lg:p-8">
        <View className="mb-6 flex-row flex-wrap items-center justify-between gap-3">
          <View>
            <Text className="text-3xl font-black" style={{ color: colors.text }}>Broker Rewards</Text>
            <Text className="mt-1" style={{ color: colors.muted }}>{user?.email || 'Track your referral link, clients, and commission.'}</Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            <Pressable onPress={() => loadDashboard().catch(() => {})} className="flex-row items-center rounded-xl border px-4 py-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
              <RefreshCcw size={16} color={loading ? '#D4AF37' : '#8fa0bb'} />
              <Text className="ml-2 font-bold" style={{ color: colors.text }}>Refresh</Text>
            </Pressable>
            <Link href="/dashboard" asChild>
              <Pressable className="rounded-xl border px-4 py-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                <Text className="font-bold" style={{ color: colors.primary }}>Back to Dashboard</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View className="mb-5 overflow-hidden rounded-2xl border p-5" style={{ backgroundColor: colors.panel, borderColor: colors.primary }}>
        <Text className="text-sm font-black uppercase tracking-[1px]" style={{ color: colors.primary }}>Your Broker Code</Text>
        <Text className="mt-3 text-4xl font-black" style={{ color: colors.text }}>{referral.code || '-'}</Text>
        {referral.referrer ? (
          <Text className="mt-2" style={{ color: colors.muted }}>You were referred by {referral.referrer.name || referral.referrer.email}</Text>
        ) : (
          <Text className="mt-2" style={{ color: colors.muted }}>Share your link below. New users registered from it are linked to you.</Text>
        )}
        <TextInput
          editable={false}
          value={referralUrl}
          className="mt-5 rounded-xl border p-4"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
        />
        <CustomButton title={copied ? 'Copied' : 'Copy Referral URL'} onPress={copyReferral} className="mt-4 max-w-[240px]" />
      </View>

        <View className="mb-5 flex-row flex-wrap gap-3">
        <Metric label="My Referrals" value={String(referral.referralCount || referrals.length || 0)} hint="Users registered through your link" colors={colors} />
        <Metric label="Pending Deposits" value={`${pendingDeposits.toFixed(2)} USD`} hint="Waiting for approval" colors={colors} />
        <Metric label="Approved Deposits" value={`${approvedDeposits.toFixed(2)} USD`} hint="Confirmed referral volume" colors={colors} />
        <Metric label="Commission" value={`${commission.toFixed(2)} USD`} hint={`${(commissionRate * 100).toFixed(2)}% rate`} colors={colors} />
      </View>

        <View className="rounded-2xl border p-5" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-black" style={{ color: colors.text }}>My Referrals</Text>
            <Text className="mt-1" style={{ color: colors.muted }}>Every client linked to your referral code.</Text>
          </View>
          <UsersRound size={24} color="#D4AF37" />
        </View>
        <View className="gap-3">
          {referrals.map((item) => <ReferralCard key={item.id} referral={item} colors={colors} />)}
          {!referrals.length ? <Text className="rounded-xl border border-dashed p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.muted }}>No referrals yet.</Text> : null}
        </View>
        </View>
      </ScrollView>
    </View>
  );
}
