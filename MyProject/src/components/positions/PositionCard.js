import { Pressable, Text, View } from 'react-native';
import { MoreVertical, Star } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { money, quote } from '../../utils/formatters';

const symbolNames = {
  'XAU/USD': 'Gold / US Dollar',
  'XAG/USD': 'Silver / US Dollar',
  'BTC/USD': 'Bitcoin / US Dollar',
  'ETH/USD': 'Ethereum / US Dollar',
};

const symbolIconLabel = (symbol = '') => {
  if (symbol.startsWith('XAU')) return 'Au';
  if (symbol.startsWith('XAG')) return 'Ag';
  if (symbol.startsWith('BTC')) return 'BTC';
  if (symbol.startsWith('ETH')) return 'ETH';
  return symbol.split('/')[0]?.slice(0, 3) || '$';
};

const marketName = (symbol = '') => symbolNames[symbol] || symbol.replace('/', ' / ');

const durationText = (position) => {
  const start = new Date(position.openedAt || position.createdAt).getTime();
  const end = position.closedAt ? new Date(position.closedAt).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return '-';
  const minutes = Math.max(0, Math.floor((end - start) / 60000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days) return `${days}d ${hours % 24}h`;
  if (hours) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};

export default function PositionCard({ position, onClose, onView, closed = false, pending = false, index = 0, columnWidths, tableWidth = 1215 }) {
  const { darkMode, colors } = useAppTheme();
  const widths = columnWidths || [210, 110, 105, 145, 145, 130, 115, 120, 135];
  const profit = Number(position.profit || 0);
  const winning = profit >= 0;
  const profitColor = winning ? colors.success : colors.danger;
  const side = String(position.side || '').toUpperCase();
  const sideColor = side === 'BUY' ? colors.success : colors.danger;
  const rowBackground = index % 2 === 0 ? 'transparent' : darkMode ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.025)';
  const entryPrice = Number(position.openPrice || position.entryPrice || 0);
  const currentPrice = Number(position.currentPrice || position.closePrice || entryPrice);
  const volume = Number(position.lots || 0);
  const pnlPercent = entryPrice && volume ? (profit / (entryPrice * volume)) * 100 : 0;
  const sidePillBg = side === 'BUY' ? 'rgba(18,207,122,0.16)' : 'rgba(242,77,88,0.16)';

  return (
    <View className="flex-row items-center border-t px-4 py-4" style={{ width: tableWidth, minHeight: 70, backgroundColor: rowBackground, borderColor: colors.border }}>
      <View className="flex-row items-center" style={{ width: widths[0] }}>
        <Star size={18} color={colors.muted} />
        <View className="ml-5 h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
          <Text className="text-[9px] font-black" numberOfLines={1} style={{ color: '#0B0B0B' }}>{symbolIconLabel(position.symbol)}</Text>
        </View>
        <View className="ml-3 min-w-0 flex-1">
          <Text className="text-sm font-black" numberOfLines={1} style={{ color: colors.text }}>{position.symbol}</Text>
          <Text className="mt-0.5 text-[11px]" numberOfLines={1} style={{ color: colors.muted }}>{marketName(position.symbol)}</Text>
        </View>
      </View>
      <View style={{ width: widths[1] }}>
        <Text className="self-start rounded-md px-3 py-1.5 text-xs font-black" style={{ backgroundColor: sidePillBg, color: sideColor }}>{side || '-'}</Text>
      </View>
      <Text className="text-sm font-semibold" style={{ width: widths[2], color: colors.text }}>{volume.toFixed(2)}</Text>
      <Text className="text-sm font-semibold" style={{ width: widths[3], color: colors.text }}>{quote(entryPrice, 5)}</Text>
      <Text className="text-sm font-semibold" style={{ width: widths[4], color: colors.text }}>{pending ? String(position.orderType || '-').toUpperCase() : quote(currentPrice, 5)}</Text>
      <Text className="text-sm font-black" style={{ width: widths[5], color: profitColor }}>{profit >= 0 ? '+' : ''}{money(profit)}</Text>
      <Text className="text-sm font-black" style={{ width: widths[6], color: profitColor }}>{pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%</Text>
      <Text className="text-sm font-bold" style={{ width: widths[7], color: colors.text }}>{durationText(position)}</Text>
      <View className="flex-row items-center" style={{ width: widths[8] }}>
        {!closed && !pending ? (
          <Pressable onPress={() => onClose(position.id)} className="h-9 w-[70px] items-center justify-center rounded-md border" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
            <Text className="text-xs font-black" style={{ color: colors.danger }}>Close</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => onView(position)} className="h-9 w-[70px] items-center justify-center rounded-md border" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
            <Text className="text-xs font-black" style={{ color: colors.primary }}>View</Text>
          </Pressable>
        )}
        <Pressable onPress={() => onView(position)} className="ml-3 h-9 w-8 items-center justify-center">
          <MoreVertical size={18} color={colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}
