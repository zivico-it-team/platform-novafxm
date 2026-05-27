import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { marketService } from '../../services/marketService';
import { percent, quote } from '../../utils/formatters';

const TIMEFRAMES = ['1s', '1m', '5m', '15m', '30m', '1H', '4H', '1D'];
const TIMEFRAME_SECONDS = {
  '1s': 1,
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1H': 3600,
  '4H': 14400,
  '1D': 86400,
};

const hasLivePrice = (item) => (
  ['tradingview', 'stale'].includes(item?.source) && Number(item?.price) > 0
);

function withLatestPrice(history, currentSymbol, timeframe) {
  const data = Array.isArray(history) ? [...history] : [];
  if (!hasLivePrice(currentSymbol)) return data;

  const price = Number(currentSymbol.price);
  const seconds = TIMEFRAME_SECONDS[timeframe] || 900;
  const time = Math.floor(Date.now() / 1000 / seconds) * seconds;
  const last = data[data.length - 1];
  if (last && last.time > time) return data;

  if (last && last.time === time) {
    data[data.length - 1] = {
      ...last,
      high: Math.max(last.high, price),
      low: Math.min(last.low, price),
      close: price,
    };
    return data;
  }

  data.push({ time, open: price, high: price, low: price, close: price });
  return data;
}

function chartHtml(candles, decimals) {
  const safeDecimals = Math.max(0, Math.min(Number(decimals) || 2, 8));
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
  timeScale: { borderColor: '#263450', timeVisible: true, secondsVisible: true }
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
if (data.length) {
  series.setData(data);
  chart.timeScale().fitContent();
} else {
  document.getElementById('empty').style.display = 'block';
}
</script>
</body></html>`;
}

export default function TradingChart() {
  const { currentSymbol } = useDemoTrading();
  const [timeframe, setTimeframe] = useState('15m');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let active = true;
    setHistory([]);
    marketService.getCandles(currentSymbol.symbol, timeframe)
      .then((candles) => {
        if (active) setHistory(candles);
      })
      .catch(() => {
        if (active) setHistory([]);
      });
    return () => {
      active = false;
    };
  }, [currentSymbol.symbol, timeframe]);

  useEffect(() => {
    if (!hasLivePrice(currentSymbol)) return;
    setHistory((candles) => withLatestPrice(candles, currentSymbol, timeframe).slice(-500));
  }, [currentSymbol.price, currentSymbol.source, currentSymbol.symbol, timeframe]);

  const candles = useMemo(
    () => withLatestPrice(history, currentSymbol, timeframe),
    [history, currentSymbol, timeframe],
  );
  const html = useMemo(() => chartHtml(candles, currentSymbol.decimals), [candles, currentSymbol.decimals]);
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
            title="Market chart"
            srcDoc={html}
            style={{ width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <WebView
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
