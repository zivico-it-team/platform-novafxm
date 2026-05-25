import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CalendarDays, ChevronDown, ChevronRight, CircleDollarSign, Search } from 'lucide-react-native';
import { MARKET_GROUPS } from '../../constants/symbols';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import SymbolCard from './SymbolCard';

export default function SymbolPanel() {
  const { prices, selectedSymbol, setSelectedSymbol, connected } = useDemoTrading();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({ POPULAR: true });
  const filtered = useMemo(
    () => prices.filter((item) => item.symbol.toLowerCase().includes(search.toLowerCase())),
    [prices, search],
  );

  const itemsForGroup = (group) =>
    filtered.filter((item) => (group === 'POPULAR' ? item.popular : item.group === group));
  const toggleGroup = (group) => setExpanded((current) => ({ ...current, [group]: !current[group] }));

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-panel lg:h-full lg:w-[350px]">
      <View className="flex-row border-b border-border p-4">
        <View className="mr-7 flex-row items-center border-b-2 border-primary pb-3">
          <CircleDollarSign size={18} color="#27a8e9" />
          <Text className="ml-2 font-semibold text-primary">Symbols</Text>
        </View>
        <View className="flex-row items-center pb-3">
          <CalendarDays size={18} color="#f3f7ff" />
          <Text className="ml-2 text-white">Calendar</Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="rounded-full bg-[#173b64] px-3 py-2 text-primary">All</Text>
        <View className="flex-row items-center">
          <View className={`mr-2 h-2.5 w-2.5 rounded-full ${connected ? 'bg-success' : 'bg-primary'}`} />
          <Text className="text-muted">{connected ? 'Connected' : 'Demo feed'}</Text>
        </View>
      </View>
      <View className="mx-3 mb-3 flex-row items-center rounded-xl border border-border bg-surface px-3">
        <TextInput value={search} onChangeText={setSearch} placeholder="Symbol Search" placeholderTextColor="#8fa0bb" className="h-11 flex-1 text-white" />
        <Search size={18} color="#8fa0bb" />
      </View>
      <View className="flex-row border-y border-border px-3 py-3">
        <Text className="flex-1 text-center text-xs text-white">Symbol</Text>
        <Text className="w-[78px] text-right text-xs text-white">Bid</Text>
        <Text className="w-[54px] text-right text-xs text-white">Spread</Text>
        <Text className="w-[78px] text-right text-xs text-white">Ask</Text>
      </View>
      <ScrollView className="max-h-[440px] lg:flex-1">
        {MARKET_GROUPS.map((group) => {
          const items = itemsForGroup(group);
          if (!items.length) return null;
          const open = Boolean(search) || Boolean(expanded[group]);
          return (
            <View key={group}>
              <Pressable onPress={() => toggleGroup(group)} className="flex-row items-center bg-[#13253f] px-4 py-3">
                {open ? <ChevronDown size={14} color="#27a8e9" /> : <ChevronRight size={14} color="#8fa0bb" />}
                <Text className="ml-2 text-xs font-bold text-primary">{group}</Text>
              </Pressable>
              {open ? items.map((item) => <SymbolCard key={item.symbol} item={item} selected={item.symbol === selectedSymbol} onSelect={setSelectedSymbol} />) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
