import { useEffect } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import TradingLayout from '../src/components/layout/TradingLayout';
import { useAuth } from '../src/hooks/useAuth';
import { useAppTheme } from '../src/context/ThemeContext';

export default function TradingScreen() {
  const { isAdmin, loading } = useAuth();
  const { colors } = useAppTheme();

  useEffect(() => {
    if (!loading && isAdmin) router.replace('/admin');
  }, [isAdmin, loading]);

  if (loading || isAdmin) {
    return <View className="flex-1" style={{ backgroundColor: colors.background }} />;
  }

  return <TradingLayout />;
}
