import { Modal, Pressable, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useAppTheme } from '../../context/ThemeContext';
import NotificationMenu from './NotificationMenu';
import { useState } from 'react';

const pagesWithLocalBell = new Set(['/trading', '/dashboard', '/admin', '/deposit', '/verification', '/broker-rewards', '/settings']);

export default function GlobalNotificationBell() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const {
    notifications,
    unreadCount,
    loading,
    refresh,
    markRead,
    markAllRead,
  } = useNotifications();
  const [open, setOpen] = useState(false);

  if (!user || pagesWithLocalBell.has(pathname)) return null;

  const toggleOpen = () => {
    setOpen((value) => {
      if (!value) refresh().catch(() => {});
      return !value;
    });
  };

  return (
    <>
      <View className="absolute right-5 top-5 z-50">
        <Pressable
          onPress={toggleOpen}
          className="relative h-[52px] w-[52px] items-center justify-center rounded-full border shadow-2xl"
          style={{ backgroundColor: colors.panel, borderColor: colors.border }}
        >
          <Bell size={22} color={colors.text} />
          {unreadCount > 0 ? (
            <View className="absolute -right-1 -top-1 min-w-[20px] items-center justify-center rounded-full px-1" style={{ height: 20, backgroundColor: colors.danger }}>
              <Text className="text-[10px] font-black text-white">{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1" style={{ flex: 1 }} onPress={() => setOpen(false)}>
          <Pressable onPress={(event) => event.stopPropagation()}>
            <NotificationMenu
              notifications={notifications}
              unreadCount={unreadCount}
              loading={loading}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onClose={() => setOpen(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
