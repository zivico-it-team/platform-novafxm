import { useState } from 'react';
import { Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import CustomInput from '../common/CustomInput';
import { useAppTheme } from '../../context/ThemeContext';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { useAuth } from '../../hooks/useAuth';
import { money, quote } from '../../utils/formatters';
import NewOrderModal from './NewOrderModal';

function SwitchRow({ active, label, onPress, colors }) {
  return (
    <Pressable onPress={onPress} className="h-11 flex-row items-center justify-between rounded-xl px-3.5" style={{ backgroundColor: colors.surface }}>
      <Text className="text-[11px] font-bold" style={{ color: colors.text }}>{label}</Text>
      <View
        className="h-6 w-11 justify-center rounded-full px-1"
        style={{ backgroundColor: active ? colors.success : '#4b5568' }}
      >
        <View
          className="h-4 w-4 rounded-full bg-white"
          style={{ alignSelf: active ? 'flex-end' : 'flex-start' }}
        />
      </View>
    </Pressable>
  );
}

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
  const [tpSlOn, setTpSlOn] = useState(false);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const mobile = width < 760;
  const panelBackground = darkMode ? colors.panel : '#e8f8ee';
  const priceBackground = darkMode ? colors.surface : '#f6fff9';
  const orderSuccess = '#12cf7a';
  const orderDanger = '#f24d58';
  const mobileActionWidth = Math.min(width - 48, 300);
  const lotSize = Number(lots) || 0;
  const requiredMargin = Math.max(0, Number(currentSymbol.ask || currentSymbol.price || 0) * lotSize * 0.1);
  const freeAfterTrade = Math.max(0, Number(summary.freeFunds || 0) - requiredMargin);
  const marginPercent = Number(summary.freeFunds || 0) > 0 ? Math.min(100, (requiredMargin / Number(summary.freeFunds || 0)) * 100) : Math.min(100, requiredMargin);
  const spread = Number(currentSymbol.ask || 0) - Number(currentSymbol.bid || 0);
  const spreadText = Number.isFinite(spread) ? quote(Math.max(spread, 0), currentSymbol.decimals) : quote(0, currentSymbol.decimals);
  const orderSummaryRows = [
    ['Symbol', currentSymbol.symbol],
    ['Volume', `${money(lotSize)} lots`],
    ['Spread', spreadText],
    ['Required Margin', `$${quote(requiredMargin, 2)}`],
    ['Free After Order', `$${quote(freeAfterTrade, 2)}`],
  ];

  const open = async (side) => {
    setOrderSide(side);
    if (!user) {
      router.push('/login');
      return;
    }
    if (tpSlOn && stopLoss && !(Number(stopLoss) > 0)) {
      setMessage('Enter a valid Stop Loss price.');
      return;
    }
    if (tpSlOn && takeProfit && !(Number(takeProfit) > 0)) {
      setMessage('Enter a valid Take Profit price.');
      return;
    }
    setLoading(true);
    try {
      await openPosition(side, lots, {
        stopLoss: tpSlOn && stopLoss ? stopLoss : null,
        takeProfit: tpSlOn && takeProfit ? takeProfit : null,
      });
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
    <View className="h-full rounded-2xl border lg:w-[270px]" style={{ backgroundColor: panelBackground, borderColor: colors.border }}>
      <View className="h-full justify-between p-3.5">
        <Text className="text-base font-bold" style={{ color: colors.text }}>New Order</Text>
        <Text className="mb-3 mt-0.5 text-xs" style={{ color: colors.muted }}>{currentSymbol.symbol}</Text>
        <CustomInput
          label="Volume (lots)"
          value={lots}
          onChangeText={setLots}
          keyboardType="decimal-pad"
          className="mb-3"
          labelStyle={{ fontSize: 11, marginBottom: 6 }}
          style={{ height: 38, fontSize: 12 }}
        />
        <View className="mb-3 flex-row justify-between rounded-xl px-3 py-2.5" style={{ backgroundColor: priceBackground }}>
          <View>
            <Text className="text-[10px]" style={{ color: colors.muted }}>Bid</Text>
            <Text className="text-xs font-bold" style={{ color: colors.danger }}>{quote(currentSymbol.bid, currentSymbol.decimals)}</Text>
          </View>
          <View>
            <Text className="text-right text-[10px]" style={{ color: colors.muted }}>Ask</Text>
            <Text className="text-xs font-bold" style={{ color: colors.success }}>{quote(currentSymbol.ask, currentSymbol.decimals)}</Text>
          </View>
        </View>
        <View className="mb-3">
          <Text className="mb-2 text-[11px] font-bold" style={{ color: colors.muted }}>Required Margin ${quote(requiredMargin, 2)}</Text>
          <View className="flex-row items-center">
            <View className="mr-3 h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: darkMode ? '#667085' : '#cbd5d1' }}>
              <View className="h-full rounded-full" style={{ width: `${marginPercent}%`, backgroundColor: orderSuccess }} />
            </View>
            <Text className="w-[48px] text-right text-sm font-black" style={{ color: colors.text }}>{quote(marginPercent, 2)}%</Text>
          </View>
        </View>
        <View className="mb-3">
          <SwitchRow active={tpSlOn} onPress={() => setTpSlOn((value) => !value)} label="TP/SL" colors={colors} />
        </View>
        <View className="flex-row gap-2">
          <Pressable
            disabled={loading}
            onPress={() => open('SELL')}
            className={`h-9 flex-1 items-center justify-center rounded-lg ${loading ? 'opacity-60' : ''}`}
            style={{ backgroundColor: orderDanger }}
          >
            <Text className="text-xs font-extrabold text-white">{loading ? '...' : 'SELL'}</Text>
          </Pressable>
          <Pressable
            disabled={loading}
            onPress={() => open('BUY')}
            className={`h-9 flex-1 items-center justify-center rounded-lg ${loading ? 'opacity-60' : ''}`}
            style={{ backgroundColor: orderSuccess }}
          >
            <Text className="text-xs font-extrabold text-white">{loading ? '...' : 'BUY'}</Text>
          </Pressable>
        </View>
        {tpSlOn ? (
          <View className="mt-3 rounded-xl border p-2.5" style={{ backgroundColor: priceBackground, borderColor: colors.border }}>
            <View className="gap-2">
              <TextInput
                value={takeProfit}
                onChangeText={setTakeProfit}
                placeholder="Take Profit Level"
                placeholderTextColor={colors.muted}
                keyboardType="numbers-and-punctuation"
                className="h-11 rounded-xl border px-3 text-xs"
                style={{ color: colors.text, borderColor: colors.border }}
              />
              <TextInput
                value={stopLoss}
                onChangeText={setStopLoss}
                placeholder="Stop Loss Level"
                placeholderTextColor={colors.muted}
                keyboardType="numbers-and-punctuation"
                className="h-11 rounded-xl border px-3 text-xs"
                style={{ color: colors.text, borderColor: colors.border }}
              />
              <Text className="text-[9px] leading-3" style={{ color: colors.muted }}>
                Add one or both levels. Empty fields are ignored.
              </Text>
            </View>
          </View>
        ) : null}
        <View className="mt-3 rounded-xl border p-3" style={{ backgroundColor: priceBackground, borderColor: colors.border }}>
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-black uppercase" style={{ color: colors.text }}>Order Summary</Text>
              <Text className="mt-0.5 text-[9px]" style={{ color: colors.muted }}>Review key trade values</Text>
            </View>
            <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: darkMode ? '#243244' : '#e6f4ec' }}>
              <Text className="text-[9px] font-black uppercase" style={{ color: colors.success }}>Market</Text>
            </View>
          </View>
          <View className="mb-2 rounded-lg px-2.5 py-2" style={{ backgroundColor: darkMode ? colors.background : '#ffffff' }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-bold" style={{ color: colors.muted }}>Selected Side</Text>
              <Text className="text-xs font-black" style={{ color: orderSide === 'SELL' ? orderDanger : orderSuccess }}>{orderSide}</Text>
            </View>
          </View>
          {orderSummaryRows.map(([label, value]) => (
            <View key={label} className="mb-1.5 flex-row items-center justify-between">
              <Text className="text-[10px] font-semibold" style={{ color: colors.muted }}>{label}</Text>
              <Text className="text-[10px] font-black" style={{ color: colors.text }}>{value}</Text>
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
      </View>
    </View>
  );
}
