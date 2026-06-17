import { Link, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import WithdrawForm from '../src/components/wallet/WithdrawForm';
import { useWallet } from '../src/hooks/useWallet';
import { useAuth } from '../src/hooks/useAuth';
import { useAppTheme } from '../src/context/ThemeContext';

export default function WithdrawScreen() {
  const { user, logout } = useAuth();
  const { colors } = useAppTheme();
  const { summary, transactions, withdraw, loading } = useWallet();
  const fundingLocked = Boolean(user && user.verificationStatus !== 'approved');
  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerClassName="mx-auto w-full max-w-[650px] p-6">
      <View className="mb-5 flex-row flex-wrap items-center justify-between gap-3">
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>New Withdrawal</Text>
        <View className="flex-row flex-wrap gap-3">
          <Link href="/trading" asChild>
            <Pressable className="flex-row items-center rounded-xl border border-border bg-panel px-4 py-3">
              <ArrowLeft size={17} color="#D4AF37" />
              <Text className="ml-2 font-bold text-primary">Back to Trading</Text>
            </Pressable>
          </Link>
          <Pressable onPress={signOut} className="rounded-xl border border-border bg-panel px-4 py-3">
            <Text className="font-bold text-danger">Sign Out</Text>
          </Pressable>
        </View>
      </View>
      <WithdrawForm
        onSubmit={(values) => withdraw(values, Boolean(user))}
        loading={loading}
        disabled={fundingLocked}
        disabledMessage="Verification approval is required before withdrawals."
        summary={summary}
        transactions={transactions}
      />
    </ScrollView>
  );
}
