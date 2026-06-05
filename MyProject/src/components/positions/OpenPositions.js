import { useState } from 'react';
import { ScrollView, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Eye, X } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import PositionCard from './PositionCard';
import PositionInfoModal from './PositionInfoModal';
import { dateTime, money, quote } from '../../utils/formatters';

const baseColumns = [
  ['', 82],
  ['Symbol', 170],
  ['Profit / Loss', 150],
  ['Open Time', 220],
  ['Side', 105],
  ['Lots', 90],
  ['Open Price', 150],
  ['Current Price', 150],
];

export default function OpenPositions() {
  const { width } = useWindowDimensions();
  const { positions, closedPositions, closePosition } = useDemoTrading();
  const { darkMode, colors } = useAppTheme();
  const [tab, setTab] = useState('open');
  const [error, setError] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const items = tab === 'open' ? positions : tab === 'closed' ? closedPositions : [];
  const panelBackground = darkMode ? colors.panel : '#e8f8ee';
  const headerBackground = darkMode ? colors.surface : colors.primarySoft;
  const tableBackground = darkMode ? '#11161c' : '#f6fff9';
  const mobile = width < 760;
  const tableWidth = Math.max(Math.min(width - 64, 1440), 1080);
  const scale = tableWidth / 1120;
  const columns = baseColumns.map(([label, columnWidth]) => [label, Math.floor(columnWidth * scale)]);
  const columnWidths = columns.map(([, columnWidth]) => columnWidth);
  const close = (id) => closePosition(id).catch((requestError) => setError(requestError.response?.data?.message || requestError.message));

  return (
    <View className={`${mobile ? 'mt-2 rounded-lg p-2' : 'mt-3 rounded-2xl p-3'} overflow-hidden border`} style={{ backgroundColor: panelBackground, borderColor: colors.border }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ paddingHorizontal: 2 }}>
        {[['open', 'Open Positions'], ['closed', 'Closed Positions'], ['pending', 'Pending Orders']].map(([value, title]) => (
          <Pressable key={value} onPress={() => setTab(value)} className={`${mobile ? 'mr-2 rounded-md px-3 py-2' : 'mr-3 rounded-full px-4 py-2'}`} style={{ backgroundColor: tab === value ? colors.primary : 'transparent' }}>
            <Text className={`${mobile ? 'text-xs' : ''} font-semibold`} style={{ color: tab === value ? '#0B0B0B' : colors.muted }}>{title}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {mobile ? (
        <View>
          {error ? <Text className="mb-2 rounded-md px-3 py-2" style={{ color: colors.danger, backgroundColor: tableBackground }}>{error}</Text> : null}
          {items.length ? items.map((position) => {
            const profit = Number(position.profit || 0);
            const sideColor = position.side === 'BUY' ? colors.success : colors.danger;
            return (
              <View key={position.id} className="mb-2 rounded-lg border p-3" style={{ backgroundColor: tableBackground, borderColor: colors.border }}>
                <View className="mb-3 flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-bold" style={{ color: colors.text }}>{position.symbol}</Text>
                    <Text className="mt-0.5 text-[10px]" style={{ color: colors.muted }}>#{position.id}  {dateTime(position.openedAt)}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {tab !== 'closed' ? (
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
                    <Text className="text-[10px]" style={{ color: colors.muted }}>Open Price</Text>
                    <Text className="mt-0.5 text-xs font-semibold" style={{ color: colors.text }}>{quote(position.openPrice, 5)}</Text>
                  </View>
                  <View className="w-1/2 items-end">
                    <Text className="text-[10px]" style={{ color: colors.muted }}>Current Price</Text>
                    <Text className="mt-0.5 text-xs font-semibold" style={{ color: colors.text }}>{quote(position.currentPrice || position.closePrice, 5)}</Text>
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
          <View className="overflow-hidden rounded-xl border" style={{ width: tableWidth, backgroundColor: tableBackground, borderColor: colors.border }}>
            <View className="flex-row px-4 py-3" style={{ backgroundColor: headerBackground }}>
              {columns.map(([label, columnWidth]) => (
                <Text key={label || 'actions'} className="text-[11px] font-bold uppercase" style={{ width: columnWidth, color: colors.muted }}>{label}</Text>
              ))}
            </View>
            {error ? <Text className="p-4" style={{ color: colors.danger }}>{error}</Text> : null}
            {items.length ? items.map((position, index) => <PositionCard key={position.id} position={position} index={index} columnWidths={columnWidths} tableWidth={tableWidth} onView={setSelectedPosition} onClose={close} closed={tab === 'closed'} />) : (
              <Text className="p-6" style={{ color: colors.muted }}>No {tab} positions.</Text>
            )}
          </View>
        </ScrollView>
      )}
      <PositionInfoModal position={selectedPosition} visible={Boolean(selectedPosition)} onClose={() => setSelectedPosition(null)} />
    </View>
  );
}
