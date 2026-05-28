import { useState } from 'react';
import { ScrollView, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import PositionCard from './PositionCard';
import PositionInfoModal from './PositionInfoModal';

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
  const headerBackground = darkMode ? colors.surface : '#d7f0e1';
  const tableBackground = darkMode ? '#06120d' : '#f6fff9';
  const tableWidth = Math.max(Math.min(width - 64, 1080), 1440);
  const scale = tableWidth / 1120;
  const columns = baseColumns.map(([label, columnWidth]) => [label, Math.floor(columnWidth * scale)]);
  const columnWidths = columns.map(([, columnWidth]) => columnWidth);

  return (
    <View className="mt-3 overflow-hidden rounded-2xl border p-3" style={{ backgroundColor: panelBackground, borderColor: colors.border }}>
      <View className="mb-3 flex-row px-1">
        {[['open', 'Open Positions'], ['closed', 'Closed Positions'], ['pending', 'Pending Orders']].map(([value, title]) => (
          <Pressable key={value} onPress={() => setTab(value)} className="mr-3 rounded-full px-4 py-2" style={{ backgroundColor: tab === value ? colors.primary : 'transparent' }}>
            <Text className="font-semibold" style={{ color: tab === value ? '#ffffff' : colors.muted }}>{title}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView horizontal>
        <View className="overflow-hidden rounded-xl border" style={{ width: tableWidth, backgroundColor: tableBackground, borderColor: colors.border }}>
          <View className="flex-row px-4 py-3" style={{ backgroundColor: headerBackground }}>
            {columns.map(([label, width]) => (
              <Text key={label || 'actions'} className="text-[11px] font-bold uppercase" style={{ width, color: colors.muted }}>{label}</Text>
            ))}
          </View>
          {error ? <Text className="p-4" style={{ color: colors.danger }}>{error}</Text> : null}
          {items.length ? items.map((position, index) => <PositionCard key={position.id} position={position} index={index} columnWidths={columnWidths} tableWidth={tableWidth} onView={setSelectedPosition} onClose={(id) => closePosition(id).catch((requestError) => setError(requestError.response?.data?.message || requestError.message))} closed={tab === 'closed'} />) : (
            <Text className="p-6" style={{ color: colors.muted }}>No {tab} positions.</Text>
          )}
        </View>
      </ScrollView>
      <PositionInfoModal position={selectedPosition} visible={Boolean(selectedPosition)} onClose={() => setSelectedPosition(null)} />
    </View>
  );
}
