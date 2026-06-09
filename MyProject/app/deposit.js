import { Link } from 'expo-router';
import { ArrowLeft, ShieldCheck, Wallet } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import DepositForm from '../src/components/wallet/DepositForm';
import TransactionList from '../src/components/wallet/TransactionList';
import { useWallet } from '../src/hooks/useWallet';
import { useAuth } from '../src/hooks/useAuth';

export default function DepositScreen() {
  const { user } = useAuth();
  const { deposit, transactions, loading } = useWallet();
  const fundingLocked = Boolean(user && user.verificationStatus !== 'approved');
  const depositTransactions = transactions.filter((item) => item.type === 'deposit');
  return (
    <ScrollView className="flex-1 bg-[#0B0B0B]" contentContainerClassName="mx-auto w-full max-w-[1180px] p-4 lg:p-8">
      <View className="mb-6 flex-row flex-wrap items-center justify-between gap-3">
        <View>
          <Text className="text-3xl font-black text-white">Deposit Center</Text>
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
