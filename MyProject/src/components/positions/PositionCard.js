import { Pressable, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { dateTime, money, quote } from '../../utils/formatters';

export default function PositionCard({ position, onClose, closed = false }) {
  const { colors } = useAppTheme();
  const winning = Number(position.profit) >= 0;
  const profitColor = winning ? colors.success : colors.danger;
  const sideColor = position.side === 'BUY' ? colors.success : colors.danger;

  return (
    <View className="min-w-[850px] flex-row items-center border-t px-4 py-3" style={{ borderColor: colors.border }}>
      <View className="w-[45px]">
        {!closed ? <Pressable onPress={() => onClose(position.id)} className="w-8 rounded border p-1" style={{ borderColor: colors.border }}><X size={18} color={colors.danger} /></Pressable> : null}
      </View>
      <Text className="w-[130px] font-semibold" style={{ color: colors.text }}>{position.symbol}</Text>
      <Text className="w-[120px]" style={{ color: profitColor }}>{money(position.profit)}</Text>
      <Text className="w-[190px]" style={{ color: colors.text }}>{dateTime(position.openedAt)}</Text>
      <Text className="w-[80px] font-bold" style={{ color: sideColor }}>{position.side}</Text>
      <Text className="w-[80px]" style={{ color: colors.text }}>{Number(position.lots).toFixed(2)}</Text>
      <Text className="w-[125px]" style={{ color: colors.text }}>{quote(position.openPrice, 5)}</Text>
      <Text className="w-[125px]" style={{ color: colors.text }}>{quote(position.currentPrice || position.closePrice, 5)}</Text>
    </View>
  );
}
