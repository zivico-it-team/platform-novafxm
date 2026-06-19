import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Check, ChevronDown, ChevronRight, Minus, Plus, Search, X } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { MARKET_GROUPS } from '../../constants/symbols';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { useAuth } from '../../hooks/useAuth';
import { quote } from '../../utils/formatters';

const ORDER_TYPES = [
  { value: 'spot', label: 'Spot Order' },
  { value: 'limit', label: 'Limit Order' },
  { value: 'stop', label: 'Stop Order' },
];

function Toggle({ selected, onPress, label, colors, compact = false }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center">
      <View className={`${compact ? 'mr-2 h-5 w-5' : 'mr-3 h-6 w-6'} items-center justify-center rounded-md border`} style={{ backgroundColor: selected ? colors.primary : 'transparent', borderColor: selected ? colors.primary : colors.muted }}>
        {selected ? <Check size={compact ? 12 : 14} color="#0B0B0B" /> : null}
      </View>
      <Text className={`${compact ? 'text-xs' : 'text-base'} font-extrabold`} style={{ color: colors.text }}>{label}</Text>
    </Pressable>
  );
}

function ValueCard({ pips, setPips, price, setPrice, profit, compact, colors, controlBackground }) {
  return (
    <View className={`${compact ? 'w-[94px]' : 'w-[190px]'} overflow-hidden rounded-lg border`} style={{ backgroundColor: controlBackground, borderColor: colors.border }}>
      <TextInput value={pips} onChangeText={setPips} keyboardType="numbers-and-punctuation" className={`${compact ? 'h-9 px-2 text-sm' : 'h-12 px-4 text-lg'} border-b font-semibold`} style={{ borderColor: colors.border, color: colors.text }} />
      <TextInput value={price} onChangeText={setPrice} keyboardType="numbers-and-punctuation" className={`${compact ? 'h-9 px-2 text-sm' : 'h-12 px-4 text-lg'} border-b font-semibold`} style={{ borderColor: colors.border, color: colors.text }} />
      <Text className={`${compact ? 'px-2 py-2 text-sm' : 'px-4 py-3 text-lg'} font-semibold`} style={{ color: colors.text }}>{profit}</Text>
    </View>
  );
}

export function NewOrderTicket({ visible = true, onClose, initialSide = 'BUY', embedded = false }) {
  const { width } = useWindowDimensions();
  const compact = width < 560;
  const { darkMode, colors } = useAppTheme();
  const { user } = useAuth();
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
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) setEntryPrice(quote(currentSymbol.price, currentSymbol.decimals));
  }, [currentSymbol.decimals, selectedSymbol, visible]);

  useEffect(() => {
    if (!visible) {
      setSymbolMenu(false);
      setSymbolSearch('');
      setExpandedGroups({});
      setMessage('');
    } else {
      setSide(initialSide);
    }
  }, [initialSide, visible]);

  const basePrice = Number(entryPrice || currentSymbol.price);
  const pipSize = 10 ** -currentSymbol.decimals;
  const formatOrderPrice = (value) => quote(value, currentSymbol.decimals);
  const calculateStopPrice = (pips = stopPips) => {
    const distance = Math.abs(Number(pips) || 0) * pipSize;
    return formatOrderPrice(side === 'BUY' ? basePrice - distance : basePrice + distance);
  };
  const calculateProfitPrice = (pips = profitPips) => {
    const distance = Math.abs(Number(pips) || 0) * pipSize;
    return formatOrderPrice(side === 'BUY' ? basePrice + distance : basePrice - distance);
  };
  const quantity = Number(lots || 0);
  const changeLots = (amount) => setLots(Math.max(0.01, quantity + amount).toFixed(2));
  const updateStopPips = (value) => {
    setStopPips(value);
    setStopLossPrice(calculateStopPrice(value));
  };
  const updateProfitPips = (value) => {
    setProfitPips(value);
    setTakeProfitPrice(calculateProfitPrice(value));
  };

  useEffect(() => {
    setStopLossPrice(calculateStopPrice(stopPips));
    setTakeProfitPrice(calculateProfitPrice(profitPips));
  }, [entryPrice, currentSymbol.decimals, selectedSymbol, side]);
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
  const modalBackground = darkMode ? '#171b21' : colors.panel;
  const sectionBackground = darkMode ? '#171b21' : colors.panel;
  const controlBackground = darkMode ? '#20262d' : colors.surface;
  const insetBackground = darkMode ? '#0f1419' : '#f8faf7';
  const activeTabBackground = colors.primarySoft;
  const orderSuccess = '#12cf7a';
  const orderDanger = darkMode ? colors.danger : '#f24d58';

  const placeOrder = async () => {
    if (!user) {
      setMessage('Please log in to place trades.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      if (orderType === 'spot') {
        await openPosition(side, lots, {
          stopLoss: stopLossOn ? stopLossPrice : null,
          takeProfit: takeProfitOn ? takeProfitPrice : null,
        });
      } else {
        await createPendingOrder({
          side,
          lots,
          orderType,
          entryPrice,
          stopLoss: stopLossOn ? stopLossPrice : null,
          takeProfit: takeProfitOn ? takeProfitPrice : null,
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
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            if (symbolMenu) setSymbolMenu(false);
          }}
          className={`${embedded ? 'h-full w-full rounded-xl p-2' : 'max-h-[96%] w-full max-w-[500px] rounded-2xl p-4'} border`}
          style={{ backgroundColor: modalBackground, borderColor: colors.border }}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={embedded ? { flexGrow: 1 } : undefined}>
            <View className={`${embedded ? 'mb-3' : 'mb-5'} flex-row items-center justify-between`}>
              <View>
                <Text className={embedded ? 'text-base font-extrabold' : 'text-xl font-extrabold'} style={{ color: colors.text }}>New Order</Text>
              </View>
              <Pressable onPress={onClose} className={`${embedded ? 'h-8 w-8' : 'h-9 w-9'} items-center justify-center rounded-full`} style={{ backgroundColor: controlBackground }}><X size={embedded ? 16 : 18} color={colors.muted} /></Pressable>
            </View>
            <View className={`${embedded ? 'mb-3' : 'mb-5'} flex-row flex-wrap gap-2`}>
              {ORDER_TYPES.map((type) => (
                <Pressable key={type.value} onPress={() => setOrderType(type.value)} className={`${embedded ? 'px-3 py-1.5' : 'px-4 py-2'} rounded-full`} style={{ backgroundColor: orderType === type.value ? activeTabBackground : 'transparent' }}>
                  <Text className={`${embedded ? 'text-xs' : 'text-sm'} font-black`} style={{ color: orderType === type.value ? colors.primary : colors.text }}>{type.label}</Text>
                </Pressable>
              ))}
            </View>
            <View className="rounded-xl border" style={{ padding: embedded ? 8 : 16, backgroundColor: sectionBackground, borderColor: colors.border }}>
              <Pressable onPress={(event) => event.stopPropagation()} className={`relative z-50 ${embedded ? 'mb-3' : 'mb-5'}`} style={{ zIndex: 50 }}>
                <Pressable onPress={() => setSymbolMenu((open) => !open)} className={`${embedded ? 'h-10 px-3' : 'h-[52px] px-5'} flex-row items-center justify-between rounded-lg border`} style={{ backgroundColor: controlBackground, borderColor: colors.border }}>
                  <Text numberOfLines={1} className={`${embedded ? 'text-xs' : 'text-base'} flex-1 font-extrabold`} style={{ color: colors.text }}>{currentSymbol.symbol}  <Text className="font-semibold" style={{ color: colors.muted }}>({currentSymbol.name})</Text></Text>
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
              </Pressable>
              <View className={`${embedded ? 'mb-3 gap-2' : 'mb-6 gap-4'} flex-row`}>
                <Pressable onPress={() => setSide('SELL')} className={`${compact || embedded ? 'h-[46px] rounded-lg' : 'h-[60px] rounded-xl'} flex-1 items-center justify-center border`} style={{ backgroundColor: side === 'SELL' ? orderDanger : 'transparent', borderColor: orderDanger }}>
                  <Text className="text-[11px] font-extrabold" style={{ color: side === 'SELL' ? '#fff' : orderDanger }}>SELL</Text>
                  {orderType === 'spot' ? <Text className={`${embedded ? 'text-sm' : 'text-base'} mt-0.5 font-extrabold`} style={{ color: side === 'SELL' ? '#fff' : orderDanger }}>{quote(currentSymbol.bid, currentSymbol.decimals)}</Text> : null}
                </Pressable>
                <Pressable onPress={() => setSide('BUY')} className={`${compact || embedded ? 'h-[46px] rounded-lg' : 'h-[60px] rounded-xl'} flex-1 items-center justify-center border`} style={{ backgroundColor: side === 'BUY' ? orderSuccess : 'transparent', borderColor: orderSuccess }}>
                  <Text className="text-[11px] font-extrabold" style={{ color: side === 'BUY' ? '#fff' : orderSuccess }}>BUY</Text>
                  {orderType === 'spot' ? <Text className={`${embedded ? 'text-sm' : 'text-base'} mt-0.5 font-extrabold`} style={{ color: side === 'BUY' ? '#fff' : orderSuccess }}>{quote(currentSymbol.ask, currentSymbol.decimals)}</Text> : null}
                </Pressable>
              </View>
              <View className={`${embedded ? 'mb-3' : 'mb-5'} ${orderType === 'spot' ? 'items-center' : compact ? 'gap-4' : 'flex-row gap-4'}`}>
                {orderType !== 'spot' ? (
                  <View className="flex-1">
                    <Text className="mb-2 text-center text-base font-black" style={{ color: colors.text }}>Entry Price</Text>
                    <TextInput value={entryPrice} onChangeText={setEntryPrice} keyboardType="decimal-pad" className="h-[52px] rounded-xl border px-4 text-lg font-semibold" style={{ backgroundColor: controlBackground, borderColor: colors.border, color: colors.text }} />
                  </View>
                ) : null}
                <View className={orderType === 'spot' ? `${embedded ? 'w-[230px]' : 'w-[330px]'} max-w-full` : 'flex-1'}>
                  <Text className={`${embedded ? 'mb-1.5 text-xs' : 'mb-3 text-base'} text-center font-extrabold`} style={{ color: colors.text }}>Quantity</Text>
                  <View className={`${embedded ? 'h-11' : 'h-12'} flex-row overflow-hidden rounded-lg border`} style={{ backgroundColor: controlBackground, borderColor: colors.border }}>
                    <TextInput value={lots} onChangeText={setLots} keyboardType="decimal-pad" className={`${embedded ? 'text-base' : 'text-lg'} flex-1 px-4 font-semibold`} style={{ color: colors.text }} />
                    <Pressable onPress={() => changeLots(-0.01)} className={`${embedded ? 'w-10' : 'w-[48px]'} items-center justify-center border-l`} style={{ borderColor: colors.border }}><Minus size={embedded ? 16 : 18} color={colors.muted} /></Pressable>
                    <Pressable onPress={() => changeLots(0.01)} className={`${embedded ? 'w-10' : 'w-[48px]'} items-center justify-center border-l`} style={{ borderColor: colors.border }}><Plus size={embedded ? 16 : 18} color={colors.muted} /></Pressable>
                  </View>
                </View>
              </View>
              <View className={`${embedded ? 'mb-3' : 'mb-5'} flex-row items-center justify-between`}>
                <View>
                  <Toggle selected={stopLossOn} onPress={() => setStopLossOn((value) => !value)} label="Stop Loss" colors={colors} compact={compact || embedded} />
                  <View className={`${embedded ? 'mt-2' : 'mt-3'}`}><ValueCard pips={stopPips} setPips={updateStopPips} price={stopLossPrice} setPrice={setStopLossPrice} profit="0" compact={compact || embedded} colors={colors} controlBackground={controlBackground} /></View>
                </View>
                <View className={`${embedded ? 'mt-9 gap-4 px-0.5' : 'mt-12 gap-5 px-1'} items-center`}>
                  <Text className={`${embedded ? 'text-xs' : 'text-sm'}`} style={{ color: colors.text }}>Pips</Text>
                  <Text className={`${embedded ? 'text-xs' : 'text-sm'}`} style={{ color: colors.text }}>Price</Text>
                  <Text className={`${embedded ? 'text-xs' : 'text-sm'}`} style={{ color: colors.text }}>Profit</Text>
                </View>
                <View>
                  <Toggle selected={takeProfitOn} onPress={() => setTakeProfitOn((value) => !value)} label="Take Profit" colors={colors} compact={compact || embedded} />
                  <View className={`${embedded ? 'mt-2' : 'mt-3'}`}><ValueCard pips={profitPips} setPips={updateProfitPips} price={takeProfitPrice} setPrice={setTakeProfitPrice} profit="0" compact={compact || embedded} colors={colors} controlBackground={controlBackground} /></View>
                </View>
              </View>
              {message ? <Text className="mb-4" style={{ color: colors.danger }}>{message}</Text> : null}
              <Pressable disabled={loading || !user} onPress={placeOrder} className={`${compact || embedded ? 'h-11 rounded-lg' : 'h-[52px] rounded-xl'} items-center justify-center ${loading || !user ? 'opacity-60' : ''}`} style={{ backgroundColor: side === 'SELL' ? orderDanger : orderSuccess }}>
                <Text className="text-xs font-extrabold text-white">{!user ? 'LOG IN TO TRADE' : loading ? 'PLACING ORDER...' : 'PLACE ORDER'}</Text>
              </Pressable>
              <View className={`${embedded ? 'mt-3 px-3 py-2' : 'mt-4 px-4 py-3'} rounded-lg`} style={{ backgroundColor: insetBackground }}>
                <Text className="text-center text-xs font-semibold" style={{ color: colors.muted }}>Spread: {Number(currentSymbol.spreadPoints || 0).toFixed(1)}   High: {quote(Math.max(currentSymbol.bid, currentSymbol.ask), currentSymbol.decimals)}   Low: {quote(Math.min(currentSymbol.bid, currentSymbol.ask), currentSymbol.decimals)}</Text>
              </View>
            </View>
          </ScrollView>
        </Pressable>
  );
}

export default function NewOrderModal({ visible, onClose, initialSide = 'BUY' }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/70 p-3">
        <NewOrderTicket visible={visible} onClose={onClose} initialSide={initialSide} />
      </Pressable>
    </Modal>
  );
}
