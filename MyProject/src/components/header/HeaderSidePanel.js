import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  Award,
  BadgeCheck,
  Bell,
  CheckCircle2,
  Camera,
  CreditCard,
  FileText,
  History,
  LockKeyhole,
  LogOut,
  Moon,
  Plus,
  Save,
  ShieldCheck,
  Sun,
  UploadCloud,
  UserRound,
  Wallet,
  X,
} from 'lucide-react-native';
import { Animated, Image, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import CustomButton from '../common/CustomButton';
import DepositForm from '../wallet/DepositForm';
import WithdrawForm from '../wallet/WithdrawForm';
import TransactionList from '../wallet/TransactionList';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../context/ThemeContext';
import { useWallet } from '../../hooks/useWallet';
import { dashboardService } from '../../services/dashboardService';
import { authService } from '../../services/authService';
import { money } from '../../utils/formatters';

function readFileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const normalizeBankAccount = (account) => ({
  id: account.id,
  bankAccountHolder: account.bankAccountHolder || account.accountHolderName || '',
  bankName: account.bankName || '',
  bankBranch: account.bankBranch || account.branchName || '',
  bankAccountNumber: account.bankAccountNumber || account.accountNumber || '',
  status: account.status || 'pending',
  payoutType: String(`${account.bankName || ''} ${account.branchName || account.bankBranch || ''}`).toLowerCase().includes('trc20') ? 'TRC20' : 'Bank',
});

function PanelHeader({ title, subtitle, icon: Icon, onClose, colors }) {
  return (
    <View className="flex-row items-start justify-between border-b px-6 py-5" style={{ borderColor: colors.border }}>
      <View className="flex-row items-center">
        <View className="h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: `${colors.primary}22` }}>
          <Icon size={22} color={colors.primary} />
        </View>
        <View className="ml-3">
          <Text className="text-2xl font-extrabold" style={{ color: colors.text }}>{title}</Text>
          {subtitle ? <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{subtitle}</Text> : null}
        </View>
      </View>
      <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-md" style={{ backgroundColor: colors.surface }}>
        <X size={22} color={colors.text} />
      </Pressable>
    </View>
  );
}

function InfoCard({ label, value, colors }) {
  return (
    <View className="min-w-[145px] flex-1 rounded-lg border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <Text className="text-xs font-bold uppercase" style={{ color: colors.muted }}>{label}</Text>
      <Text className="mt-2 text-lg font-black" style={{ color: colors.text }}>{value}</Text>
    </View>
  );
}

function ReferralPanel({ dashboard, colors }) {
  const referral = dashboard?.referral || {};
  const referrals = referral.referrals || [];
  const [copied, setCopied] = useState(false);
  const copyReferral = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && referral.url) {
      await navigator.clipboard.writeText(referral.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <View className="gap-4 p-6">
      <View className="rounded-lg border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text className="text-xs font-black uppercase" style={{ color: colors.primary }}>Referral Code</Text>
        <Text className="mt-2 text-3xl font-black" style={{ color: colors.text }}>{referral.code || '-'}</Text>
        <TextInput
          editable={false}
          value={referral.url || ''}
          className="mt-4 rounded-md border p-3"
          style={{ backgroundColor: colors.panel, borderColor: colors.border, color: colors.text }}
        />
        <CustomButton title={copied ? 'Copied' : 'Copy Referral Link'} onPress={copyReferral} className="mt-4" />
      </View>
      <View className="flex-row flex-wrap gap-3">
        <InfoCard label="Referrals" value={String(referral.referralCount || referrals.length || 0)} colors={colors} />
        <InfoCard label="Commission" value={`${money(referral.commission || 0)} USD`} colors={colors} />
      </View>
      <View className="rounded-lg border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text className="mb-3 text-lg font-black" style={{ color: colors.text }}>My Referrals</Text>
        {referrals.length ? referrals.map((item) => (
          <View key={item.id} className="mb-2 rounded-md border p-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
            <Text className="font-bold" style={{ color: colors.text }}>{item.name || 'Client'}</Text>
            <Text className="text-xs" style={{ color: colors.muted }}>{item.email || '-'}</Text>
          </View>
        )) : <Text style={{ color: colors.muted }}>No referrals yet.</Text>}
      </View>
    </View>
  );
}

function accountId(account) {
  return String(account?.id || '').replace(/\D/g, '').slice(-8).padStart(8, '0');
}

function AccountPanel({ dashboard, selectedAccount, summary, colors, onAccountsChanged }) {
  const { user } = useAuth();
  const [busyType, setBusyType] = useState('');
  const [message, setMessage] = useState('');
  const [confirmType, setConfirmType] = useState('');
  const accounts = dashboard?.accounts || [];
  const activeAccount = selectedAccount || accounts[0] || {
    id: user?.id,
    type: user?.accountType || 'Demo',
    name: user?.accountType === 'Live' ? 'Live account 1' : 'Demo account 1',
    balance: summary?.balance || user?.wallet?.balance || 0,
    currency: 'USD',
    status: user?.tradingStatus || 'active',
  };
  const demoCount = accounts.filter((account) => account.type === 'Demo').length;
  const liveCount = accounts.filter((account) => account.type === 'Live').length;

  const createAccount = async (type) => {
    setBusyType(type);
    setMessage('');
    try {
      const result = await dashboardService.createAccount(type, true);
      const nextDashboard = await dashboardService.getDashboard();
      onAccountsChanged?.(nextDashboard.accounts || []);
      setMessage(`${result.account?.name || type} created successfully.`);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || `${type} account could not be created.`);
    } finally {
      setBusyType('');
      setConfirmType('');
    }
  };

  return (
    <View className="gap-5 p-6">
      <View className="gap-4 lg:flex-row">
        <View className="flex-1 rounded-lg border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text className="text-xs font-black uppercase" style={{ color: colors.muted }}>Selected Account</Text>
          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="h-14 w-14 items-center justify-center rounded-lg" style={{ backgroundColor: colors.primary }}>
                <Wallet size={25} color="#0B0B0B" />
              </View>
              <View className="ml-4">
                <Text className="text-xl font-black" style={{ color: colors.text }}>{activeAccount.type || 'Demo'} Account</Text>
                <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{activeAccount.name || 'Trading account'}</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-xs" style={{ color: colors.muted }}>Balance</Text>
              <Text className="text-2xl font-black" style={{ color: colors.text }}>{money(activeAccount.balance || 0)} {activeAccount.currency || 'USD'}</Text>
            </View>
          </View>
          <View className="mt-5 flex-row flex-wrap gap-3">
            <InfoCard label="Account ID" value={`#${accountId(activeAccount)}`} colors={colors} />
            <InfoCard label="Status" value={activeAccount.status || 'active'} colors={colors} />
            <InfoCard label="Leverage" value={activeAccount.leverage || '1:100'} colors={colors} />
          </View>
        </View>

        <View className="flex-1 rounded-lg border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Text className="text-xs font-black uppercase" style={{ color: colors.muted }}>Create Trading Account</Text>
          <Text className="mt-2 text-sm" style={{ color: colors.muted }}>Create extra demo/live accounts from inside the account section.</Text>
          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={() => setConfirmType('Demo')}
              disabled={busyType === 'Demo' || demoCount >= 2}
              className="flex-1 flex-row items-center justify-center rounded-lg px-4 py-4"
              style={{ backgroundColor: demoCount >= 2 ? colors.panel : colors.primary, opacity: busyType === 'Demo' ? 0.7 : 1 }}
            >
              <Plus size={17} color={demoCount >= 2 ? colors.muted : '#0B0B0B'} />
              <Text className="ml-2 font-black" style={{ color: demoCount >= 2 ? colors.muted : '#0B0B0B' }}>{busyType === 'Demo' ? 'Creating...' : 'New Demo'}</Text>
            </Pressable>
            <Pressable
              onPress={() => setConfirmType('Live')}
              disabled={busyType === 'Live' || liveCount >= 2}
              className="flex-1 flex-row items-center justify-center rounded-lg border px-4 py-4"
              style={{ borderColor: colors.border, backgroundColor: colors.panel, opacity: busyType === 'Live' ? 0.7 : 1 }}
            >
              <Plus size={17} color={colors.primary} />
              <Text className="ml-2 font-black" style={{ color: liveCount >= 2 ? colors.muted : colors.text }}>{busyType === 'Live' ? 'Creating...' : 'New Live'}</Text>
            </Pressable>
          </View>
          <Text className="mt-3 text-xs" style={{ color: colors.muted }}>Demo {demoCount}/2 | Live {liveCount}/2</Text>
          {confirmType ? (
            <View className="mt-5 rounded-lg border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.primary }}>
              <Text className="text-lg font-black" style={{ color: colors.text }}>Create {confirmType} account?</Text>
              <Text className="mt-1 text-sm" style={{ color: colors.muted }}>
                This will add a new {confirmType.toLowerCase()} trading account to your profile.
              </Text>
              <View className="mt-4 flex-row gap-3">
                <Pressable onPress={() => setConfirmType('')} className="flex-1 rounded-lg border px-4 py-3" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
                  <Text className="text-center font-black" style={{ color: colors.text }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={() => createAccount(confirmType)} disabled={Boolean(busyType)} className="flex-1 rounded-lg px-4 py-3" style={{ backgroundColor: colors.primary, opacity: busyType ? 0.7 : 1 }}>
                  <Text className="text-center font-black text-black">{busyType ? 'Creating...' : 'Confirm'}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <View className="rounded-lg border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text className="text-xl font-black" style={{ color: colors.text }}>All Trading Accounts</Text>
        <View className="mt-4 gap-3">
          {accounts.length ? accounts.map((account) => (
            <View key={account.id} className="flex-row flex-wrap items-center justify-between gap-3 rounded-lg border p-4" style={{ backgroundColor: colors.panel, borderColor: String(account.id) === String(activeAccount.id) ? colors.primary : colors.border }}>
              <View>
                <Text className="font-black" style={{ color: colors.text }}>{account.type} - {account.name}</Text>
                <Text className="mt-1 text-xs" style={{ color: colors.muted }}>#{accountId(account)} | {account.status || 'active'} | {account.leverage || '1:100'}</Text>
              </View>
              <Text className="font-black" style={{ color: colors.text }}>{money(account.balance || 0)} {account.currency || 'USD'}</Text>
            </View>
          )) : <Text style={{ color: colors.muted }}>No trading accounts found.</Text>}
        </View>
      </View>

      {message ? <Text className="rounded-lg border p-3 text-sm" style={{ borderColor: colors.border, color: colors.text }}>{message}</Text> : null}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, editable = true, colors }) {
  return (
    <View className="mb-4 flex-1">
      <Text className="mb-2 text-sm font-black" style={{ color: colors.text }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        className="rounded-lg border px-4 py-3"
        style={{ backgroundColor: colors.panel, borderColor: colors.border, color: colors.text }}
      />
    </View>
  );
}

function SettingsTab({ active, title, subtitle, icon: Icon, onPress, colors }) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center border-l-4 p-4"
      style={{
        backgroundColor: active ? `${colors.primary}18` : 'transparent',
        borderLeftColor: active ? colors.primary : 'transparent',
      }}
    >
      <View className="h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: active ? `${colors.primary}22` : colors.surface }}>
        <Icon size={20} color={active ? colors.primary : colors.muted} />
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <Text className="font-black" style={{ color: active ? colors.primary : colors.text }}>{title}</Text>
        <Text className="mt-1 text-xs" numberOfLines={1} style={{ color: colors.muted }}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function ToggleRow({ title, subtitle, active, onPress, colors }) {
  return (
    <Pressable onPress={onPress} className="mb-3 flex-row items-center justify-between rounded-lg border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <View className="mr-4 flex-1">
        <Text className="font-black" style={{ color: colors.text }}>{title}</Text>
        <Text className="mt-1 text-xs" style={{ color: colors.muted }}>{subtitle}</Text>
      </View>
      <View className="h-7 w-12 justify-center rounded-full px-1" style={{ backgroundColor: active ? colors.primary : colors.surface }}>
        <View className="h-5 w-5 rounded-full bg-white" style={{ alignSelf: active ? 'flex-end' : 'flex-start' }} />
      </View>
    </Pressable>
  );
}

function SettingsPanel({ colors, darkMode, toggleTheme, user, updateProfile }) {
  const { logout } = useAuth();
  const profileImageInputRef = useRef(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || 'Sri Lanka',
    dateOfBirth: user?.dateOfBirth || '',
    profileImage: user?.profileImage || null,
  });
  const [bankAccounts, setBankAccounts] = useState([]);
  const [bank, setBank] = useState({ bankAccountHolder: '', bankName: '', bankBranch: '', bankAccountNumber: '' });
  const [trc20, setTrc20] = useState({ walletHolderName: '', walletAddress: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [resetForm, setResetForm] = useState({ resetToken: '', password: '' });
  const [notificationSettings, setNotificationSettings] = useState({
    tradeAlerts: true,
    depositAlerts: true,
    marketNews: false,
    emailUpdates: true,
  });

  const loadBankAccounts = async () => {
    const result = await authService.listBankAccounts();
    const accounts = (result.accounts || []).map(normalizeBankAccount);
    setBankAccounts(accounts);
    const savedBank = accounts.find((item) => item.payoutType === 'Bank');
    const savedTrc20 = accounts.find((item) => item.payoutType === 'TRC20');
    if (savedBank) {
      setBank({
        bankAccountHolder: savedBank.bankAccountHolder,
        bankName: savedBank.bankName,
        bankBranch: savedBank.bankBranch,
        bankAccountNumber: savedBank.bankAccountNumber,
      });
    }
    if (savedTrc20) {
      setTrc20({
        walletHolderName: savedTrc20.bankAccountHolder,
        walletAddress: savedTrc20.bankAccountNumber,
      });
    }
  };

  useEffect(() => {
    loadBankAccounts().catch(() => {});
  }, []);

  useEffect(() => {
    setProfile({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      country: user?.country || 'Sri Lanka',
      dateOfBirth: user?.dateOfBirth || '',
      profileImage: user?.profileImage || null,
    });
  }, [user]);

  const openProfileImagePicker = () => {
    if (Platform.OS === 'web') {
      profileImageInputRef.current?.click();
    }
  };

  const selectProfileImage = async (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    if (!file) return;
    setMessage('');
    if (!file.type?.startsWith('image/')) {
      setMessage('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Profile photo must be 5MB or smaller.');
      return;
    }
    try {
      const profileImage = await readFileDataUrl(file);
      setProfile((current) => ({ ...current, profileImage }));
    } catch {
      setMessage('Profile photo could not be loaded.');
    }
  };

  const removeProfileImage = () => {
    setProfile((current) => ({ ...current, profileImage: null }));
  };

  const saveProfile = async () => {
    setBusy(true);
    setMessage('');
    try {
      await updateProfile({
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        country: profile.country.trim(),
        dateOfBirth: profile.dateOfBirth.trim(),
        profileImage: profile.profileImage,
      });
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Profile update failed.');
    } finally {
      setBusy(false);
    }
  };

  const saveBank = async () => {
    setBusy(true);
    setMessage('');
    try {
      const existing = bankAccounts.find((item) => item.payoutType === 'Bank');
      const payload = {
        bankAccountHolder: bank.bankAccountHolder.trim(),
        bankName: bank.bankName.trim(),
        bankBranch: bank.bankBranch.trim(),
        bankAccountNumber: bank.bankAccountNumber.trim(),
      };
      if (existing?.id) await authService.updateBankAccount(existing.id, payload);
      else await authService.createBankAccount(payload);
      await loadBankAccounts();
      setMessage('Bank details submitted for admin approval.');
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Bank details save failed.');
    } finally {
      setBusy(false);
    }
  };

  const saveTrc20 = async () => {
    setBusy(true);
    setMessage('');
    try {
      const existing = bankAccounts.find((item) => item.payoutType === 'TRC20');
      const payload = {
        bankAccountHolder: trc20.walletHolderName.trim(),
        bankName: 'USDT TRC20',
        bankBranch: 'TRC20',
        bankAccountNumber: trc20.walletAddress.trim(),
      };
      if (existing?.id) await authService.updateBankAccount(existing.id, payload);
      else await authService.createBankAccount(payload);
      await loadBankAccounts();
      setMessage('TRC20 details submitted for admin approval.');
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'TRC20 details save failed.');
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    setBusy(true);
    setMessage('');
    try {
      await authService.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password updated successfully.');
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Password update failed.');
    } finally {
      setBusy(false);
    }
  };

  const requestPasswordReset = async () => {
    setBusy(true);
    setMessage('');
    try {
      await authService.forgotPassword({ email: profile.email || user?.email });
      setMessage('Password reset code sent to your email.');
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Reset code request failed.');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setBusy(true);
    setMessage('');
    try {
      await authService.resetPassword(resetForm);
      setResetForm({ resetToken: '', password: '' });
      setMessage('Password reset successfully.');
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Password reset failed.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  const tabs = [
    ['profile', 'Profile', 'Edit your profile details', UserRound],
    ['security', 'Security', 'Password and account access', LockKeyhole],
    ['notifications', 'Notifications', 'Manage your alerts', Bell],
    ['payments', 'Payments', 'Withdrawal methods', CreditCard],
    ['session', 'Session', 'Sign out and sessions', LogOut],
  ];

  return (
    <View className="min-h-[620px] lg:flex-row">
      <View className="border-b p-4 lg:w-[300px] lg:border-b-0 lg:border-r" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
        {tabs.map(([key, title, subtitle, Icon]) => (
          <SettingsTab key={key} active={activeSection === key} title={title} subtitle={subtitle} icon={Icon} onPress={() => setActiveSection(key)} colors={colors} />
        ))}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        {activeSection === 'profile' ? (
          <View className="rounded-lg border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-black" style={{ color: colors.text }}>Profile</Text>
                <Text className="mt-1 text-sm" style={{ color: colors.muted }}>Edit your profile details</Text>
              </View>
              <CustomButton title={busy ? 'Saving...' : 'Save Profile'} onPress={saveProfile} disabled={busy} className="min-w-[150px]" />
            </View>
            <View className="gap-4 lg:flex-row">
              <View className="w-full items-center rounded-lg border p-5 lg:w-[250px]" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                <View className="h-32 w-32 overflow-hidden rounded-full border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  {profile.profileImage ? (
                    <Image source={{ uri: profile.profileImage }} className="h-full w-full" resizeMode="cover" />
                  ) : (
                    <View className="h-full w-full items-center justify-center">
                      <Text className="text-4xl font-black" style={{ color: colors.primary }}>{String(profile.name || profile.email || 'NU').slice(0, 2).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                {Platform.OS === 'web' ? (
                  <input ref={profileImageInputRef} accept="image/*" style={{ display: 'none' }} type="file" onChange={selectProfileImage} />
                ) : null}
                <Pressable onPress={openProfileImagePicker} className="-mt-9 ml-24 h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
                  <Camera size={18} color="#0B0B0B" />
                </Pressable>
                <View className="mt-4 flex-row flex-wrap justify-center gap-2">
                  <Pressable onPress={openProfileImagePicker} className="rounded-lg border px-3 py-2" style={{ borderColor: colors.primary }}>
                    <Text className="text-xs font-bold" style={{ color: colors.primary }}>{profile.profileImage ? 'Change Photo' : 'Add Photo'}</Text>
                  </Pressable>
                  {profile.profileImage ? (
                    <Pressable onPress={removeProfileImage} className="rounded-lg px-3 py-2" style={{ backgroundColor: `${colors.danger}18` }}>
                      <Text className="text-xs font-bold" style={{ color: colors.danger }}>Remove Photo</Text>
                    </Pressable>
                  ) : null}
                </View>
                <Text className="mt-4 text-xl font-black" style={{ color: colors.text }}>{profile.name || 'NovaFXM Client'}</Text>
                <Text className="mt-2 rounded-lg px-3 py-2 text-xs font-black" style={{ backgroundColor: user?.verificationStatus === 'approved' ? `${colors.success}22` : `${colors.primary}22`, color: user?.verificationStatus === 'approved' ? colors.success : colors.primary }}>
                  {user?.verificationStatus === 'approved' ? 'Verified' : 'Not Verified'}
                </Text>
              </View>
              <View className="flex-1">
                <View className="gap-4 lg:flex-row">
                  <Field label="Full Name" value={profile.name} onChangeText={(name) => setProfile((current) => ({ ...current, name }))} placeholder="Your full name" colors={colors} />
                  <Field label="Email Address" value={profile.email} onChangeText={(email) => setProfile((current) => ({ ...current, email }))} placeholder="email@example.com" colors={colors} />
                </View>
                <View className="gap-4 lg:flex-row">
                  <Field label="Country" value={profile.country} onChangeText={(country) => setProfile((current) => ({ ...current, country }))} placeholder="Sri Lanka" colors={colors} />
                  <Field label="Phone Number" value={profile.phone} onChangeText={(phone) => setProfile((current) => ({ ...current, phone }))} placeholder="+94 77 123 4567" colors={colors} />
                </View>
                <Field label="Date of Birth" value={profile.dateOfBirth} onChangeText={(dateOfBirth) => setProfile((current) => ({ ...current, dateOfBirth }))} placeholder="DD / MM / YYYY" colors={colors} />
              </View>
            </View>
          </View>
        ) : null}

        {activeSection === 'security' ? (
          <View className="gap-4">
            <View className="rounded-lg border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className="text-2xl font-black" style={{ color: colors.text }}>Security</Text>
              <Text className="mt-1 text-sm" style={{ color: colors.muted }}>Change your password and recover account access.</Text>
              <View className="mt-5 gap-4 lg:flex-row">
                <Field label="Current Password" value={passwordForm.currentPassword} onChangeText={(currentPassword) => setPasswordForm((current) => ({ ...current, currentPassword }))} placeholder="Current password" colors={colors} />
                <Field label="New Password" value={passwordForm.newPassword} onChangeText={(newPassword) => setPasswordForm((current) => ({ ...current, newPassword }))} placeholder="Minimum 8 characters" colors={colors} />
                <Field label="Confirm Password" value={passwordForm.confirmPassword} onChangeText={(confirmPassword) => setPasswordForm((current) => ({ ...current, confirmPassword }))} placeholder="Confirm new password" colors={colors} />
              </View>
              <CustomButton title={busy ? 'Saving...' : 'Change Password'} onPress={changePassword} disabled={busy} className="mt-2 max-w-[220px]" />
            </View>
            <View className="rounded-lg border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className="text-xl font-black" style={{ color: colors.text }}>Password Reset</Text>
              <Text className="mt-1 text-sm" style={{ color: colors.muted }}>Send a reset code to your email, then set a new password.</Text>
              <View className="mt-4 flex-row flex-wrap gap-3">
                <CustomButton title={busy ? 'Sending...' : 'Send Reset Code'} onPress={requestPasswordReset} disabled={busy} className="min-w-[190px]" />
              </View>
              <View className="mt-4 gap-4 lg:flex-row">
                <Field label="Reset Code" value={resetForm.resetToken} onChangeText={(resetToken) => setResetForm((current) => ({ ...current, resetToken }))} placeholder="Code from email" colors={colors} />
                <Field label="New Password" value={resetForm.password} onChangeText={(password) => setResetForm((current) => ({ ...current, password }))} placeholder="Minimum 8 characters" colors={colors} />
              </View>
              <CustomButton title={busy ? 'Updating...' : 'Reset Password'} onPress={resetPassword} disabled={busy} className="max-w-[190px]" />
            </View>
          </View>
        ) : null}

        {activeSection === 'notifications' ? (
          <View className="rounded-lg border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <Text className="text-2xl font-black" style={{ color: colors.text }}>Notifications</Text>
            <Text className="mt-1 text-sm" style={{ color: colors.muted }}>Choose what you want NovaFXM to tell you about.</Text>
            <View className="mt-5">
              {[
                ['tradeAlerts', 'Trade Alerts', 'Order opens, closes, margin warnings and risk alerts.'],
                ['depositAlerts', 'Deposit and Withdrawal Updates', 'Funding requests, approvals and rejected requests.'],
                ['marketNews', 'Market News', 'Important market and product updates.'],
                ['emailUpdates', 'Email Updates', 'Send account updates to your email.'],
              ].map(([key, title, subtitle]) => (
                <ToggleRow
                  key={key}
                  title={title}
                  subtitle={subtitle}
                  active={notificationSettings[key]}
                  onPress={() => setNotificationSettings((current) => ({ ...current, [key]: !current[key] }))}
                  colors={colors}
                />
              ))}
            </View>
          </View>
        ) : null}

        {activeSection === 'payments' ? (
          <View className="rounded-lg border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <Text className="text-2xl font-black" style={{ color: colors.text }}>Payments</Text>
            <Text className="mt-1 text-sm" style={{ color: colors.muted }}>Save bank and USDT TRC20 withdrawal details.</Text>
            <View className="mt-5 gap-4 lg:flex-row">
              <View className="flex-1 rounded-lg border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                <Text className="mb-3 text-lg font-black" style={{ color: colors.text }}>Bank Account</Text>
                <Field label="Account Holder" value={bank.bankAccountHolder} onChangeText={(bankAccountHolder) => setBank((current) => ({ ...current, bankAccountHolder }))} placeholder="Name on bank account" colors={colors} />
                <Field label="Bank Name" value={bank.bankName} onChangeText={(bankName) => setBank((current) => ({ ...current, bankName }))} placeholder="Bank name" colors={colors} />
                <Field label="Branch" value={bank.bankBranch} onChangeText={(bankBranch) => setBank((current) => ({ ...current, bankBranch }))} placeholder="Branch name" colors={colors} />
                <Field label="Account Number" value={bank.bankAccountNumber} onChangeText={(bankAccountNumber) => setBank((current) => ({ ...current, bankAccountNumber }))} placeholder="Account number" colors={colors} />
                <CustomButton title={busy ? 'Saving...' : 'Save Bank Details'} onPress={saveBank} disabled={busy} />
              </View>
              <View className="flex-1 rounded-lg border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                <Text className="mb-3 text-lg font-black" style={{ color: colors.text }}>USDT TRC20</Text>
                <Field label="Wallet Holder" value={trc20.walletHolderName} onChangeText={(walletHolderName) => setTrc20((current) => ({ ...current, walletHolderName }))} placeholder="Wallet holder name" colors={colors} />
                <Field label="Wallet Address" value={trc20.walletAddress} onChangeText={(walletAddress) => setTrc20((current) => ({ ...current, walletAddress }))} placeholder="TRC20 wallet address" colors={colors} />
                <CustomButton title={busy ? 'Saving...' : 'Save TRC20 Details'} onPress={saveTrc20} disabled={busy} />
              </View>
            </View>
            <View className="mt-5 rounded-lg border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
              <Text className="mb-3 text-lg font-black" style={{ color: colors.text }}>Saved Payment Methods</Text>
              {bankAccounts.length ? bankAccounts.map((account) => (
                <View key={account.id} className="mb-2 flex-row items-center justify-between rounded-md border p-3" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
                  <View>
                    <Text className="font-black" style={{ color: colors.text }}>{account.payoutType}</Text>
                    <Text className="text-xs" style={{ color: colors.muted }}>{account.bankName} | {account.bankAccountNumber}</Text>
                  </View>
                  <Text className="text-xs font-black uppercase" style={{ color: account.status === 'approved' ? colors.success : colors.primary }}>{account.status}</Text>
                </View>
              )) : <Text style={{ color: colors.muted }}>No payment methods saved yet.</Text>}
            </View>
          </View>
        ) : null}

        {activeSection === 'session' ? (
          <View className="rounded-lg border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <Text className="text-2xl font-black" style={{ color: colors.text }}>Session</Text>
            <Text className="mt-1 text-sm" style={{ color: colors.muted }}>Manage your theme and account session.</Text>
            <Pressable onPress={toggleTheme} className="mt-5 flex-row items-center justify-between rounded-lg border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
              <View className="flex-row items-center">
                {darkMode ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
                <View className="ml-3">
                  <Text className="font-black" style={{ color: colors.text }}>Mode</Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>{darkMode ? 'Dark mode enabled' : 'Light mode enabled'}</Text>
                </View>
              </View>
              <Text className="font-bold" style={{ color: colors.primary }}>Change</Text>
            </Pressable>
            <View className="mt-4 rounded-lg border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
              <Text className="font-black" style={{ color: colors.text }}>{profile.email || user?.email || 'Signed in user'}</Text>
              <Text className="mt-1 text-xs" style={{ color: colors.muted }}>End this account session safely.</Text>
              <CustomButton title="Sign Out" variant="secondary" onPress={signOut} className="mt-4 max-w-[160px]" />
            </View>
          </View>
        ) : null}

        {message ? <Text className="mt-4 rounded-lg border p-3 text-sm" style={{ borderColor: colors.border, color: colors.text }}>{message}</Text> : null}
      </ScrollView>
    </View>
  );
}

function VerificationStepCard({ title, description, badge, active, complete, locked, icon: Icon, colors }) {
  const borderColor = complete ? colors.success : active ? colors.primary : locked ? colors.muted : colors.border;
  const backgroundColor = complete ? `${colors.success}14` : active ? `${colors.primary}12` : colors.panel;

  return (
    <View className="mb-3 rounded-lg border p-5" style={{ backgroundColor, borderColor }}>
      <View className="flex-row items-start justify-between">
        <View className="h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: complete ? `${colors.success}22` : active ? `${colors.primary}22` : colors.surface }}>
          <Icon size={22} color={complete ? colors.success : active ? colors.primary : colors.text} />
        </View>
        <Text className="rounded-full px-3 py-1 text-[10px] font-black uppercase" style={{ backgroundColor: active ? colors.primary : colors.surface, color: active ? '#0B0B0B' : colors.muted }}>
          {badge}
        </Text>
      </View>
      <Text className="mt-4 text-lg font-black" style={{ color: colors.text }}>{title}</Text>
      <Text className="mt-2 text-sm" style={{ color: colors.muted }}>{description}</Text>
    </View>
  );
}

function VerificationPanel({ user, colors, submitVerification, refreshUser }) {
  const approved = user?.verificationStatus === 'approved';
  const pending = user?.verificationStatus === 'pending';
  const rejected = user?.verificationStatus === 'rejected';
  const idInputRef = useRef(null);
  const addressInputRef = useRef(null);
  const [files, setFiles] = useState({ idProof: null, addressProof: null });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const selectFile = (key) => (event) => {
    setFiles((current) => ({ ...current, [key]: event.target.files?.[0] || null }));
    setMessage('');
  };

  const upload = async () => {
    setBusy(true);
    setMessage('');
    try {
      if (!files.idProof || !files.addressProof) throw new Error('Please select both ID proof and address proof.');
      const [idProofImage, addressProofImage] = await Promise.all([
        readFileDataUrl(files.idProof),
        readFileDataUrl(files.addressProof),
      ]);
      await submitVerification({ idProofImage, addressProofImage });
      await refreshUser?.();
      setMessage('Verification documents submitted. Waiting for admin review.');
    } catch (error) {
      setMessage(error.message || 'Verification upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="p-6">
      <View className="rounded-lg border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <View className="mb-6 flex-row flex-wrap items-center justify-between gap-3">
          <View>
            <Text className="text-sm font-black" style={{ color: colors.text }}>Verification Status</Text>
            <Text className="text-2xl font-black" style={{ color: colors.text }}>Unlock full account access</Text>
            <Text className="mt-1 text-sm" style={{ color: colors.muted }}>Upload your documents to enable withdrawals and full account features.</Text>
          </View>
          <Text className="rounded-full border px-4 py-2 text-sm font-black" style={{ borderColor: approved ? colors.success : colors.primary, color: approved ? colors.success : colors.primary }}>
            {approved ? 'KYC Approved' : pending ? 'Under Review' : rejected ? 'Try Again' : 'KYC Required'}
          </Text>
        </View>
        {approved ? (
          <View className="mb-5 rounded-lg border p-4" style={{ backgroundColor: `${colors.success}14`, borderColor: colors.success }}>
            <Text className="font-black" style={{ color: colors.success }}>Your verification is approved.</Text>
            <Text className="mt-1 text-sm" style={{ color: colors.muted }}>Full account funding and trading features are unlocked.</Text>
          </View>
        ) : null}
        {pending ? (
          <View className="mb-5 rounded-lg border p-4" style={{ backgroundColor: `${colors.primary}12`, borderColor: colors.primary }}>
            <Text className="font-black" style={{ color: colors.primary }}>Documents submitted.</Text>
            <Text className="mt-1 text-sm" style={{ color: colors.muted }}>Admin is reviewing your KYC documents. You can submit again after review if needed.</Text>
          </View>
        ) : null}
        <View className="gap-5 lg:flex-row">
          <View className="flex-[1.4]">
            <VerificationStepCard
              title="Unverified"
              description="Step 1: upload your ID proof and address proof."
              badge={!approved && !pending ? 'You are here' : 'Complete'}
              active={!approved && !pending}
              complete={approved || pending}
              icon={CheckCircle2}
              colors={colors}
            />
            <VerificationStepCard
              title="Verified"
              description="Step 2: admin reviews your documents and unlocks full account access."
              badge={approved ? 'You are here' : pending ? 'In review' : 'Up next'}
              active={pending || approved}
              complete={approved}
              icon={UploadCloud}
              colors={colors}
            />
          </View>

          <View className="flex-1 rounded-lg border p-5" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
            <View className="h-14 w-14 items-center justify-center rounded-lg" style={{ backgroundColor: `${colors.success}20` }}>
              <FileText size={25} color={colors.primary} />
            </View>
            <Text className="mt-5 text-xl font-black" style={{ color: colors.text }}>Document Requirements</Text>
            <Text className="mt-2 text-sm" style={{ color: colors.muted }}>Both files are required before submission.</Text>
            {Platform.OS === 'web' ? (
              <>
                <input ref={idInputRef} accept="image/*" style={{ display: 'none' }} type="file" onChange={selectFile('idProof')} />
                <input ref={addressInputRef} accept="image/*" style={{ display: 'none' }} type="file" onChange={selectFile('addressProof')} />
              </>
            ) : null}
            <Pressable onPress={() => idInputRef.current?.click()} className="mt-6 flex-row items-center rounded-lg border p-4" style={{ borderColor: colors.success, backgroundColor: colors.surface }}>
              <View className="h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${colors.success}18` }}>
                <FileText size={18} color={colors.success} />
              </View>
              <View className="ml-3">
                <Text className="font-black" style={{ color: colors.text }}>ID Proof</Text>
                <Text className="text-xs" style={{ color: colors.muted }}>{files.idProof?.name || 'Passport, national ID or driving licence'}</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => addressInputRef.current?.click()} className="mt-3 flex-row items-center rounded-lg border p-4" style={{ borderColor: colors.success, backgroundColor: colors.surface }}>
              <View className="h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${colors.success}18` }}>
                <FileText size={18} color={colors.success} />
              </View>
              <View className="ml-3">
                <Text className="font-black" style={{ color: colors.text }}>Address Proof</Text>
                <Text className="text-xs" style={{ color: colors.muted }}>{files.addressProof?.name || 'Bank statement or utility bill'}</Text>
              </View>
            </Pressable>
            <CustomButton title={busy ? 'Submitting...' : 'Submit Verification'} onPress={upload} disabled={busy || approved || user?.verificationStatus === 'pending'} className="mt-5" />
            {message ? <Text className="mt-3 text-sm" style={{ color: colors.text }}>{message}</Text> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function HeaderSidePanel({ type, selectedAccount, summary, onClose, onAccountsChanged }) {
  const { user, updateProfile, submitVerification, refreshUser } = useAuth();
  const { colors, darkMode, toggleTheme } = useAppTheme();
  const { deposit, withdraw, loading: walletLoading } = useWallet();
  const { width, height } = useWindowDimensions();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(-34)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const panelWidth = Math.min(1180, Math.max(340, width * 0.96));
  const panelHeight = Math.min(height * 0.9, height - 32);

  useEffect(() => {
    let active = true;
    if (!user || !type) return undefined;
    setLoading(true);
    dashboardService.getDashboard()
      .then((result) => {
        if (active) setDashboard(result);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [type, user]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const wallet = dashboard?.wallet || {};
  const transactions = dashboard?.transactions || [];
  const balance = Number.isFinite(Number(selectedAccount?.balance))
    ? Number(selectedAccount.balance)
    : Number(wallet.balance || summary?.balance || 0);
  const fundingLocked = Boolean(user && user.verificationStatus !== 'approved');
  const fundingLockedMessage = 'Verification approval is required before withdrawals.';
  const titleMap = {
    account: ['Account Details', 'Trading accounts and account creation', BadgeCheck],
    deposit: ['Deposit', 'Submit a funding request', Wallet],
    withdraw: ['Withdraw', 'Request funds from your account', Wallet],
    history: ['Transaction History', 'Deposits, withdrawals and account activity', History],
    settings: ['My Settings', 'Profile, security, notifications and payments', Moon],
    verification: ['Verification', 'Step-wise KYC status and documents', ShieldCheck],
    referral: ['Referral Programme', 'Invite clients and earn rewards', Award],
  };
  const [title, subtitle, Icon] = titleMap[type] || titleMap.history;

  const summaryCards = useMemo(() => (
    <View className="flex-row flex-wrap gap-3 p-6 pb-0">
      <InfoCard label="Selected Account" value={selectedAccount?.name || 'Demo account 1'} colors={colors} />
      <InfoCard label="Balance" value={`${money(balance)} USD`} colors={colors} />
    </View>
  ), [balance, colors, selectedAccount?.name]);

  return (
    <View
      className="items-center justify-center p-5"
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 90, backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <Pressable style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} onPress={onClose} />
      <Animated.View
        className="overflow-hidden rounded-lg border shadow-2xl"
        style={{
          width: panelWidth,
          maxHeight: panelHeight,
          backgroundColor: colors.background,
          borderColor: colors.border,
          shadowColor: colors.primary,
          shadowOpacity: 0.14,
          shadowRadius: 30,
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }}
      >
        <PanelHeader title={title} subtitle={subtitle} icon={Icon || BadgeCheck} onClose={onClose} colors={colors} />
        <ScrollView showsVerticalScrollIndicator>
          {['deposit', 'withdraw', 'history'].includes(type) ? summaryCards : null}
          {type === 'account' ? (
            <AccountPanel
              dashboard={dashboard}
              selectedAccount={selectedAccount}
              summary={summary}
              colors={colors}
              onAccountsChanged={onAccountsChanged}
            />
          ) : null}
          {type === 'deposit' ? (
            <View className="p-6">
              <DepositForm onSubmit={(values) => deposit(values, Boolean(user))} loading={walletLoading} disabled={false} />
            </View>
          ) : null}
          {type === 'withdraw' ? (
            <View className="p-6">
              <WithdrawForm
                onSubmit={(values) => withdraw(values, Boolean(user))}
                loading={walletLoading}
                disabled={fundingLocked}
                disabledMessage={fundingLockedMessage}
                summary={{ balance }}
                transactions={transactions}
              />
            </View>
          ) : null}
          {type === 'history' ? (
            <View className="p-6">
              <TransactionList transactions={transactions} title={loading ? 'Loading History...' : 'Transaction History'} />
            </View>
          ) : null}
          {type === 'settings' ? <SettingsPanel colors={colors} darkMode={darkMode} toggleTheme={toggleTheme} user={user} updateProfile={updateProfile} /> : null}
          {type === 'verification' ? <VerificationPanel user={user} colors={colors} submitVerification={submitVerification} refreshUser={refreshUser} /> : null}
          {type === 'referral' ? <ReferralPanel dashboard={dashboard} colors={colors} /> : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
