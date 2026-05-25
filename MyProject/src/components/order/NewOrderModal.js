import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Check, ChevronDown, Minus, Plus, X } from 'lucide-react-native';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { quote } from '../../utils/formatters';

const ORDER_TYPES = [
  { value: 'spot', label: 'Spot Order' },
  { value: 'limit', label: 'Limit Order' },
  { value: 'stop', label: 'Stop Order' },
];

function Toggle({ selected, onPress, label }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center">
      <View className={`mr-2 h-5 w-5 items-center justify-center rounded border ${selected ? 'border-primary bg-primary' : 'border-muted'}`}>
        {selected ? <Check size={14} color="#fff" /> : null}
      </View>
      <Text className="font-semibold text-white">{label}</Text>
    </Pressable>
  );
}

function ValueCard({ pips, setPips, price, profit, compact }) {
  return (
    <View className={`${compact ? 'w-[102px]' : 'w-[165px]'} overflow-hidden rounded-xl border border-border bg-surface`}>
      <TextInput value={pips} onChangeText={setPips} keyboardType="numbers-and-punctuation" className="h-11 border-b border-border px-3 text-base text-white" />
      <Text className="border-b border-border px-3 py-3 text-base text-white">{price}</Text>
      <Text className="px-3 py-3 text-base text-white">{profit}</Text>
    </View>
  );
}

export default function NewOrderModal({ visible, onClose }) {
  const { width } = useWindowDimensions();
  const compact = width < 560;
  const { prices, currentSymbol, selectedSymbol, setSelectedSymbol, openPosition, createPendingOrder } = useDemoTrading();
  const [orderType, setOrderType] = useState('spot');
  const [side, setSide] = useState('BUY');
  const [lots, setLots] = useState('0.01');
  const [symbolMenu, setSymbolMenu] = useState(false);
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossOn, setStopLossOn] = useState(false);
  const [takeProfitOn, setTakeProfitOn] = useState(false);
  const [stopPips, setStopPips] = useState('-0.2');
  const [profitPips, setProfitPips] = useState('0.2');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEntryPrice(quote(currentSymbol.price, currentSymbol.decimals));
  }, [currentSymbol.price, currentSymbol.decimals, selectedSymbol]);

  useEffect(() => {
    if (!visible) {
      setSymbolMenu(false);
      setMessage('');
    }
  }, [visible]);

  const basePrice = Number(entryPrice || currentSymbol.price);
  const pipSize = 10 ** -currentSymbol.decimals;
  const stopPrice = quote(basePrice - Math.abs(Number(stopPips) || 0) * pipSize, currentSymbol.decimals);
  const profitPrice = quote(basePrice + Math.abs(Number(profitPips) || 0) * pipSize, currentSymbol.decimals);
  const quantity = Number(lots || 0);
  const changeLots = (amount) => setLots(Math.max(0.01, quantity + amount).toFixed(2));
  const shownSymbols = useMemo(() => prices.filter((item) => item.popular).slice(0, 9), [prices]);

  const placeOrder = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (orderType === 'spot') {
        await openPosition(side, lots);
      } else {
        createPendingOrder({
          side,
          lots,
          orderType: orderType.toUpperCase(),
          entryPrice,
          stopLoss: stopLossOn ? stopPrice : null,
          takeProfit: takeProfitOn ? profitPrice : null,
        });
      }
      onClose();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/70 p-3">
        <Pressable onPress={(event) => event.stopPropagation()} className="max-h-[96%] w-full max-w-[690px] rounded-2xl border border-border bg-[#0c1326] p-4 lg:p-7">
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-white">Create New Market Order</Text>
              <Pressable onPress={onClose} className="p-2"><X size={20} color="#8fa0bb" /></Pressable>
            </View>
            <View className="mb-5 flex-row flex-wrap">
              {ORDER_TYPES.map((type) => (
                <Pressable key={type.value} onPress={() => setOrderType(type.value)} className={`mr-4 rounded-full px-4 py-2 ${orderType === type.value ? 'bg-[#173b64]' : ''}`}>
                  <Text className={orderType === type.value ? 'font-semibold text-primary' : 'font-semibold text-white'}>{type.label}</Text>
                </Pressable>
              ))}
            </View>
            <View className="rounded-2xl border border-border p-5 lg:p-6">
              <View className="relative mb-7">
                <Pressable onPress={() => setSymbolMenu((open) => !open)} className="h-14 flex-row items-center justify-between rounded-xl border border-border bg-[#0d1427] px-5">
                  <Text className="font-bold text-white">{currentSymbol.symbol}  <Text className="font-normal text-muted">({currentSymbol.name})</Text></Text>
                  <ChevronDown size={19} color="#8fa0bb" />
                </Pressable>
                {symbolMenu ? (
                  <View className="absolute left-0 right-0 top-14 z-10 rounded-xl border border-border bg-panel p-2">
                    {shownSymbols.map((item) => (
                      <Pressable key={item.symbol} onPress={() => { setSelectedSymbol(item.symbol); setSymbolMenu(false); }} className="rounded-lg px-4 py-3">
                        <Text className="text-white">{item.symbol}  <Text className="text-muted">{item.name}</Text></Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
              <View className="mb-8 flex-row gap-3 lg:gap-5">
                <Pressable onPress={() => setSide('SELL')} className={`h-[74px] flex-1 items-center justify-center rounded-xl border ${side === 'SELL' ? 'bg-danger' : 'border-danger'}`}>
                  <Text className={side === 'SELL' ? 'text-white' : 'text-danger'}>SELL</Text>
                  {orderType === 'spot' ? <Text className={`mt-1 text-lg font-bold ${side === 'SELL' ? 'text-white' : 'text-danger'}`}>{quote(currentSymbol.bid, currentSymbol.decimals)}</Text> : null}
                </Pressable>
                <Pressable onPress={() => setSide('BUY')} className={`h-[74px] flex-1 items-center justify-center rounded-xl border ${side === 'BUY' ? 'border-success bg-success' : 'border-success'}`}>
                  <Text className={side === 'BUY' ? 'text-white' : 'text-success'}>BUY</Text>
                  {orderType === 'spot' ? <Text className={`mt-1 text-lg font-bold ${side === 'BUY' ? 'text-white' : 'text-success'}`}>{quote(currentSymbol.ask, currentSymbol.decimals)}</Text> : null}
                </Pressable>
              </View>
              <View className={`mb-8 ${orderType === 'spot' ? 'items-center' : compact ? 'gap-4' : 'flex-row gap-4'}`}>
                {orderType !== 'spot' ? (
                  <View className="flex-1">
                    <Text className="mb-3 text-center text-lg font-semibold text-white">Entry Price</Text>
                    <TextInput value={entryPrice} onChangeText={setEntryPrice} keyboardType="decimal-pad" className="h-[54px] rounded-xl border border-border bg-surface px-4 text-lg text-white" />
                  </View>
                ) : null}
                <View className={orderType === 'spot' ? 'w-[286px]' : 'flex-1'}>
                  <Text className="mb-3 text-center text-lg font-semibold text-white">Quantity</Text>
                  <View className="h-[54px] flex-row overflow-hidden rounded-xl border border-border bg-surface">
                    <TextInput value={lots} onChangeText={setLots} keyboardType="decimal-pad" className="flex-1 px-4 text-lg text-white" />
                    <Pressable onPress={() => changeLots(-0.01)} className="w-[52px] items-center justify-center border-l border-border"><Minus size={20} color="#8fa0bb" /></Pressable>
                    <Pressable onPress={() => changeLots(0.01)} className="w-[52px] items-center justify-center border-l border-border"><Plus size={20} color="#8fa0bb" /></Pressable>
                  </View>
                </View>
              </View>
              <View className="mb-5 flex-row items-center justify-between">
                <View>
                  <Toggle selected={stopLossOn} onPress={() => setStopLossOn((value) => !value)} label="Stop Loss" />
                  <View className="mt-3"><ValueCard pips={stopPips} setPips={setStopPips} price={stopPrice} profit="0" compact={compact} /></View>
                </View>
                <View className="mt-12 items-center gap-5 px-1">
                  <Text className="text-base text-white">Pips</Text>
                  <Text className="text-base text-white">Price</Text>
                  <Text className="text-base text-white">Profit</Text>
                </View>
                <View>
                  <Toggle selected={takeProfitOn} onPress={() => setTakeProfitOn((value) => !value)} label="Take Profit" />
                  <View className="mt-3"><ValueCard pips={profitPips} setPips={setProfitPips} price={profitPrice} profit="0" compact={compact} /></View>
                </View>
              </View>
              {message ? <Text className="mb-4 text-danger">{message}</Text> : null}
              <Pressable disabled={loading} onPress={placeOrder} className={`h-[60px] items-center justify-center rounded-xl ${side === 'SELL' ? 'bg-danger' : 'bg-success'} ${loading ? 'opacity-60' : ''}`}>
                <Text className="font-bold text-white">{loading ? 'PLACING ORDER...' : 'PLACE ORDER'}</Text>
              </Pressable>
              <Text className="mt-5 text-center text-white">Spread: {Number(currentSymbol.spreadPoints || 0).toFixed(1)}   High: {quote(Math.max(currentSymbol.bid, currentSymbol.ask), currentSymbol.decimals)}   Low: {quote(Math.min(currentSymbol.bid, currentSymbol.ask), currentSymbol.decimals)}</Text>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
