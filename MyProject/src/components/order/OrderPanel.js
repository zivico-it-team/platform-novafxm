import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useAppTheme } from '../../context/ThemeContext';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { useAuth } from '../../hooks/useAuth';
import { money, quote } from '../../utils/formatters';
import NewOrderModal from './NewOrderModal';

function SwitchRow({ active, label, onPress, colors }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between rounded-lg border px-3 py-2" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <Text className="text-xs font-extrabold" style={{ color: colors.text }}>{label}</Text>
      <View
        className="h-6 w-11 justify-center rounded-full px-1"
        style={{ backgroundColor: active ? colors.success : colors.border }}
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
  const panelBackground = darkMode ? '#171b21' : colors.panel;
  const controlBackground = darkMode ? '#20262d' : colors.surface;
  const orderSuccess = '#12cf7a';
  const orderDanger = '#f24d58';
  const mobileActionWidth = Math.min(width - 48, 300);
  const lotSize = Number(lots) || 0;
  const requiredMargin = lotSize * 100;
  const freeAfterTrade = Math.max(0, Number(summary.freeFunds || 0) - requiredMargin);
  const spread = Number(currentSymbol.ask || 0) - Number(currentSymbol.bid || 0);
  const spreadText = Number.isFinite(spread) ? quote(Math.max(spread, 0), currentSymbol.decimals) : quote(0, currentSymbol.decimals);
  const snapshotRows = [
    ['Spread', spreadText],
    ['Volume', `${money(lotSize)} lots`],
    ['Required margin', `${quote(requiredMargin, 2)} USD`],
    ['Free margin', `${quote(summary.freeFunds, 2)} USD`],
    ['After trade', `${quote(freeAfterTrade, 2)} USD`],
  ];

  const open = async (side) => {
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
    <View className="h-full rounded-xl border lg:w-[300px]" style={{ backgroundColor: panelBackground, borderColor: colors.border, height: '100%' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 14 }}>
        <View>
          <Text className="text-lg font-extrabold" style={{ color: colors.text }}>New Order</Text>
          <Text className="mt-1 text-sm font-semibold" style={{ color: colors.muted }}>{currentSymbol.symbol}</Text>
        </View>

        <View className="mt-4">
          <Text className="mb-2 text-[11px] font-extrabold uppercase" style={{ color: colors.muted }}>Volume (lots)</Text>
          <TextInput
            value={lots}
            onChangeText={setLots}
            keyboardType="decimal-pad"
            className="h-11 rounded-lg border px-4 text-sm font-bold"
            style={{ backgroundColor: controlBackground, borderColor: colors.border, color: colors.text }}
          />
        </View>

        <View className="mt-4 flex-row justify-between rounded-xl px-4 py-3" style={{ backgroundColor: controlBackground }}>
          <View>
            <Text className="text-xs font-semibold" style={{ color: colors.muted }}>Bid</Text>
            <Text className="mt-1 text-sm font-extrabold" style={{ color: colors.danger }}>{quote(currentSymbol.bid, currentSymbol.decimals)}</Text>
          </View>
          <View>
            <Text className="text-right text-xs font-semibold" style={{ color: colors.muted }}>Ask</Text>
            <Text className="mt-1 text-sm font-extrabold" style={{ color: colors.success }}>{quote(currentSymbol.ask, currentSymbol.decimals)}</Text>
          </View>
        </View>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            disabled={loading}
            onPress={() => open('SELL')}
            className={`h-11 flex-1 items-center justify-center rounded-lg ${loading ? 'opacity-60' : ''}`}
            style={{ backgroundColor: orderDanger }}
          >
            <Text className="text-xs font-extrabold text-white">{loading ? '...' : 'SELL'}</Text>
          </Pressable>
          <Pressable
            disabled={loading}
            onPress={() => open('BUY')}
            className={`h-11 flex-1 items-center justify-center rounded-lg ${loading ? 'opacity-60' : ''}`}
            style={{ backgroundColor: orderSuccess }}
          >
            <Text className="text-xs font-extrabold text-white">{loading ? '...' : 'BUY'}</Text>
          </Pressable>
        </View>

        <View className="mt-4">
          <SwitchRow active={tpSlOn} onPress={() => setTpSlOn((value) => !value)} label="TP/SL" colors={colors} />
          {tpSlOn ? (
            <View className="mt-3 gap-2">
              <TextInput
                value={takeProfit}
                onChangeText={setTakeProfit}
                placeholder="Take Profit Level"
                placeholderTextColor={colors.muted}
                keyboardType="numbers-and-punctuation"
                className="h-11 rounded-xl border px-3 text-sm font-semibold"
                style={{ color: colors.text, borderColor: colors.border, backgroundColor: controlBackground }}
              />
              <TextInput
                value={stopLoss}
                onChangeText={setStopLoss}
                placeholder="Stop Loss Level"
                placeholderTextColor={colors.muted}
                keyboardType="numbers-and-punctuation"
                className="h-11 rounded-xl border px-3 text-sm font-semibold"
                style={{ color: colors.text, borderColor: colors.border, backgroundColor: controlBackground }}
              />
              <Text className="text-[9px] leading-3" style={{ color: colors.muted }}>
                Add one or both levels. Empty fields are ignored.
              </Text>
            </View>
          ) : null}
        </View>
        <View className="mt-4 rounded-xl border p-3" style={{ backgroundColor: controlBackground, borderColor: colors.border }}>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[11px] font-extrabold uppercase" style={{ color: colors.muted }}>Trade snapshot</Text>
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.success }} />
          </View>
          {snapshotRows.map(([label, value]) => (
            <View key={label} className="mb-1.5 flex-row items-center justify-between">
              <Text className="text-[11px]" style={{ color: colors.muted }}>{label}</Text>
              <Text className="text-[11px] font-extrabold" style={{ color: colors.text }}>{value}</Text>
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
  );
}
