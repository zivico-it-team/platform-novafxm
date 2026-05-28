import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Check, ChevronDown, ChevronRight, Minus, Plus, Search, X } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { MARKET_GROUPS } from '../../constants/symbols';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { quote } from '../../utils/formatters';

const ORDER_TYPES = [
  { value: 'spot', label: 'Spot Order' },
  { value: 'limit', label: 'Limit Order' },
  { value: 'stop', label: 'Stop Order' },
];

function Toggle({ selected, onPress, label, colors }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center">
      <View className="mr-2 h-5 w-5 items-center justify-center rounded border" style={{ backgroundColor: selected ? colors.primary : 'transparent', borderColor: selected ? colors.primary : colors.muted }}>
        {selected ? <Check size={14} color="#fff" /> : null}
      </View>
      <Text className="font-semibold" style={{ color: colors.text }}>{label}</Text>
    </Pressable>
  );
}

function ValueCard({ pips, setPips, price, profit, compact, colors, controlBackground }) {
  return (
    <View className={`${compact ? 'w-[102px]' : 'w-[165px]'} overflow-hidden rounded-xl border`} style={{ backgroundColor: controlBackground, borderColor: colors.border }}>
      <TextInput value={pips} onChangeText={setPips} keyboardType="numbers-and-punctuation" className="h-11 border-b px-3 text-base" style={{ borderColor: colors.border, color: colors.text }} />
      <Text className="border-b px-3 py-3 text-base" style={{ borderColor: colors.border, color: colors.text }}>{price}</Text>
      <Text className="px-3 py-3 text-base" style={{ color: colors.text }}>{profit}</Text>
    </View>
  );
}

export default function NewOrderModal({ visible, onClose }) {
  const { width } = useWindowDimensions();
  const compact = width < 560;
  const { darkMode, colors } = useAppTheme();
  const { prices, currentSymbol, selectedSymbol, setSelectedSymbol, openPosition, createPendingOrder } = useDemoTrading();
  const [orderType, setOrderType] = useState('spot');
  const [side, setSide] = useState('BUY');
  const [lots, setLots] = useState('0.01');
  const [symbolMenu, setSymbolMenu] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
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
      setSymbolSearch('');
      setExpandedGroups({});
      setMessage('');
    }
  }, [visible]);

  const basePrice = Number(entryPrice || currentSymbol.price);
  const pipSize = 10 ** -currentSymbol.decimals;
  const stopPrice = quote(basePrice - Math.abs(Number(stopPips) || 0) * pipSize, currentSymbol.decimals);
  const profitPrice = quote(basePrice + Math.abs(Number(profitPips) || 0) * pipSize, currentSymbol.decimals);
  const quantity = Number(lots || 0);
  const changeLots = (amount) => setLots(Math.max(0.01, quantity + amount).toFixed(2));
  const filteredSymbols = useMemo(
    () => prices.filter((item) => item.symbol.toLowerCase().includes(symbolSearch.toLowerCase())),
    [prices, symbolSearch],
  );
  const groupItems = (group) =>
    filteredSymbols.filter((item) => (group === 'POPULAR' ? item.popular : item.group === group));
  const selectSymbol = (symbol) => {
    setSelectedSymbol(symbol);
    setSymbolMenu(false);
    setSymbolSearch('');
    setExpandedGroups({});
  };
  const modalBackground = darkMode ? colors.panel : '#e8f8ee';
  const sectionBackground = darkMode ? colors.panel : '#f6fff9';
  const controlBackground = darkMode ? colors.surface : '#f6fff9';
  const activeTabBackground = darkMode ? colors.primarySoft : '#d0efdc';

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
        <Pressable onPress={(event) => event.stopPropagation()} className="max-h-[96%] w-full max-w-[460px] rounded-2xl border p-4 lg:p-5" style={{ backgroundColor: modalBackground, borderColor: colors.border }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>Create New Market Order</Text>
              <Pressable onPress={onClose} className="p-2"><X size={18} color={colors.muted} /></Pressable>
            </View>
            <View className="mb-4 flex-row flex-wrap">
              {ORDER_TYPES.map((type) => (
                <Pressable key={type.value} onPress={() => setOrderType(type.value)} className="mr-3 rounded-full px-3 py-1.5" style={{ backgroundColor: orderType === type.value ? activeTabBackground : 'transparent' }}>
                  <Text className="text-xs font-semibold" style={{ color: orderType === type.value ? colors.primary : colors.text }}>{type.label}</Text>
                </Pressable>
              ))}
            </View>
            <View className="rounded-2xl border p-4" style={{ backgroundColor: sectionBackground, borderColor: colors.border }}>
              <View className="relative z-50 mb-5" style={{ zIndex: 50 }}>
                <Pressable onPress={() => setSymbolMenu((open) => !open)} className="h-12 flex-row items-center justify-between rounded-xl border px-4" style={{ backgroundColor: controlBackground, borderColor: colors.border }}>
                  <Text className="font-bold" style={{ color: colors.text }}>{currentSymbol.symbol}  <Text className="font-normal" style={{ color: colors.muted }}>({currentSymbol.name})</Text></Text>
                  <ChevronDown size={18} color={colors.muted} />
                </Pressable>
                {symbolMenu ? (
                  <View
                    className="absolute left-0 right-0 top-14 z-50 max-h-[260px] overflow-hidden rounded-xl border shadow-2xl"
                    style={{ backgroundColor: modalBackground, borderColor: colors.border, elevation: 16, zIndex: 50 }}
                  >
                    <View className="h-11 flex-row items-center border-b px-3" style={{ borderColor: colors.border }}>
                      <TextInput
                        value={symbolSearch}
                        onChangeText={setSymbolSearch}
                        placeholder="Search symbol"
                        placeholderTextColor={colors.muted}
                        className="flex-1 text-sm"
                        style={{ color: colors.text }}
                      />
                      <Search size={17} color={colors.muted} />
                    </View>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator indicatorStyle={darkMode ? 'white' : 'black'}>
                      {MARKET_GROUPS.map((group) => {
                        const items = groupItems(group);
                        if (!items.length) return null;
                        const expanded = Boolean(symbolSearch) || Boolean(expandedGroups[group]);
                        return (
                          <View key={group}>
                            <Pressable
                              onPress={() => setExpandedGroups((current) => ({ ...current, [group]: !current[group] }))}
                              className="h-10 flex-row items-center border-b px-4"
                              style={{ borderColor: colors.border }}
                            >
                              {expanded ? <ChevronDown size={16} color={colors.primary} /> : <ChevronRight size={16} color={colors.muted} />}
                              <Text className="ml-3 text-xs font-bold" style={{ color: colors.text }}>{group}</Text>
                            </Pressable>
                            {expanded ? items.map((item) => (
                              <Pressable
                                key={item.symbol}
                                onPress={() => selectSymbol(item.symbol)}
                                className="border-b px-10 py-2.5"
                                style={{ backgroundColor: item.symbol === selectedSymbol ? controlBackground : 'transparent', borderColor: colors.border }}
                              >
                                <Text className="text-xs font-semibold" style={{ color: colors.text }}>{item.symbol}  <Text style={{ color: colors.muted }}>{item.name}</Text></Text>
                              </Pressable>
                            )) : null}
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
              <View className="mb-6 flex-row gap-3">
                <Pressable onPress={() => setSide('SELL')} className="h-[54px] flex-1 items-center justify-center rounded-xl border" style={{ backgroundColor: side === 'SELL' ? colors.danger : 'transparent', borderColor: colors.danger }}>
                  <Text className="text-xs" style={{ color: side === 'SELL' ? '#fff' : colors.danger }}>SELL</Text>
                  {orderType === 'spot' ? <Text className="mt-0.5 font-bold" style={{ color: side === 'SELL' ? '#fff' : colors.danger }}>{quote(currentSymbol.bid, currentSymbol.decimals)}</Text> : null}
                </Pressable>
                <Pressable onPress={() => setSide('BUY')} className="h-[54px] flex-1 items-center justify-center rounded-xl border" style={{ backgroundColor: side === 'BUY' ? colors.success : 'transparent', borderColor: colors.success }}>
                  <Text className="text-xs" style={{ color: side === 'BUY' ? '#fff' : colors.success }}>BUY</Text>
                  {orderType === 'spot' ? <Text className="mt-0.5 font-bold" style={{ color: side === 'BUY' ? '#fff' : colors.success }}>{quote(currentSymbol.ask, currentSymbol.decimals)}</Text> : null}
                </Pressable>
              </View>
              <View className={`mb-6 ${orderType === 'spot' ? 'items-center' : compact ? 'gap-4' : 'flex-row gap-4'}`}>
                {orderType !== 'spot' ? (
                  <View className="flex-1">
                    <Text className="mb-2 text-center font-semibold" style={{ color: colors.text }}>Entry Price</Text>
                    <TextInput value={entryPrice} onChangeText={setEntryPrice} keyboardType="decimal-pad" className="h-[46px] rounded-xl border px-4 text-base" style={{ backgroundColor: controlBackground, borderColor: colors.border, color: colors.text }} />
                  </View>
                ) : null}
                <View className={orderType === 'spot' ? 'w-[286px]' : 'flex-1'}>
                  <Text className="mb-2 text-center font-semibold" style={{ color: colors.text }}>Quantity</Text>
                  <View className="h-[42px] flex-row overflow-hidden rounded-xl border" style={{ backgroundColor: controlBackground, borderColor: colors.border }}>
                    <TextInput value={lots} onChangeText={setLots} keyboardType="decimal-pad" className="flex-1 px-4 text-base" style={{ color: colors.text }} />
                    <Pressable onPress={() => changeLots(-0.01)} className="w-[48px] items-center justify-center border-l" style={{ borderColor: colors.border }}><Minus size={18} color={colors.muted} /></Pressable>
                    <Pressable onPress={() => changeLots(0.01)} className="w-[48px] items-center justify-center border-l" style={{ borderColor: colors.border }}><Plus size={18} color={colors.muted} /></Pressable>
                  </View>
                </View>
              </View>
              <View className="mb-5 flex-row items-center justify-between">
                <View>
                  <Toggle selected={stopLossOn} onPress={() => setStopLossOn((value) => !value)} label="Stop Loss" colors={colors} />
                  <View className="mt-3"><ValueCard pips={stopPips} setPips={setStopPips} price={stopPrice} profit="0" compact={compact} colors={colors} controlBackground={controlBackground} /></View>
                </View>
                <View className="mt-12 items-center gap-5 px-1">
                  <Text className="text-sm" style={{ color: colors.text }}>Pips</Text>
                  <Text className="text-sm" style={{ color: colors.text }}>Price</Text>
                  <Text className="text-sm" style={{ color: colors.text }}>Profit</Text>
                </View>
                <View>
                  <Toggle selected={takeProfitOn} onPress={() => setTakeProfitOn((value) => !value)} label="Take Profit" colors={colors} />
                  <View className="mt-3"><ValueCard pips={profitPips} setPips={setProfitPips} price={profitPrice} profit="0" compact={compact} colors={colors} controlBackground={controlBackground} /></View>
                </View>
              </View>
              {message ? <Text className="mb-4" style={{ color: colors.danger }}>{message}</Text> : null}
              <Pressable disabled={loading} onPress={placeOrder} className={`h-[48px] items-center justify-center rounded-xl ${loading ? 'opacity-60' : ''}`} style={{ backgroundColor: side === 'SELL' ? colors.danger : colors.success }}>
                <Text className="text-xs font-bold text-white">{loading ? 'PLACING ORDER...' : 'PLACE ORDER'}</Text>
              </Pressable>
              <Text className="mt-4 text-center text-xs" style={{ color: colors.text }}>Spread: {Number(currentSymbol.spreadPoints || 0).toFixed(1)}   High: {quote(Math.max(currentSymbol.bid, currentSymbol.ask), currentSymbol.decimals)}   Low: {quote(Math.min(currentSymbol.bid, currentSymbol.ask), currentSymbol.decimals)}</Text>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
