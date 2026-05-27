import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { marketService } from '../../services/marketService';
import { percent, quote } from '../../utils/formatters';

const TIMEFRAMES = ['1s', '1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M'];
const TIMEFRAME_SECONDS = {
  '1s': 1,
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1H': 3600,
  '4H': 14400,
  '1D': 86400,
  '1W': 604800,
  '1M': 2592000,
};
const HISTORY_LIMITS = {
  '1s': 0,
  '1m': 1000,
  '5m': 1500,
  '15m': 2000,
  '30m': 2500,
  '1H': 3000,
  '4H': 5000,
  '1D': 5000,
  '1W': 5000,
  '1M': 5000,
};
const INITIAL_VISIBLE_BARS = {
  '1s': 120,
  '1m': 240,
  '5m': 300,
  '15m': 300,
  '30m': 400,
  '1H': 600,
  '4H': 1000,
  '1D': 365,
  '1W': 260,
  '1M': 180,
};

const hasLivePrice = (item) => (
  ['tradingview', 'stale'].includes(item?.source) && Number(item?.price) > 0
);

function chartHtml(candles, decimals, timeframe) {
  const safeDecimals = Math.max(0, Math.min(Number(decimals) || 2, 8));
  const visibleBars = INITIAL_VISIBLE_BARS[timeframe] || 300;
  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
*{box-sizing:border-box}html,body,#chart{height:100%;width:100%;margin:0;background:#080f20;overflow:hidden}
#empty{display:none;position:absolute;left:0;right:0;top:48%;text-align:center;color:#8190ad;font:14px Arial,sans-serif}
</style></head>
<body>
<div id="chart"></div><div id="empty">Waiting for chart data</div>
<script src="https://unpkg.com/lightweight-charts@5/dist/lightweight-charts.standalone.production.js"></script>
<script>
const data = ${JSON.stringify(candles)};
const chart = LightweightCharts.createChart(document.getElementById('chart'), {
  autoSize: true,
  layout: {
    background: { type: 'solid', color: '#080f20' },
    textColor: '#8fa0bf',
    attributionLogo: false
  },
  grid: {
    vertLines: { color: 'rgba(42,54,82,.45)' },
    horzLines: { color: 'rgba(42,54,82,.45)' }
  },
  crosshair: {
    vertLine: { color: '#556581' },
    horzLine: { color: '#556581' }
  },
  rightPriceScale: { borderColor: '#263450' },
  timeScale: {
    borderColor: '#263450',
    timeVisible: true,
    secondsVisible: true,
    shiftVisibleRangeOnNewBar: false
  }
});
const series = chart.addSeries(LightweightCharts.CandlestickSeries, {
  upColor: '#10c983',
  downColor: '#ef4858',
  wickUpColor: '#10c983',
  wickDownColor: '#ef4858',
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
  chart.timeScale().setVisibleLogicalRange({
    from: Math.max(0, data.length - ${visibleBars}),
    to: data.length + 4
  });
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
  const [timeframe, setTimeframe] = useState('15m');
  const [history, setHistory] = useState([]);
  const iframeRef = useRef(null);
  const webViewRef = useRef(null);
  const liveCandleRef = useRef(null);

  useEffect(() => {
    let active = true;
    setHistory([]);
    marketService.getCandles(currentSymbol.symbol, timeframe, HISTORY_LIMITS[timeframe])
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
  }, [currentSymbol.symbol, timeframe]);

  useEffect(() => {
    if (!hasLivePrice(currentSymbol)) return;
    const price = Number(currentSymbol.price);
    const seconds = TIMEFRAME_SECONDS[timeframe] || 900;
    const time = Math.floor(Date.now() / 1000 / seconds) * seconds;
    const previous = liveCandleRef.current;
    const candle = previous && Number(previous.time) === time
      ? {
          ...previous,
          high: Math.max(Number(previous.high), price),
          low: Math.min(Number(previous.low), price),
          close: price,
        }
      : {
          time,
          open: previous ? Number(previous.close) : price,
          high: Math.max(previous ? Number(previous.close) : price, price),
          low: Math.min(previous ? Number(previous.close) : price, price),
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
    () => chartHtml(candles, currentSymbol.decimals, timeframe),
    [candles, currentSymbol.decimals, timeframe],
  );
  const positive = Number(currentSymbol.change) >= 0;

  return (
    <View className="min-h-[430px] flex-1 overflow-hidden rounded-2xl border border-border bg-[#080f20]">
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <Text className="mr-5 text-lg font-bold text-white">{currentSymbol.symbol}</Text>
        <Text className={positive ? 'text-success' : 'text-danger'}>
          {quote(currentSymbol.price, currentSymbol.decimals)}  {percent(currentSymbol.change)}
        </Text>
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
              onPress={() => setTimeframe(entry)}
              className={`ml-1 rounded-md px-3 py-2 ${entry === timeframe ? 'bg-primary' : ''}`}
            >
              <Text className={entry === timeframe ? 'font-bold text-white' : 'text-muted'}>{entry}</Text>
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
            style={{ backgroundColor: '#080f20' }}
          />
        )}
      </View>
    </View>
  );
}
