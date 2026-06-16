import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { CalendarDays, ChevronDown, CircleDollarSign, Search, Star } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { percent, quote } from '../../utils/formatters';

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

function SymbolMarketRow({ item, selected, onSelect, colors, darkMode, isFavourited, onToggleFavourite }) {
  const [hovered, setHovered] = useState(false);
  const positive = Number(item.change) >= 0;
  const tone = positive ? colors.success : colors.danger;
  const displaySymbol = item.symbol.replace('/', '');
  const rowBackground = selected
    ? colors.primarySoft
    : hovered
      ? darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(212, 175, 55, 0.12)'
      : 'transparent';
  const fakeVolume = Number.isFinite(Number(item.volume))
    ? `${(Number(item.volume) / 1000000).toFixed(2)}M`
    : `${Math.max(Math.abs(Number(item.price) || 1) * 0.018, 1.05).toFixed(2)}M`;

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => onSelect(item.symbol)}
      className="h-[48px] flex-row items-center px-2"
      style={{ backgroundColor: rowBackground, cursor: 'pointer' }}
    >
      <View className="min-w-0 flex-1 flex-row items-center">
        {/* Tappable star for favouriting */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavourite(item.symbol);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Star
            size={14}
            color={isFavourited ? colors.primary : selected || hovered ? colors.primary : colors.muted}
            fill={isFavourited ? colors.primary : 'none'}
          />
        </Pressable>
        <View className="mx-1.5 h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: tone }}>
          <Text className="text-[8px] font-black text-white">{displaySymbol[0] || '$'}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center">
            <Text className="text-xs font-medium" numberOfLines={1} style={{ color: selected || hovered ? colors.primary : colors.text }}>{displaySymbol} CM</Text>
            <Text className="ml-1 rounded px-1 text-[9px] font-bold" style={{ backgroundColor: darkMode ? colors.surface : '#f0f0f0', color: colors.muted }}>Perp</Text>
          </View>
          <Text className="text-[10px]" style={{ color: colors.muted }}>{fakeVolume}</Text>
        </View>
      </View>
      <Text className="w-[72px] text-right text-xs font-semibold" numberOfLines={1} style={{ color: colors.text }}>{quote(item.price, item.decimals)}</Text>
      <Text className="w-[64px] text-right text-xs font-semibold" numberOfLines={1} style={{ color: tone }}>{percent(item.change)}</Text>
      <Text className="w-[72px] text-right text-xs font-semibold" numberOfLines={1} style={{ color: colors.text }}>{Number(item.spreadPoints ?? item.spread ?? 0).toFixed(5)}%</Text>
    </Pressable>
  );
}

export default function SymbolPanel() {
  const { width } = useWindowDimensions();
  const { prices, selectedSymbol, setSelectedSymbol } = useDemoTrading();
  const { darkMode, colors } = useAppTheme();
  const [tab, setTab] = useState('symbols');
  const [search, setSearch] = useState('');
  const [marketTab, setMarketTab] = useState('Popular');
  const [tag, setTag] = useState('All');

  // Favourites state — pre-seed with items that were already starred (item.popular as a proxy)
  const [favourites, setFavourites] = useState(
    () => new Set(prices.filter((p) => p.popular).map((p) => p.symbol)),
  );

  const toggleFavourite = (symbol) => {
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  };

  const panelBackground = darkMode ? colors.panel : '#e8f8ee';
  const controlBackground = darkMode ? colors.surface : '#f6fff9';
  const tabBackground = darkMode ? colors.surface : '#f6fff9';
  const desktop = width >= 1100;
  const mobile = width < 760;
  const panelHeight = desktop ? undefined : 390;
  const selectedItem = prices.find((item) => item.symbol === selectedSymbol) || prices[0];
  const selectedPositive = Number(selectedItem?.change) >= 0;
  const selectedTone = selectedPositive ? colors.success : colors.danger;

  // "Favourites" added as first tab so it sits right beside Popular
  const marketTabs = ['Favourites', 'Popular', 'Crypto CFD', 'Energies', 'Forex', 'Indices', 'Metals'];
  const tags = ['All', 'New Listing', 'AI', 'Layer-1', 'Layer-2', 'Gaming', 'Meme', 'Infrastructure'];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return prices.filter((item) => {
      const matchesSearch = !query || item.symbol.toLowerCase().includes(query) || item.group?.toLowerCase().includes(query);
      const itemGroup = String(item.group || '').toLowerCase();

      let matchesTab;
      if (marketTab === 'Favourites') {
        matchesTab = favourites.has(item.symbol);
      } else if (marketTab === 'Popular') {
        matchesTab = item.popular;
      } else if (marketTab === 'Crypto CFD') {
        matchesTab = itemGroup.includes('crypto');
      } else {
        matchesTab = itemGroup.includes(marketTab.toLowerCase());
      }

      return matchesSearch && matchesTab;
    });
  }, [marketTab, prices, search, favourites]);

  const isFavouritesTab = marketTab === 'Favourites';

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
          <View className="mb-3 rounded-xl border p-3" style={{ backgroundColor: darkMode ? colors.surface : '#ffffff', borderColor: colors.border }}>
            <View className="flex-row items-center justify-between">
              <View className="min-w-0 flex-1 flex-row items-center">
                <Star size={16} color={colors.primary} fill={colors.primary} />
                <View className="mx-2 h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
                  <Text className="text-[11px] font-black" style={{ color: '#0B0B0B' }}>{selectedItem?.symbol?.[0] || '$'}</Text>
                </View>
                <Text className="text-lg font-semibold" numberOfLines={1} style={{ color: colors.text }}>{selectedItem?.symbol?.replace('/', '') || selectedSymbol}</Text>
                <Text className="ml-1 rounded px-1 py-0.5 text-[10px] font-medium" style={{ backgroundColor: darkMode ? colors.panel : '#f0f0f0', color: colors.muted }}>Perp</Text>
                <ChevronDown size={13} color={colors.muted} />
              </View>
              <View className="items-end">
                <Text className="text-lg font-semibold" style={{ color: selectedTone }}>{quote(selectedItem?.price, selectedItem?.decimals)}</Text>
                <Text className="text-[11px] font-bold" style={{ color: selectedTone }}>{percent(selectedItem?.change)}</Text>
              </View>
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-[10px] font-semibold" style={{ color: colors.muted }}>Mark {quote(selectedItem?.bid, selectedItem?.decimals)}</Text>
              <Text className="text-[10px] font-semibold" style={{ color: colors.muted }}>Index {quote(selectedItem?.ask, selectedItem?.decimals)}</Text>
              <Text className="text-[10px] font-semibold" style={{ color: selectedTone }}>Funding {Number(selectedItem?.spreadPoints ?? selectedItem?.spread ?? 0).toFixed(5)}%</Text>
            </View>
          </View>

          <View className="mb-3 flex-row items-center rounded-xl border px-4" style={{ backgroundColor: controlBackground, borderColor: colors.border }}>
            <Search size={18} color={colors.muted} />
            <TextInput value={search} onChangeText={setSearch} placeholder="Search" placeholderTextColor={colors.muted} className="ml-2 h-11 flex-1" style={{ color: colors.text }} />
          </View>

          {/* Market tabs — Favourites is the first tab, visually distinct with a filled star */}
          <View className="mb-2 flex-row items-center justify-between">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, alignItems: 'center' }}>
              {marketTabs.map((item) => {
                const isFav = item === 'Favourites';
                const isActive = item === marketTab;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setMarketTab(item)}
                    className="flex-row items-center border-b-2 pb-1"
                    style={{ borderColor: isActive ? colors.primary : 'transparent', gap: 4 }}
                  >
                    {isFav && (
                      <Star
                        size={12}
                        color={isActive ? colors.primary : colors.muted}
                        fill={isActive ? colors.primary : 'none'}
                      />
                    )}
                    <Text
                      className="text-sm font-medium"
                      style={{ color: isActive ? colors.text : colors.muted }}
                    >
                      {item}
                    </Text>
                    {/* Badge showing count of favourited symbols */}
                    {isFav && favourites.size > 0 && (
                      <View
                        className="items-center justify-center rounded-full px-1"
                        style={{
                          backgroundColor: isActive ? colors.primary : darkMode ? colors.surface : '#e8e8e8',
                          minWidth: 16,
                          height: 16,
                        }}
                      >
                        <Text
                          className="text-[9px] font-black"
                          style={{ color: isActive ? '#0B0B0B' : colors.muted }}
                        >
                          {favourites.size}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable className="ml-2 flex-row items-center flex-shrink-0">
              <Text className="text-xs font-bold" style={{ color: colors.muted }}>All</Text>
              <ChevronDown size={13} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2" contentContainerStyle={{ columnGap: 8 }}>
            {tags.map((item) => (
              <Pressable key={item} onPress={() => setTag(item)} className="rounded px-2 py-1" style={{ backgroundColor: item === tag ? controlBackground : 'transparent' }}>
                <Text className="text-xs font-semibold" style={{ color: item === tag ? colors.text : colors.muted }}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View className="flex-row border-b px-2 py-2" style={{ borderColor: colors.border }}>
            <Text className="flex-1 text-[11px] font-medium" style={{ color: colors.muted }}>Symbols ↕ / Vol ↕</Text>
            <Text className="w-[72px] text-right text-[11px] font-medium" style={{ color: colors.muted }}>Last Price ↕</Text>
            <Text className="w-[64px] text-right text-[11px] font-medium" style={{ color: colors.muted }}>24h Chg ↕</Text>
            <Text className="w-[72px] text-right text-[11px] font-medium" style={{ color: colors.muted }}>Funding Rate</Text>
          </View>

          <ScrollView
            className="deep-green-scrollbar min-h-0 rounded-b-xl border-b lg:flex-1"
            style={{ borderColor: colors.border }}
            showsVerticalScrollIndicator
            indicatorStyle={darkMode ? 'white' : 'black'}
            persistentScrollbar
            nestedScrollEnabled
          >
            {filtered.length === 0 && isFavouritesTab ? (
              // Empty state for favourites
              <View className="flex-1 items-center justify-center py-10" style={{ gap: 8 }}>
                <Star size={28} color={colors.muted} />
                <Text className="text-sm font-semibold" style={{ color: colors.muted }}>No favourites yet</Text>
                <Text className="text-center text-xs" style={{ color: colors.muted, maxWidth: 200 }}>
                  Tap the ☆ next to any symbol to add it here
                </Text>
              </View>
            ) : (
              filtered.map((item) => (
                <SymbolMarketRow
                  key={item.symbol}
                  item={item}
                  selected={item.symbol === selectedSymbol}
                  onSelect={setSelectedSymbol}
                  colors={colors}
                  darkMode={darkMode}
                  isFavourited={favourites.has(item.symbol)}
                  onToggleFavourite={toggleFavourite}
                />
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}