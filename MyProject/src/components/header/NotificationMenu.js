import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AlertTriangle, CheckCircle2, Newspaper, X, Zap } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { dateTime, money } from '../../utils/formatters';

function NotificationItem({ Icon, title, body, time, tone, colors }) {
  return (
    <View className="flex-row border-b px-4 py-3" style={{ borderColor: colors.border }}>
      <View className="mr-3 h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: tone }}>
        <Icon size={17} color="#0B0B0B" />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-xs font-extrabold" numberOfLines={1} style={{ color: colors.text }}>{title}</Text>
        <Text className="mt-0.5 text-[11px]" numberOfLines={2} style={{ color: colors.muted }}>{body}</Text>
        <Text className="mt-1 text-[9px] font-semibold uppercase" numberOfLines={1} style={{ color: colors.muted }}>{time}</Text>
      </View>
    </View>
  );
}

export default function NotificationMenu({ onClose }) {
  const { colors } = useAppTheme();
  const { currentSymbol, positions, closedPositions, summary, transactions } = useDemoTrading();

  const notifications = useMemo(() => {
    const latestOrder = positions[0] || closedPositions[0];
    const approvedDeposit = transactions.find((item) => item.type === 'deposit' && item.status === 'approved');
    const marginLevel = Number(summary.marginLevel || 0);
    const marginRisk = summary.margin && marginLevel > 0 && marginLevel < 120;

    return [
      {
        Icon: Zap,
        title: 'Order Executed',
        body: latestOrder
          ? `${latestOrder.side} ${latestOrder.symbol} order executed at ${Number(latestOrder.openPrice || latestOrder.closePrice || 0).toFixed(5)}.`
          : 'New executed orders will appear here as soon as a trade is placed.',
        time: latestOrder?.openedAt || latestOrder?.closedAt ? dateTime(latestOrder.openedAt || latestOrder.closedAt) : 'Live order feed',
        tone: colors.success,
      },
      {
        Icon: CheckCircle2,
        title: 'Deposit Approved',
        body: approvedDeposit
          ? `Deposit of ${money(approvedDeposit.amount)} USD has been approved.`
          : 'Approved deposit updates will appear here after account funding is confirmed.',
        time: approvedDeposit?.createdAt ? dateTime(approvedDeposit.createdAt) : 'Wallet updates',
        tone: colors.primary,
      },
      {
        Icon: Newspaper,
        title: 'Market News',
        body: `${currentSymbol?.symbol || 'Market'} news and session updates are available from the market calendar feed.`,
        time: 'Market watch',
        tone: '#4fc3f7',
      },
      {
        Icon: AlertTriangle,
        title: 'Margin Alert',
        body: marginRisk
          ? `Margin level is ${money(marginLevel)}%. Review open positions.`
          : 'Margin level is stable. Alerts will show here when risk increases.',
        time: summary.margin ? `${money(summary.margin)} USD used margin` : 'No used margin',
        tone: marginRisk ? colors.danger : '#8aa8ff',
      },
    ];
  }, [closedPositions, colors.danger, colors.primary, colors.success, currentSymbol?.symbol, positions, summary.margin, summary.marginLevel, transactions]);

  return (
    <View className="absolute right-3 top-[74px] z-50 w-[360px] max-w-[92vw] overflow-hidden rounded-xl border shadow-2xl" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <View className="flex-row items-center justify-between border-b px-4 py-3" style={{ borderColor: colors.border }}>
        <View>
          <Text className="text-sm font-extrabold" style={{ color: colors.text }}>Notifications</Text>
          <Text className="text-[10px] font-semibold uppercase" style={{ color: colors.muted }}>Trading alerts</Text>
        </View>
        <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: colors.surface }}>
          <X size={16} color={colors.text} />
        </Pressable>
      </View>
      {notifications.map((item) => (
        <NotificationItem key={item.title} colors={colors} {...item} />
      ))}
    </View>
  );
}
