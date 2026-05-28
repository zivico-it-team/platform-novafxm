import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { percent, quote } from '../../utils/formatters';

export default function SymbolCard({ item, selected, onSelect }) {
  const { darkMode, colors } = useAppTheme();
  const positive = Number(item.change) >= 0;
  const selectedBackground = darkMode ? colors.surface : '#d0efdc';
  const rowBackground = selected ? selectedBackground : darkMode ? '#06120d' : '#f6fff9';
  const priceColor = positive ? colors.success : colors.danger;
  const priceBackground = positive ? 'rgba(18,207,122,0.12)' : 'rgba(242,77,88,0.12)';

  return (
    <Pressable onPress={() => onSelect(item.symbol)} className="flex-row items-center border-b px-3 py-3.5" style={{ backgroundColor: rowBackground, borderColor: colors.border }}>
      <View className="flex-1">
        <Text className="font-bold" style={{ color: colors.text }}>{item.symbol}</Text>
        <Text className="mt-1 text-xs font-semibold" style={{ color: priceColor }}>{percent(item.change)}</Text>
      </View>
      <View className="w-[78px] items-end">
        <Text className="rounded-full px-2 py-1 text-right text-xs font-bold" style={{ backgroundColor: priceBackground, color: priceColor }}>{quote(item.bid, item.decimals)}</Text>
      </View>
      <Text className="w-[54px] text-right text-xs font-semibold" style={{ color: colors.muted }}>{Number(item.spreadPoints ?? item.spread).toFixed(1)}</Text>
      <View className="w-[78px] items-end">
        <Text className="rounded-full px-2 py-1 text-right text-xs font-bold" style={{ backgroundColor: priceBackground, color: priceColor }}>{quote(item.ask, item.decimals)}</Text>
      </View>
    </Pressable>
  );
}
