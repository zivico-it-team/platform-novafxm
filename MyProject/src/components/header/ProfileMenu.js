import { useMemo } from 'react';
import { router } from 'expo-router';
import {
  Download,
  LogOut,
  ReceiptText,
  UserRound,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../context/ThemeContext';

function Action({ icon: Icon, title, onPress, colors }) {
  const handlePress = (event) => {
    event.stopPropagation?.();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} className="flex-row items-center px-5 py-4">
      <Icon size={21} color={colors.text} />
      <Text className="ml-4 text-base font-semibold" style={{ color: colors.text }}>{title}</Text>
    </Pressable>
  );
}

export default function ProfileMenu({ onClose, onHoverIn, onHoverOut }) {
  const { user, logout } = useAuth();
  const { colors } = useAppTheme();
  const fetchedAt = useMemo(() => new Date().toLocaleString(), []);

  const signOut = async () => {
    await logout();
    onClose();
    router.replace('/login');
  };

  return (
    <View
      onPointerEnter={onHoverIn}
      onPointerLeave={onHoverOut}
      className="absolute right-3 top-[74px] z-50 w-[360px] max-w-[92vw] overflow-hidden rounded-xl border shadow-2xl"
      style={{ backgroundColor: colors.panel, borderColor: colors.border }}
    >
      <View className="py-3">
        <Action icon={LogOut} title="Sign Out" onPress={signOut} colors={colors} />
      </View>
      <View className="border-t px-5 py-3" style={{ borderColor: colors.border }}>
        <View className="mb-4 flex-row items-center">
          <UserRound size={19} color={colors.muted} />
          <Text className="ml-4 text-sm" style={{ color: colors.muted }}>Email : {user?.email || 'demo@novafxm.com'}</Text>
        </View>
        <View className="mb-4 flex-row items-center">
          <ReceiptText size={19} color={colors.muted} />
          <Text className="ml-4 text-sm" style={{ color: colors.muted }}>App Version : v0.0.1</Text>
        </View>
        <View className="flex-row items-center">
          <Download size={19} color={colors.muted} />
          <Text className="ml-4 text-sm" style={{ color: colors.muted }}>Last Data Fetch: {fetchedAt}</Text>
        </View>
      </View>
    </View>
  );
}
