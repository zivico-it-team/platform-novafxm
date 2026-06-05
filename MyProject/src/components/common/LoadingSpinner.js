import { ActivityIndicator, View } from 'react-native';

export default function LoadingSpinner() {
  return (
    <View className="flex-1 items-center justify-center bg-[#0B0B0B]">
      <ActivityIndicator size="large" color="#27a8e9" />
    </View>
  );
}
