import { useEffect } from 'react';
import { router } from 'expo-router';
import { CheckCircle2, FileCheck2, FileText, ShieldCheck, UploadCloud } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import CustomButton from '../src/components/common/CustomButton';
import AccountSidebar from '../src/components/layout/AccountSidebar';
import { useAuth } from '../src/hooks/useAuth';
import { useAppTheme } from '../src/context/ThemeContext';

const BLACK = '#0B0B0B';
const GOLD = '#D4AF37';
const GREEN = '#014421';

function Card({ title, children, colors }) {
  return (
    <View className="rounded-2xl border p-5" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <Text className="mb-4 text-lg font-extrabold" style={{ color: colors.text }}>{title}</Text>
      {children}
    </View>
  );
}

function VerificationStep({ title, description, status, active, complete, colors }) {
  const accent = complete ? GREEN : active ? GOLD : '#2b2b2b';
  const labelColor = active ? BLACK : GOLD;
  const labelBackground = active ? GOLD : complete ? 'rgba(1, 68, 33, .65)' : colors.panel;

  return (
    <View
      className="flex-1 rounded-2xl border p-4"
      style={{
        backgroundColor: complete ? 'rgba(1, 68, 33, .16)' : active ? 'rgba(212, 175, 55, .12)' : colors.surface,
        borderColor: accent,
      }}
    >
      <View className="mb-4 flex-row items-center justify-between">
        <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: accent }}>
          {complete ? <CheckCircle2 size={22} color={GOLD} /> : active ? <UploadCloud size={22} color={BLACK} /> : <FileText size={22} color={GOLD} />}
        </View>
        <Text className="rounded-full px-3 py-1 text-[10px] font-extrabold uppercase" style={{ color: labelColor, backgroundColor: labelBackground }}>
          {status}
        </Text>
      </View>
      <Text className="text-base font-extrabold" style={{ color: colors.text }}>{title}</Text>
      <Text className="mt-2 text-sm leading-5" style={{ color: colors.muted }}>{description}</Text>
    </View>
  );
}

function AccountPageShell({ children, user, onSignOut, colors }) {
  return (
    <View className="flex-1 md:flex-row" style={{ backgroundColor: colors.background }}>
      <AccountSidebar activeKey="verification" onSignOut={onSignOut} />
      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerClassName="p-5 md:p-8">
        <View className="mb-7 flex-row flex-wrap items-center justify-between gap-3">
          <View>
            <Text className="text-3xl font-extrabold" style={{ color: colors.text }}>Verification</Text>
            <Text className="mt-2" style={{ color: colors.muted }}>{user?.email || 'Complete account verification'}</Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            <Pressable onPress={() => router.push('/trading')} className="rounded-xl border px-4 py-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
              <Text className="font-bold" style={{ color: GOLD }}>Back to Trading</Text>
            </Pressable>
            <Pressable onPress={onSignOut} className="rounded-xl border px-4 py-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
              <Text className="font-bold text-danger">Sign Out</Text>
            </Pressable>
          </View>
        </View>
        {children}
      </ScrollView>
    </View>
  );
}

export default function VerificationScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { colors } = useAppTheme();
  const verificationStatus = user?.verificationStatus || 'unverified';

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  useEffect(() => {
    refreshUser?.().catch(() => {});
  }, [refreshUser]);

  if (verificationStatus === 'approved') {
    return (
      <AccountPageShell user={user} onSignOut={signOut} colors={colors}>
        <View className="w-full max-w-[640px] self-center items-center rounded-2xl border p-10" style={{ backgroundColor: colors.panel, borderColor: GREEN }}>
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: GREEN }}>
            <CheckCircle2 size={42} color={GOLD} />
          </View>
          <Text className="text-center text-4xl font-extrabold" style={{ color: colors.text }}>Verification Successfully</Text>
          <Text className="mt-3 text-center" style={{ color: colors.muted }}>Your account is verified. You now have access to all enabled account features.</Text>
          <CustomButton title="Go to Dashboard" onPress={() => router.push('/dashboard')} className="mt-8 min-w-[190px]" />
        </View>
      </AccountPageShell>
    );
  }

  if (verificationStatus === 'rejected') {
    return (
      <AccountPageShell user={user} onSignOut={signOut} colors={colors}>
        <View className="w-full max-w-[640px] self-center items-center rounded-2xl border border-danger/60 bg-danger/10 p-10">
          <Text className="text-center text-4xl font-extrabold" style={{ color: colors.text }}>Try Again</Text>
          <Text className="mt-3 text-center" style={{ color: colors.muted }}>Your verification was not approved. Upload clear ID proof and address proof photos again.</Text>
          <CustomButton title="Upload Again" onPress={() => router.push('/verification-upload')} className="mt-8 min-w-[190px]" />
        </View>
      </AccountPageShell>
    );
  }

  if (verificationStatus === 'pending') {
    return (
      <AccountPageShell user={user} onSignOut={signOut} colors={colors}>
        <View className="w-full max-w-[640px] self-center items-center rounded-2xl border p-10" style={{ backgroundColor: colors.panel, borderColor: GOLD }}>
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(212, 175, 55, .14)' }}>
            <ShieldCheck size={42} color={GOLD} />
          </View>
          <Text className="text-center text-4xl font-extrabold" style={{ color: colors.text }}>Verification Submitted</Text>
          <Text className="mt-3 text-center" style={{ color: colors.muted }}>Waiting for admin review. You will see the result here once it is reviewed.</Text>
          <CustomButton title="Go to Dashboard" onPress={() => router.push('/dashboard')} className="mt-8 min-w-[190px]" />
        </View>
      </AccountPageShell>
    );
  }

  return (
    <AccountPageShell user={user} onSignOut={signOut} colors={colors}>
      <View className="gap-4">
        <Card title="Verification Status" colors={colors}>
          <View className="mb-5 flex-row flex-wrap items-center justify-between gap-3">
            <View>
              <Text className="text-2xl font-extrabold" style={{ color: colors.text }}>Unlock full account access</Text>
              <Text className="mt-1" style={{ color: colors.muted }}>Complete verification to enable all trading, funding, and account features.</Text>
            </View>
            <View className="flex-row items-center rounded-full border px-4 py-2" style={{ borderColor: GOLD, backgroundColor: 'rgba(212, 175, 55, .12)' }}>
              <ShieldCheck size={18} color={GOLD} />
              <Text className="ml-2 text-sm font-extrabold" style={{ color: GOLD }}>KYC Required</Text>
            </View>
          </View>

          <View className="gap-4 xl:flex-row">
            <View className="flex-[2] gap-3">
              <VerificationStep
                title="Unverified"
                description="You've registered. Upload your documents to complete verification and unlock more features."
                status="You are here"
                complete
                colors={colors}
              />
              <VerificationStep
                title="Verified"
                description="After verification, you'll gain access to enhanced features and more functionality."
                status="Up next"
                active
                colors={colors}
              />
              <VerificationStep
                title="CC-Verified"
                description="This is the final step before you gain full access to all account features."
                status="Locked"
                colors={colors}
              />
            </View>

            <View className="flex-1 rounded-2xl border p-5" style={{ backgroundColor: colors.surface, borderColor: GREEN }}>
              <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(1, 68, 33, .55)' }}>
                <FileCheck2 size={24} color={GOLD} />
              </View>
              <Text className="text-lg font-extrabold" style={{ color: colors.text }}>Document Requirements</Text>
              <Text className="mt-2 text-sm" style={{ color: colors.muted }}>Documents required to complete this stage.</Text>
              <View className="mt-5 gap-3">
                {['ID Proof', 'Address Proof'].map((item) => (
                  <View key={item} className="flex-row items-center rounded-xl border p-3" style={{ backgroundColor: colors.panel, borderColor: GREEN }}>
                    <View className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: GREEN }}>
                      <FileText size={15} color={GOLD} />
                    </View>
                    <Text className="ml-3 font-bold" style={{ color: colors.text }}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Card>

        <Card title="Available Features" colors={colors}>
          <View className="min-h-[120px] items-center justify-center rounded-2xl border border-dashed p-6" style={{ backgroundColor: colors.surface, borderColor: GREEN }}>
            <Text className="text-lg font-extrabold" style={{ color: colors.text }}>No Features Available</Text>
            <Text className="mt-2 text-center" style={{ color: colors.muted }}>New account tools will appear here after your verification status changes.</Text>
          </View>
        </Card>

        <CustomButton
          title={verificationStatus === 'rejected' ? 'Try Again ->' : 'Next Steps ->'}
          onPress={() => router.push('/verification-upload')}
          disabled={verificationStatus === 'approved' || verificationStatus === 'pending'}
          className="max-w-[180px]"
        />
      </View>
    </AccountPageShell>
  );
}
