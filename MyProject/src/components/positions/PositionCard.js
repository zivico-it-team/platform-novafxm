import { Pressable, Text, View } from 'react-native';
import { Eye, X } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { dateTime, money, quote } from '../../utils/formatters';

export default function PositionCard({ position, onClose, onView, closed = false, index = 0, columnWidths, tableWidth = 1120 }) {
  const { darkMode, colors } = useAppTheme();
  const widths = columnWidths || [82, 170, 150, 220, 105, 90, 150, 150];
  const winning = Number(position.profit) >= 0;
  const profitColor = winning ? colors.success : colors.danger;
  const sideColor = position.side === 'BUY' ? colors.success : colors.danger;
  const rowBackground = index % 2 === 0 ? 'transparent' : darkMode ? 'rgba(255,255,255,0.025)' : 'rgba(0,107,60,0.045)';
  const actionBackground = darkMode ? colors.surface : '#f6fff9';
  const pillBackground = position.side === 'BUY' ? 'rgba(18,207,122,0.14)' : 'rgba(242,77,88,0.14)';

  return (
    <View className="flex-row items-center border-t px-4 py-3.5" style={{ width: tableWidth, backgroundColor: rowBackground, borderColor: colors.border }}>
      <View className="flex-row gap-2" style={{ width: widths[0] }}>
        {!closed ? <Pressable onPress={() => onClose(position.id)} className="h-8 w-8 items-center justify-center rounded-lg border" style={{ backgroundColor: actionBackground, borderColor: colors.border }}><X size={17} color={colors.danger} /></Pressable> : null}
        <Pressable onPress={() => onView(position)} className="h-8 w-8 items-center justify-center rounded-lg border" style={{ backgroundColor: actionBackground, borderColor: colors.border }}>
          <Eye size={17} color={colors.primary} />
        </Pressable>
      </View>
      <View style={{ width: widths[1] }}>
        <Text className="font-bold" style={{ color: colors.text }}>{position.symbol}</Text>
        <Text className="mt-0.5 text-[10px]" style={{ color: colors.muted }}>#{position.id}</Text>
      </View>
      <View style={{ width: widths[2] }}>
        <Text className="self-start rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: winning ? 'rgba(18,207,122,0.14)' : 'rgba(242,77,88,0.14)', color: profitColor }}>{money(position.profit)}</Text>
      </View>
      <Text className="font-medium" style={{ width: widths[3], color: colors.text }}>{dateTime(position.openedAt)}</Text>
      <View style={{ width: widths[4] }}>
        <Text className="self-start rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: pillBackground, color: sideColor }}>{position.side}</Text>
      </View>
      <Text className="font-semibold" style={{ width: widths[5], color: colors.text }}>{Number(position.lots).toFixed(2)}</Text>
      <Text className="font-semibold" style={{ width: widths[6], color: colors.text }}>{quote(position.openPrice, 5)}</Text>
      <Text className="font-semibold" style={{ width: widths[7], color: colors.text }}>{quote(position.currentPrice || position.closePrice, 5)}</Text>
    </View>
  );
}
