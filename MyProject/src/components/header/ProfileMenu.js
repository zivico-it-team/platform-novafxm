import { useMemo } from 'react';
import { router } from 'expo-router';
import {
  Award,
  LogOut,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
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
      className="min-h-[128px] flex-1 justify-between rounded-2xl border p-4"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="flex-row items-center justify-between">
        <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${colors.primary}22` }}>
          <Icon size={18} color={colors.primary} />
        </View>
        {badge ? (
          <Text className="rounded-full px-2 py-1 text-[10px] font-black" style={{ color: colors.success, backgroundColor: `${colors.success}1f` }}>
            {badge}
          </Text>
        ) : null}
      </View>
      <View>
        <Text className="text-base font-black" style={{ color: colors.text }}>{title}</Text>
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
      className="flex-row items-center rounded-2xl px-3 py-3"
      style={{ backgroundColor: danger ? `${colors.danger}12` : 'transparent' }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: danger ? `${colors.danger}1f` : colors.surface }}>
        <Icon size={19} color={danger ? colors.danger : colors.primary} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="font-bold" style={{ color: tone }}>{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function ProfileMenu({ onClose, onHoverIn, onHoverOut, onOpenPanel }) {
  const { user, logout } = useAuth();
  const { colors } = useAppTheme();
  const initials = useMemo(() => initialsFor(user), [user]);
  const verified = user?.verificationStatus === 'approved';

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
    <View
      onPointerEnter={onHoverIn}
      onPointerLeave={onHoverOut}
      className="absolute right-3 top-[74px] z-50 w-[430px] max-w-[94vw] overflow-hidden rounded-lg border p-5 shadow-2xl"
      style={{
        backgroundColor: colors.panel,
        borderColor: colors.border,
        shadowColor: colors.primary,
        shadowOpacity: 0.18,
        shadowRadius: 24,
        transform: [{ translateY: 4 }],
      }}
    >
      <View className="mb-5 flex-row items-start justify-between">
        <View>
          <Text className="text-2xl font-black" style={{ color: colors.text }}>My Profile</Text>
          <Text className="mt-1 text-xs" style={{ color: colors.muted }}>Account details and client tools</Text>
        </View>
        <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
          <X size={21} color={colors.text} />
        </Pressable>
      </View>

      <View className="mb-5 flex-row items-center rounded-3xl border p-4" style={{ borderColor: colors.border, backgroundColor: `${colors.primary}10` }}>
        <View className="h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.primary }}>
          <Text className="text-xl font-black text-black">{initials}</Text>
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-xl font-black" style={{ color: colors.text }}>{user?.name || 'NovaFXM Client'}</Text>
          <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{user?.email || 'client@novafxm.com'}</Text>
          <View className="mt-3 self-start rounded-full px-3 py-1" style={{ backgroundColor: verified ? `${colors.success}1f` : `${colors.primary}20` }}>
            <Text className="text-xs font-black" style={{ color: verified ? colors.success : colors.primary }}>
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

      <View className="rounded-3xl border p-2" style={{ borderColor: colors.border }}>
        <MenuAction
          icon={LogOut}
          title="Sign Out"
          subtitle="End this session safely"
          onPress={signOut}
          danger
          colors={colors}
        />
      </View>
    </View>
  );
}
