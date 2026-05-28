import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CalendarDays, ChevronDown, ChevronRight, CircleDollarSign, Search } from 'lucide-react-native';
import { MARKET_GROUPS } from '../../constants/symbols';
import { useAppTheme } from '../../context/ThemeContext';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import SymbolCard from './SymbolCard';

export default function SymbolPanel() {
  const { prices, selectedSymbol, setSelectedSymbol, connected } = useDemoTrading();
  const { darkMode, colors } = useAppTheme();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({ POPULAR: true });
  const panelBackground = darkMode ? colors.panel : '#e8f8ee';
  const controlBackground = darkMode ? colors.surface : '#f6fff9';
  const groupBackground = darkMode ? colors.surface : '#d7f0e1';
  const pillBackground = darkMode ? colors.primary : '#d0efdc';
  const pillText = darkMode ? '#ffffff' : colors.primary;
  const filtered = useMemo(
    () => prices.filter((item) => item.symbol.toLowerCase().includes(search.toLowerCase())),
    [prices, search],
  );

  const itemsForGroup = (group) =>
    filtered.filter((item) => (group === 'POPULAR' ? item.popular : item.group === group));
  const toggleGroup = (group) => setExpanded((current) => ({ ...current, [group]: !current[group] }));

  return (
    <View className="overflow-hidden rounded-2xl border lg:h-full lg:w-[350px]" style={{ backgroundColor: panelBackground, borderColor: colors.border }}>
      <View className="flex-row border-b p-4" style={{ borderColor: colors.border }}>
        <View className="mr-7 flex-row items-center border-b-2 pb-3" style={{ borderColor: colors.primary }}>
          <CircleDollarSign size={18} color={colors.primary} />
          <Text className="ml-2 font-semibold" style={{ color: colors.primary }}>Symbols</Text>
        </View>
        <View className="flex-row items-center pb-3">
          <CalendarDays size={18} color={colors.text} />
          <Text className="ml-2" style={{ color: colors.text }}>Calendar</Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="rounded-full px-3 py-2" style={{ backgroundColor: pillBackground, color: pillText }}>All</Text>
        <View className="flex-row items-center">
          <View className={`mr-2 h-2.5 w-2.5 rounded-full ${connected ? 'bg-success' : 'bg-primary'}`} />
          <Text style={{ color: colors.muted }}>{connected ? 'Connected' : 'Demo feed'}</Text>
        </View>
      </View>
      <View className="mx-3 mb-3 flex-row items-center rounded-xl border px-3" style={{ backgroundColor: controlBackground, borderColor: colors.border }}>
        <TextInput value={search} onChangeText={setSearch} placeholder="Symbol Search" placeholderTextColor={colors.muted} className="h-11 flex-1" style={{ color: colors.text }} />
        <Search size={18} color={colors.muted} />
      </View>
      <View className="flex-row border-y px-3 py-3" style={{ borderColor: colors.border }}>
        <Text className="flex-1 text-center text-xs" style={{ color: colors.text }}>Symbol</Text>
        <Text className="w-[78px] text-right text-xs" style={{ color: colors.text }}>Bid</Text>
        <Text className="w-[54px] text-right text-xs" style={{ color: colors.text }}>Spread</Text>
        <Text className="w-[78px] text-right text-xs" style={{ color: colors.text }}>Ask</Text>
      </View>
      <ScrollView className="max-h-[440px] lg:flex-1">
        {MARKET_GROUPS.map((group) => {
          const items = itemsForGroup(group);
          if (!items.length) return null;
          const open = Boolean(search) || Boolean(expanded[group]);
          return (
            <View key={group}>
              <Pressable onPress={() => toggleGroup(group)} className="flex-row items-center px-4 py-3" style={{ backgroundColor: groupBackground }}>
                {open ? <ChevronDown size={14} color={colors.primary} /> : <ChevronRight size={14} color={colors.muted} />}
                <Text className="ml-2 text-xs font-bold" style={{ color: colors.primary }}>{group}</Text>
              </Pressable>
              {open ? items.map((item) => <SymbolCard key={item.symbol} item={item} selected={item.symbol === selectedSymbol} onSelect={setSelectedSymbol} />) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
