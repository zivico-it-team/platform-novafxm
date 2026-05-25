import { Pressable, Text, View } from 'react-native';
import { quote, percent } from '../../utils/formatters';

export default function SymbolCard({ item, selected, onSelect }) {
  const positive = Number(item.change) >= 0;
  return (
    <Pressable onPress={() => onSelect(item.symbol)} className={`flex-row items-center border-b border-border px-3 py-3 ${selected ? 'bg-[#182d4c]' : ''}`}>
      <View className="flex-1">
        <Text className="font-semibold text-white">{item.symbol}</Text>
        <Text className={`mt-1 text-xs ${positive ? 'text-success' : 'text-danger'}`}>{percent(item.change)}</Text>
      </View>
      <Text className={`w-[78px] text-right ${positive ? 'text-success' : 'text-danger'}`}>{quote(item.bid, item.decimals)}</Text>
      <Text className="w-[54px] text-right text-muted">{Number(item.spreadPoints ?? item.spread).toFixed(1)}</Text>
      <Text className={`w-[78px] text-right ${positive ? 'text-success' : 'text-danger'}`}>{quote(item.ask, item.decimals)}</Text>
    </Pressable>
  );
}
