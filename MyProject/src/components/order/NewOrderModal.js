import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { ArrowUpRight, Check, ChevronDown, ChevronRight, Minus, Plus, Search, X } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { MARKET_GROUPS } from '../../constants/symbols';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { useAuth } from '../../hooks/useAuth';
import { quote } from '../../utils/formatters';
import { calculateProfit } from '../../utils/calculations';

function Toggle({ selected, onPress, label, colors }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center">
      <View className="mr-2 h-5 w-5 items-center justify-center rounded border" style={{ backgroundColor: selected ? colors.primary : 'transparent', borderColor: selected ? colors.primary : colors.muted }}>
        {selected ? <Check size={14} color="#0B0B0B" /> : null}
      </View>
      <Text className="font-semibold" style={{ color: colors.text }}>{label}</Text>
    </Pressable>
  );
}

function ValueCard({ pips, setPips, price, setPrice, profit, compact, colors, controlBackground }) {
  return (
    <View className={`${compact ? 'w-[102px]' : 'w-[165px]'} overflow-hidden rounded-xl border`} style={{ backgroundColor: controlBackground, borderColor: colors.border }}>
      <TextInput value={pips} onChangeText={setPips} keyboardType="numbers-and-punctuation" className="h-11 border-b px-3 text-base" style={{ borderColor: colors.border, color: colors.text }} />
      <TextInput value={price} onChangeText={setPrice} keyboardType="numbers-and-punctuation" className="h-11 border-b px-3 text-base" style={{ borderColor: colors.border, color: colors.text }} />
      <Text className="px-3 py-3 text-base" style={{ color: colors.text }}>{profit}</Text>
    </View>
  );
}

function RiskRow({ enabled, onToggle, label, pips, setPips, price, setPrice, profit, colors, background, borderColor }) {
  return (
    <View className="rounded-xl border p-2.5" style={{ backgroundColor: background, borderColor }}>
      <View className="mb-2">
        <Toggle selected={enabled} onPress={onToggle} label={label} colors={colors} />
      </View>
      {enabled ? (
        <View className="flex-row gap-2">
          <TextInput
            value={pips}
            onChangeText={setPips}
            keyboardType="numbers-and-punctuation"
            placeholder="Pips"
            placeholderTextColor={colors.muted}
            className="h-10 flex-1 rounded-lg border px-2.5 text-xs"
            style={{ borderColor, color: colors.text }}
          />
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="numbers-and-punctuation"
            placeholder="Price"
            placeholderTextColor={colors.muted}
            className="h-10 flex-1 rounded-lg border px-2.5 text-xs"
            style={{ borderColor, color: colors.text }}
          />
          <View className="h-10 min-w-[72px] items-center justify-center rounded-lg border px-2" style={{ borderColor }}>
            <Text className="text-xs font-bold" style={{ color: profit.startsWith('-') ? colors.danger : colors.success }}>{profit}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function TicketSwitch({ active, label, onPress, colors, background }) {
  return (
    <Pressable onPress={onPress} className="h-[58px] flex-row items-center justify-between rounded-xl px-5" style={{ backgroundColor: background }}>
      <Text className="text-sm font-bold" style={{ color: colors.text }}>{label}</Text>
      <View className="h-7 w-12 justify-center rounded-full px-1" style={{ backgroundColor: active ? colors.success : '#4b5568' }}>
        <View className="h-5 w-5 rounded-full bg-white" style={{ alignSelf: active ? 'flex-end' : 'flex-start' }} />
      </View>
    </Pressable>
  );
}

export default function NewOrderModal({ visible, onClose, initialSide = 'BUY' }) {
  const { width } = useWindowDimensions();
  const compact = width < 560;
  const { darkMode, colors } = useAppTheme();
  const { user } = useAuth();
  const { prices, currentSymbol, selectedSymbol, setSelectedSymbol, openPosition, summary = {} } = useDemoTrading();
  const [side, setSide] = useState('BUY');
  const [lots, setLots] = useState('0.01');
  const [quantityMode, setQuantityMode] = useState('lots');
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

  const activeOrderPrice = side === 'BUY' ? currentSymbol.ask : currentSymbol.bid;
  const basePrice = Number(activeOrderPrice || entryPrice || currentSymbol.price);
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
  const formatPnL = (value) => {
    const amount = Number(value || 0);
    const sign = amount > 0 ? '+' : '';
    return `${sign}$${amount.toFixed(2)}`;
  };
  const estimatePnL = (targetPrice) => calculateProfit(
    {
      symbol: currentSymbol.symbol,
      side,
      lots: quantity,
      openPrice: activeOrderPrice,
    },
    targetPrice,
  );
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
  const modalBackground = darkMode ? colors.panel : '#e8f8ee';
  const sectionBackground = darkMode ? colors.panel : '#f6fff9';
  const controlBackground = darkMode ? colors.surface : '#f6fff9';
  const ticketControlBackground = darkMode ? '#202638' : '#eef8f2';
  const ticketMutedBackground = darkMode ? '#353d52' : '#dce8e0';
  const orderSuccess = '#12cf7a';
  const orderDanger = darkMode ? colors.danger : '#f24d58';
  const spread = Math.max(0, Number(currentSymbol.ask || 0) - Number(currentSymbol.bid || 0));
  const spreadText = quote(spread, currentSymbol.decimals);
  const requiredMargin = Math.max(0, (Number(activeOrderPrice) || 0) * quantity * 0.1);
  const freeFunds = Number(summary.freeFunds || 0);
  const marginPercent = freeFunds > 0 ? Math.min(100, (requiredMargin / freeFunds) * 100) : Math.min(100, requiredMargin);
  const tpSlOn = stopLossOn || takeProfitOn;
  const stopLossAmount = formatPnL(estimatePnL(stopLossPrice));
  const takeProfitAmount = formatPnL(estimatePnL(takeProfitPrice));
  const toggleTpSl = () => {
    const next = !tpSlOn;
    setStopLossOn(next);
    setTakeProfitOn(next);
  };

  const placeOrder = async () => {
    if (!user) {
      setMessage('Please log in to place trades.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await openPosition(side, lots, {
        stopLoss: stopLossOn ? stopLossPrice : null,
        takeProfit: takeProfitOn ? takeProfitPrice : null,
      });
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
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            if (symbolMenu) setSymbolMenu(false);
          }}
          className="max-h-[96%] w-full max-w-[460px] rounded-2xl border p-4 lg:p-5"
          style={{ backgroundColor: modalBackground, borderColor: colors.border }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>Create New Market Order</Text>
              <Pressable onPress={onClose} className="p-2"><X size={18} color={colors.muted} /></Pressable>
            </View>
            <View className="rounded-2xl border p-4" style={{ backgroundColor: sectionBackground, borderColor: colors.border }}>
              <Pressable onPress={(event) => event.stopPropagation()} className="relative z-50 mb-5" style={{ zIndex: 50 }}>
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
              </Pressable>
              <View className="mb-6 flex-row gap-3">
                <Pressable onPress={() => setSide('SELL')} className={`${compact ? 'h-[40px] rounded' : 'h-[54px] rounded-xl'} flex-1 items-center justify-center border`} style={{ backgroundColor: side === 'SELL' ? orderDanger : 'transparent', borderColor: orderDanger }}>
                  <Text className="text-xs" style={{ color: side === 'SELL' ? '#fff' : orderDanger }}>SELL</Text>
                  <Text className="mt-0.5 font-bold" style={{ color: side === 'SELL' ? '#fff' : orderDanger }}>{quote(currentSymbol.bid, currentSymbol.decimals)}</Text>
                </Pressable>
                <View className="absolute left-1/2 top-4 z-10 -ml-6 min-w-[48px] items-center rounded-md px-2 py-1" style={{ backgroundColor: darkMode ? '#f2f5f8' : colors.text }}>
                  <Text className="text-xs font-black" style={{ color: darkMode ? '#111827' : '#ffffff' }}>{spreadText}</Text>
                </View>
                <Pressable onPress={() => setSide('BUY')} className={`${compact ? 'h-[40px] rounded' : 'h-[54px] rounded-xl'} flex-1 items-center justify-center border`} style={{ backgroundColor: side === 'BUY' ? orderSuccess : 'transparent', borderColor: orderSuccess }}>
                  <Text className="text-xs" style={{ color: side === 'BUY' ? '#fff' : orderSuccess }}>BUY</Text>
                  <Text className="mt-0.5 font-bold" style={{ color: side === 'BUY' ? '#fff' : orderSuccess }}>{quote(currentSymbol.ask, currentSymbol.decimals)}</Text>
                </Pressable>
              </View>
              <View className="mb-3 h-9 flex-row overflow-hidden rounded-lg" style={{ backgroundColor: ticketControlBackground }}>
                {[
                  ['quantity', 'Quantity'],
                  ['lots', 'Lots'],
                ].map(([value, label]) => (
                  <Pressable
                    key={value}
                    onPress={() => setQuantityMode(value)}
                    className="flex-1 items-center justify-center"
                    style={{ backgroundColor: quantityMode === value ? ticketMutedBackground : 'transparent' }}
                  >
                    <Text className="text-sm font-bold" style={{ color: colors.text }}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              <View className="mb-3 rounded-xl border px-6 py-3" style={{ backgroundColor: controlBackground, borderColor: colors.border }}>
                <Text className="text-sm" style={{ color: colors.muted }}>Amount</Text>
                <Text className="text-xl font-black" style={{ color: colors.text }}>{Number(lots || 0).toFixed(2)} Lot(s)</Text>
              </View>
              <View className="mb-7">
                <Text className="mb-3 text-sm font-bold" style={{ color: colors.muted }}>Required Margin ${quote(requiredMargin, 2)}</Text>
                <View className="flex-row items-center">
                  <View className="mr-4 h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: darkMode ? '#667085' : '#cbd5d1' }}>
                    <View className="h-full rounded-full" style={{ width: `${marginPercent}%`, backgroundColor: orderSuccess }} />
                  </View>
                  <Text className="w-[54px] text-right text-base font-black" style={{ color: colors.text }}>{quote(marginPercent, 2)}%</Text>
                </View>
              </View>
              <View className="mb-5">
                <TicketSwitch active={tpSlOn} onPress={toggleTpSl} label="TP/SL" colors={colors} background={ticketControlBackground} />
              </View>
              <View className="mb-6 items-center">
                <View className="w-[286px]">
                  <Text className="mb-2 text-center font-semibold" style={{ color: colors.text }}>{quantityMode === 'lots' ? 'Lots' : 'Quantity'}</Text>
                  <View className="h-[42px] flex-row overflow-hidden rounded-xl border" style={{ backgroundColor: controlBackground, borderColor: colors.border }}>
                    <TextInput value={lots} onChangeText={setLots} keyboardType="decimal-pad" className="flex-1 px-4 text-base" style={{ color: colors.text }} />
                    <Pressable onPress={() => changeLots(-0.01)} className="w-[48px] items-center justify-center border-l" style={{ borderColor: colors.border }}><Minus size={18} color={colors.muted} /></Pressable>
                    <Pressable onPress={() => changeLots(0.01)} className="w-[48px] items-center justify-center border-l" style={{ borderColor: colors.border }}><Plus size={18} color={colors.muted} /></Pressable>
                  </View>
                </View>
              </View>
              {tpSlOn ? (
                <View className="mb-5 gap-2">
                  <RiskRow
                    enabled={stopLossOn}
                    onToggle={() => setStopLossOn((value) => !value)}
                    label="Stop Loss"
                    pips={stopPips}
                    setPips={updateStopPips}
                    price={stopLossPrice}
                    setPrice={setStopLossPrice}
                    profit={stopLossAmount}
                    colors={colors}
                    background={controlBackground}
                    borderColor={colors.border}
                  />
                  <RiskRow
                    enabled={takeProfitOn}
                    onToggle={() => setTakeProfitOn((value) => !value)}
                    label="Take Profit"
                    pips={profitPips}
                    setPips={updateProfitPips}
                    price={takeProfitPrice}
                    setPrice={setTakeProfitPrice}
                    profit={takeProfitAmount}
                    colors={colors}
                    background={controlBackground}
                    borderColor={colors.border}
                  />
                </View>
              ) : null}
              {message ? <Text className="mb-4" style={{ color: colors.danger }}>{message}</Text> : null}
              <Pressable disabled={loading || !user} onPress={placeOrder} className={`${compact ? 'h-[56px] rounded-xl' : 'h-[74px] rounded-xl'} flex-row items-center justify-between px-5 ${loading || !user ? 'opacity-60' : ''}`} style={{ backgroundColor: side === 'SELL' ? orderDanger : orderSuccess }}>
                <View>
                  <Text className="text-sm font-bold text-white">{!user ? 'Log in to trade' : loading ? 'Placing order...' : 'Place Order at'}</Text>
                  {user && !loading ? <Text className="text-2xl font-black text-white">{quote(activeOrderPrice, currentSymbol.decimals)}</Text> : null}
                </View>
                <ArrowUpRight size={24} color="#ffffff" />
              </Pressable>
              <Text className="mt-4 text-center text-xs" style={{ color: colors.text }}>Spread: {Number(currentSymbol.spreadPoints || 0).toFixed(1)}   High: {quote(Math.max(currentSymbol.bid, currentSymbol.ask), currentSymbol.decimals)}   Low: {quote(Math.min(currentSymbol.bid, currentSymbol.ask), currentSymbol.decimals)}</Text>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
