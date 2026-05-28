import { useState } from 'react';
import { ScrollView, Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import PositionCard from './PositionCard';

export default function OpenPositions() {
  const { positions, closedPositions, closePosition } = useDemoTrading();
  const { darkMode, colors } = useAppTheme();
  const [tab, setTab] = useState('open');
  const [error, setError] = useState('');
  const items = tab === 'open' ? positions : tab === 'closed' ? closedPositions : [];
  const panelBackground = darkMode ? colors.panel : '#e8f8ee';
  const headerBackground = darkMode ? colors.surface : '#d7f0e1';

  return (
    <View className="mt-3 overflow-hidden rounded-2xl border" style={{ backgroundColor: panelBackground, borderColor: colors.border }}>
      <View className="flex-row border-b px-4" style={{ borderColor: colors.border }}>
        {[['open', 'Open Positions'], ['closed', 'Closed Positions'], ['pending', 'Pending Orders']].map(([value, title]) => (
          <Pressable key={value} onPress={() => setTab(value)} className={`mr-7 py-4 ${tab === value ? 'border-b-2' : ''}`} style={{ borderColor: tab === value ? colors.primary : 'transparent' }}>
            <Text style={{ color: tab === value ? colors.primary : colors.muted }}>{title}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView horizontal>
        <View>
          <View className="min-w-[850px] flex-row px-4 py-3" style={{ backgroundColor: headerBackground }}>
            <Text className="w-[45px] text-xs" style={{ color: colors.muted }} />
            <Text className="w-[130px] text-xs" style={{ color: colors.muted }}>SYMBOL</Text>
            <Text className="w-[120px] text-xs" style={{ color: colors.muted }}>PROFIT / LOSS</Text>
            <Text className="w-[190px] text-xs" style={{ color: colors.muted }}>OPEN TIME</Text>
            <Text className="w-[80px] text-xs" style={{ color: colors.muted }}>SIDE</Text>
            <Text className="w-[80px] text-xs" style={{ color: colors.muted }}>LOTS</Text>
            <Text className="w-[125px] text-xs" style={{ color: colors.muted }}>OPEN PRICE</Text>
            <Text className="w-[125px] text-xs" style={{ color: colors.muted }}>CURRENT PRICE</Text>
          </View>
          {error ? <Text className="p-4" style={{ color: colors.danger }}>{error}</Text> : null}
          {items.length ? items.map((position) => <PositionCard key={position.id} position={position} onClose={(id) => closePosition(id).catch((requestError) => setError(requestError.response?.data?.message || requestError.message))} closed={tab === 'closed'} />) : (
            <Text className="p-6" style={{ color: colors.muted }}>No {tab} positions.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
