import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { contractSize } from '../../utils/calculations';
import { money, quote } from '../../utils/formatters';

function InfoBox({ label, children, colors, background, mobile, wide = false }) {
  return (
    <View className={`${mobile ? 'mb-2 rounded-md p-3' : 'flex-1 rounded-lg p-3'}`} style={{ width: mobile ? (wide ? '100%' : '48.5%') : undefined, backgroundColor: background }}>
      <Text className="mb-1.5 text-xs" style={{ color: colors.muted }}>{label}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value, colors, background, accent = false, mobile }) {
  if (mobile) {
    return (
      <View className="mb-2 min-h-[38px] flex-row items-center justify-between rounded-md px-3 py-2" style={{ backgroundColor: background, borderLeftWidth: accent ? 3 : 0, borderLeftColor: colors.primary }}>
        <Text className="mr-3 flex-1 text-xs font-semibold" numberOfLines={1} style={{ color: colors.muted }}>{label}</Text>
        <Text className="max-w-[58%] text-right text-sm font-semibold" numberOfLines={1} style={{ color: colors.text }}>{value}</Text>
      </View>
    );
  }

  return (
    <View className="mb-3 flex-1 flex-row items-center">
      <Text className="w-[115px] text-sm font-semibold" style={{ color: colors.text }}>{label}</Text>
      <View className="h-9 flex-1 justify-center rounded-md px-3" style={{ backgroundColor: background, borderLeftWidth: accent ? 3 : 0, borderLeftColor: colors.primary }}>
        <Text className="font-semibold" style={{ color: colors.text }}>{value}</Text>
      </View>
    </View>
  );
}

function Section({ title, children, colors, mobile }) {
  return (
    <View className={`${mobile ? 'mt-3 pt-3' : 'mt-5 pt-5'} border-t`} style={{ borderColor: colors.border }}>
      <Text className={`${mobile ? 'mb-2 text-sm' : 'mb-4'} font-bold`} style={{ color: colors.text }}>{title}</Text>
      {children}
    </View>
  );
}

export default function PositionInfoModal({ position, visible, onClose }) {
  const { width } = useWindowDimensions();
  const { darkMode, colors } = useAppTheme();
  if (!position) return null;

  const mobile = width < 760;
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
        <Pressable onPress={(event) => event.stopPropagation()} className={`${mobile ? 'max-h-[94%] rounded-md p-3' : 'max-h-[92%] rounded-lg p-5'} w-full max-w-[640px]`} style={{ backgroundColor: modalBackground }}>
          <View className={`${mobile ? 'mb-3' : 'mb-5'} flex-row items-center justify-between`}>
            <Text className={`${mobile ? 'text-base' : 'text-lg'} font-bold`} style={{ color: colors.text }}>Position Info</Text>
            <Pressable onPress={onClose} className="p-2"><X size={18} color={colors.muted} /></Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator indicatorStyle={darkMode ? 'white' : 'black'}>
            <View className={`${mobile ? 'mb-3 rounded-md px-3 py-2' : 'mb-4'} flex-row items-center justify-between`} style={{ backgroundColor: mobile ? boxBackground : 'transparent' }}>
              <View className="flex-row items-center">
                <Text className={`${mobile ? 'text-base' : 'text-lg'} mr-2 font-bold`} style={{ color: colors.text }}>{position.symbol}</Text>
                <Text className="rounded-full px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: status === 'open' ? colors.success : colors.muted }}>
                  {status === 'open' ? 'Open' : 'Closed'}
                </Text>
              </View>
              <Text className={`${mobile ? 'text-xs' : 'text-sm'} font-semibold`} style={{ color: colors.text }}>ID: {position.id}</Text>
            </View>

            <View className={mobile ? 'flex-row flex-wrap justify-between' : 'flex-row gap-3'}>
              <InfoBox label="Position" colors={colors} background={boxBackground} mobile={mobile}>
                <View className="flex-row items-center">
                  <Text className={`${mobile ? 'text-sm' : 'text-lg'} mr-2 font-bold`} numberOfLines={1} style={{ color: colors.text }}>{Number(position.lots).toFixed(2)} Lots</Text>
                  <Text className="rounded-full px-2 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: position.side === 'BUY' ? colors.success : colors.danger }}>{position.side}</Text>
                </View>
              </InfoBox>
              <InfoBox label="Entry Price" colors={colors} background={boxBackground} mobile={mobile}>
                <Text className={`${mobile ? 'text-sm' : 'text-lg'} font-bold`} numberOfLines={1} style={{ color: colors.text }}>{quote(position.openPrice, 6)}</Text>
              </InfoBox>
              <InfoBox label="Unrealized P/L" colors={colors} background={boxBackground} mobile={mobile} wide>
                <Text className={`${mobile ? 'text-sm' : 'text-lg'} font-bold`} numberOfLines={1} style={{ color: profitColor }}>{profit >= 0 ? '+' : ''}{money(profit)}</Text>
              </InfoBox>
            </View>

            <Section title="Position Details" colors={colors} mobile={mobile}>
              <View className={mobile ? '' : 'gap-4 md:flex-row'}>
                <View className="flex-1">
                  <DetailRow label="Position Size" value={`${Number(position.lots).toFixed(2)} Lots`} colors={colors} background={boxBackground} mobile={mobile} />
                  <DetailRow label="Margin" value={quote(margin, 5)} colors={colors} background={boxBackground} mobile={mobile} />
                </View>
                <View className="flex-1">
                  <DetailRow label="Current Direction" value={position.side} colors={colors} background={boxBackground} mobile={mobile} />
                  <DetailRow label="Lot Information" value={String(size)} colors={colors} background={boxBackground} mobile={mobile} />
                </View>
              </View>
            </Section>

            <Section title="Price Information" colors={colors} mobile={mobile}>
              <View className={mobile ? '' : 'gap-4 md:flex-row'}>
                <View className="flex-1">
                  <DetailRow label="Entry Price" value={quote(position.openPrice, 6)} colors={colors} background={boxBackground} mobile={mobile} />
                  <DetailRow label="Open Counter Price" value={quote(currentOrClose, 6)} colors={colors} background={boxBackground} mobile={mobile} />
                </View>
                <View className="flex-1">
                  <DetailRow label="Close Price" value={closePrice ? quote(closePrice, 6) : '-'} colors={colors} background={boxBackground} mobile={mobile} />
                  <DetailRow label="Broker Spread" value={quote(position.spread || 0, 0)} colors={colors} background={boxBackground} mobile={mobile} />
                </View>
              </View>
            </Section>

            <Section title="Risk Management" colors={colors} mobile={mobile}>
              <View className={mobile ? '' : 'gap-4 md:flex-row'}>
                <DetailRow label="Stop Loss" value={quote(position.stopLoss || 0, 6)} colors={colors} background={boxBackground} accent mobile={mobile} />
                <DetailRow label="Take Profit" value={quote(position.takeProfit || 0, 6)} colors={colors} background={boxBackground} accent mobile={mobile} />
              </View>
            </Section>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
