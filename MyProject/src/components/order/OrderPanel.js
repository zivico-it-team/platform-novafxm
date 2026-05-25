import { useState } from 'react';
import { Text, View } from 'react-native';
import CustomButton from '../common/CustomButton';
import CustomInput from '../common/CustomInput';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { quote } from '../../utils/formatters';

export default function OrderPanel() {
  const { currentSymbol, openPosition, summary } = useDemoTrading();
  const [lots, setLots] = useState('0.01');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const open = async (side) => {
    setLoading(true);
    try {
      await openPosition(side, lots);
      setMessage(`${side} order opened successfully.`);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="rounded-2xl border border-border bg-panel p-4 lg:w-[270px]">
      <Text className="text-lg font-bold text-white">New Order</Text>
      <Text className="mb-5 mt-1 text-muted">{currentSymbol.symbol}</Text>
      <CustomInput label="Volume (lots)" value={lots} onChangeText={setLots} keyboardType="decimal-pad" />
      <View className="mb-4 flex-row justify-between rounded-xl bg-surface p-3">
        <View>
          <Text className="text-xs text-muted">Bid</Text>
          <Text className="font-bold text-danger">{quote(currentSymbol.bid, currentSymbol.decimals)}</Text>
        </View>
        <View>
          <Text className="text-right text-xs text-muted">Ask</Text>
          <Text className="font-bold text-success">{quote(currentSymbol.ask, currentSymbol.decimals)}</Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <CustomButton title="SELL" variant="danger" className="flex-1" onPress={() => open('SELL')} loading={loading} />
        <CustomButton title="BUY" variant="success" className="flex-1" onPress={() => open('BUY')} loading={loading} />
      </View>
      {message ? <Text className="mt-3 text-xs text-muted">{message}</Text> : null}
      <View className="mt-6 border-t border-border pt-4">
        <Text className="mb-2 text-sm text-muted">Available Margin</Text>
        <Text className="font-semibold text-white">{quote(summary.freeFunds, 2)} USD</Text>
      </View>
    </View>
  );
}
