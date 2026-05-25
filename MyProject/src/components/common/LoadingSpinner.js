import { ActivityIndicator, View } from 'react-native';

export default function LoadingSpinner() {
  return (
    <View className="flex-1 items-center justify-center bg-[#080f20]">
      <ActivityIndicator size="large" color="#27a8e9" />
    </View>
  );
}
