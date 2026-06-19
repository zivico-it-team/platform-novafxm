import { useEffect, useMemo, useRef } from 'react';
import { router } from 'expo-router';
import {
  Award,
  LogOut,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { Animated, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../context/ThemeContext';

function initialsFor(user) {
  const name = user?.name || user?.email || 'Nova User';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'NU';
}

function MenuTile({ icon: Icon, title, subtitle, badge, onPress, colors }) {
  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation?.();
        onPress();
      }}
      className="min-h-[120px] flex-1 justify-between rounded-xl border p-4"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="flex-row items-center justify-between">
        <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${colors.primary}22` }}>
          <Icon size={18} color={colors.primary} />
        </View>
        {badge ? (
          <Text className="rounded-full px-2 py-1 text-[10px] font-extrabold" style={{ color: colors.success, backgroundColor: `${colors.success}1f` }}>
            {badge}
          </Text>
        ) : null}
      </View>
      <View>
        <Text className="text-base font-extrabold" style={{ color: colors.text }}>{title}</Text>
        <Text className="mt-1 text-xs" style={{ color: colors.muted }}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function MenuAction({ icon: Icon, title, subtitle, onPress, danger = false, colors }) {
  const tone = danger ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation?.();
        onPress();
      }}
      className="flex-row items-center rounded-xl px-3 py-3"
      style={{ backgroundColor: danger ? `${colors.danger}12` : 'transparent' }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: danger ? `${colors.danger}1f` : colors.surface }}>
        <Icon size={19} color={danger ? colors.danger : colors.primary} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="font-extrabold" style={{ color: tone }}>{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function ProfileMenu({ onClose, onHoverIn, onHoverOut, onOpenPanel }) {
  const { user, logout } = useAuth();
  const { colors } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(-28)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const initials = useMemo(() => initialsFor(user), [user]);
  const verified = user?.verificationStatus === 'approved';
  const panelWidth = Math.min(460, Math.max(330, width * 0.94));
  const panelTop = width < 760 ? 58 : 74;
  const panelHeight = height - panelTop;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const openPanel = (panel) => {
    onClose?.();
    onOpenPanel?.(panel);
  };

  const signOut = async () => {
    await logout();
    onClose?.();
    router.replace('/login');
  };

  return (
    <Animated.View
      onPointerEnter={onHoverIn}
      onPointerLeave={onHoverOut}
      className="overflow-hidden rounded-l-xl border-l p-5 shadow-2xl"
      style={{
        position: 'absolute',
        right: 0,
        top: panelTop,
        zIndex: 50,
        width: panelWidth,
        height: panelHeight,
        backgroundColor: colors.panel,
        borderColor: colors.border,
        shadowColor: colors.primary,
        shadowOpacity: 0.14,
        shadowRadius: 24,
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-5 flex-row items-start justify-between">
          <View>
            <Text className="text-2xl font-extrabold" style={{ color: colors.text }}>My Profile</Text>
            <Text className="mt-1 text-sm" style={{ color: colors.muted }}>Account details and tools</Text>
          </View>
          <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
            <X size={21} color={colors.text} />
          </Pressable>
        </View>

        <View className="mb-5 flex-row items-center rounded-xl border p-4" style={{ borderColor: colors.border, backgroundColor: `${colors.primary}10` }}>
          <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
            <Text className="text-xl font-black text-black">{initials}</Text>
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-xl font-extrabold" style={{ color: colors.text }}>{user?.name || 'NovaFXM Client'}</Text>
            <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{user?.email || 'client@novafxm.com'}</Text>
            <View className="mt-3 self-start rounded-full px-3 py-1" style={{ backgroundColor: verified ? `${colors.success}1f` : `${colors.primary}20` }}>
              <Text className="text-xs font-extrabold" style={{ color: verified ? colors.success : colors.primary }}>
                {verified ? 'Verified account' : 'Verification required'}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-5 flex-row gap-3">
          <MenuTile
            icon={ShieldCheck}
            title="Verification"
            subtitle="Upload ID and address proof"
            badge={verified ? 'DONE' : 'TODO'}
            onPress={() => openPanel('verification')}
            colors={colors}
          />
          <MenuTile
            icon={Award}
            title="Referral Programme"
            subtitle="Invite clients and view rewards"
            onPress={() => openPanel('referral')}
            colors={colors}
          />
        </View>

        <View className="mb-4 flex-row gap-3">
          <MenuTile
            icon={Settings2}
            title="My Settings"
            subtitle="Security, mode and withdrawal details"
            onPress={() => openPanel('settings')}
            colors={colors}
          />
        </View>

        <View className="rounded-xl border p-2" style={{ borderColor: colors.border }}>
          <MenuAction
            icon={LogOut}
            title="Sign Out"
            subtitle="End this session safely"
            onPress={signOut}
            danger
            colors={colors}
          />
        </View>
      </ScrollView>
    </Animated.View>
  );
}
