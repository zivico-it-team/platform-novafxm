import { Image, Text, View } from 'react-native';
import { money } from '../../utils/formatters';

export default function ProfileCard({ user, balance }) {
  const items = [
    ['Name', user?.name || 'Demo Trader'],
    ['Email', user?.email || 'demo@novafxm.com'],
    ['Phone', user?.phone || '-'],
    ['Account Type', user?.accountType || 'Demo'],
    ['Wallet Balance', `${money(balance)} USD`],
  ];
  return (
    <View className="rounded-2xl border border-border bg-panel p-5">
      <Text className="mb-5 text-xl font-bold text-white">Account Profile</Text>
      <View className="mb-5 items-center">
        {user?.profileImage ? (
          <Image source={{ uri: user.profileImage }} resizeMode="cover" className="h-24 w-24 rounded-full border border-border" />
        ) : (
          <View className="h-24 w-24 items-center justify-center rounded-full border border-border bg-surface">
            <Text className="text-3xl font-bold text-primary">{(user?.name || 'Demo Trader').charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      {items.map(([label, value]) => (
        <View key={label} className="mb-4">
          <Text className="text-xs text-muted">{label}</Text>
          <Text className="mt-1 text-white">{value}</Text>
        </View>
      ))}
    </View>
  );
}
