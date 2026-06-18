import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useAppTheme } from '../../context/ThemeContext';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { useAuth } from '../../hooks/useAuth';
import { money, quote } from '../../utils/formatters';
import NewOrderModal from './NewOrderModal';

export default function OrderPanel({ showAvailableMargin = true }) {
  const { width } = useWindowDimensions();
  const { currentSymbol, openPosition, summary } = useDemoTrading();
  const { user } = useAuth();
  const { darkMode, colors } = useAppTheme();
  const [lots, setLots] = useState('0.01');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [orderSide, setOrderSide] = useState('BUY');
  const [tpSlEnabled, setTpSlEnabled] = useState(false);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const mobile = width < 760;
  const orderSuccess = '#12cf7a';
  const orderDanger = '#f24d58';
  const mobileActionWidth = Math.min(width - 48, 300);
  const lotSize = Number(lots) || 0;
  const requiredMargin = Math.max(0, lotSize * (10000 / Number(user?.leverage || 100)));
  const afterTrade = Math.max(0, Number(summary.freeFunds || 0) - requiredMargin);
  const spread = Number(currentSymbol.ask || 0) - Number(currentSymbol.bid || 0);
  const spreadText = Number.isFinite(spread) ? quote(Math.max(spread, 0), currentSymbol.decimals) : quote(0, currentSymbol.decimals);
  const snapshotRows = [
    ['Spread', spreadText],
    ['Volume', `${money(lotSize)} lots`],
    ['Required margin', `${money(requiredMargin)} USD`],
    ['Free margin', `${money(summary.freeFunds)} USD`],
    ['After trade', `${money(afterTrade)} USD`],
  ];

  const open = async (side, options = {}) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      await openPosition(side, lots, options);
      setMessage(`${side} order opened successfully.`);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const openOrderModal = (side) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setOrderSide(side);
    setOrderModal(true);
  };

  const submitQuickOrder = (side) => {
    if (tpSlEnabled) {
      const stopLossValue = stopLoss.trim();
      const takeProfitValue = takeProfit.trim();
      const hasStopLoss = Boolean(stopLossValue);
      const hasTakeProfit = Boolean(takeProfitValue);
      if (!hasStopLoss && !hasTakeProfit) {
        setMessage('Enter stop loss or take profit value.');
        return;
      }
      if ((hasStopLoss && !(Number(stopLossValue) > 0)) || (hasTakeProfit && !(Number(takeProfitValue) > 0))) {
        setMessage('Enter valid TP/SL price values.');
        return;
      }
      open(side, {
        stopLoss: hasStopLoss ? Number(stopLossValue) : null,
        takeProfit: hasTakeProfit ? Number(takeProfitValue) : null,
      });
      return;
    }
    open(side);
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
          {message ? <Text className="mt-2 text-center text-xs" style={{ color: colors.muted }}>{message}</Text> : null}
        </View>
        <NewOrderModal visible={orderModal} initialSide={orderSide} onClose={() => setOrderModal(false)} />
      </>
    );
  }

  return (
    <>
    <View className="h-full overflow-hidden rounded-xl border lg:w-[260px]" style={{ backgroundColor: darkMode ? '#181a20' : '#e8f8ee', borderColor: colors.border }}>
      <ScrollView
        className="h-full"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: '100%', justifyContent: 'space-between', padding: 12, paddingBottom: 14 }}
      >
        <View>
          <View className="mb-2">
            <Text className="text-base font-extrabold" style={{ color: colors.text }}>New Order</Text>
            <Text className="mt-0.5 text-[10px] font-semibold" style={{ color: colors.muted }}>{currentSymbol.symbol}</Text>
          </View>
        </View>
        <View className="mb-2.5">
          <Text className="mb-1 text-[10px] font-bold" style={{ color: colors.muted }}>Volume (lots)</Text>
          <View className="h-[38px] justify-center rounded-lg border px-4" style={{ backgroundColor: darkMode ? '#1e2329' : '#f6fff9', borderColor: colors.border }}>
            <TextInput
              value={lots}
              onChangeText={setLots}
              keyboardType="decimal-pad"
              className="text-xs font-bold"
              style={{ color: colors.text }}
            />
          </View>
        </View>
        <View className="mb-2.5 rounded-lg border p-2.5" style={{ backgroundColor: darkMode ? '#1d222b' : '#f6fff9', borderColor: colors.border }}>
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-[10px]" style={{ color: colors.muted }}>Bid</Text>
              <Text className="mt-0.5 text-xs font-extrabold" style={{ color: orderDanger }}>{quote(currentSymbol.bid, currentSymbol.decimals)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[10px]" style={{ color: colors.muted }}>Ask</Text>
              <Text className="mt-0.5 text-xs font-extrabold" style={{ color: orderSuccess }}>{quote(currentSymbol.ask, currentSymbol.decimals)}</Text>
            </View>
          </View>
        </View>
        <View className="mb-2.5 flex-row gap-2">
          <Pressable
            disabled={loading}
            onPress={() => submitQuickOrder('SELL')}
            className={`h-[36px] flex-1 items-center justify-center rounded-md ${loading ? 'opacity-60' : ''}`}
            style={{ backgroundColor: orderDanger }}
          >
            <Text className="text-xs font-extrabold text-white">{loading ? '...' : 'SELL'}</Text>
          </Pressable>
          <Pressable
            disabled={loading}
            onPress={() => submitQuickOrder('BUY')}
            className={`h-[36px] flex-1 items-center justify-center rounded-md ${loading ? 'opacity-60' : ''}`}
            style={{ backgroundColor: orderSuccess }}
          >
            <Text className="text-xs font-extrabold text-white">{loading ? '...' : 'BUY'}</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => setTpSlEnabled((value) => !value)}
          className={`${tpSlEnabled ? 'rounded-t-lg border-x border-t' : 'mb-2.5 rounded-lg border'} h-[38px] flex-row items-center justify-between px-3`}
          style={{ backgroundColor: darkMode ? '#1e2329' : '#f6fff9', borderColor: colors.border }}
        >
          <Text className="text-xs font-extrabold" style={{ color: colors.text }}>TP/SL</Text>
          <View className="h-6 w-[42px] justify-center rounded-full px-0.5" style={{ backgroundColor: tpSlEnabled ? colors.primary : darkMode ? '#2b3139' : '#dce5ee' }}>
            <View className="h-5 w-5 rounded-full" style={{ backgroundColor: '#ffffff', alignSelf: tpSlEnabled ? 'flex-end' : 'flex-start' }} />
          </View>
        </Pressable>
        {tpSlEnabled ? (
          <View className="mb-2.5 rounded-b-lg border-x border-b px-2.5 pb-2.5" style={{ backgroundColor: darkMode ? '#1e2329' : '#f6fff9', borderColor: colors.border }}>
            <View className="gap-2">
              <View className="h-[38px] justify-center rounded-md border px-3" style={{ backgroundColor: darkMode ? '#181a20' : '#ffffff', borderColor: colors.border }}>
                <TextInput
                  value={takeProfit}
                  onChangeText={setTakeProfit}
                  keyboardType="decimal-pad"
                  placeholder="Take Profit Level"
                  placeholderTextColor={colors.muted}
                  className="text-xs font-semibold"
                  style={{ color: colors.text }}
                />
              </View>
              <View className="h-[38px] justify-center rounded-md border px-3" style={{ backgroundColor: darkMode ? '#181a20' : '#ffffff', borderColor: colors.border }}>
                <TextInput
                  value={stopLoss}
                  onChangeText={setStopLoss}
                  keyboardType="decimal-pad"
                  placeholder="Stop Loss Level"
                  placeholderTextColor={colors.muted}
                  className="text-xs font-semibold"
                  style={{ color: colors.text }}
                />
              </View>
            </View>
            <Text className="mt-2 text-[9px] leading-3" style={{ color: colors.muted }}>
              Adjust your exit levels, taking risk as appropriate.
            </Text>
          </View>
        ) : null}
        <View className="rounded-lg border p-2" style={{ backgroundColor: darkMode ? '#20252d' : '#f6fff9', borderColor: colors.border }}>
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-[10px] font-extrabold uppercase" style={{ color: colors.muted }}>Trade Snapshot</Text>
            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.success }} />
          </View>
          <View>
            {snapshotRows.map(([label, value]) => (
              <View key={label} className="mb-0.5 flex-row items-center justify-between">
                <Text className="text-[10px]" style={{ color: colors.muted }}>{label}</Text>
                <Text className="text-[10px] font-extrabold" style={{ color: colors.text }}>{value}</Text>
              </View>
            ))}
          </View>
          <View className="mt-1 rounded-md px-2 py-1.5" style={{ backgroundColor: darkMode ? '#0b0e11' : '#ffffff' }}>
            <Text className="text-[9px] leading-3" numberOfLines={2} style={{ color: colors.muted }}>
              Choose Sell or Buy to place a quick market order for the selected symbol.
            </Text>
          </View>
        </View>
        <View className="mt-2 rounded-lg border p-2" style={{ backgroundColor: darkMode ? '#0f1419' : '#ffffff', borderColor: colors.border }}>
          <Text className="mb-1 text-[10px] font-extrabold uppercase" style={{ color: colors.muted }}>Before You Trade</Text>
          {[
            'Check the spread before opening.',
            'Start small when markets move fast.',
            'Review open positions below.',
          ].map((item) => (
            <View key={item} className="mb-0.5 flex-row items-start">
              <View className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.primary }} />
              <Text className="flex-1 text-[9px] leading-3" numberOfLines={1} style={{ color: colors.muted }}>{item}</Text>
            </View>
          ))}
        </View>
        {message || !user ? <Text className="mt-2 text-[10px]" style={{ color: colors.muted }}>{message || 'Log in to place trades.'}</Text> : null}
        {showAvailableMargin ? (
          <View className="mt-3 border-t pt-2" style={{ borderColor: colors.border }}>
            <Text className="mb-1 text-xs" style={{ color: colors.muted }}>Available Margin</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>{quote(summary.freeFunds, 2)} USD</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
    <NewOrderModal visible={orderModal} initialSide={orderSide} onClose={() => setOrderModal(false)} />
    </>
  );
}
