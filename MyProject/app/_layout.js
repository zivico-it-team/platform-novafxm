import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { TradingProvider } from '../src/context/TradingContext';
import { ThemeProvider, useAppTheme } from '../src/context/ThemeContext';

function AppStack() {
  const { darkMode, colors } = useAppTheme();

  return (
    <>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <TradingProvider>
            <AppStack />
          </TradingProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
