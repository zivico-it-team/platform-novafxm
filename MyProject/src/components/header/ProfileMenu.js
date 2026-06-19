import { useEffect, useMemo, useRef } from 'react';
import { router } from 'expo-router';
import {
  Award,
  ChevronRight,
  MessageSquarePlus,
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

function MenuTile({ icon: Icon, title, subtitle, badge, onPress, palette }) {
  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation?.();
        onPress();
      }}
      className="min-h-[136px] flex-1 justify-between rounded-xl p-4"
      style={{ backgroundColor: palette.tile }}
    >
      <View className="flex-row items-center justify-between">
        <Icon size={20} color={palette.text} />
        {badge ? (
          <Text className="rounded-md px-2 py-1 text-[11px] font-extrabold" style={{ color: palette.danger, backgroundColor: `${palette.danger}22` }}>
            {badge}
          </Text>
        ) : null}
      </View>
      <View>
        <Text className="text-base font-extrabold" style={{ color: palette.text }}>{title}</Text>
        <Text className="mt-2 text-sm" style={{ color: palette.muted }}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function MenuAction({ icon: Icon, title, onPress, danger = false, palette }) {
  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation?.();
        onPress();
      }}
      className="mb-5 flex-row items-center"
    >
      <Icon size={18} color={danger ? palette.danger : palette.text} />
      <Text className="ml-4 text-base font-extrabold" style={{ color: danger ? palette.danger : palette.text }}>{title}</Text>
    </Pressable>
  );
}

export default function ProfileMenu({ onClose, onHoverIn, onHoverOut, onOpenPanel }) {
  const { user, logout } = useAuth();
  const { colors } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(48)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const initials = useMemo(() => initialsFor(user), [user]);
  const verified = user?.verificationStatus === 'approved';
  const panelGutter = width < 900 ? 10 : 14;
  const panelTop = width < 900 ? 116 : 88;
  const panelWidth = Math.min(460, Math.max(330, width - (panelGutter * 2)));
  const panelHeight = height - panelTop - panelGutter;
  const displayName = user?.name || 'Nova FXM Client';
  const firstName = displayName.split(/\s+/)[0] || 'Client';
  const palette = {
    panel: colors.background,
    tile: colors.surface,
    card: colors.panel,
    border: colors.border,
    text: colors.text,
    muted: colors.muted,
    accent: colors.primary,
    softAccent: colors.primarySoft,
    progress: colors.border,
    danger: colors.danger,
  };

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
      className="overflow-hidden rounded-xl border px-7 py-6 shadow-2xl"
      style={{
        position: 'absolute',
        right: panelGutter,
        top: panelTop,
        zIndex: 50,
        width: panelWidth,
        height: panelHeight,
        backgroundColor: palette.panel,
        borderColor: palette.border,
        shadowColor: colors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 28,
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-8 flex-row items-center justify-between">
          <Text className="text-2xl font-extrabold" style={{ color: palette.text }}>My Profile</Text>
          <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center">
            <X size={27} color={palette.text} />
          </Pressable>
        </View>

        <View className="mb-8 flex-row items-center">
          <View className="h-[60px] w-[60px] items-center justify-center rounded-full" style={{ backgroundColor: palette.accent }}>
            <Text className="text-lg font-extrabold text-black">{initials}</Text>
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-xl font-semibold" style={{ color: palette.text }}>
              Hey, <Text className="font-extrabold">{firstName.toUpperCase()}</Text>
            </Text>
            <Text className="mt-2 text-base" style={{ color: palette.muted }}>{user?.email || 'client@novafxm.com'}</Text>
          </View>
        </View>

        <View className="mb-10 rounded-xl border p-4" style={{ borderColor: palette.border, backgroundColor: palette.card }}>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs" style={{ color: palette.muted }}>Level</Text>
              <Text className="mt-1 text-base font-extrabold" style={{ color: palette.text }}>Bronze</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs" style={{ color: palette.muted }}>Trading Volume</Text>
              <Text className="mt-1 text-base font-extrabold" style={{ color: palette.text }}>$0 <Text style={{ color: palette.muted }}>/ $1,000,000</Text></Text>
            </View>
          </View>
          <View className="mt-6 flex-row items-center">
            <Award size={21} color={colors.primary} />
            <View className="mx-3 h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: palette.progress }}>
              <View className="h-full rounded-full" style={{ width: '2%', backgroundColor: palette.accent }} />
            </View>
            <Award size={21} color={colors.muted} />
          </View>
        </View>

        <View className="mb-10 flex-row gap-4">
          <MenuTile
            icon={ShieldCheck}
            title="Verification"
            subtitle={verified ? 'Verified' : 'Unverified'}
            badge={verified ? null : 'Unverified'}
            onPress={() => openPanel('verification')}
            palette={palette}
          />
          <MenuTile
            icon={Award}
            title="Referral Program"
            subtitle="Invite & earn rewards"
            onPress={() => openPanel('referral')}
            palette={palette}
          />
        </View>

        <View className="mb-8">
          <MenuAction
            icon={Settings2}
            title="Settings"
            onPress={() => openPanel('settings')}
            palette={palette}
          />
          <MenuAction
            icon={LogOut}
            title="Sign Out"
            onPress={signOut}
            danger
            palette={palette}
          />
        </View>

        <Pressable
          onPress={() => openPanel('settings')}
          className="mb-6 flex-row items-center justify-between rounded-xl px-4 py-4"
          style={{ backgroundColor: palette.softAccent }}
        >
          <View className="flex-row flex-1 items-center">
            <MessageSquarePlus size={18} color={colors.text} />
            <Text className="ml-3 flex-1 text-base font-semibold" style={{ color: colors.text }}>Suggest new features or share your opinion</Text>
          </View>
          <ChevronRight size={18} color={colors.text} />
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}
