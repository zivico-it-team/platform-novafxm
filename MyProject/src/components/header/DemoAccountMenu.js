import { router } from 'expo-router';
import { Check, Copy, Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

function accountId(account) {
  return String(account?.id || '').replace(/\D/g, '').slice(-5).padStart(5, '0');
}

export default function DemoAccountMenu({ accounts = [], selectedAccount, onSelectAccount, onClose }) {
  const { user } = useAuth();
  const fallbackAccount = {
    id: `user-${user?.id || 27075}`,
    type: user?.accountType || 'Demo',
    name: user?.accountType === 'Live' ? 'Live account 1' : 'Demo account 1',
    status: user?.tradingStatus === 'frozen' ? 'frozen' : 'active',
  };
  const tradingAccounts = accounts.length ? accounts : [fallbackAccount];
  const activeAccount = selectedAccount || tradingAccounts[0];

  const addAccount = () => {
    onClose();
    router.push('/dashboard?section=accounts');
  };

  return (
    <View className="absolute right-3 top-[242px] z-50 w-[250px] overflow-hidden rounded-xl border border-border bg-[#0c1326] shadow-2xl lg:right-[132px] lg:top-[74px]">
      {tradingAccounts.map((account) => {
        const selected = String(account.id) === String(activeAccount?.id);
        return (
          <Pressable
            key={account.id}
            onPress={() => onSelectAccount?.(account)}
            className={`flex-row items-center border-b border-border px-4 py-4 ${selected ? 'bg-primary/10' : ''}`}
          >
            <View className={`mr-3 h-7 w-7 items-center justify-center rounded-full border ${selected ? 'border-success' : 'border-border'}`}>
              {selected ? <Check size={17} color="#12cf7a" /> : null}
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-white">{account.type || 'Demo'}</Text>
                <View className="flex-row items-center">
                  <View className={`mr-2 h-2.5 w-2.5 rounded-full ${account.status === 'pending' ? 'bg-primary' : 'bg-success'}`} />
                  <Text className={`text-xs ${account.status === 'pending' ? 'text-primary' : 'text-success'}`}>{account.status || account.type || 'Demo'}</Text>
                </View>
              </View>
              <Text className="mt-1 text-sm font-semibold text-white">{account.name || `${account.type || 'Demo'} account`}</Text>
              <View className="mt-1 flex-row items-center">
                <Text className="mr-2 text-xs text-muted">Account ID : {accountId(account)}</Text>
                <Copy size={13} color="#8fa0bb" />
              </View>
            </View>
          </Pressable>
        );
      })}
      <Pressable onPress={addAccount} className="flex-row items-center border-t border-border px-5 py-5">
        <Plus size={15} color="#8fa0bb" />
        <Text className="ml-2 text-xs font-bold text-muted">OPEN NEW TRADING ACCOUNT</Text>
      </Pressable>
    </View>
  );
}
