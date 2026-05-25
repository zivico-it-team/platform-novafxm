import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { TradingProvider } from '../src/context/TradingContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TradingProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#080f20' } }} />
        </TradingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
