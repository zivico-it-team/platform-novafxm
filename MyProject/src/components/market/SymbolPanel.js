import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { CalendarDays, ChevronDown, ChevronRight, CircleDollarSign, Search } from 'lucide-react-native';
import { DEFAULT_SYMBOL, MARKET_GROUPS } from '../../constants/symbols';
import { useAppTheme } from '../../context/ThemeContext';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import SymbolCard from './SymbolCard';

function calendarHtml(colors, darkMode) {
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <style>
    html,body,.tradingview-widget-container,.tradingview-widget-container__widget {
      height:100%;width:100%;margin:0;background:${colors.panel};overflow:hidden;
    }
    body { border:1px solid ${colors.border}; border-radius:12px; box-sizing:border-box; }
  </style>
</head>
<body>
  <div class="tradingview-widget-container">
    <div class="tradingview-widget-container__widget"></div>
    <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-events.js" async>
    {
      "colorTheme": "${darkMode ? 'dark' : 'light'}",
      "isTransparent": false,
      "width": "100%",
      "height": "100%",
      "locale": "en",
      "importanceFilter": "-1,0,1",
      "countryFilter": "us,eu,gb,jp,ca,au,nz,ch,cn"
    }
    </script>
  </div>
</body>
</html>`;
}

export default function SymbolPanel() {
  const { width } = useWindowDimensions();
  const { prices, selectedSymbol, setSelectedSymbol, connected } = useDemoTrading();
  const { darkMode, colors } = useAppTheme();
  const [tab, setTab] = useState('symbols');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({ POPULAR: true });
  const panelBackground = darkMode ? colors.panel : '#e8f8ee';
  const controlBackground = darkMode ? colors.surface : '#f6fff9';
  const groupBackground = darkMode ? colors.surface : colors.primarySoft;
  const pillBackground = darkMode ? colors.primary : colors.primarySoft;
  const pillText = '#0B0B0B';
  const headerBackground = darkMode ? '#11161c' : colors.primarySoft;
  const tabBackground = darkMode ? colors.surface : '#f6fff9';
  const desktop = width >= 1100;
  const mobile = width < 760;
  const panelHeight = desktop ? undefined : 390;
  const filtered = useMemo(
    () => prices.filter((item) => item.symbol.toLowerCase().includes(search.toLowerCase())),
    [prices, search],
  );

  const itemsForGroup = (group) =>
    filtered
      .filter((item) => (group === 'POPULAR' ? item.popular : item.group === group))
      .sort((left, right) => (right.symbol === DEFAULT_SYMBOL ? 1 : 0) - (left.symbol === DEFAULT_SYMBOL ? 1 : 0));
  const toggleGroup = (group) => setExpanded((current) => ({ ...current, [group]: !current[group] }));

  return (
    <View className="overflow-hidden rounded-2xl border p-2 lg:h-full lg:w-[350px]" style={{ height: panelHeight, backgroundColor: panelBackground, borderColor: colors.border }}>
      <View className={`${mobile ? 'mb-2 rounded-md p-0.5' : 'mb-3 rounded-xl p-1'} flex-row border`} style={{ backgroundColor: tabBackground, borderColor: colors.border }}>
        <Pressable onPress={() => setTab('symbols')} className={`${mobile ? 'rounded px-2 py-2' : 'rounded-lg px-3 py-3'} mr-1 flex-1 flex-row items-center justify-center`} style={{ backgroundColor: tab === 'symbols' ? colors.primary : 'transparent' }}>
          <CircleDollarSign size={mobile ? 14 : 18} color={tab === 'symbols' ? '#0B0B0B' : colors.muted} />
          <Text className={`${mobile ? 'ml-1.5 text-xs' : 'ml-2'} font-semibold`} style={{ color: tab === 'symbols' ? '#0B0B0B' : colors.muted }}>Symbols</Text>
        </Pressable>
        <Pressable onPress={() => setTab('calendar')} className={`${mobile ? 'rounded px-2 py-2' : 'rounded-lg px-3 py-3'} flex-1 flex-row items-center justify-center`} style={{ backgroundColor: tab === 'calendar' ? colors.primary : 'transparent' }}>
          <CalendarDays size={mobile ? 14 : 18} color={tab === 'calendar' ? '#0B0B0B' : colors.muted} />
          <Text className={`${mobile ? 'ml-1.5 text-xs' : 'ml-2'} font-semibold`} style={{ color: tab === 'calendar' ? '#0B0B0B' : colors.muted }}>Calendar</Text>
        </Pressable>
      </View>

      {tab === 'calendar' ? (
        <View className="h-[480px] p-2 lg:flex-1">
          {Platform.OS === 'web' ? (
            <iframe
              title="TradingView economic calendar"
              srcDoc={calendarHtml(colors, darkMode)}
              style={{ width: '100%', height: '100%', border: 0, borderRadius: 12 }}
            />
          ) : (
            <WebView
              originWhitelist={['*']}
              domStorageEnabled
              javaScriptEnabled
              source={{ html: calendarHtml(colors, darkMode) }}
              style={{ backgroundColor: colors.panel, borderRadius: 12 }}
            />
          )}
        </View>
      ) : (
        <View className="min-h-0 flex-1">
          <View className={`${mobile ? 'mb-2' : 'mb-3'} flex-row items-center justify-between px-1`}>
            <Text className={`${mobile ? 'rounded-md px-3 py-1.5 text-xs' : 'rounded-full px-4 py-2'} overflow-hidden font-bold`} style={{ backgroundColor: pillBackground, color: pillText }}>All</Text>
            <View className="flex-row items-center rounded-full border px-3 py-2" style={{ backgroundColor: controlBackground, borderColor: colors.border }}>
              <View className={`mr-2 h-2.5 w-2.5 rounded-full ${connected ? 'bg-success' : 'bg-primary'}`} />
              <Text className="text-xs font-semibold" style={{ color: colors.muted }}>{connected ? 'Connected' : 'Demo feed'}</Text>
            </View>
          </View>
          <View className="mb-3 flex-row items-center rounded-xl border px-4" style={{ backgroundColor: controlBackground, borderColor: colors.border }}>
            <TextInput value={search} onChangeText={setSearch} placeholder="Symbol Search" placeholderTextColor={colors.muted} className="h-11 flex-1" style={{ color: colors.text }} />
            <Search size={18} color={colors.muted} />
          </View>
          <View className="flex-row rounded-t-xl border px-3 py-3" style={{ backgroundColor: headerBackground, borderColor: colors.border }}>
            <Text className="flex-1 text-center text-[11px] font-bold uppercase" style={{ color: colors.muted }}>Symbol</Text>
            <Text className="w-[78px] text-right text-[11px] font-bold uppercase" style={{ color: colors.muted }}>Bid</Text>
            <Text className="w-[54px] text-right text-[11px] font-bold uppercase" style={{ color: colors.muted }}>Spread</Text>
            <Text className="w-[78px] text-right text-[11px] font-bold uppercase" style={{ color: colors.muted }}>Ask</Text>
          </View>
          <ScrollView
            className="deep-green-scrollbar min-h-0 max-h-[330px] rounded-b-xl border-x border-b lg:flex-1"
            style={{ borderColor: colors.border }}
            showsVerticalScrollIndicator
            indicatorStyle={darkMode ? 'white' : 'black'}
            persistentScrollbar
            nestedScrollEnabled
          >
            {MARKET_GROUPS.map((group) => {
              const items = itemsForGroup(group);
              if (!items.length) return null;
              const open = Boolean(search) || Boolean(expanded[group]);
              return (
                <View key={group}>
                  <Pressable onPress={() => toggleGroup(group)} className="flex-row items-center border-b px-4 py-3" style={{ backgroundColor: groupBackground, borderColor: colors.border }}>
                    {open ? <ChevronDown size={14} color={colors.primary} /> : <ChevronRight size={14} color={colors.muted} />}
                    <Text className="ml-2 text-xs font-bold" style={{ color: colors.primary }}>{group}</Text>
                  </Pressable>
                  {open ? items.map((item) => <SymbolCard key={item.symbol} item={item} selected={item.symbol === selectedSymbol} onSelect={setSelectedSymbol} />) : null}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
