import { useEffect, useMemo, useState } from 'react';
import { Link, router } from 'expo-router';
import { Copy, RefreshCcw, UsersRound } from 'lucide-react-native';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import CustomButton from '../src/components/common/CustomButton';
import { dashboardService } from '../src/services/dashboardService';
import { useAuth } from '../src/hooks/useAuth';

function Metric({ label, value, hint }) {
  return (
    <View className="min-w-[190px] flex-1 rounded-2xl border border-border bg-surface p-4">
      <Text className="text-xs font-bold uppercase text-muted">{label}</Text>
      <Text className="mt-2 text-2xl font-black text-white">{value}</Text>
      {hint ? <Text className="mt-1 text-xs text-muted">{hint}</Text> : null}
    </View>
  );
}

function ReferralCard({ referral }) {
  return (
    <View className="rounded-xl border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <View className="min-w-0 flex-1">
          <Text className="font-black text-white" numberOfLines={1}>{referral.name || 'Client'}</Text>
          <Text className="mt-1 text-sm text-muted" numberOfLines={1}>{referral.email || '-'}</Text>
        </View>
        <View className="rounded-full bg-panel px-3 py-1">
          <Text className="text-xs font-bold text-primary">{referral.accountType || 'Demo'}</Text>
        </View>
      </View>
      <Text className="mt-2 text-xs text-muted">
        Joined {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : '-'}
      </Text>
    </View>
  );
}

export default function BrokerRewardsScreen() {
  const { user } = useAuth();
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

  return (
    <ScrollView className="flex-1 bg-[#0B0B0B]" contentContainerClassName="p-4 lg:p-8">
      <View className="mb-6 flex-row flex-wrap items-center justify-between gap-3">
        <View>
          <Text className="text-3xl font-black text-white">Broker Rewards</Text>
          <Text className="mt-1 text-muted">{user?.email || 'Track your referral link, clients, and commission.'}</Text>
        </View>
        <View className="flex-row flex-wrap gap-3">
          <Pressable onPress={() => loadDashboard().catch(() => {})} className="flex-row items-center rounded-xl border border-border bg-panel px-4 py-3">
            <RefreshCcw size={16} color={loading ? '#D4AF37' : '#8fa0bb'} />
            <Text className="ml-2 font-bold text-white">Refresh</Text>
          </Pressable>
          <Link href="/dashboard" asChild>
            <Pressable className="rounded-xl border border-border bg-panel px-4 py-3">
              <Text className="font-bold text-primary">Back to Dashboard</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      <View className="mb-5 overflow-hidden rounded-2xl border border-primary/40 bg-panel p-5">
        <Text className="text-sm font-black uppercase tracking-[1px] text-primary">Your Broker Code</Text>
        <Text className="mt-3 text-4xl font-black text-white">{referral.code || '-'}</Text>
        {referral.referrer ? (
          <Text className="mt-2 text-muted">You were referred by {referral.referrer.name || referral.referrer.email}</Text>
        ) : (
          <Text className="mt-2 text-muted">Share your link below. New users registered from it are linked to you.</Text>
        )}
        <TextInput
          editable={false}
          value={referralUrl}
          className="mt-5 rounded-xl border border-border bg-surface p-4 text-white"
        />
        <CustomButton title={copied ? 'Copied' : 'Copy Referral URL'} onPress={copyReferral} className="mt-4 max-w-[240px]" />
      </View>

      <View className="mb-5 flex-row flex-wrap gap-3">
        <Metric label="My Referrals" value={String(referral.referralCount || referrals.length || 0)} hint="Users registered through your link" />
        <Metric label="Pending Deposits" value={`${pendingDeposits.toFixed(2)} USD`} hint="Waiting for approval" />
        <Metric label="Approved Deposits" value={`${approvedDeposits.toFixed(2)} USD`} hint="Confirmed referral volume" />
        <Metric label="Commission" value={`${commission.toFixed(2)} USD`} hint={`${(commissionRate * 100).toFixed(2)}% rate`} />
      </View>

      <View className="rounded-2xl border border-border bg-panel p-5">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-black text-white">My Referrals</Text>
            <Text className="mt-1 text-muted">Every client linked to your referral code.</Text>
          </View>
          <UsersRound size={24} color="#D4AF37" />
        </View>
        <View className="gap-3">
          {referrals.map((item) => <ReferralCard key={item.id} referral={item} />)}
          {!referrals.length ? <Text className="rounded-xl border border-dashed border-border bg-surface p-5 text-muted">No referrals yet.</Text> : null}
        </View>
      </View>
    </ScrollView>
  );
}
