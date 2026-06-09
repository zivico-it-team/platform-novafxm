import { useEffect } from 'react';
import { Link, router } from 'expo-router';
import { CheckCircle2, FileCheck2, FileText, ShieldCheck, UploadCloud } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import CustomButton from '../src/components/common/CustomButton';
import { useAuth } from '../src/hooks/useAuth';

const BLACK = '#0B0B0B';
const GOLD = '#D4AF37';
const GREEN = '#014421';
const sections = [
  ['Overview', '/dashboard?section=overview'],
  ['Accounts', '/dashboard?section=accounts'],
  ['Verification', '/verification'],
  ['Deposit', '/dashboard?section=deposit'],
  ['Withdraw', '/dashboard?section=withdraw'],
  ['Broker Rewards', '/dashboard?section=rewards'],
  ['Settings', '/dashboard?section=settings'],
];

function Card({ title, children }) {
  return (
    <View className="rounded-2xl border p-5" style={{ backgroundColor: '#101010', borderColor: GREEN }}>
      <Text className="mb-4 text-lg font-extrabold text-white">{title}</Text>
      {children}
    </View>
  );
}

function VerificationStep({ title, description, status, active, complete }) {
  const accent = complete ? GREEN : active ? GOLD : '#2b2b2b';
  const labelColor = active ? BLACK : GOLD;
  const labelBackground = active ? GOLD : complete ? 'rgba(1, 68, 33, .65)' : BLACK;

  return (
    <View
      className="flex-1 rounded-2xl border p-4"
      style={{
        backgroundColor: complete ? 'rgba(1, 68, 33, .38)' : active ? 'rgba(212, 175, 55, .12)' : BLACK,
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
      <Text className="text-base font-extrabold text-white">{title}</Text>
      <Text className="mt-2 text-sm leading-5 text-muted">{description}</Text>
    </View>
  );
}

function AccountDashboardHeader({ user }) {
  return (
    <View className="mb-6">
      <View className="mb-6 flex-row flex-wrap items-start justify-between gap-3">
        <View>
          <Text className="text-3xl font-extrabold text-white">Account Dashboard</Text>
          <Text className="mt-1 text-muted">{user?.email || 'Manage accounts, funds, and rewards'}</Text>
        </View>
        <View className="flex-row gap-3">
          <Link href="/trading" asChild><Pressable><Text style={{ color: GOLD }}>Back to Trading</Text></Pressable></Link>
          <Link href="/login" asChild><Pressable><Text className="text-danger">Sign Out</Text></Pressable></Link>
        </View>
      </View>
      <View className="rounded-2xl border border-border bg-panel p-2">
        <View className="flex-row flex-wrap gap-2">
          {sections.map(([label, href]) => {
            const active = label === 'Verification';
            return (
              <Link key={label} href={href} asChild>
                <Pressable
                  className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: active ? GOLD : 'transparent', borderColor: active ? GOLD : '#243142', borderWidth: 1 }}
                >
                  <Text className="font-bold" style={{ color: active ? BLACK : '#9CA3AF' }}>{label}</Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function VerificationScreen() {
  const { user, refreshUser } = useAuth();
  const verificationStatus = user?.verificationStatus || 'unverified';

  useEffect(() => {
    refreshUser?.().catch(() => {});
  }, [refreshUser]);

  if (verificationStatus === 'approved') {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: BLACK }}>
        <View className="absolute left-4 right-4 top-4 lg:left-8 lg:right-8 lg:top-8">
          <AccountDashboardHeader user={user} />
        </View>
        <View className="mt-40 w-full max-w-[640px] items-center rounded-2xl border p-10" style={{ backgroundColor: '#101010', borderColor: GREEN }}>
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: GREEN }}>
            <CheckCircle2 size={42} color={GOLD} />
          </View>
          <Text className="text-center text-4xl font-extrabold text-white">Verification Successfully</Text>
          <Text className="mt-3 text-center text-muted">Your account is verified. You now have access to all enabled account features.</Text>
          <CustomButton title="Go to Dashboard" onPress={() => router.push('/dashboard')} className="mt-8 min-w-[190px]" />
        </View>
      </View>
    );
  }

  if (verificationStatus === 'rejected') {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: BLACK }}>
        <View className="absolute left-4 right-4 top-4 lg:left-8 lg:right-8 lg:top-8">
          <AccountDashboardHeader user={user} />
        </View>
        <View className="mt-40 w-full max-w-[640px] items-center rounded-2xl border border-danger/60 bg-danger/10 p-10">
          <Text className="text-center text-4xl font-extrabold text-white">Try Again</Text>
          <Text className="mt-3 text-center text-muted">Your verification was not approved. Upload clear ID proof and address proof photos again.</Text>
          <CustomButton title="Upload Again" onPress={() => router.push('/verification-upload')} className="mt-8 min-w-[190px]" />
        </View>
      </View>
    );
  }

  if (verificationStatus === 'pending') {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: BLACK }}>
        <View className="absolute left-4 right-4 top-4 lg:left-8 lg:right-8 lg:top-8">
          <AccountDashboardHeader user={user} />
        </View>
        <View className="mt-40 w-full max-w-[640px] items-center rounded-2xl border p-10" style={{ backgroundColor: '#101010', borderColor: GOLD }}>
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(212, 175, 55, .14)' }}>
            <ShieldCheck size={42} color={GOLD} />
          </View>
          <Text className="text-center text-4xl font-extrabold text-white">Verification Submitted</Text>
          <Text className="mt-3 text-center text-muted">Waiting for admin review. You will see the result here once it is reviewed.</Text>
          <CustomButton title="Go to Dashboard" onPress={() => router.push('/dashboard')} className="mt-8 min-w-[190px]" />
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: BLACK }} contentContainerClassName="p-4 lg:p-8">
      <AccountDashboardHeader user={user} />

      <View className="gap-4">
        <Card title="Verification Status">
          <View className="mb-5 flex-row flex-wrap items-center justify-between gap-3">
            <View>
              <Text className="text-2xl font-extrabold text-white">Unlock full account access</Text>
              <Text className="mt-1 text-muted">Complete verification to enable all trading, funding, and account features.</Text>
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
              />
              <VerificationStep
                title="Verified"
                description="After verification, you'll gain access to enhanced features and more functionality."
                status="Up next"
                active
              />
              <VerificationStep
                title="CC-Verified"
                description="This is the final step before you gain full access to all account features."
                status="Locked"
              />
            </View>

            <View className="flex-1 rounded-2xl border p-5" style={{ backgroundColor: '#151515', borderColor: GREEN }}>
              <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(1, 68, 33, .55)' }}>
                <FileCheck2 size={24} color={GOLD} />
              </View>
              <Text className="text-lg font-extrabold text-white">Document Requirements</Text>
              <Text className="mt-2 text-sm text-muted">Documents required to complete this stage.</Text>
              <View className="mt-5 gap-3">
                {['ID Proof', 'Address Proof'].map((item) => (
                  <View key={item} className="flex-row items-center rounded-xl border p-3" style={{ backgroundColor: BLACK, borderColor: GREEN }}>
                    <View className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: GREEN }}>
                      <FileText size={15} color={GOLD} />
                    </View>
                    <Text className="ml-3 font-bold text-white">{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Card>

        <Card title="Available Features">
          <View className="min-h-[120px] items-center justify-center rounded-2xl border border-dashed p-6" style={{ backgroundColor: '#151515', borderColor: GREEN }}>
            <Text className="text-lg font-extrabold text-white">No Features Available</Text>
            <Text className="mt-2 text-center text-muted">New account tools will appear here after your verification status changes.</Text>
          </View>
        </Card>

        <CustomButton
          title={verificationStatus === 'rejected' ? 'Try Again ->' : 'Next Steps ->'}
          onPress={() => router.push('/verification-upload')}
          disabled={verificationStatus === 'approved' || verificationStatus === 'pending'}
          className="max-w-[180px]"
        />
      </View>
    </ScrollView>
  );
}
