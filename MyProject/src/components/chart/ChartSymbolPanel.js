import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ChevronDown, ChevronLeft, Search, Star } from 'lucide-react-native';
import { percent, quote } from '../../utils/formatters';

export default function ChartSymbolPanel({
  currentSymbol,
  favoriteSymbols = [],
  filteredSymbols,
  hoveredSymbol,
  onClose,
  onHoverSymbol,
  onSearchChange,
  onSelectSymbol,
  onSelectTab,
  onToggleFavorite,
  search,
  symbolPanelTop,
  symbolPanelWidth,
  symbolTabs,
  symbolTab,
  symbolTabMenuOpen,
  setSymbolTabMenuOpen,
  ui,
}) {
  const favoriteSymbolSet = new Set(favoriteSymbols);
  const favoritesActive = symbolTab === 'Favorites';
  const selectedCategory = symbolTabs.includes(symbolTab) ? symbolTab : symbolTabs[0];

  return (
    <View
      className="absolute max-w-[96vw] overflow-hidden rounded-lg border shadow-2xl"
      style={{
        left: 10,
        top: symbolPanelTop,
        bottom: 10,
        width: symbolPanelWidth,
        backgroundColor: ui.menu,
        borderColor: ui.menuBorder,
        zIndex: 3200,
        elevation: 3200,
      }}
    >
      <View className="border-b px-3 py-3" style={{ borderColor: ui.border, zIndex: 3300, elevation: 3300 }}>
        <View className="flex-row items-center gap-2" style={{ zIndex: 3400, elevation: 3400 }}>
          <View className="relative flex-1" style={{ zIndex: 3400, elevation: 3400 }}>
            <Pressable
              onPress={() => setSymbolTabMenuOpen((value) => !value)}
              className="h-9 flex-row items-center justify-between rounded-md border px-3"
              style={{
                backgroundColor: symbolTabMenuOpen ? ui.soft : ui.control,
                borderColor: symbolTabMenuOpen ? ui.accent : ui.border,
                cursor: 'pointer',
              }}
            >
              <Text className="text-xs font-extrabold" numberOfLines={1} style={{ color: symbolTabMenuOpen ? ui.accent : ui.text }}>{selectedCategory}</Text>
              <ChevronDown size={13} color={symbolTabMenuOpen ? ui.accent : ui.muted} />
            </Pressable>
            {symbolTabMenuOpen ? (
              <View
                className="absolute left-0 right-0 rounded-md border p-1 shadow-2xl"
                style={{ top: 42, backgroundColor: ui.menu, borderColor: ui.menuBorder, zIndex: 3500, elevation: 3500 }}
              >
                {symbolTabs.map((entry) => (
                  <Pressable
                    key={entry}
                    onPress={() => onSelectTab(entry)}
                    className="h-8 justify-center rounded px-2"
                    style={{ backgroundColor: entry === symbolTab ? ui.soft : 'transparent', cursor: 'pointer' }}
                  >
                    <Text className="text-xs font-extrabold" style={{ color: entry === symbolTab ? ui.accent : ui.text }}>{entry}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={() => onSelectTab('Favorites')}
            className="h-9 flex-row items-center justify-center rounded-md border px-3"
            style={{
              minWidth: 104,
              backgroundColor: favoritesActive ? ui.accent : ui.control,
              borderColor: favoritesActive ? ui.accent : ui.border,
              cursor: 'pointer',
            }}
          >
            <Star size={15} color={favoritesActive ? ui.activeText : ui.muted} fill={favoritesActive ? ui.activeText : 'transparent'} />
            <Text className="ml-1.5 text-xs font-extrabold" numberOfLines={1} style={{ color: favoritesActive ? ui.activeText : ui.text }}>Favorites</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-md border"
            style={{ backgroundColor: ui.control, borderColor: ui.border }}
          >
            <ChevronLeft size={16} color={ui.muted} />
          </Pressable>
        </View>
        <View className="mt-2 h-10 flex-row items-center rounded-md border px-3" style={{ backgroundColor: ui.control, borderColor: ui.border }}>
          <Search size={16} color={ui.muted} />
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search"
            placeholderTextColor={ui.muted}
            className="ml-2 h-10 flex-1 text-sm"
            style={{ color: ui.text }}
          />
        </View>
      </View>

      <View className="flex-row border-b px-4 py-2" style={{ borderColor: ui.border }}>
        <Text className="flex-1 text-[11px] font-bold" numberOfLines={1} style={{ color: ui.muted }}>Symbols / Vol</Text>
        <Text className="w-[92px] text-right text-[11px] font-bold" style={{ color: ui.muted }}>Last Price</Text>
      </View>

      <ScrollView
        className="min-h-0 flex-1"
        showsVerticalScrollIndicator
        persistentScrollbar
        style={Platform.OS === 'web' ? { overflowY: 'scroll', scrollbarGutter: 'stable' } : null}
      >
        {filteredSymbols.map((item) => {
          const itemPositive = Number(item.change) >= 0;
          const itemTone = itemPositive ? ui.success : ui.danger;
          const active = item.symbol === currentSymbol.symbol;
          const hovered = hoveredSymbol === item.symbol;
          const favorite = favoriteSymbolSet.has(item.symbol);
          return (
            <Pressable
              key={item.symbol}
              onHoverIn={() => onHoverSymbol(item.symbol)}
              onHoverOut={() => onHoverSymbol(null)}
              onPress={() => onSelectSymbol(item.symbol)}
              className="h-[48px] flex-row items-center px-4"
              style={{ backgroundColor: active || hovered ? ui.soft : 'transparent', cursor: 'pointer' }}
            >
              <View className="min-w-0 flex-1 flex-row items-center">
                <Pressable
                  onPress={(event) => {
                    event?.stopPropagation?.();
                    onToggleFavorite?.(item.symbol);
                  }}
                  className="h-7 w-7 items-center justify-center rounded"
                  style={{ cursor: 'pointer' }}
                >
                  <Star
                    size={15}
                    color={favorite || active || hovered ? ui.accent : ui.muted}
                    fill={favorite ? ui.accent : 'transparent'}
                  />
                </Pressable>
                <View className="mx-2 h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: itemTone }}>
                  <Text className="text-[8px] font-black text-white">{item.symbol?.[0] || '$'}</Text>
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-sm font-extrabold" numberOfLines={1} style={{ color: active || hovered ? ui.accent : ui.text }}>{item.symbol}</Text>
                    <Text className="ml-1 rounded px-1 text-[10px] font-bold" style={{ backgroundColor: ui.control, color: ui.muted }}>Perp</Text>
                  </View>
                  <Text className="text-[11px]" style={{ color: ui.muted }}>{item.group || 'Market'}</Text>
                </View>
              </View>
              <View className="w-[92px] items-end">
                <Text className="text-sm font-semibold" numberOfLines={1} style={{ color: ui.text }}>{quote(item.price, item.decimals)}</Text>
                <Text className="text-[11px] font-bold" numberOfLines={1} style={{ color: itemTone }}>{percent(item.change)}</Text>
              </View>
            </Pressable>
          );
        })}
        {!filteredSymbols.length ? (
          <View className="items-center px-6 py-10">
            <Star size={22} color={ui.muted} />
            <Text className="mt-3 text-sm font-extrabold" style={{ color: ui.text }}>
              No symbols here
            </Text>
            <Text className="mt-1 text-center text-xs" style={{ color: ui.muted }}>
              Tap a star on any market to add it to Favorites.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
