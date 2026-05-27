import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { percent, quote } from '../../utils/formatters';

const TIMEFRAMES = ['1s', '1m', '5m', '15m', '30m', '1H', '4H', '1D'];
const RANGES = [
  { label: 'YTD', value: 'YTD' },
  { label: '1Y', value: '1Y' },
  { label: '5Y', value: '5Y' },
  { label: 'ALL', value: 'ALL' },
];

const INTERVALS = {
  '1s': '1S',
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '30m': '30',
  '1H': '60',
  '4H': '240',
  '1D': 'D',
};

const RANGE_CONFIG = {
  YTD: 'YTD',
  '1Y': '12M',
  '5Y': '60M',
  ALL: 'ALL',
  '1D': '1D',
};

const inferTradingViewSymbol = (symbol, group) => {
  const compact = String(symbol || '').replace('/', '');
  if (!compact) return 'FX:EURUSD';
  if (group === 'CRYPTO CFD') return `BINANCE:${compact.replace('USD', 'USDT')}`;
  if (group === 'FOREX') return `FX:${compact}`;
  if (group === 'METALS' || group === 'ENERGIES' || group === 'INDICES') return `OANDA:${compact}`;
  return compact;
};

function chartHtml(symbol, timeframe, range) {
  const widgetOptions = {
    autosize: true,
    symbol,
    interval: INTERVALS[timeframe] || '15',
    range: RANGE_CONFIG[range] || '1D',
    timezone: 'Etc/UTC',
    theme: 'dark',
    style: '1',
    locale: 'en',
    backgroundColor: '#080f20',
    gridColor: 'rgba(42, 54, 82, 0.55)',
    hide_top_toolbar: true,
    hide_side_toolbar: true,
    hide_legend: true,
    allow_symbol_change: false,
    save_image: false,
    calendar: false,
    support_host: 'https://www.tradingview.com',
  };

  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
*{box-sizing:border-box}html,body,#chart{height:100%;width:100%;margin:0;background:#080f20;overflow:hidden}
.tradingview-widget-container{position:relative;height:100%;width:100%}
.tradingview-widget-container__widget{height:100%;width:100%}
.tradingview-widget-copyright,.tradingview-widget-copyright a{background:transparent!important}
</style></head>
<body>
<div id="chart" class="tradingview-widget-container">
  <div class="tradingview-widget-container__widget"></div>
  <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" async>
${JSON.stringify(widgetOptions, null, 2)}
  </script>
</div>
</body></html>`;
}

export default function TradingChart() {
  const { currentSymbol } = useDemoTrading();
  const [timeframe, setTimeframe] = useState('15m');
  const [activePeriod, setActivePeriod] = useState('15m');
  const activeRange = RANGES.some((entry) => entry.value === activePeriod) ? activePeriod : '1D';
  const tradingViewSymbol = currentSymbol.tradingViewSymbol || inferTradingViewSymbol(currentSymbol.symbol, currentSymbol.group);
  const html = useMemo(() => chartHtml(tradingViewSymbol, timeframe, activeRange), [tradingViewSymbol, timeframe, activeRange]);
  const positive = Number(currentSymbol.change) >= 0;

  return (
    <View className="min-h-[430px] flex-1 overflow-hidden rounded-2xl border border-border bg-[#080f20]">
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <Text className="mr-5 text-lg font-bold text-white">{currentSymbol.symbol}</Text>
        <Text className={positive ? 'text-success' : 'text-danger'}>{quote(currentSymbol.price, currentSymbol.decimals)}  {percent(currentSymbol.change)}</Text>
        <Text className="ml-3 text-xs text-muted">Spread {quote(currentSymbol.spread, currentSymbol.decimals)}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="ml-auto"
          contentContainerStyle={{ alignItems: 'center', flexDirection: 'row' }}
        >
          {TIMEFRAMES.map((entry) => (
            <Pressable
              key={entry}
              onPress={() => {
                setTimeframe(entry);
                setActivePeriod(entry);
              }}
              className={`ml-1 rounded-md px-3 py-2 ${entry === activePeriod ? 'bg-primary' : ''}`}
            >
              <Text className={entry === activePeriod ? 'font-bold text-white' : 'text-muted'}>{entry}</Text>
            </Pressable>
          ))}
          <View className="mx-2 h-5 w-px bg-border" />
          {RANGES.map((entry) => (
            <Pressable key={entry.value} onPress={() => setActivePeriod(entry.value)} className={`ml-1 rounded-md px-3 py-2 ${entry.value === activePeriod ? 'bg-primary' : ''}`}>
              <Text className={entry.value === activePeriod ? 'font-bold text-white' : 'text-muted'}>{entry.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View className="flex-1">
        {Platform.OS === 'web' ? (
          <iframe
            key={`${currentSymbol.symbol}-${timeframe}-${activePeriod}`}
            title="Trading chart"
            srcDoc={html}
            style={{ width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <WebView
            key={`${currentSymbol.symbol}-${timeframe}-${activePeriod}`}
            originWhitelist={['*']}
            domStorageEnabled
            javaScriptEnabled
            source={{ html }}
            style={{ backgroundColor: '#080f20' }}
          />
        )}
      </View>
    </View>
  );
}
