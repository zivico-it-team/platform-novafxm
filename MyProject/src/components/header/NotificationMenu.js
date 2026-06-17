import { Pressable, Text, View } from 'react-native';
import { AlertTriangle, CheckCircle2, Megaphone, Newspaper, ShieldCheck, WalletCards, X, Zap } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { dateTime } from '../../utils/formatters';

const iconByType = {
  deposit: { Icon: CheckCircle2, tone: '#4ade80' },
  withdraw: { Icon: WalletCards, tone: '#60a5fa' },
  trade: { Icon: Zap, tone: '#facc15' },
  kyc: { Icon: ShieldCheck, tone: '#2dd4bf' },
  admin: { Icon: Megaphone, tone: '#fb7185' },
  system: { Icon: Newspaper, tone: '#8aa8ff' },
};

function NotificationItem({ notification, onPress, colors }) {
  const meta = iconByType[notification.type] || { Icon: AlertTriangle, tone: '#f59e0b' };
  const { Icon, tone } = meta;
  return (
    <Pressable onPress={() => onPress(notification)} className="flex-row border-b px-4 py-3" style={{ borderColor: colors.border, backgroundColor: notification.isRead ? colors.panel : colors.surface }}>
      <View className="mr-3 h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: tone }}>
        <Icon size={17} color="#0B0B0B" />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center">
          {!notification.isRead ? <View className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.primary }} /> : null}
          <Text className="min-w-0 flex-1 text-xs font-extrabold" numberOfLines={1} style={{ color: colors.text }}>{notification.title}</Text>
        </View>
        <Text className="mt-0.5 text-[11px]" numberOfLines={2} style={{ color: colors.muted }}>{notification.message}</Text>
        <Text className="mt-1 text-[9px] font-semibold uppercase" numberOfLines={1} style={{ color: colors.muted }}>{dateTime(notification.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

export default function NotificationMenu({ notifications = [], unreadCount = 0, loading = false, onMarkRead, onMarkAllRead, onClose }) {
  const { colors } = useAppTheme();

  return (
    <View className="absolute right-3 top-[74px] z-50 w-[360px] max-w-[92vw] overflow-hidden rounded-xl border shadow-2xl" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <View className="flex-row items-center justify-between border-b px-4 py-3" style={{ borderColor: colors.border }}>
        <View>
          <Text className="text-sm font-extrabold" style={{ color: colors.text }}>Notifications</Text>
          <Text className="text-[10px] font-semibold uppercase" style={{ color: colors.muted }}>{unreadCount ? `${unreadCount} unread` : 'All caught up'}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          {unreadCount ? (
            <Pressable onPress={onMarkAllRead} className="h-8 justify-center rounded-md px-2.5" style={{ backgroundColor: colors.surface }}>
              <Text className="text-[10px] font-bold uppercase" style={{ color: colors.text }}>Read all</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: colors.surface }}>
            <X size={16} color={colors.text} />
          </Pressable>
        </View>
      </View>
      {loading && !notifications.length ? (
        <View className="px-4 py-6">
          <Text className="text-xs font-semibold" style={{ color: colors.muted }}>Loading notifications...</Text>
        </View>
      ) : null}
      {!loading && !notifications.length ? (
        <View className="px-4 py-6">
          <Text className="text-xs font-semibold" style={{ color: colors.muted }}>No notifications yet.</Text>
        </View>
      ) : null}
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} colors={colors} notification={notification} onPress={(item) => onMarkRead?.(item.id)} />
      ))}
    </View>
  );
}
