import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { marketService } from '../../services/marketService';
import { percent, quote } from '../../utils/formatters';
import { useAppTheme } from '../../context/ThemeContext';

const TIMEFRAMES = [
  '1m', '3m', '5m', '15m',
  '1H', '4H',
  '1D', '1W', '1M',
];
const TIMEFRAME_SECONDS = {
  '1m': 60,
  '3m': 180,
  '5m': 300,
  '15m': 900,
  '1H': 3600,
  '4H': 14400,
  '1D': 86400,
  '1W': 604800,
  '1M': 2592000,
};
const HISTORY_LIMITS = {
  '1m': 50000,
  '3m': 50000,
  '5m': 50000,
  '15m': 50000,
  '1H': 50000,
  '4H': 50000,
  '1D': 50000,
  '1W': 50000,
  '1M': 50000,
};
const FULL_HISTORY_LIMITS = {
  '1m': 200000,
  '3m': 200000,
  '5m': 200000,
  '15m': 200000,
  '1H': 200000,
  '4H': 200000,
  '1D': 200000,
  '1W': 200000,
  '1M': 200000,
};
const INITIAL_VISIBLE_BARS = {
  '1m': 240,
  '3m': 300,
  '5m': 300,
  '15m': 300,
  '1H': 600,
  '4H': 1000,
  '1D': 365,
  '1W': 260,
  '1M': 180,
};
const VIEW_RANGES = ['Recent', 'Full'];

const hasLivePrice = (item) => (
  ['tradingview', 'stale'].includes(item?.source) && Number(item?.price) > 0
);

function chartHtml(candles, decimals, timeframe, colors, viewRange) {
  const safeDecimals = Math.max(0, Math.min(Number(decimals) || 2, 8));
  const visibleBars = INITIAL_VISIBLE_BARS[timeframe] || 300;
  const showFullRange = viewRange === 'Full';
  const chartColors = {
    background: colors.chartBackground,
    text: colors.chartText,
    grid: colors.chartGrid,
    border: colors.border,
    up: colors.success,
    down: colors.danger,
  };
  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
*{box-sizing:border-box}html,body,#chart{height:100%;width:100%;margin:0;background:${chartColors.background};overflow:hidden}
#empty{display:none;position:absolute;left:0;right:0;top:48%;text-align:center;color:${chartColors.text};font:14px Arial,sans-serif}
</style></head>
<body>
<div id="chart"></div><div id="empty">Waiting for chart data</div>
<script src="https://unpkg.com/lightweight-charts@5/dist/lightweight-charts.standalone.production.js"></script>
<script>
const data = ${JSON.stringify(candles)};
const chart = LightweightCharts.createChart(document.getElementById('chart'), {
  autoSize: true,
  layout: {
    background: { type: 'solid', color: ${JSON.stringify(chartColors.background)} },
    textColor: ${JSON.stringify(chartColors.text)},
    attributionLogo: false
  },
  grid: {
    vertLines: { color: ${JSON.stringify(chartColors.grid)} },
    horzLines: { color: ${JSON.stringify(chartColors.grid)} }
  },
  crosshair: {
    vertLine: { color: ${JSON.stringify(colors.primary)} },
    horzLine: { color: ${JSON.stringify(colors.primary)} }
  },
  rightPriceScale: { borderColor: ${JSON.stringify(chartColors.border)} },
  timeScale: {
    borderColor: ${JSON.stringify(chartColors.border)},
    timeVisible: true,
    secondsVisible: true,
    shiftVisibleRangeOnNewBar: false
  }
});
const series = chart.addSeries(LightweightCharts.CandlestickSeries, {
  upColor: ${JSON.stringify(chartColors.up)},
  downColor: ${JSON.stringify(chartColors.down)},
  wickUpColor: ${JSON.stringify(chartColors.up)},
  wickDownColor: ${JSON.stringify(chartColors.down)},
  borderVisible: false,
  priceFormat: {
    type: 'price',
    precision: ${safeDecimals},
    minMove: ${10 ** -safeDecimals}
  }
});
let lastBar = data.length ? data[data.length - 1] : null;
if (data.length) {
  series.setData(data);
  if (${showFullRange}) {
    chart.timeScale().fitContent();
  } else {
    chart.timeScale().setVisibleLogicalRange({
      from: Math.max(0, data.length - ${visibleBars}),
      to: data.length + 4
    });
  }
} else {
  document.getElementById('empty').style.display = 'block';
}
function applyLiveCandle(candle) {
  if (!candle || !Number.isFinite(Number(candle.time))) return;
  const next = {
    time: Number(candle.time),
    open: Number(candle.open),
    high: Number(candle.high),
    low: Number(candle.low),
    close: Number(candle.close)
  };
  if (!Object.values(next).every(Number.isFinite)) return;
  lastBar = next;
  document.getElementById('empty').style.display = 'none';
  series.update(next);
}
function receiveLiveUpdate(event) {
  let payload = event.data;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch {}
  }
  if (payload && payload.type === 'live-candle') applyLiveCandle(payload.candle);
}
window.addEventListener('message', receiveLiveUpdate);
document.addEventListener('message', receiveLiveUpdate);
</script>
</body></html>`;
}

export default function TradingChart() {
  const { currentSymbol } = useDemoTrading();
  const { colors } = useAppTheme();
  const [timeframe, setTimeframe] = useState('15m');
  const [viewRange, setViewRange] = useState('Recent');
  const [history, setHistory] = useState([]);
  const iframeRef = useRef(null);
  const webViewRef = useRef(null);
  const liveCandleRef = useRef(null);

  useEffect(() => {
    let active = true;
    setHistory([]);
    const limit = viewRange === 'Full'
      ? FULL_HISTORY_LIMITS[timeframe]
      : HISTORY_LIMITS[timeframe];
    marketService.getCandles(currentSymbol.symbol, timeframe, limit)
      .then((candles) => {
        if (active) {
          setHistory(candles);
          liveCandleRef.current = candles?.[candles.length - 1] || null;
        }
      })
      .catch(() => {
        if (active) {
          setHistory([]);
          liveCandleRef.current = null;
        }
      });
    return () => {
      active = false;
    };
  }, [currentSymbol.symbol, timeframe, viewRange]);

  useEffect(() => {
    if (!hasLivePrice(currentSymbol)) return;
    const price = Number(currentSymbol.price);
    const seconds = TIMEFRAME_SECONDS[timeframe] || 900;
    const time = Math.floor(Date.now() / 1000 / seconds) * seconds;
    const previous = liveCandleRef.current;
    const previousIsPreviousBucket = previous && Number(previous.time) >= time - seconds;
    const open = previousIsPreviousBucket ? Number(previous.close) : price;
    const candle = previous && Number(previous.time) === time
      ? {
          ...previous,
          high: Math.max(Number(previous.high), price),
          low: Math.min(Number(previous.low), price),
          close: price,
        }
      : {
          time,
          open,
          high: Math.max(open, price),
          low: Math.min(open, price),
          close: price,
        };

    liveCandleRef.current = candle;
    const message = JSON.stringify({ type: 'live-candle', candle });

    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(message, '*');
      return;
    }

    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(message)} }));
      true;
    `);
  }, [currentSymbol.price, currentSymbol.source, currentSymbol.symbol, timeframe]);

  const candles = useMemo(() => history, [history]);
  const html = useMemo(
    () => chartHtml(candles, currentSymbol.decimals, timeframe, colors, viewRange),
    [candles, currentSymbol.decimals, timeframe, colors, viewRange],
  );
  const positive = Number(currentSymbol.change) >= 0;

  return (
    <View className="min-h-[430px] flex-1 overflow-hidden rounded-2xl border" style={{ backgroundColor: colors.chartBackground, borderColor: colors.border }}>
      <View className="flex-row items-center border-b px-4 py-3" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
        <Text className="mr-5 text-lg font-bold" style={{ color: colors.text }}>{currentSymbol.symbol}</Text>
        <Text className={positive ? 'text-success' : 'text-danger'}>
          {quote(currentSymbol.price, currentSymbol.decimals)}  {percent(currentSymbol.change)}
        </Text>
        <Text className="ml-3 text-xs" style={{ color: colors.muted }}>Spread {quote(currentSymbol.spread, currentSymbol.decimals)}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="ml-auto"
          contentContainerStyle={{ alignItems: 'center', flexDirection: 'row' }}
        >
          {TIMEFRAMES.map((entry) => (
            <Pressable
              key={entry}
              onPress={() => setTimeframe(entry)}
              className="ml-1 rounded-md px-3 py-2"
              style={{ backgroundColor: entry === timeframe ? colors.primary : 'transparent' }}
            >
              <Text className={entry === timeframe ? 'font-bold text-white' : ''} style={{ color: entry === timeframe ? '#ffffff' : colors.muted }}>{entry}</Text>
            </Pressable>
          ))}
          <View className="mx-2 h-5 w-px" style={{ backgroundColor: colors.border }} />
          {VIEW_RANGES.map((entry) => (
            <Pressable
              key={entry}
              onPress={() => setViewRange(entry)}
              className="ml-1 rounded-md px-3 py-2"
              style={{ backgroundColor: entry === viewRange ? colors.primary : 'transparent' }}
            >
              <Text className={entry === viewRange ? 'font-bold text-white' : ''} style={{ color: entry === viewRange ? '#ffffff' : colors.muted }}>{entry}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View className="flex-1">
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            title="Market chart"
            srcDoc={html}
            style={{ width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            domStorageEnabled
            javaScriptEnabled
            source={{ html }}
            style={{ backgroundColor: colors.chartBackground }}
          />
        )}
      </View>
    </View>
  );
}
