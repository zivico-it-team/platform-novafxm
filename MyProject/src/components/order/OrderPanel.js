import { useState } from 'react';
import { Pressable, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import CustomInput from '../common/CustomInput';
import { useAppTheme } from '../../context/ThemeContext';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { useAuth } from '../../hooks/useAuth';
import { money, quote } from '../../utils/formatters';
import NewOrderModal from './NewOrderModal';

const getSidePrice = (symbol, side) => quote(side === 'SELL' ? symbol.bid : symbol.ask, symbol.decimals);

export default function OrderPanel({ showAvailableMargin = true }) {
  const { width } = useWindowDimensions();
  const { currentSymbol, openPosition, createPendingOrder, summary } = useDemoTrading();
  const { user } = useAuth();
  const { darkMode, colors } = useAppTheme();
  const [lots, setLots] = useState('0.01');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [orderSide, setOrderSide] = useState('BUY');
  const [priceTriggerOn, setPriceTriggerOn] = useState(false);
  const [riskToolsOn, setRiskToolsOn] = useState(false);
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const mobile = width < 760;
  const panelBackground = darkMode ? colors.panel : '#e8f8ee';
  const priceBackground = darkMode ? colors.surface : '#f6fff9';
  const orderSuccess = '#12cf7a';
  const orderDanger = '#f24d58';
  const mobileActionWidth = Math.min(width - 48, 300);
  const lotSize = Number(lots) || 0;
  const freeFunds = Number(summary?.freeFunds || 0);
  const requiredMargin = lotSize * 100;
  const marginUsage = freeFunds > 0 ? Math.min((requiredMargin / freeFunds) * 100, 100) : 0;
  const spread = Number(currentSymbol.ask || 0) - Number(currentSymbol.bid || 0);
  const spreadText = Number.isFinite(spread) ? quote(Math.max(spread, 0), currentSymbol.decimals) : quote(0, currentSymbol.decimals);
  const displayEntryPrice = entryPrice || getSidePrice(currentSymbol, orderSide);
  const snapshotRows = [
    ['Spread', spreadText],
    ['Volume', `${money(lotSize)} lots`],
    ['Required margin', `${quote(requiredMargin, 2)} USD`],
    ['Free margin', `${quote(freeFunds, 2)} USD`],
  ];

  const changeSide = (side) => {
    setOrderSide(side);
    setEntryPrice(priceTriggerOn ? getSidePrice(currentSymbol, side) : '');
  };

  const changePriceTrigger = (value) => {
    setPriceTriggerOn(value);
    setEntryPrice(value ? getSidePrice(currentSymbol, orderSide) : '');
  };

  const open = async (side) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const pendingEntryPrice = entryPrice || getSidePrice(currentSymbol, side);
      if (priceTriggerOn) {
        createPendingOrder({
          side,
          lots,
          orderType: 'LIMIT',
          entryPrice: pendingEntryPrice,
          stopLoss: riskToolsOn && stopLoss ? stopLoss : null,
          takeProfit: riskToolsOn && takeProfit ? takeProfit : null,
        });
        setMessage(`${side} pending order created.`);
      } else {
        await openPosition(side, lots);
        setMessage(`${side} order opened successfully.`);
      }
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
          <View className="items-center">
            <Text className="text-[10px]" style={{ color: colors.muted }}>Spread</Text>
            <Text className="text-xs font-bold" style={{ color: colors.text }}>{spreadText}</Text>
          </View>
          <View>
            <Text className="text-right text-[10px]" style={{ color: colors.muted }}>Ask</Text>
            <Text className="text-xs font-bold" style={{ color: colors.success }}>{quote(currentSymbol.ask, currentSymbol.decimals)}</Text>
          </View>
        </View>
        <View className="mt-3 rounded-xl border p-2.5" style={{ backgroundColor: priceBackground, borderColor: colors.border }}>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[11px] font-bold uppercase" style={{ color: colors.muted }}>Order options</Text>
            <Text className="text-[10px] font-bold" style={{ color: colors.text }}>{priceTriggerOn ? 'Pending' : 'Market'}</Text>
          </View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[11px] font-bold" style={{ color: colors.text }}>{orderSide === 'BUY' ? 'Buy' : 'Sell'} When Price is</Text>
            <Switch value={priceTriggerOn} onValueChange={changePriceTrigger} trackColor={{ false: darkMode ? '#4b5563' : '#cbd5e1', true: colors.primarySoft }} thumbColor={priceTriggerOn ? colors.primary : '#f8fafc'} />
          </View>
          {priceTriggerOn ? (
            <TextInput
              value={displayEntryPrice}
              onChangeText={setEntryPrice}
              keyboardType="decimal-pad"
              className="mb-2 h-9 rounded-lg border px-2.5 text-xs font-bold"
              style={{ backgroundColor: darkMode ? colors.background : '#ffffff', borderColor: colors.border, color: colors.text }}
            />
          ) : null}
          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] font-bold" style={{ color: colors.text }}>TP/SL</Text>
            <Switch value={riskToolsOn} onValueChange={setRiskToolsOn} trackColor={{ false: darkMode ? '#4b5563' : '#cbd5e1', true: colors.primarySoft }} thumbColor={riskToolsOn ? colors.primary : '#f8fafc'} />
          </View>
          {riskToolsOn ? (
            <View className="mt-2 flex-row gap-2">
              <TextInput value={takeProfit} onChangeText={setTakeProfit} placeholder="Take profit" placeholderTextColor={colors.muted} keyboardType="decimal-pad" className="h-8 flex-1 rounded-lg border px-2 text-[10px]" style={{ minWidth: 0, flexBasis: 0, backgroundColor: darkMode ? colors.background : '#ffffff', borderColor: colors.border, color: colors.text }} />
              <TextInput value={stopLoss} onChangeText={setStopLoss} placeholder="Stop loss" placeholderTextColor={colors.muted} keyboardType="decimal-pad" className="h-8 flex-1 rounded-lg border px-2 text-[10px]" style={{ minWidth: 0, flexBasis: 0, backgroundColor: darkMode ? colors.background : '#ffffff', borderColor: colors.border, color: colors.text }} />
            </View>
          ) : null}
        </View>

        <View className="mt-2 rounded-xl border p-2.5" style={{ backgroundColor: priceBackground, borderColor: colors.border }}>
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-[11px] font-bold uppercase" style={{ color: colors.muted }}>Trade snapshot</Text>
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.success }} />
          </View>
          {snapshotRows.map(([label, value]) => (
            <View key={label} className="mb-1 flex-row items-center justify-between">
              <Text className="text-[10px]" style={{ color: colors.muted }}>{label}</Text>
              <Text className="text-[10px] font-bold" style={{ color: colors.text }}>{value}</Text>
            </View>
          ))}
          <View className="mt-2 flex-row items-center gap-3">
            <View className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: darkMode ? '#5d6a7f' : '#cbd5e1' }}>
              <View className="h-full rounded-full" style={{ width: `${marginUsage}%`, backgroundColor: orderSuccess }} />
            </View>
            <Text className="w-12 text-right text-[10px] font-bold" style={{ color: colors.text }}>{quote(marginUsage, 2)}%</Text>
          </View>
        </View>

        <View className="mt-3 flex-row gap-2">
          <Pressable
            disabled={loading}
            onPress={() => {
              changeSide('SELL');
              open('SELL');
            }}
            className={`h-9 flex-1 items-center justify-center rounded-lg ${loading ? 'opacity-60' : ''}`}
            style={{ backgroundColor: orderDanger }}
          >
            <Text className="text-xs font-extrabold text-white">{loading ? '...' : 'SELL'}</Text>
          </Pressable>
          <Pressable
            disabled={loading}
            onPress={() => {
              changeSide('BUY');
              open('BUY');
            }}
            className={`h-9 flex-1 items-center justify-center rounded-lg ${loading ? 'opacity-60' : ''}`}
            style={{ backgroundColor: orderSuccess }}
          >
            <Text className="text-xs font-extrabold text-white">{loading ? '...' : 'BUY'}</Text>
          </Pressable>
        </View>
        {message || !user ? <Text className="mt-2 text-[10px]" style={{ color: colors.muted }}>{message || 'Log in to place trades.'}</Text> : null}
        {showAvailableMargin ? (
          <View className="mt-3 border-t pt-2" style={{ borderColor: colors.border }}>
            <Text className="mb-1 text-xs" style={{ color: colors.muted }}>Available Margin</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>{quote(freeFunds, 2)} USD</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
