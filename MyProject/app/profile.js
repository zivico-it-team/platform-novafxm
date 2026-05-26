import { Link, router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import ProfileCard from '../src/components/profile/ProfileCard';
import EditProfileForm from '../src/components/profile/EditProfileForm';
import CustomButton from '../src/components/common/CustomButton';
import { useAuth } from '../src/hooks/useAuth';
import { useDemoTrading } from '../src/hooks/useDemoTrading';

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const { summary } = useDemoTrading();
  const signOut = async () => {
    await logout();
    router.replace('/login');
  };
  return (
    <ScrollView className="flex-1 bg-[#080f20]" contentContainerClassName="p-5 lg:p-8">
      <View className="mb-6 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-white">Profile</Text>
        <Link href="/trading" asChild><Pressable><Text className="text-primary">Back to Trading</Text></Pressable></Link>
      </View>
      <View className="gap-4 lg:flex-row">
        <View className="lg:w-[360px]"><ProfileCard user={user} balance={summary.balance} /></View>
        <EditProfileForm user={user} onSubmit={updateProfile} />
      </View>
      {user ? <CustomButton title="Logout" variant="secondary" onPress={signOut} className="mt-5 max-w-[220px]" /> : (
        <Link href="/login" asChild><Pressable className="mt-5"><Text className="text-primary">Login to manage your account</Text></Pressable></Link>
      )}
      <Text className="mt-10 text-xs text-muted">
        <Link href="https://www.tradingview.com/">
          TradingView Lightweight Charts(TM) Copyright (c) 2025 TradingView, Inc.
        </Link>
      </Text>
    </ScrollView>
  );
}
