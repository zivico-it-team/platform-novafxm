import { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { router } from 'expo-router';
import CustomInput from '../common/CustomInput';
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
  const mobile = width < 760;
  const panelBackground = darkMode ? colors.panel : '#e8f8ee';
  const priceBackground = darkMode ? colors.surface : '#f6fff9';
  const orderSuccess = '#12cf7a';
  const orderDanger = '#f24d58';
  const mutedPill = darkMode ? 'rgba(255,255,255,.045)' : 'rgba(11,11,11,.045)';
  const mobileActionWidth = Math.min(width - 48, 300);
  const lotSize = Number(lots) || 0;
  const spread = Number(currentSymbol.ask || 0) - Number(currentSymbol.bid || 0);
  const spreadText = Number.isFinite(spread) ? quote(Math.max(spread, 0), currentSymbol.decimals) : quote(0, currentSymbol.decimals);
  const snapshotRows = [
    ['Spread', spreadText],
    ['Volume', `${money(lotSize)} lots`],
    ['Free margin', `${quote(summary.freeFunds, 2)} USD`],
  ];

  const open = async (side) => {
    if (!user) {
      router.push('/login');
      return;
    }
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
    <View className="h-full overflow-hidden rounded-2xl border lg:w-[270px]" style={{ backgroundColor: panelBackground, borderColor: colors.border }}>
      <View className="h-full justify-between p-3.5">
        <View>
          <View className="mb-1">
            <Text className="text-base font-extrabold" style={{ color: colors.text }}>New Order</Text>
            <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>{currentSymbol.symbol}</Text>
          </View>
          <Text className="mb-3 text-[10px] font-semibold uppercase" style={{ color: colors.muted }}>Instant market execution</Text>
        </View>
        <CustomInput
          label="Volume (lots)"
          value={lots}
          onChangeText={setLots}
          keyboardType="decimal-pad"
          className="mb-3"
          labelStyle={{ fontSize: 11, marginBottom: 6 }}
          style={{ height: 38, fontSize: 12 }}
        />
        <View className="mb-3 overflow-hidden rounded-xl border" style={{ backgroundColor: priceBackground, borderColor: colors.border }}>
          <View className="flex-row">
            <View className="flex-1 px-3 py-2.5">
              <View className="mb-1 flex-row items-center">
                <ArrowDown size={12} color={orderDanger} />
                <Text className="ml-1 text-[10px] font-bold uppercase" style={{ color: colors.muted }}>Bid</Text>
              </View>
              <Text className="text-sm font-extrabold" style={{ color: orderDanger }}>{quote(currentSymbol.bid, currentSymbol.decimals)}</Text>
            </View>
            <View className="w-px" style={{ backgroundColor: colors.border }} />
            <View className="flex-1 px-3 py-2.5">
              <View className="mb-1 flex-row items-center justify-end">
                <Text className="mr-1 text-[10px] font-bold uppercase" style={{ color: colors.muted }}>Ask</Text>
                <ArrowUp size={12} color={orderSuccess} />
              </View>
              <Text className="text-right text-sm font-extrabold" style={{ color: orderSuccess }}>{quote(currentSymbol.ask, currentSymbol.decimals)}</Text>
            </View>
          </View>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            disabled={loading}
            onPress={() => open('SELL')}
            className={`h-10 flex-1 items-center justify-center rounded-lg ${loading ? 'opacity-60' : ''}`}
            style={{ backgroundColor: orderDanger, shadowColor: orderDanger, shadowOpacity: darkMode ? 0.24 : 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}
          >
            <View className="flex-row items-center">
              <ArrowDown size={13} color="#fff" />
              <Text className="ml-1 text-xs font-extrabold text-white">{loading ? '...' : 'SELL'}</Text>
            </View>
          </Pressable>
          <Pressable
            disabled={loading}
            onPress={() => open('BUY')}
            className={`h-10 flex-1 items-center justify-center rounded-lg ${loading ? 'opacity-60' : ''}`}
            style={{ backgroundColor: orderSuccess, shadowColor: orderSuccess, shadowOpacity: darkMode ? 0.24 : 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}
          >
            <View className="flex-row items-center">
              <ArrowUp size={13} color="#fff" />
              <Text className="ml-1 text-xs font-extrabold text-white">{loading ? '...' : 'BUY'}</Text>
            </View>
          </Pressable>
        </View>
        <View className="mt-3 rounded-xl border p-2.5" style={{ backgroundColor: priceBackground, borderColor: colors.border }}>
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-[11px] font-bold uppercase" style={{ color: colors.muted }}>Trade snapshot</Text>
            <View className="flex-row items-center rounded-full px-2 py-1" style={{ backgroundColor: mutedPill }}>
              <View className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.success }} />
              <Text className="text-[8px] font-extrabold uppercase" style={{ color: colors.muted }}>Ready</Text>
            </View>
          </View>
          {snapshotRows.map(([label, value]) => (
            <View key={label} className="mb-1.5 flex-row items-center justify-between">
              <Text className="text-[10px]" style={{ color: colors.muted }}>{label}</Text>
              <Text className="text-[10px] font-bold" style={{ color: colors.text }}>{value}</Text>
            </View>
          ))}
          <View className="mt-1 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: darkMode ? colors.background : '#ffffff' }}>
            <Text className="text-[9px] leading-3" style={{ color: colors.muted }}>
              Tap Sell or Buy to open an instant market position.
            </Text>
          </View>
        </View>
        <View className="mt-3 rounded-xl border p-2.5" style={{ backgroundColor: darkMode ? colors.background : '#ffffff', borderColor: colors.border }}>
          <Text className="text-[11px] font-bold uppercase" style={{ color: colors.muted }}>Before you trade</Text>
          {[
            'Check the spread before opening.',
            'Start small when markets move fast.',
            'Review open positions below.',
          ].map((item) => (
            <View key={item} className="mt-1.5 flex-row items-start">
              <View className="mr-2 mt-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.primary }} />
              <Text className="flex-1 text-[9px] leading-3" style={{ color: colors.muted }}>{item}</Text>
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
