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
      className="min-h-[110px] flex-1 justify-between rounded-xl p-3"
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
        <Text className="mt-1 text-xs" style={{ color: palette.muted }}>{subtitle}</Text>
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
      style={({ pressed }) => ({
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        paddingHorizontal: 18,
        paddingVertical: 12,
        backgroundColor: pressed ? palette.tile : 'transparent',
      })}
    >
      <Icon size={20} color={danger ? palette.danger : palette.text} strokeWidth={1.8} />
      <Text className="ml-3 text-base font-semibold" style={{ color: danger ? palette.danger : palette.text }}>{title}</Text>
    </Pressable>
  );
}

export default function ProfileMenu({ onClose, onHoverIn, onHoverOut, onOpenPanel }) {
  const { user, logout } = useAuth();
  const { colors } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(410)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const initials = useMemo(() => initialsFor(user), [user]);
  const verified = user?.verificationStatus === 'approved';
  const panelWidth = width < 500 ? width : 410;
  const panelHeight = height;
  const displayName = user?.name || 'Nova FXM Client';
  const firstName = displayName.split(/\s+/)[0] || 'Client';
  const palette = {
    panel: colors.panel,
    tile: colors.surface,
    card: colors.surface,
    border: colors.border,
    text: colors.text,
    muted: colors.muted,
    accent: colors.primary,
    softAccent: colors.primarySoft,
    progress: colors.border,
    danger: colors.danger,
  };

  useEffect(() => {
    slideAnim.setValue(panelWidth);
    fadeAnim.setValue(0);
    contentAnim.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, contentAnim, panelWidth]);

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
      className="overflow-hidden shadow-2xl"
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 50,
        width: panelWidth,
        height: panelHeight,
        paddingTop: 24,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: palette.panel,
        borderLeftWidth: 1,
        borderLeftColor: palette.border,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 28,
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: contentAnim,
            transform: [
              {
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [15, 0],
                }),
              },
            ],
          }}
        >
          <View className="mb-5 flex-row items-center justify-between pl-[18px]">
            <Text className="text-2xl font-extrabold" style={{ color: palette.text }}>My Profile</Text>
            <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center">
              <X size={26} color={palette.text} strokeWidth={1.8} />
            </Pressable>
          </View>

          <View className="mb-4 flex-row items-center px-[18px]">
            <View className="h-[50px] w-[50px] items-center justify-center rounded-full" style={{ backgroundColor: palette.accent }}>
              <Text className="text-base font-extrabold text-black">{initials}</Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold" style={{ color: palette.text }}>
                Hey, <Text className="font-extrabold">{firstName.toUpperCase()}</Text>
              </Text>
              <Text className="mt-1 text-sm" style={{ color: palette.muted }}>{user?.email || 'client@novafxm.com'}</Text>
            </View>
          </View>

          <View className="mb-4 rounded-xl p-4" style={{ backgroundColor: palette.card }}>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-xs" style={{ color: palette.muted }}>Level</Text>
                <Text className="mt-1 text-base font-bold" style={{ color: palette.text }}>Bronze</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs" style={{ color: palette.muted }}>Trading Volume</Text>
                <Text className="mt-1 text-base font-bold" style={{ color: palette.text }}>
                  $0 <Text style={{ color: palette.muted }}>/ $1,000,000</Text>
                </Text>
              </View>
            </View>
            <View className="mt-4 flex-row items-center">
              <Award size={20} color={palette.accent} strokeWidth={1.8} />
              <View className="mx-3 h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: palette.progress }}>
                <View className="h-full rounded-full" style={{ width: '2%', backgroundColor: palette.accent }} />
              </View>
              <Award size={20} color={palette.muted} strokeWidth={1.8} />
            </View>
          </View>

          <View className="mb-4 flex-row gap-3">
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

          <Text className="mb-4 pl-[18px] text-xl font-extrabold" style={{ color: palette.text }}>Account</Text>

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

          
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}
