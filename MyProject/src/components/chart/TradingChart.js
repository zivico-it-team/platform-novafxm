import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  Activity,
  BarChart3,
  CandlestickChart,
  ChevronDown,
  LineChart,
  Minus,
  Mountain,
  Plus,
  ScatterChart,
  Settings,
  Trash2,
  TrendingUp,
} from 'lucide-react-native';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { marketService } from '../../services/marketService';
import { percent, quote } from '../../utils/formatters';
import { useAppTheme } from '../../context/ThemeContext';

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
const CHART_TYPES = [
  ['combo', 'Combochart', CandlestickChart],
  ['candles', 'Candlestick', CandlestickChart],
  ['bar', 'Bar', BarChart3],
  ['line', 'Line', TrendingUp],
  ['area', 'Area', Mountain],
  ['hollow', 'Hollow', CandlestickChart],
  ['histogram', 'Histogram', BarChart3],
  ['baseline', 'Baseline', Activity],
  ['trend', 'Trend', LineChart],
  ['scatter', 'Scatter Plot', ScatterChart],
];
const INDICATOR_TOOLS = [
  ['atr', 'AVERAGE TRUE RANGE'],
  ['awesome', 'AWESOME OSCILLATOR'],
  ['bb', 'BOLLINGER BANDS'],
  ['cci', 'COMMODITY CHANNEL'],
  ['ichimoku', 'ICHIMOKU CLOUD'],
  ['macd', 'MACD'],
  ['momentum', 'MOMENTUM'],
  ['sar', 'PARABOLIC SAR'],
  ['rsi', 'RSI'],
  ['roc', 'RATE OF CHANGE'],
];
const GRAPH_SETTINGS = [
  ['askLine', 'Display ask line'],
  ['positionLine', 'Display position line'],
  ['takeProfitLine', 'Display take profit line'],
  ['stopLossLine', 'Display stop loss line'],
  ['positionLabels', 'Display position line labels'],
  ['customBidAsk', 'Custom bid/ask lines'],
];
const DRAWING_TOOLS = [
  ['horizontal', 'Horizontal Line'],
  ['trend', 'Trend Line'],
  ['fibonacci', 'Fibonacci Retracement'],
  ['clear', 'Clear All Drawings'],
];
const hasLivePrice = (item) => (
  ['tradingview', 'stale'].includes(item?.source) && Number(item?.price) > 0
);

const chartUiFromTheme = (colors) => ({
  background: colors.chartBackground,
  toolbar: colors.background,
  control: colors.panel,
  controlActive: colors.primary,
  border: colors.border,
  menu: colors.panel,
  menuBorder: colors.border,
  panel: colors.panel,
  muted: colors.muted,
  text: colors.text,
  accent: colors.primary,
  activeText: '#0B0B0B',
  success: colors.success,
  danger: colors.danger,
  grid: colors.chartGrid,
  soft: colors.primarySoft,
});

function IconButton({ active, children, onPress, ui, size = 32 }) {
  const backgroundColor = active ? ui.controlActive : ui.control;
  const borderColor = active ? ui.controlActive : ui.border;

  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center rounded border"
      style={{ width: size, height: size, backgroundColor, borderColor }}
    >
      {children}
    </Pressable>
  );
}

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

function chartHtml(candles, decimals, timeframe, chartType, tools, drawings, ui) {
  const safeDecimals = Math.max(0, Math.min(Number(decimals) || 2, 8));
  const visibleBars = INITIAL_VISIBLE_BARS[timeframe] || 300;
  const chartColors = {
    background: ui.background,
    text: ui.text,
    grid: ui.grid,
    border: ui.border,
    up: ui.success,
    down: ui.danger,
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
let data = ${JSON.stringify(candles)};
const chartType = ${JSON.stringify(chartType)};
const tools = ${JSON.stringify(tools)};
const drawings = ${JSON.stringify(drawings)};
const priceOptions = {
  type: 'price',
  precision: ${safeDecimals},
  minMove: ${10 ** -safeDecimals}
};
const chart = LightweightCharts.createChart(document.getElementById('chart'), {
  autoSize: true,
  layout: {
    background: { type: 'solid', color: ${JSON.stringify(chartColors.background)} },
    textColor: ${JSON.stringify(chartColors.text)},
    attributionLogo: false
  },
  grid: {
    vertLines: { color: tools.grid ? ${JSON.stringify(chartColors.grid)} : 'transparent' },
    horzLines: { color: tools.grid ? ${JSON.stringify(chartColors.grid)} : 'transparent' }
  },
  crosshair: {
    mode: tools.crosshair ? LightweightCharts.CrosshairMode.Normal : LightweightCharts.CrosshairMode.Hidden,
    vertLine: { color: ${JSON.stringify(ui.accent)} },
    horzLine: { color: ${JSON.stringify(ui.accent)} }
  },
  rightPriceScale: { borderColor: ${JSON.stringify(chartColors.border)} },
  timeScale: {
    borderColor: ${JSON.stringify(chartColors.border)},
    timeVisible: true,
    secondsVisible: true,
    shiftVisibleRangeOnNewBar: false
  }
});
const closeData = (items) => items.map((item) => ({ time: Number(item.time), value: Number(item.close) })).filter((item) => Number.isFinite(item.time) && Number.isFinite(item.value));
const histogramData = (items) => items.map((item) => ({
  time: Number(item.time),
  value: Number(item.close),
  color: Number(item.close) >= Number(item.open) ? 'rgba(18, 207, 122, .68)' : 'rgba(242, 77, 88, .68)'
})).filter((item) => Number.isFinite(item.time) && Number.isFinite(item.value));
const mainSeriesOptions = {
  color: ${JSON.stringify(ui.accent)},
  lineColor: ${JSON.stringify(ui.accent)},
  lineWidth: chartType === 'scatter' ? 0 : 2,
  pointMarkersVisible: chartType === 'scatter',
  pointMarkersRadius: chartType === 'scatter' ? 4 : undefined,
  baseValue: { type: 'price', price: Number(data[data.length - 1]?.close || 0) },
  baseLineColor: ${JSON.stringify(ui.accent)},
  topLineColor: ${JSON.stringify(ui.success)},
  bottomLineColor: ${JSON.stringify(ui.danger)},
  topFillColor1: 'rgba(18, 207, 122, .28)',
  topFillColor2: 'rgba(18, 207, 122, .04)',
  bottomFillColor1: 'rgba(242, 77, 88, .04)',
  bottomFillColor2: 'rgba(242, 77, 88, .26)',
  topColor: 'rgba(212, 175, 55, .42)',
  bottomColor: 'rgba(212, 175, 55, 0)',
  upColor: chartType === 'hollow' ? 'rgba(0, 0, 0, 0)' : ${JSON.stringify(chartColors.up)},
  downColor: ${JSON.stringify(chartColors.down)},
  borderUpColor: ${JSON.stringify(chartColors.up)},
  borderDownColor: ${JSON.stringify(chartColors.down)},
  wickUpColor: ${JSON.stringify(chartColors.up)},
  wickDownColor: ${JSON.stringify(chartColors.down)},
  borderVisible: chartType !== 'hollow',
  lastValueVisible: tools.priceLine,
  priceLineVisible: tools.priceLine,
  priceFormat: priceOptions
};
const seriesType = (() => {
  if (chartType === 'line' || chartType === 'trend' || chartType === 'scatter') return LightweightCharts.LineSeries;
  if (chartType === 'area') return LightweightCharts.AreaSeries;
  if (chartType === 'bar') return LightweightCharts.BarSeries;
  if (chartType === 'histogram') return LightweightCharts.HistogramSeries;
  if (chartType === 'baseline') return LightweightCharts.BaselineSeries;
  return LightweightCharts.CandlestickSeries;
})();
const series = chart.addSeries(seriesType, mainSeriesOptions);
const indicatorSeries = [];
const setMainData = () => {
  if (chartType === 'candles' || chartType === 'combo' || chartType === 'bar' || chartType === 'hollow') {
    series.setData(data);
    return;
  }
  if (chartType === 'histogram') {
    series.setData(histogramData(data));
    return;
  }
  series.setData(closeData(data));
};
function movingAverage(items, period) {
  const output = [];
  for (let index = period - 1; index < items.length; index += 1) {
    const slice = items.slice(index - period + 1, index + 1);
    const value = slice.reduce((sum, item) => sum + Number(item.close), 0) / period;
    output.push({ time: Number(items[index].time), value });
  }
  return output;
}
function exponentialAverage(items, period) {
  const output = [];
  const multiplier = 2 / (period + 1);
  let ema = Number(items[0]?.close || 0);
  items.forEach((item, index) => {
    const close = Number(item.close);
    ema = index === 0 ? close : close * multiplier + ema * (1 - multiplier);
    if (index >= period - 1) output.push({ time: Number(item.time), value: ema });
  });
  return output;
}
function bollingerBands(items, period) {
  const upper = [];
  const middle = [];
  const lower = [];
  for (let index = period - 1; index < items.length; index += 1) {
    const slice = items.slice(index - period + 1, index + 1).map((item) => Number(item.close));
    const mean = slice.reduce((sum, value) => sum + value, 0) / period;
    const variance = slice.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / period;
    const deviation = Math.sqrt(variance);
    const time = Number(items[index].time);
    middle.push({ time, value: mean });
    upper.push({ time, value: mean + deviation * 2 });
    lower.push({ time, value: mean - deviation * 2 });
  }
  return { upper, middle, lower };
}
function averageTrueRange(items, period) {
  const output = [];
  const ranges = items.map((item, index) => {
    const high = Number(item.high);
    const low = Number(item.low);
    const previousClose = Number(items[index - 1]?.close ?? item.close);
    return Math.max(high - low, Math.abs(high - previousClose), Math.abs(low - previousClose));
  });
  for (let index = period - 1; index < ranges.length; index += 1) {
    const slice = ranges.slice(index - period + 1, index + 1);
    output.push({
      time: Number(items[index].time),
      value: slice.reduce((sum, value) => sum + value, 0) / period
    });
  }
  return output;
}
function rateOfChange(items, period) {
  const output = [];
  for (let index = period; index < items.length; index += 1) {
    const previous = Number(items[index - period].close);
    const current = Number(items[index].close);
    if (previous) output.push({ time: Number(items[index].time), value: current + ((current - previous) / previous) * current * .05 });
  }
  return output;
}
function momentumLine(items, period) {
  const output = [];
  for (let index = period; index < items.length; index += 1) {
    const current = Number(items[index].close);
    const previous = Number(items[index - period].close);
    output.push({ time: Number(items[index].time), value: current + (current - previous) * .35 });
  }
  return output;
}
function addLine(dataSet, color, width = 1) {
  const line = chart.addSeries(LightweightCharts.LineSeries, {
    color,
    lineWidth: width,
    priceLineVisible: false,
    lastValueVisible: false,
    priceFormat: priceOptions
  });
  line.setData(dataSet);
  indicatorSeries.push({ line, dataSet });
}
function renderIndicators() {
  if (!data.length) return;
  if (chartType === 'combo') addLine(closeData(data), ${JSON.stringify(ui.accent)}, 1);
  if (tools.atr) addLine(averageTrueRange(data, Number(tools.atrPeriod || 14)), ${JSON.stringify(ui.accent)}, 2);
  if (tools.awesome) addLine(momentumLine(data, 5), '#4fc3f7', 2);
  if (tools.sma20) addLine(movingAverage(data, 20), ${JSON.stringify(ui.accent)}, 2);
  if (tools.ema50) addLine(exponentialAverage(data, 50), '#4fc3f7', 2);
  if (tools.bollinger || tools.bb) {
    const bands = bollingerBands(data, 20);
    addLine(bands.upper, 'rgba(212, 175, 55, .78)');
    addLine(bands.middle, 'rgba(255, 255, 255, .42)');
    addLine(bands.lower, 'rgba(212, 175, 55, .78)');
  }
  if (tools.cci) addLine(momentumLine(data, 20), '#ffb84d', 1);
  if (tools.ichimoku) {
    addLine(movingAverage(data, 9), '#4fc3f7', 1);
    addLine(movingAverage(data, 26), '#f24d58', 1);
  }
  if (tools.macd) {
    addLine(exponentialAverage(data, 12), '#4fc3f7', 1);
    addLine(exponentialAverage(data, 26), '#f24d58', 1);
  }
  if (tools.momentum) addLine(momentumLine(data, 10), '#12cf7a', 2);
  if (tools.sar) addLine(movingAverage(data, 5), '#ffffff', 1);
  if (tools.rsi) addLine(rateOfChange(data, 14), '#b58cff', 2);
  if (tools.roc) addLine(rateOfChange(data, 12), '#ffb84d', 2);
  if (tools.volume && data.some((item) => Number(item.volume) > 0)) {
    const volume = chart.addSeries(LightweightCharts.HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      color: 'rgba(212, 175, 55, .35)',
      lastValueVisible: false,
      priceLineVisible: false
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: .78, bottom: 0 } });
    volume.setData(data.map((item) => ({
      time: Number(item.time),
      value: Number(item.volume || 0),
      color: Number(item.close) >= Number(item.open) ? 'rgba(18, 207, 122, .35)' : 'rgba(242, 77, 88, .35)'
    })));
  }
}
function renderDrawings() {
  if (!data.length || !drawings.length) return;
  const last = data[data.length - 1];
  const recent = data.slice(Math.max(0, data.length - 36));
  const high = Math.max(...recent.map((item) => Number(item.high)));
  const low = Math.min(...recent.map((item) => Number(item.low)));
  drawings.forEach((drawing, drawingIndex) => {
    if (drawing.type === 'horizontal') {
      series.createPriceLine({
        price: Number(last.close),
        color: ${JSON.stringify(ui.accent)},
        lineWidth: 1,
        lineStyle: LightweightCharts.LineStyle.Solid,
        axisLabelVisible: true,
        title: 'Horizontal'
      });
    }
    if (drawing.type === 'trend' && recent.length > 1) {
      addLine([
        { time: Number(recent[0].time), value: Number(recent[0].low) },
        { time: Number(recent[recent.length - 1].time), value: Number(recent[recent.length - 1].high) }
      ], ${JSON.stringify(ui.accent)}, 2);
    }
    if (drawing.type === 'fibonacci' && Number.isFinite(high) && Number.isFinite(low)) {
      [0, .236, .382, .5, .618, 1].forEach((level) => {
        series.createPriceLine({
          price: high - ((high - low) * level),
          color: level === 0 || level === 1 ? ${JSON.stringify(ui.accent)} : 'rgba(212, 175, 55, .58)',
          lineWidth: 1,
          lineStyle: LightweightCharts.LineStyle.Dashed,
          axisLabelVisible: false,
          title: drawingIndex === 0 ? 'Fib' : ''
        });
      });
    }
  });
}
function renderGraphSettings() {
  if (!data.length) return;
  const last = data[data.length - 1];
  const close = Number(last.close);
  const high = Number(last.high);
  const low = Number(last.low);
  const range = Math.max(Math.abs(high - low), Math.abs(close) * .00025);
  const addPriceLine = (enabled, price, color, title) => {
    if (!enabled || !Number.isFinite(price)) return;
    series.createPriceLine({
      price,
      color,
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      axisLabelVisible: Boolean(tools.positionLabels),
      title: tools.positionLabels ? title : ''
    });
  };
  addPriceLine(tools.askLine, close + range * .6, ${JSON.stringify(ui.accent)}, 'ASK');
  addPriceLine(tools.positionLine, close, '#4fc3f7', 'POS');
  addPriceLine(tools.takeProfitLine, close + range * 2, ${JSON.stringify(ui.success)}, 'TP');
  addPriceLine(tools.stopLossLine, close - range * 2, ${JSON.stringify(ui.danger)}, 'SL');
  addPriceLine(tools.customBidAsk, close - range * .6, '#ffffff', 'BID');
}
let lastBar = data.length ? data[data.length - 1] : null;
if (data.length) {
  setMainData();
  renderIndicators();
  renderDrawings();
  renderGraphSettings();
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
  const index = data.findIndex((item) => Number(item.time) === Number(next.time));
  if (index >= 0) data[index] = next;
  else data.push(next);
  document.getElementById('empty').style.display = 'none';
  if (chartType === 'candles' || chartType === 'combo' || chartType === 'bar' || chartType === 'hollow') {
    series.update(next);
  } else if (chartType === 'histogram') {
    series.update({
      time: next.time,
      value: next.close,
      color: next.close >= next.open ? 'rgba(18, 207, 122, .68)' : 'rgba(242, 77, 88, .68)'
    });
  } else {
    series.update({ time: next.time, value: next.close });
  }
}
function receiveLiveUpdate(event) {
  let payload = event.data;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch {}
  }
  if (payload && payload.type === 'live-candle') applyLiveCandle(payload.candle);
  if (payload && payload.type === 'reset-view') chart.timeScale().fitContent();
}
window.addEventListener('message', receiveLiveUpdate);
document.addEventListener('message', receiveLiveUpdate);
</script>
</body></html>`;
}

export default function TradingChart() {
  const { currentSymbol, prices, setSelectedSymbol } = useDemoTrading();
  const { colors } = useAppTheme();
  const { height, width } = useWindowDimensions();
  const compactToolbar = width < 640;
  const mobile = width < 760;
  const iconButtonSize = compactToolbar ? 26 : 32;
  const toolbarMenuTop = mobile ? 126 : compactToolbar ? 58 : 68;
  const timeframeHeight = compactToolbar ? 22 : 24;
  const timeframeMinWidth = compactToolbar ? 27 : 32;
  const chartMinHeight = mobile ? Math.min(Math.max(Math.round(height * 0.62), 500), 620) : compactToolbar ? 430 : 520;
  const [timeframe, setTimeframe] = useState('15m');
  const [chartType, setChartType] = useState('candles');
  const [chartMenuOpen, setChartMenuOpen] = useState(false);
  const [symbolMenuOpen, setSymbolMenuOpen] = useState(false);
  const [indicatorOpen, setIndicatorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawingOpen, setDrawingOpen] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [activeIndicator, setActiveIndicator] = useState('atr');
  const [tools, setTools] = useState({
    atr: false,
    atrPeriod: 14,
    awesome: false,
    bb: false,
    cci: false,
    ichimoku: false,
    macd: false,
    momentum: false,
    sar: false,
    rsi: false,
    roc: false,
    sma20: false,
    ema50: false,
    bollinger: false,
    volume: false,
    grid: true,
    crosshair: true,
    priceLine: true,
    askLine: false,
    positionLine: true,
    takeProfitLine: true,
    stopLossLine: true,
    positionLabels: true,
    customBidAsk: true,
  });
  const [history, setHistory] = useState([]);
  const [priceDirection, setPriceDirection] = useState(0);
  const iframeRef = useRef(null);
  const webViewRef = useRef(null);
  const liveCandleRef = useRef(null);
  const previousPriceRef = useRef(null);

  useEffect(() => {
    let active = true;
    setHistory([]);
    previousPriceRef.current = null;
    setPriceDirection(0);
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
    const price = Number(currentSymbol.price);
    if (!Number.isFinite(price) || price <= 0) return;

    const previousPrice = previousPriceRef.current;
    if (Number.isFinite(previousPrice)) {
      if (price > previousPrice) setPriceDirection(1);
      if (price < previousPrice) setPriceDirection(-1);
    }
    previousPriceRef.current = price;
  }, [currentSymbol.price, currentSymbol.symbol]);

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
  const ui = useMemo(() => chartUiFromTheme(colors), [colors]);
  const html = useMemo(
    () => chartHtml(candles, currentSymbol.decimals, timeframe, chartType, tools, drawings, ui),
    [candles, currentSymbol.decimals, timeframe, chartType, tools, drawings, ui],
  );
  const chartRenderKey = JSON.stringify({
    symbol: currentSymbol.symbol,
    timeframe,
    chartType,
    drawings: drawings.length,
    tools,
  });
  const positive = priceDirection ? priceDirection > 0 : Number(currentSymbol.change) >= 0;
  const priceTone = positive ? ui.success : ui.danger;
  const mobileStats = [
    ['Change', percent(currentSymbol.change), priceTone],
    ['Bid', quote(currentSymbol.bid, currentSymbol.decimals), ui.danger],
    ['Ask', quote(currentSymbol.ask, currentSymbol.decimals), ui.success],
    ['Spread', quote(currentSymbol.spread, currentSymbol.decimals), ui.muted],
  ];
  const toggleTool = (key) => setTools((current) => ({ ...current, [key]: !current[key] }));
  const setAtrPeriod = (period) => setTools((current) => ({ ...current, atrPeriod: Math.max(1, period) }));
  const toggleChartMenu = () => {
    setChartMenuOpen((value) => !value);
    setSymbolMenuOpen(false);
    setIndicatorOpen(false);
    setSettingsOpen(false);
    setDrawingOpen(false);
  };
  const toggleSymbolMenu = () => {
    setSymbolMenuOpen((value) => !value);
    setChartMenuOpen(false);
    setIndicatorOpen(false);
    setSettingsOpen(false);
    setDrawingOpen(false);
  };
  const toggleIndicatorMenu = () => {
    setIndicatorOpen((value) => !value);
    setSymbolMenuOpen(false);
    setChartMenuOpen(false);
    setSettingsOpen(false);
    setDrawingOpen(false);
  };
  const toggleSettingsMenu = () => {
    setSettingsOpen((value) => !value);
    setSymbolMenuOpen(false);
    setChartMenuOpen(false);
    setIndicatorOpen(false);
    setDrawingOpen(false);
  };
  const toggleDrawingMenu = () => {
    setDrawingOpen((value) => !value);
    setSymbolMenuOpen(false);
    setChartMenuOpen(false);
    setIndicatorOpen(false);
    setSettingsOpen(false);
  };
  const selectSymbol = (symbol) => {
    setSelectedSymbol(symbol);
    setSymbolMenuOpen(false);
  };
  const applyDrawingTool = (key) => {
    if (key === 'clear') {
      setDrawings([]);
    } else {
      setDrawings((current) => [...current, { id: Date.now(), type: key }]);
    }
    setDrawingOpen(false);
  };
  const applyIndicatorTool = (key) => {
    setActiveIndicator(key);
    if (key === 'atr') return;
    setTools((current) => ({
      ...current,
      [key]: true,
      bollinger: key === 'bb' ? true : current.bollinger,
      volume: key === 'awesome' ? true : current.volume,
    }));
    setIndicatorOpen(false);
  };
  const resetView = () => {
    const message = JSON.stringify({ type: 'reset-view' });
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(message, '*');
      return;
    }
    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(message)} }));
      true;
    `);
  };

  return (
    <View className="relative flex-1 overflow-hidden border" style={{ minHeight: chartMinHeight, backgroundColor: ui.background, borderColor: ui.border }}>
      <View className="relative border-b px-2 py-1.5 sm:px-3" style={{ backgroundColor: ui.toolbar, borderColor: ui.border, zIndex: 1000, elevation: 1000 }}>
        {mobile ? (
          <View className="px-0.5 pt-0.5">
            <View className="flex-row items-center justify-between">
              <Pressable onPress={toggleSymbolMenu} className="min-w-0 flex-row items-center">
                <Text className="max-w-[150px] text-[17px] font-extrabold" numberOfLines={1} style={{ color: ui.text }}>{currentSymbol.symbol}</Text>
                <ChevronDown size={15} color={symbolMenuOpen ? ui.accent : ui.muted} strokeWidth={2.4} />
              </Pressable>
              <View className="flex-row items-center">
                <View className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: priceTone }} />
                <Text className="text-[10px] font-bold" style={{ color: ui.muted }}>Live</Text>
              </View>
            </View>

            <View className="mt-1.5 flex-row items-end justify-between">
              <Text className="text-[32px] font-extrabold" numberOfLines={1} style={{ color: priceTone }}>{quote(currentSymbol.price, currentSymbol.decimals)}</Text>
              <View className="items-end pb-1.5">
                <Text className="text-[15px] font-extrabold" numberOfLines={1} style={{ color: priceTone }}>{percent(currentSymbol.change)}</Text>
                <Text className="text-[9px] font-bold uppercase" numberOfLines={1} style={{ color: ui.muted }}>24h change</Text>
              </View>
            </View>

            <View className="mt-1.5 flex-row items-center justify-between border-b pb-2.5" style={{ borderColor: ui.border }}>
              {mobileStats.map(([label, value, color], index) => (
                <View key={label} className="min-w-0 flex-1" style={{ borderColor: 'rgba(132, 142, 156, .24)', borderRightWidth: index === mobileStats.length - 1 ? 0 : 1, paddingLeft: index === 0 ? 0 : 8, paddingRight: index === mobileStats.length - 1 ? 0 : 8 }}>
                  <Text className="text-[9px] font-bold uppercase" numberOfLines={1} style={{ color: ui.muted, textAlign: index === 0 ? 'left' : 'right' }}>{label}</Text>
                  <Text className="text-[11px] font-extrabold" numberOfLines={1} style={{ color, textAlign: index === 0 ? 'left' : 'right' }}>{value}</Text>
                </View>
              ))}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-1.5"
              contentContainerStyle={{ alignItems: 'center', columnGap: 3, paddingRight: 6 }}
            >
              {TIMEFRAMES.map((entry) => (
                <Pressable
                  key={entry}
                  onPress={() => setTimeframe(entry)}
                  className="items-center justify-center border-b-2"
                  style={{ height: 26, minWidth: 32, paddingHorizontal: 7, backgroundColor: 'transparent', borderColor: entry === timeframe ? ui.controlActive : 'transparent' }}
                >
                  <Text className="font-extrabold" style={{ color: entry === timeframe ? ui.text : ui.muted, fontSize: 11 }}>{entry}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View className="mt-1.5 flex-row items-center justify-end" style={{ columnGap: 4 }}>
              <IconButton active={chartMenuOpen} ui={ui} size={iconButtonSize} onPress={toggleChartMenu}>
                <BarChart3 size={14} color={chartMenuOpen ? ui.activeText : ui.text} />
              </IconButton>
              <IconButton active={indicatorOpen} ui={ui} size={iconButtonSize} onPress={toggleIndicatorMenu}>
                <Text className="font-extrabold" style={{ color: indicatorOpen ? ui.activeText : ui.text, fontSize: 10 }}>f(x)</Text>
              </IconButton>
              <IconButton active={settingsOpen} ui={ui} size={iconButtonSize} onPress={toggleSettingsMenu}>
                <Settings size={14} color={settingsOpen ? ui.activeText : ui.text} />
              </IconButton>
              <IconButton active={drawingOpen} ui={ui} size={iconButtonSize} onPress={toggleDrawingMenu}>
                <View className="h-5 w-5 items-center justify-center">
                  <View
                    className="rounded-full"
                    style={{
                      width: 18,
                      height: 2,
                      backgroundColor: drawingOpen ? ui.activeText : ui.text,
                      transform: [{ rotate: '-45deg' }],
                    }}
                  />
                </View>
              </IconButton>
            </View>
          </View>
        ) : (
          <>
            <View className="flex-row flex-wrap items-center" style={{ columnGap: compactToolbar ? 6 : 10, rowGap: 3 }}>
              <View className="flex-row items-center gap-1.5 sm:gap-2" style={{ height: compactToolbar ? 24 : 28 }}>
                <Text className="font-extrabold" style={{ color: ui.text, fontSize: compactToolbar ? 12 : 14 }}>{currentSymbol.symbol}</Text>
                <ChevronDown size={13} color={ui.muted} strokeWidth={2.4} />
                <Text className="font-bold" style={{ color: priceTone, fontSize: compactToolbar ? 12 : 14 }}>{quote(currentSymbol.price, currentSymbol.decimals)}</Text>
                <Text className="font-bold" style={{ color: priceTone, fontSize: compactToolbar ? 10 : 12 }}>{percent(currentSymbol.change)}</Text>
                <Text className="text-[10px]" style={{ color: ui.muted }}>Spread: {quote(currentSymbol.spread, currentSymbol.decimals)}</Text>
              </View>
              <View className="flex-row flex-wrap items-center" style={{ columnGap: 1, rowGap: 1, minHeight: compactToolbar ? 22 : 28 }}>
                {TIMEFRAMES.map((entry) => (
                  <Pressable
                    key={entry}
                    onPress={() => setTimeframe(entry)}
                    className="items-center justify-center rounded"
                    style={{ height: timeframeHeight, minWidth: timeframeMinWidth, paddingHorizontal: compactToolbar ? 5 : 8, backgroundColor: entry === timeframe ? ui.controlActive : 'transparent' }}
                  >
                    <Text className="font-bold" style={{ color: entry === timeframe ? ui.activeText : ui.muted, fontSize: compactToolbar ? 10 : 12 }}>{entry}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View className="mt-1 flex-row flex-wrap items-center" style={{ columnGap: compactToolbar ? 3 : 4, rowGap: 3 }}>
                <IconButton active={chartMenuOpen} ui={ui} size={iconButtonSize} onPress={toggleChartMenu}>
                  <BarChart3 size={compactToolbar ? 14 : 17} color={chartMenuOpen ? ui.activeText : ui.text} />
                </IconButton>
                <IconButton active={indicatorOpen} ui={ui} size={iconButtonSize} onPress={toggleIndicatorMenu}>
                  <Text className="font-extrabold" style={{ color: indicatorOpen ? ui.activeText : ui.text, fontSize: compactToolbar ? 10 : 12 }}>f(x)</Text>
                </IconButton>
                <IconButton active={settingsOpen} ui={ui} size={iconButtonSize} onPress={toggleSettingsMenu}>
                  <Settings size={compactToolbar ? 14 : 16} color={settingsOpen ? ui.activeText : ui.text} />
                </IconButton>
                <IconButton active={drawingOpen} ui={ui} size={iconButtonSize} onPress={toggleDrawingMenu}>
                  <View className="h-5 w-5 items-center justify-center">
                    <View
                      className="rounded-full"
                      style={{
                        width: compactToolbar ? 18 : 22,
                        height: 2,
                        backgroundColor: drawingOpen ? ui.activeText : ui.text,
                        transform: [{ rotate: '-45deg' }],
                      }}
                    />
                  </View>
                </IconButton>
            </View>
          </>
        )}
      </View>

        {symbolMenuOpen ? (
          <View className="absolute left-2 w-[232px] overflow-hidden rounded-md border shadow-2xl" style={{ top: toolbarMenuTop, maxHeight: 264, backgroundColor: ui.menu, borderColor: ui.menuBorder, zIndex: 3200, elevation: 3200 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {prices.map((item) => {
                const itemPositive = Number(item.change) >= 0;
                const itemTone = itemPositive ? ui.success : ui.danger;
                const active = item.symbol === currentSymbol.symbol;
                return (
                  <Pressable
                    key={item.symbol}
                    onPress={() => selectSymbol(item.symbol)}
                    className="h-11 flex-row items-center border-b px-3"
                    style={{ backgroundColor: active ? ui.soft : 'transparent', borderColor: ui.border }}
                  >
                    <View className="min-w-0 flex-1">
                      <Text className="text-xs font-extrabold" numberOfLines={1} style={{ color: active ? ui.accent : ui.text }}>{item.symbol}</Text>
                      <Text className="text-[9px] font-semibold" numberOfLines={1} style={{ color: ui.muted }}>{item.group}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs font-extrabold" numberOfLines={1} style={{ color: itemTone }}>{quote(item.price, item.decimals)}</Text>
                      <Text className="text-[9px] font-bold" numberOfLines={1} style={{ color: itemTone }}>{percent(item.change)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {chartMenuOpen ? (
          <View className="absolute left-1 w-[132px] rounded-xl border p-1.5 shadow-2xl" style={{ top: toolbarMenuTop, backgroundColor: ui.menu, borderColor: ui.menuBorder, zIndex: 3000, elevation: 3000 }}>
            {CHART_TYPES.map(([key, label, Icon]) => (
              <Pressable
                key={key}
                onPress={() => { setChartType(key); setChartMenuOpen(false); }}
                className="h-8 flex-row items-center rounded-md px-3"
                style={{ backgroundColor: key === chartType ? ui.soft : 'transparent' }}
              >
                <Icon size={15} color={key === chartType ? ui.accent : ui.text} />
                <Text className="ml-3 text-xs font-semibold" style={{ color: key === chartType ? ui.accent : ui.text }}>{label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {indicatorOpen ? (
          <View className="absolute left-0 h-[322px] w-[536px] max-w-full flex-row border shadow-2xl" style={{ top: toolbarMenuTop, backgroundColor: ui.panel, borderColor: ui.menuBorder, zIndex: 3000, elevation: 3000 }}>
            <View className="w-[212px] border-r pt-8" style={{ borderColor: ui.border }}>
              <Text className="absolute left-3 top-4 text-sm font-extrabold" style={{ color: ui.text }}>INDICATORS</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 14 }}>
                {INDICATOR_TOOLS.map(([key, label]) => (
                  <Pressable
                    key={key}
                    onPress={() => applyIndicatorTool(key)}
                    className="h-8 justify-center rounded-md px-3"
                    style={{ backgroundColor: activeIndicator === key || tools[key] || (key === 'bb' && tools.bollinger) ? ui.soft : 'transparent' }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: activeIndicator === key || tools[key] || (key === 'bb' && tools.bollinger) ? ui.accent : ui.muted, textAlign: 'center' }}>{label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <View className="flex-1 px-8 py-14">
              <View className="absolute left-0 top-5 h-[260px] w-1 rounded-full" style={{ backgroundColor: ui.accent }} />
              <Text className="text-xs font-semibold" style={{ color: ui.muted }}>Number of periods for calculation of the indicator</Text>
              <View className="mt-2 h-9 flex-row overflow-hidden rounded-md border" style={{ borderColor: ui.border }}>
                <Pressable className="w-10 items-center justify-center border-r" style={{ borderColor: ui.border }} onPress={() => setAtrPeriod(tools.atrPeriod - 1)}>
                  <Minus size={14} color={ui.text} />
                </Pressable>
                <View className="flex-1 items-center justify-center">
                  <Text className="text-sm font-extrabold" style={{ color: ui.text }}>{tools.atrPeriod}</Text>
                </View>
                <Pressable className="w-10 items-center justify-center border-l" style={{ borderColor: ui.border }} onPress={() => setAtrPeriod(tools.atrPeriod + 1)}>
                  <Plus size={14} color={ui.text} />
                </Pressable>
              </View>
              <Text className="mt-4 text-xs font-semibold" style={{ color: ui.muted }}>Color</Text>
              <View className="mt-2 flex-row items-center gap-3">
                <View className="h-8 w-8 rounded border p-0.5" style={{ borderColor: ui.border }}>
                  <View className="h-full w-full rounded-sm" style={{ backgroundColor: ui.accent }} />
                </View>
                <View className="h-9 flex-1 flex-row items-center justify-between rounded-md border px-3" style={{ borderColor: ui.border }}>
                  <Text className="text-sm font-bold" style={{ color: ui.text }}>1 px</Text>
                  <ChevronDown size={15} color={ui.muted} />
                </View>
              </View>
              <Pressable className="mt-4 h-8 self-end justify-center rounded-lg px-6" style={{ backgroundColor: ui.controlActive }} onPress={() => { setTools((current) => ({ ...current, atr: true })); setIndicatorOpen(false); }}>
                <Text className="text-xs font-extrabold" style={{ color: ui.activeText }}>ADD ATR</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {settingsOpen ? (
          <View className="absolute left-[70px] w-[236px] rounded-xl border p-3 shadow-2xl" style={{ top: toolbarMenuTop, backgroundColor: ui.menu, borderColor: ui.menuBorder, zIndex: 3000, elevation: 3000 }}>
            <Text className="mb-2 border-b pb-2 text-xs font-extrabold" style={{ color: ui.text, borderColor: ui.border }}>GRAPH SETTINGS</Text>
            {GRAPH_SETTINGS.map(([key, label]) => (
              <View key={key} className="mb-3 flex-row items-center justify-between" style={{ height: 24 }}>
                <Text className="text-xs font-medium" style={{ color: ui.text }}>{label}</Text>
                <ToggleSwitch active={tools[key]} onPress={() => toggleTool(key)} ui={ui} />
              </View>
            ))}
          </View>
        ) : null}
      {drawingOpen ? (
        <View className="absolute left-[104px] w-[194px] rounded-xl border p-2 shadow-2xl" style={{ top: toolbarMenuTop, backgroundColor: ui.menu, borderColor: ui.menuBorder, zIndex: 3000, elevation: 3000 }}>
          {DRAWING_TOOLS.map(([key, label]) => {
            const danger = key === 'clear';
            return (
              <Pressable
                key={key}
                onPress={() => applyDrawingTool(key)}
                className="h-8 flex-row items-center rounded-md px-2"
              >
                {key === 'horizontal' ? (
                  <View className="w-8 items-center">
                    <View style={{ width: 16, height: 2, backgroundColor: ui.text }} />
                  </View>
                ) : null}
                {key === 'trend' ? (
                  <View className="w-8 items-center">
                    <View style={{ width: 20, height: 2, backgroundColor: ui.text, transform: [{ rotate: '-45deg' }] }} />
                  </View>
                ) : null}
                {key === 'fibonacci' ? (
                  <View className="w-8 items-center" style={{ rowGap: 2 }}>
                    {[0, 1, 2, 3, 4].map((item) => (
                      <View key={item} style={{ width: 18, height: 1.5, backgroundColor: ui.text }} />
                    ))}
                  </View>
                ) : null}
                {danger ? (
                  <View className="w-8 items-center">
                    <Trash2 size={15} color={ui.danger} />
                  </View>
                ) : null}
                <Text className="text-xs font-semibold" style={{ color: danger ? ui.danger : ui.text }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <View className="flex-1" style={{ zIndex: 0, elevation: 0 }}>
        {Platform.OS === 'web' ? (
          <iframe
            key={chartRenderKey}
            ref={iframeRef}
            title="Market chart"
            srcDoc={html}
            style={{ width: '100%', height: '100%', border: 0, position: 'relative', zIndex: 0 }}
          />
        ) : (
          <WebView
            key={chartRenderKey}
            ref={webViewRef}
            originWhitelist={['*']}
            domStorageEnabled
            javaScriptEnabled
            source={{ html }}
            style={{ backgroundColor: colors.chartBackground, zIndex: 0, elevation: 0 }}
          />
        )}
      </View>
    </View>
  );
}
