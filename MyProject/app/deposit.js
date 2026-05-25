import { ScrollView, Text } from 'react-native';
import DepositForm from '../src/components/wallet/DepositForm';
import { useWallet } from '../src/hooks/useWallet';
import { useAuth } from '../src/hooks/useAuth';

export default function DepositScreen() {
  const { user } = useAuth();
  const { deposit, loading } = useWallet();
  return (
    <ScrollView className="flex-1 bg-[#080f20]" contentContainerClassName="mx-auto w-full max-w-[650px] p-6">
      <Text className="mb-5 text-2xl font-bold text-white">New Deposit</Text>
      <DepositForm onSubmit={(values) => deposit(values, Boolean(user))} loading={loading} />
    </ScrollView>
  );
}
