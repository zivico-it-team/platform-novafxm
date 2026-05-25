import { Pressable, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { dateTime, money, quote } from '../../utils/formatters';

export default function PositionCard({ position, onClose, closed = false }) {
  const winning = Number(position.profit) >= 0;
  return (
    <View className="min-w-[850px] flex-row items-center border-t border-border px-4 py-3">
      <View className="w-[45px]">
        {!closed ? <Pressable onPress={() => onClose(position.id)} className="w-8 rounded border border-border p-1"><X size={18} color="#f24d58" /></Pressable> : null}
      </View>
      <Text className="w-[130px] font-semibold text-white">{position.symbol}</Text>
      <Text className={`w-[120px] ${winning ? 'text-success' : 'text-danger'}`}>{money(position.profit)}</Text>
      <Text className="w-[190px] text-white">{dateTime(position.openedAt)}</Text>
      <Text className={`w-[80px] font-bold ${position.side === 'BUY' ? 'text-success' : 'text-danger'}`}>{position.side}</Text>
      <Text className="w-[80px] text-white">{Number(position.lots).toFixed(2)}</Text>
      <Text className="w-[125px] text-white">{quote(position.openPrice, 5)}</Text>
      <Text className="w-[125px] text-white">{quote(position.currentPrice || position.closePrice, 5)}</Text>
    </View>
  );
}
