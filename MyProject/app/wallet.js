import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import WalletCard from '../src/components/wallet/WalletCard';
import DepositForm from '../src/components/wallet/DepositForm';
import WithdrawForm from '../src/components/wallet/WithdrawForm';
import TransactionList from '../src/components/wallet/TransactionList';
import { useWallet } from '../src/hooks/useWallet';
import { useAuth } from '../src/hooks/useAuth';

export default function WalletScreen() {
  const { user } = useAuth();
  const { summary, transactions, deposit, withdraw, loading } = useWallet();
  const fundingLocked = Boolean(user && user.verificationStatus !== 'approved');
  const fundingLockedMessage = 'Verification approval is required before deposits and withdrawals.';
  return (
    <ScrollView className="flex-1 bg-[#0B0B0B]" contentContainerClassName="p-4 lg:p-8">
      <View className="mb-6 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-white">Wallet</Text>
        <Link href="/trading" asChild><Pressable><Text className="text-primary">Back to Trading</Text></Pressable></Link>
      </View>
      <WalletCard summary={summary} transactions={transactions} user={user} />
      <View className="gap-4 lg:flex-row">
        <DepositForm onSubmit={(values) => deposit(values, Boolean(user))} loading={loading} disabled={fundingLocked} disabledMessage={fundingLockedMessage} />
        <WithdrawForm onSubmit={(values) => withdraw(values, Boolean(user))} loading={loading} disabled={fundingLocked} disabledMessage={fundingLockedMessage} />
      </View>
      <TransactionList transactions={transactions} />
    </ScrollView>
  );
}
