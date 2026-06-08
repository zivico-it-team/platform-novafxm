import { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import CustomButton from '../common/CustomButton';
import CustomInput from '../common/CustomInput';
import { useAppTheme } from '../../context/ThemeContext';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { quote } from '../../utils/formatters';
import NewOrderModal from './NewOrderModal';

export default function OrderPanel() {
  const { width } = useWindowDimensions();
  const { currentSymbol, openPosition, summary } = useDemoTrading();
  const { darkMode, colors } = useAppTheme();
  const [lots, setLots] = useState('0.01');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [orderSide, setOrderSide] = useState('BUY');
  const mobile = width < 760;
  const panelBackground = darkMode ? colors.panel : '#e8f8ee';
  const priceBackground = darkMode ? colors.surface : '#f6fff9';
  const orderSuccess = '#12cf7a';
  const orderDanger = '#f24d58';
  const mobileActionWidth = Math.min(width - 48, 300);

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

  const openOrderModal = (side) => {
    setOrderSide(side);
    setOrderModal(true);
  };

  if (mobile) {
    return (
      <>
        <View className="border-t px-3 pb-2.5 pt-2" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
          <View className="flex-row gap-2" style={{ width: mobileActionWidth, alignSelf: 'center' }}>
            <Pressable
              onPress={() => openOrderModal('SELL')}
              className="h-[48px] flex-1 items-center justify-center rounded-md"
              style={{ backgroundColor: orderDanger }}
            >
              <Text className="text-[11px] font-extrabold uppercase text-white">Sell</Text>
              <Text className="mt-0.5 text-sm font-extrabold text-white">{quote(currentSymbol.bid, currentSymbol.decimals)}</Text>
            </Pressable>
            <Pressable
              onPress={() => openOrderModal('BUY')}
              className="h-[48px] flex-1 items-center justify-center rounded-md"
              style={{ backgroundColor: orderSuccess }}
            >
              <Text className="text-[11px] font-extrabold uppercase text-white">Buy</Text>
              <Text className="mt-0.5 text-sm font-extrabold text-white">{quote(currentSymbol.ask, currentSymbol.decimals)}</Text>
            </Pressable>
          </View>
        </View>
        <NewOrderModal visible={orderModal} initialSide={orderSide} onClose={() => setOrderModal(false)} />
      </>
    );
  }

  return (
    <View className="rounded-2xl border p-4 lg:w-[270px]" style={{ backgroundColor: panelBackground, borderColor: colors.border }}>
      <Text className="text-lg font-bold" style={{ color: colors.text }}>New Order</Text>
      <Text className="mb-5 mt-1" style={{ color: colors.muted }}>{currentSymbol.symbol}</Text>
      <CustomInput label="Volume (lots)" value={lots} onChangeText={setLots} keyboardType="decimal-pad" />
      <View className="mb-4 flex-row justify-between rounded-xl p-3" style={{ backgroundColor: priceBackground }}>
        <View>
          <Text className="text-xs" style={{ color: colors.muted }}>Bid</Text>
          <Text className="font-bold" style={{ color: colors.danger }}>{quote(currentSymbol.bid, currentSymbol.decimals)}</Text>
        </View>
        <View>
          <Text className="text-right text-xs" style={{ color: colors.muted }}>Ask</Text>
          <Text className="font-bold" style={{ color: colors.success }}>{quote(currentSymbol.ask, currentSymbol.decimals)}</Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <CustomButton title="SELL" variant="danger" className="flex-1" onPress={() => open('SELL')} loading={loading} />
        <CustomButton title="BUY" variant="success" className="flex-1" onPress={() => open('BUY')} loading={loading} />
      </View>
      {message ? <Text className="mt-3 text-xs" style={{ color: colors.muted }}>{message}</Text> : null}
      <View className="mt-6 border-t pt-4" style={{ borderColor: colors.border }}>
        <Text className="mb-2 text-sm" style={{ color: colors.muted }}>Available Margin</Text>
        <Text className="font-semibold" style={{ color: colors.text }}>{quote(summary.freeFunds, 2)} USD</Text>
      </View>
    </View>
  );
}
