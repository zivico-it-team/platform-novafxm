import { useState } from 'react';
import { ScrollView, Pressable, Text, View } from 'react-native';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import PositionCard from './PositionCard';

export default function OpenPositions() {
  const { positions, closedPositions, closePosition } = useDemoTrading();
  const [tab, setTab] = useState('open');
  const [error, setError] = useState('');
  const items = tab === 'open' ? positions : tab === 'closed' ? closedPositions : [];

  return (
    <View className="mt-3 overflow-hidden rounded-2xl border border-border bg-panel">
      <View className="flex-row border-b border-border px-4">
        {[['open', 'Open Positions'], ['closed', 'Closed Positions'], ['pending', 'Pending Orders']].map(([value, title]) => (
          <Pressable key={value} onPress={() => setTab(value)} className={`mr-7 py-4 ${tab === value ? 'border-b-2 border-primary' : ''}`}>
            <Text className={tab === value ? 'text-primary' : 'text-muted'}>{title}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView horizontal>
        <View>
          <View className="min-w-[850px] flex-row bg-surface px-4 py-3">
            <Text className="w-[45px] text-xs text-muted" />
            <Text className="w-[130px] text-xs text-muted">SYMBOL</Text>
            <Text className="w-[120px] text-xs text-muted">PROFIT / LOSS</Text>
            <Text className="w-[190px] text-xs text-muted">OPEN TIME</Text>
            <Text className="w-[80px] text-xs text-muted">SIDE</Text>
            <Text className="w-[80px] text-xs text-muted">LOTS</Text>
            <Text className="w-[125px] text-xs text-muted">OPEN PRICE</Text>
            <Text className="w-[125px] text-xs text-muted">CURRENT PRICE</Text>
          </View>
          {error ? <Text className="p-4 text-danger">{error}</Text> : null}
          {items.length ? items.map((position) => <PositionCard key={position.id} position={position} onClose={(id) => closePosition(id).catch((requestError) => setError(requestError.response?.data?.message || requestError.message))} closed={tab === 'closed'} />) : (
            <Text className="p-6 text-muted">No {tab} positions.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
