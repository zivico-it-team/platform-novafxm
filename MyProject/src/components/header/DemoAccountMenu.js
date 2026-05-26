import { router } from 'expo-router';
import { Check, Copy, Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function DemoAccountMenu({ onClose }) {
  const { user } = useAuth();
  const accountName = user?.accountType === 'Live' ? 'Live account 1' : 'Demo account 1';
  const accountId = String(user?.id || 27075).padStart(5, '0');

  const addAccount = () => {
    onClose();
    router.push('/register');
  };

  return (
    <View className="absolute right-3 top-[242px] z-50 w-[250px] overflow-hidden rounded-xl border border-border bg-[#0c1326] shadow-2xl lg:right-[132px] lg:top-[74px]">
      <View className="flex-row items-center px-4 py-4">
        <View className="mr-3 h-7 w-7 items-center justify-center rounded-full border border-success">
          <Check size={17} color="#12cf7a" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-white">{user?.accountType || 'Demo'}</Text>
            <View className="flex-row items-center">
              <View className="mr-2 h-2.5 w-2.5 rounded-full bg-success" />
              <Text className="text-xs text-success">{user?.accountType || 'Demo'}</Text>
            </View>
          </View>
          <Text className="mt-1 text-sm font-semibold text-white">{accountName}</Text>
          <View className="mt-1 flex-row items-center">
            <Text className="mr-2 text-xs text-muted">Account ID : {accountId}</Text>
            <Copy size={13} color="#8fa0bb" />
          </View>
        </View>
      </View>
      <Pressable onPress={addAccount} className="flex-row items-center border-t border-border px-5 py-5">
        <Plus size={15} color="#8fa0bb" />
        <Text className="ml-2 text-xs font-bold text-muted">OPEN NEW TRADING ACCOUNT</Text>
      </Pressable>
    </View>
  );
}
