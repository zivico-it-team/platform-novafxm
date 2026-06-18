import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationMenu from './NotificationMenu';

export default function AccountNotificationButton({ className = 'h-[46px] w-[46px]' }) {
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

  const toggleOpen = () => {
    setOpen((value) => {
      if (!value) refresh().catch(() => {});
      return !value;
    });
  };

  return (
    <>
      <Pressable
        onPress={toggleOpen}
        className={`relative items-center justify-center rounded-xl border ${className}`}
        style={{ backgroundColor: colors.panel, borderColor: colors.border }}
      >
        <Bell size={20} color={colors.text} />
        {unreadCount > 0 ? (
          <View className="absolute -right-1 -top-1 min-w-[18px] items-center justify-center rounded-full px-1" style={{ height: 18, backgroundColor: colors.danger }}>
            <Text className="text-[10px] font-black text-white">{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        ) : null}
      </Pressable>
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
