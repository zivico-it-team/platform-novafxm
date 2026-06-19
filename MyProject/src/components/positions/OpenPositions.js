import { useState } from 'react';
import { ScrollView, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Briefcase, Eye, Gauge, Network, X } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import PositionCard from './PositionCard';
import PositionInfoModal from './PositionInfoModal';
import { dateTime, money, quote } from '../../utils/formatters';

const baseColumns = [
  ['Symbol', 210],
  ['Side', 110],
  ['Volume', 105],
  ['Entry Price', 145],
  ['Current Price', 145],
  ['P&L (USD)', 130],
  ['P&L (%)', 115],
  ['Duration', 120],
  ['Actions', 135],
];

function SummaryItem({ Icon, label, value, colors, tone }) {
  return (
    <View className="min-w-[170px] flex-1 flex-row items-center border-r px-5 py-5" style={{ borderColor: colors.border }}>
      <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
        <Icon size={18} color={colors.muted} />
      </View>
      <View className="ml-4">
        <Text className="text-xs" style={{ color: colors.muted }}>{label}</Text>
        <Text className="mt-1 text-base font-black" style={{ color: tone || colors.text }}>{value}</Text>
      </View>
    </View>
  );
}

export default function OpenPositions() {
  const { width } = useWindowDimensions();
  const { positions, closedPositions, pendingOrders, closePosition, summary } = useDemoTrading();
  const { darkMode, colors } = useAppTheme();
  const [tab, setTab] = useState('open');
  const [error, setError] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const items = tab === 'open' ? positions : tab === 'closed' ? closedPositions : pendingOrders || [];
  const panelBackground = darkMode ? '#070d12' : colors.panel;
  const headerBackground = darkMode ? '#10161d' : colors.surface;
  const tableBackground = darkMode ? '#080f14' : colors.panel;
  const mobile = width < 760;
  const tableWidth = Math.max(Math.min(width - 32, 1440), 1215);
  const scale = tableWidth / 1215;
  const columns = baseColumns.map(([label, columnWidth]) => [label, Math.floor(columnWidth * scale)]);
  const columnWidths = columns.map(([, columnWidth]) => columnWidth);
  const close = (id) => closePosition(id).catch((requestError) => setError(requestError.response?.data?.message || requestError.message));
  const closeAll = async () => {
    setError('');
    try {
      await Promise.all(positions.map((position) => closePosition(position.id)));
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    }
  };

  return (
    <View className={`${mobile ? 'mt-2 rounded-lg' : 'mt-3 rounded-lg'} overflow-hidden border`} style={{ backgroundColor: panelBackground, borderColor: colors.border }}>
      <View className="flex-row items-center justify-between border-b px-5" style={{ borderColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
          {[
            ['open', `Positions (${positions.length})`],
            ['pending', `Orders (${pendingOrders?.length || 0})`],
            ['closed', 'History'],
          ].map(([value, title]) => (
          <Pressable key={value} onPress={() => setTab(value)} className="mr-8 h-11 justify-center border-b-2" style={{ borderColor: tab === value ? colors.primary : 'transparent' }}>
            <Text className="text-sm font-bold" style={{ color: tab === value ? colors.primary : colors.muted }}>{title}</Text>
          </Pressable>
        ))}
        </ScrollView>
        {!mobile && positions.length ? (
          <Pressable onPress={closeAll} className="h-8 flex-row items-center rounded-md border px-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
            <X size={14} color={colors.text} />
            <Text className="ml-2 text-xs font-bold" style={{ color: colors.text }}>Close All Positions</Text>
          </Pressable>
        ) : null}
      </View>
      {mobile ? (
        <View className="p-2">
          {error ? <Text className="mb-2 rounded-md px-3 py-2" style={{ color: colors.danger, backgroundColor: tableBackground }}>{error}</Text> : null}
          {items.length ? items.map((position) => {
            const profit = Number(position.profit || 0);
            const sideColor = position.side === 'BUY' ? colors.success : colors.danger;
            return (
              <View key={position.id} className="mb-2 rounded-lg border p-3" style={{ backgroundColor: tableBackground, borderColor: colors.border }}>
                <View className="mb-3 flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-bold" style={{ color: colors.text }}>{position.symbol}</Text>
                    <Text className="mt-0.5 text-[10px]" style={{ color: colors.muted }}>#{position.id}  {dateTime(position.openedAt || position.createdAt)}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {tab === 'open' ? (
                      <Pressable onPress={() => close(position.id)} className="h-8 w-8 items-center justify-center rounded-md border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                        <X size={15} color={colors.danger} />
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => setSelectedPosition(position)} className="h-8 w-8 items-center justify-center rounded-md border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                      <Eye size={15} color={colors.primary} />
                    </Pressable>
                  </View>
                </View>
                <View className="flex-row flex-wrap">
                  <View className="mb-2 w-1/2">
                    <Text className="text-[10px]" style={{ color: colors.muted }}>Side / Lots</Text>
                    <Text className="mt-0.5 text-xs font-bold" style={{ color: sideColor }}>{position.side}  {Number(position.lots).toFixed(2)}</Text>
                  </View>
                  <View className="mb-2 w-1/2 items-end">
                    <Text className="text-[10px]" style={{ color: colors.muted }}>Profit / Loss</Text>
                    <Text className="mt-0.5 text-xs font-bold" style={{ color: profit >= 0 ? colors.success : colors.danger }}>{money(profit)}</Text>
                  </View>
                  <View className="w-1/2">
                    <Text className="text-[10px]" style={{ color: colors.muted }}>{tab === 'pending' ? 'Entry Price' : 'Open Price'}</Text>
                    <Text className="mt-0.5 text-xs font-semibold" style={{ color: colors.text }}>{quote(position.openPrice || position.entryPrice, 5)}</Text>
                  </View>
                  <View className="w-1/2 items-end">
                    <Text className="text-[10px]" style={{ color: colors.muted }}>{tab === 'pending' ? 'Order Type' : 'Current Price'}</Text>
                    <Text className="mt-0.5 text-xs font-semibold" style={{ color: colors.text }}>{tab === 'pending' ? position.orderType : quote(position.currentPrice || position.closePrice, 5)}</Text>
                  </View>
                </View>
              </View>
            );
          }) : (
            <Text className="rounded-lg border p-4 text-center" style={{ color: colors.muted, backgroundColor: tableBackground, borderColor: colors.border }}>No {tab} positions.</Text>
          )}
        </View>
      ) : (
        <ScrollView horizontal>
          <View className="overflow-hidden" style={{ width: tableWidth, backgroundColor: tableBackground }}>
            <View className="flex-row px-4 py-3" style={{ backgroundColor: headerBackground }}>
              {columns.map(([label, columnWidth]) => (
                <Text key={label} className="text-[11px] font-bold uppercase" style={{ width: columnWidth, color: colors.muted }}>{label}</Text>
              ))}
            </View>
            {error ? <Text className="p-4" style={{ color: colors.danger }}>{error}</Text> : null}
            {items.length ? items.map((position, index) => <PositionCard key={position.id} position={position} index={index} columnWidths={columnWidths} tableWidth={tableWidth} onView={setSelectedPosition} onClose={close} closed={tab !== 'open'} pending={tab === 'pending'} />) : (
              <Text className="p-6" style={{ color: colors.muted }}>No {tab} positions.</Text>
            )}
          </View>
        </ScrollView>
      )}
      {!mobile && tab !== 'closed' ? (
        <View className="mt-3 flex-row overflow-hidden border-t" style={{ borderColor: colors.border, backgroundColor: panelBackground }}>
          <SummaryItem Icon={Network} label="Open Positions" value={String(positions.length)} colors={colors} />
          <SummaryItem Icon={Gauge} label="Floating P&L" value={`${summary.openProfit >= 0 ? '+' : ''}${money(summary.openProfit)}`} colors={colors} tone={summary.openProfit >= 0 ? colors.success : colors.danger} />
          <SummaryItem Icon={Briefcase} label="Margin Used" value={`$${money(summary.margin)}`} colors={colors} />
          <SummaryItem Icon={Briefcase} label="Free Margin" value={`$${money(summary.freeFunds)}`} colors={colors} />
          <SummaryItem Icon={Network} label="Margin Level" value={summary.margin ? `${money(summary.marginLevel)}%` : '-'} colors={colors} tone={colors.success} />
        </View>
      ) : null}
      <PositionInfoModal position={selectedPosition} visible={Boolean(selectedPosition)} onClose={() => setSelectedPosition(null)} />
    </View>
  );
}
