import { useEffect } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import TradingLayout from '../src/components/layout/TradingLayout';
import { useAuth } from '../src/hooks/useAuth';
import { useAppTheme } from '../src/context/ThemeContext';

export default function HomeScreen() {
  const { user, loading, isAdmin } = useAuth();
  const { colors } = useAppTheme();

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.replace('/admin');
    }
  }, [isAdmin, loading, user]);

  if (loading || (user && isAdmin)) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <TradingLayout />;
}
