import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { percent, quote } from '../../utils/formatters';

export default function SymbolCard({ item, selected, onSelect }) {
  const { darkMode, colors } = useAppTheme();
  const positive = Number(item.change) >= 0;
  const selectedBackground = darkMode ? colors.surface : '#d0efdc';
  const priceColor = positive ? colors.success : colors.danger;

  return (
    <Pressable onPress={() => onSelect(item.symbol)} className="flex-row items-center border-b px-3 py-3" style={{ backgroundColor: selected ? selectedBackground : 'transparent', borderColor: colors.border }}>
      <View className="flex-1">
        <Text className="font-semibold" style={{ color: colors.text }}>{item.symbol}</Text>
        <Text className="mt-1 text-xs" style={{ color: priceColor }}>{percent(item.change)}</Text>
      </View>
      <Text className="w-[78px] text-right" style={{ color: priceColor }}>{quote(item.bid, item.decimals)}</Text>
      <Text className="w-[54px] text-right" style={{ color: colors.muted }}>{Number(item.spreadPoints ?? item.spread).toFixed(1)}</Text>
      <Text className="w-[78px] text-right" style={{ color: priceColor }}>{quote(item.ask, item.decimals)}</Text>
    </Pressable>
  );
}
