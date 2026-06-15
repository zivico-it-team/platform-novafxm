import { Pressable, Text, View } from 'react-native';

export const GRAPH_SETTINGS = [
  ['askLine', 'Display ask line'],
  ['positionLine', 'Display position line'],
  ['takeProfitLine', 'Display take profit line'],
  ['stopLossLine', 'Display stop loss line'],
  ['positionLabels', 'Display position line labels'],
  ['customBidAsk', 'Custom bid/ask lines'],
];

function ToggleSwitch({ active, onPress, ui }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-5 w-10 justify-center rounded-full px-0.5"
      style={{ backgroundColor: active ? ui.controlActive : ui.muted }}
    >
      <View
        className="h-4 w-4 rounded-full bg-white"
        style={{ alignSelf: active ? 'flex-end' : 'flex-start' }}
      />
    </Pressable>
  );
}

export default function ChartGraphSettingsPanel({ left = 70, top, tools, toggleTool, ui }) {
  return (
    <View
      className="absolute w-[236px] rounded-xl border p-3 shadow-2xl"
      style={{ left, top, backgroundColor: ui.menu, borderColor: ui.menuBorder, zIndex: 3000, elevation: 3000 }}
    >
      <Text className="mb-2 border-b pb-2 text-xs font-extrabold" style={{ color: ui.text, borderColor: ui.border }}>GRAPH SETTINGS</Text>
      {GRAPH_SETTINGS.map(([key, label]) => (
        <View key={key} className="mb-3 flex-row items-center justify-between" style={{ height: 24 }}>
          <Text className="text-xs font-medium" style={{ color: ui.text }}>{label}</Text>
          <ToggleSwitch active={tools[key]} onPress={() => toggleTool(key)} ui={ui} />
        </View>
      ))}
    </View>
  );
}
