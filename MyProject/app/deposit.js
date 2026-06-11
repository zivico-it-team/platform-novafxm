import { Link } from 'expo-router';
import { ArrowLeft, CheckCircle2, ShieldCheck, Wallet, XCircle } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import DepositForm from '../src/components/wallet/DepositForm';
import TransactionList from '../src/components/wallet/TransactionList';
import { useWallet } from '../src/hooks/useWallet';
import { useAuth } from '../src/hooks/useAuth';
import { useAppTheme } from '../src/context/ThemeContext';

export default function DepositScreen() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const { deposit, transactions, loading } = useWallet();
  const fundingLocked = Boolean(user && user.verificationStatus !== 'approved');
  const depositTransactions = transactions.filter((item) => item.type === 'deposit');
  const latestReviewedDeposit = depositTransactions.find((item) => ['approved', 'completed', 'rejected'].includes(item.status));
  const depositApproved = ['approved', 'completed'].includes(latestReviewedDeposit?.status);

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerClassName="mx-auto w-full max-w-[1180px] p-4 lg:p-8">
      <View className="mb-6 flex-row flex-wrap items-center justify-between gap-3">
        <View>
          <Text className="text-3xl font-black" style={{ color: colors.text }}>Deposit Center</Text>
          <Text className="mt-1 text-muted">Fund your trading account with a reviewed deposit request.</Text>
        </View>
        <Link href="/trading" asChild>
          <Pressable className="flex-row items-center rounded-xl border border-border bg-panel px-4 py-3">
            <ArrowLeft size={17} color="#D4AF37" />
            <Text className="ml-2 font-bold text-primary">Back to Trading</Text>
          </Pressable>
        </Link>
      </View>

      <View className="mb-5 flex-row flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-panel p-5">
        <View className="flex-row items-center">
          <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-success/10">
            <ShieldCheck size={24} color="#12cf7a" />
          </View>
          <View className="flex-1">
            <Text className="font-black text-white">Secure funding workflow</Text>
            <Text className="mt-1 text-sm text-muted">Upload receipt proof and track every request in deposit history.</Text>
          </View>
        </View>
        <View className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
          <View className="flex-row items-center">
            <Wallet size={18} color="#D4AF37" />
            <Text className="ml-2 text-xs font-bold text-primary">Minimum deposit $100</Text>
          </View>
        </View>
      </View>

      {latestReviewedDeposit ? (
        <View className={`mb-5 flex-row items-center rounded-2xl border p-4 ${depositApproved ? 'border-success/40 bg-success/10' : 'border-danger/40 bg-danger/10'}`}>
          <View className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${depositApproved ? 'bg-success/15' : 'bg-danger/15'}`}>
            {depositApproved ? <CheckCircle2 size={22} color="#12cf7a" /> : <XCircle size={22} color="#f24d58" />}
          </View>
          <View className="flex-1">
            <Text className={`font-black ${depositApproved ? 'text-success' : 'text-danger'}`}>
              {depositApproved ? 'Deposit Approved' : 'Deposit Rejected'}
            </Text>
            <Text className="mt-1 text-sm text-muted">
              {depositApproved
                ? `Your deposit of ${Number(latestReviewedDeposit.amount || 0).toFixed(2)} USD has been approved and added to your wallet.`
                : `Your deposit of ${Number(latestReviewedDeposit.amount || 0).toFixed(2)} USD was rejected. Please check your receipt/reference and submit again.`}
            </Text>
          </View>
        </View>
      ) : null}

      <DepositForm
        onSubmit={(values) => deposit(values, Boolean(user))}
        loading={loading}
        disabled={fundingLocked}
        disabledMessage="Verification approval is required before deposits and withdrawals."
      />
      <TransactionList transactions={depositTransactions} title="Deposit History" />
    </ScrollView>
  );
}
