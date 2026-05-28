import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { contractSize } from '../../utils/calculations';
import { money, quote } from '../../utils/formatters';

function InfoBox({ label, children, colors, background }) {
  return (
    <View className="flex-1 rounded-lg p-3" style={{ backgroundColor: background }}>
      <Text className="mb-2 text-xs" style={{ color: colors.muted }}>{label}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value, colors, background, accent = false }) {
  return (
    <View className="mb-3 flex-1 flex-row items-center">
      <Text className="w-[115px] text-sm font-semibold" style={{ color: colors.text }}>{label}</Text>
      <View className="h-9 flex-1 justify-center rounded-md px-3" style={{ backgroundColor: background, borderLeftWidth: accent ? 3 : 0, borderLeftColor: colors.primary }}>
        <Text className="font-semibold" style={{ color: colors.text }}>{value}</Text>
      </View>
    </View>
  );
}

function Section({ title, children, colors }) {
  return (
    <View className="mt-5 border-t pt-5" style={{ borderColor: colors.border }}>
      <Text className="mb-4 font-bold" style={{ color: colors.text }}>{title}</Text>
      {children}
    </View>
  );
}

export default function PositionInfoModal({ position, visible, onClose }) {
  const { darkMode, colors } = useAppTheme();
  if (!position) return null;

  const modalBackground = darkMode ? colors.panel : '#e8f8ee';
  const boxBackground = darkMode ? colors.surface : '#f6fff9';
  const profit = Number(position.profit || 0);
  const profitColor = profit >= 0 ? colors.success : colors.danger;
  const status = position.status || (position.closedAt ? 'closed' : 'open');
  const closePrice = position.closePrice || (status === 'closed' ? position.currentPrice : null);
  const margin = Number(position.margin ?? Number(position.lots) * 100);
  const size = contractSize(position.symbol);
  const currentOrClose = position.currentPrice || closePrice || position.openPrice;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/70 p-3">
        <Pressable onPress={(event) => event.stopPropagation()} className="max-h-[92%] w-full max-w-[640px] rounded-lg p-5" style={{ backgroundColor: modalBackground }}>
          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>Position Info</Text>
            <Pressable onPress={onClose} className="p-2"><X size={18} color={colors.muted} /></Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator indicatorStyle={darkMode ? 'white' : 'black'}>
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="mr-2 text-lg font-bold" style={{ color: colors.text }}>{position.symbol}</Text>
                <Text className="rounded-full px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: status === 'open' ? colors.success : colors.muted }}>
                  {status === 'open' ? 'Open' : 'Closed'}
                </Text>
              </View>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>ID: {position.id}</Text>
            </View>

            <View className="flex-row gap-3">
              <InfoBox label="Position" colors={colors} background={boxBackground}>
                <View className="flex-row items-center">
                  <Text className="mr-2 text-lg font-bold" style={{ color: colors.text }}>{Number(position.lots).toFixed(2)} Lots</Text>
                  <Text className="rounded-full px-2 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: position.side === 'BUY' ? colors.success : colors.danger }}>{position.side}</Text>
                </View>
              </InfoBox>
              <InfoBox label="Entry Price" colors={colors} background={boxBackground}>
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{quote(position.openPrice, 6)}</Text>
              </InfoBox>
              <InfoBox label="Unrealized P/L" colors={colors} background={boxBackground}>
                <Text className="text-lg" style={{ color: profitColor }}>{profit >= 0 ? '+' : ''}{money(profit)}</Text>
              </InfoBox>
            </View>

            <Section title="Position Details" colors={colors}>
              <View className="gap-4 md:flex-row">
                <View className="flex-1">
                  <DetailRow label="Position Size" value={`${Number(position.lots).toFixed(2)} Lots`} colors={colors} background={boxBackground} />
                  <DetailRow label="Margin" value={quote(margin, 5)} colors={colors} background={boxBackground} />
                </View>
                <View className="flex-1">
                  <DetailRow label="Current Direction" value={position.side} colors={colors} background={boxBackground} />
                  <DetailRow label="Lot Information" value={String(size)} colors={colors} background={boxBackground} />
                </View>
              </View>
            </Section>

            <Section title="Price Information" colors={colors}>
              <View className="gap-4 md:flex-row">
                <View className="flex-1">
                  <DetailRow label="Entry Price" value={quote(position.openPrice, 6)} colors={colors} background={boxBackground} />
                  <DetailRow label="Open Counter Price" value={quote(currentOrClose, 6)} colors={colors} background={boxBackground} />
                </View>
                <View className="flex-1">
                  <DetailRow label="Close Price" value={closePrice ? quote(closePrice, 6) : '-'} colors={colors} background={boxBackground} />
                  <DetailRow label="Broker Spread" value={quote(position.spread || 0, 0)} colors={colors} background={boxBackground} />
                </View>
              </View>
            </Section>

            <Section title="Risk Management" colors={colors}>
              <View className="gap-4 md:flex-row">
                <DetailRow label="Stop Loss" value={quote(position.stopLoss || 0, 6)} colors={colors} background={boxBackground} accent />
                <DetailRow label="Take Profit" value={quote(position.takeProfit || 0, 6)} colors={colors} background={boxBackground} accent />
              </View>
            </Section>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
