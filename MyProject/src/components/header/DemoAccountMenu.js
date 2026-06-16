import { Award, BadgeCheck, Check, Copy, Plus, Repeat2, ShieldCheck, WalletCards, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../context/ThemeContext';
import { dashboardService } from '../../services/dashboardService';
import { money } from '../../utils/formatters';

function accountId(account) {
  return String(account?.id || '').replace(/\D/g, '').slice(-8).padStart(8, '0');
}

function accountLabel(account) {
  return account?.name || `${account?.type || 'Demo'} account`;
}

export default function DemoAccountMenu({ accounts = [], selectedAccount, onSelectAccount, onClose, onAccountsChanged, onOpenPanel }) {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const [dashboard, setDashboard] = useState(null);
  const [busyType, setBusyType] = useState('');
  const [message, setMessage] = useState('');
  const fallbackAccount = {
    id: `user-${user?.id || 27075}`,
    type: user?.accountType || 'Demo',
    name: user?.accountType === 'Live' ? 'Live account 1' : 'Demo account 1',
    status: user?.tradingStatus === 'frozen' ? 'frozen' : 'active',
    balance: user?.wallet?.balance || 0,
    currency: 'USD',
  };
  const tradingAccounts = accounts.length ? accounts : [fallbackAccount];
  const activeAccount = selectedAccount || tradingAccounts[0];
  const referral = dashboard?.referral || {};
  const referrals = referral.referrals || [];
  const demoCount = tradingAccounts.filter((account) => account.type === 'Demo').length;
  const liveCount = tradingAccounts.filter((account) => account.type === 'Live').length;
  const verified = user?.verificationStatus === 'approved';
  const pending = user?.verificationStatus === 'pending';

  useEffect(() => {
    let active = true;
    dashboardService.getDashboard()
      .then((result) => {
        if (active) setDashboard(result);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const createAccount = async (type) => {
    setBusyType(type);
    setMessage('');
    try {
      await dashboardService.createAccount(type, true);
      const result = await dashboardService.getDashboard();
      setDashboard(result);
      onAccountsChanged?.(result.accounts || []);
      setMessage(`${type} account created successfully.`);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || `${type} account could not be created.`);
    } finally {
      setBusyType('');
    }
  };

  const copyReferral = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && referral.url) {
      await navigator.clipboard.writeText(referral.url);
      setMessage('Referral URL copied.');
    }
  };

  const openPanel = (panel) => {
    onClose?.();
    onOpenPanel?.(panel);
  };

  return (
    <View
      className="absolute right-3 top-[242px] z-50 w-[390px] max-w-[94vw] overflow-hidden rounded-lg border p-5 shadow-2xl lg:right-[132px] lg:top-[74px]"
      style={{
        backgroundColor: colors.panel,
        borderColor: colors.border,
        shadowColor: colors.primary,
        shadowOpacity: 0.18,
        shadowRadius: 24,
        transform: [{ translateY: 4 }],
      }}
    >
      <View className="mb-4 flex-row items-start justify-between">
        <View>
          <Text className="text-2xl font-black" style={{ color: colors.text }}>Account Center</Text>
          <Text className="mt-1 text-xs" style={{ color: colors.muted }}>Switch accounts and manage trading access</Text>
        </View>
        <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
          <X size={21} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 620 }}>
      <View className="mb-4 rounded-3xl border p-4" style={{ borderColor: colors.border, backgroundColor: `${colors.primary}10` }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.primary }}>
              <WalletCards size={23} color="#0B0B0B" />
            </View>
            <View className="ml-3">
              <Text className="font-black" style={{ color: colors.text }}>{activeAccount?.type || 'Demo'} Account</Text>
              <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>{accountLabel(activeAccount)}</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-xs" style={{ color: colors.muted }}>Balance</Text>
            <Text className="text-lg font-black" style={{ color: colors.text }}>
              {money(activeAccount?.balance || 0)} {activeAccount?.currency || 'USD'}
            </Text>
          </View>
        </View>
        <View className="mt-4 flex-row items-center justify-between rounded-2xl px-3 py-2" style={{ backgroundColor: colors.surface }}>
          <Text className="text-xs font-semibold" style={{ color: colors.muted }}>Account ID</Text>
          <View className="flex-row items-center">
            <Text className="mr-2 text-xs font-black" style={{ color: colors.text }}>#{accountId(activeAccount)}</Text>
            <Copy size={13} color={colors.muted} />
          </View>
        </View>
      </View>

      <View className="mb-4">
        <Text className="mb-2 text-xs font-black uppercase tracking-wide" style={{ color: colors.muted }}>Switch account</Text>
        {tradingAccounts.map((account) => {
          const selected = String(account.id) === String(activeAccount?.id);
          const statusTone = account.status === 'pending' ? colors.primary : colors.success;
          return (
            <Pressable
              key={account.id}
              onPress={() => onSelectAccount?.(account)}
              className="mb-2 flex-row items-center rounded-2xl border p-3"
              style={{
                backgroundColor: selected ? `${colors.primary}18` : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
              }}
            >
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: selected ? colors.primary : colors.panel }}>
                {selected ? <Check size={18} color="#0B0B0B" /> : <Repeat2 size={17} color={colors.muted} />}
              </View>
              <View className="flex-1">
                <Text className="font-black" style={{ color: colors.text }}>{account.type || 'Demo'} - {accountLabel(account)}</Text>
                <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>#{accountId(account)} | {money(account.balance || 0)} {account.currency || 'USD'}</Text>
              </View>
              <Text className="text-xs font-black" style={{ color: statusTone }}>{account.status || 'active'}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mb-4 rounded-lg border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text className="mb-3 text-xs font-black uppercase tracking-wide" style={{ color: colors.muted }}>Create trading account</Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => createAccount('Demo')}
            disabled={busyType === 'Demo' || demoCount >= 2}
            className="flex-1 flex-row items-center justify-center rounded-xl px-3 py-3"
            style={{ backgroundColor: demoCount >= 2 ? colors.panel : colors.primary, opacity: busyType === 'Demo' ? 0.7 : 1 }}
          >
            <Plus size={16} color={demoCount >= 2 ? colors.muted : '#0B0B0B'} />
            <Text className="ml-2 font-black" style={{ color: demoCount >= 2 ? colors.muted : '#0B0B0B' }}>{busyType === 'Demo' ? 'Creating...' : 'New Demo'}</Text>
          </Pressable>
          <Pressable
            onPress={() => createAccount('Live')}
            disabled={busyType === 'Live' || liveCount >= 2}
            className="flex-1 flex-row items-center justify-center rounded-xl border px-3 py-3"
            style={{ borderColor: colors.border, backgroundColor: colors.panel, opacity: busyType === 'Live' ? 0.7 : 1 }}
          >
            <Plus size={16} color={colors.primary} />
            <Text className="ml-2 font-black" style={{ color: liveCount >= 2 ? colors.muted : colors.text }}>{busyType === 'Live' ? 'Creating...' : 'New Live'}</Text>
          </Pressable>
        </View>
        <Text className="mt-2 text-[11px]" style={{ color: colors.muted }}>Demo {demoCount}/2 | Live {liveCount}/2</Text>
      </View>

      <View className="mb-4 rounded-lg border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text className="mb-3 text-xs font-black uppercase tracking-wide" style={{ color: colors.muted }}>Manage account</Text>
        <View className="gap-2">
          <Pressable onPress={() => openPanel('settings')} className="flex-row items-center rounded-xl border p-3" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
            <BadgeCheck size={18} color={colors.primary} />
            <View className="ml-3 flex-1">
              <Text className="font-black" style={{ color: colors.text }}>Account Details</Text>
              <Text className="text-xs" style={{ color: colors.muted }}>Profile, security and withdrawal settings</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => openPanel('verification')} className="rounded-xl border p-3" style={{ borderColor: verified ? colors.success : colors.primary, backgroundColor: colors.panel }}>
            <View className="flex-row items-center">
              <ShieldCheck size={18} color={verified ? colors.success : colors.primary} />
              <View className="ml-3 flex-1">
                <Text className="font-black" style={{ color: colors.text }}>Verification</Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  {verified ? 'Approved account access' : pending ? 'Documents under admin review' : 'Step 1: Upload ID and address proof'}
                </Text>
              </View>
              <Text className="text-xs font-black" style={{ color: verified ? colors.success : colors.primary }}>{verified ? 'Done' : pending ? 'Review' : 'Start'}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View className="mb-4 rounded-lg border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <View className="mb-3 flex-row items-center">
          <Award size={18} color={colors.primary} />
          <Text className="ml-2 text-xs font-black uppercase tracking-wide" style={{ color: colors.muted }}>Referral Programme</Text>
        </View>
        <Text className="text-2xl font-black" style={{ color: colors.text }}>{referral.code || user?.referralCode || '-'}</Text>
        <Text className="mt-1 text-xs" style={{ color: colors.muted }}>Share your link and view linked clients.</Text>
        <View className="mt-3 flex-row gap-2">
          <View className="flex-1 rounded-xl border p-3" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
            <Text className="text-xs font-bold uppercase" style={{ color: colors.muted }}>My Referrals</Text>
            <Text className="mt-1 text-lg font-black" style={{ color: colors.text }}>{referrals.length || referral.referralCount || 0}</Text>
          </View>
          <View className="flex-1 rounded-xl border p-3" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
            <Text className="text-xs font-bold uppercase" style={{ color: colors.muted }}>Commission</Text>
            <Text className="mt-1 text-lg font-black" style={{ color: colors.text }}>{money(referral.commission || 0)} USD</Text>
          </View>
        </View>
        <Pressable onPress={copyReferral} className="mt-3 rounded-xl border p-3" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
          <Text className="text-xs" numberOfLines={1} style={{ color: colors.text }}>{referral.url || 'Referral link loading...'}</Text>
        </Pressable>
        {referrals.length ? (
          <View className="mt-3">
            {referrals.slice(0, 3).map((referralUser) => (
              <View key={referralUser.id} className="mt-2 rounded-xl border p-3" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                <Text className="font-black" style={{ color: colors.text }}>{referralUser.name || 'Client'}</Text>
                <Text className="text-xs" style={{ color: colors.muted }}>{referralUser.email || '-'}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <Pressable onPress={() => openPanel('referral')} className="mt-3 rounded-xl px-4 py-3" style={{ backgroundColor: colors.primary }}>
          <Text className="text-center font-black text-black">Open Referral Details</Text>
        </Pressable>
      </View>

      {message ? <Text className="rounded-lg border p-3 text-xs" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}>{message}</Text> : null}
      </ScrollView>
    </View>
  );
}
