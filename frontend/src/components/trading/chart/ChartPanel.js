'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  LineSeries,
  LineStyle,
} from 'lightweight-charts';
import { getSymbolMeta } from '@/lib/symbolMeta';
import { getMarketPrice, getQuoteSpread } from '@/lib/marketQuotes';
import { formatSymbolPrice, getNumericPrice } from '@/lib/tradingEngine';
import { usePriceStore } from '@/store/usePriceStore';
import { pricesAPI } from '@/services/api';

const TIMEFRAME_OPTIONS = [
  ['1', '1m'],
  ['5', '5m'],
  ['15', '15m'],
  ['30', '30m'],
  ['45', '45m'],
  ['60', '1H'],
  ['120', '2H'],
  ['240', '4H'],
  ['D', '1D'],
  ['W', '1W'],
  ['M', '1M'],
];

const TIMEFRAME_SECONDS = {
  1: 60,
  5: 300,
  15: 900,
  30: 1800,
  45: 2700,
  60: 3600,
  120: 7200,
  240: 14400,
  D: 86400,
  W: 604800,
  M: 2592000,
};

const CHART_STYLE_OPTIONS = [
  ['1', 'Candlestick'],
  ['0', 'Bar'],
  ['2', 'Line'],
  ['3', 'Area'],
  ['9', 'Hollow Candles'],
  ['8', 'Heikin Ashi'],
];

const INDICATOR_OPTIONS = [
  ['movingAverage', 'Moving Average'],
  ['ema', 'EMA'],
  ['rsi', 'RSI'],
  ['macd', 'MACD'],
  ['bollingerBands', 'Bollinger Bands'],
  ['fibonacci', 'Fibonacci Levels'],
];

const GRAPH_SETTINGS = [
  ['showBidAsk', 'Display market price line'],
  ['showPositionLine', 'Display position line'],
  ['showTakeProfitLine', 'Display take profit line'],
  ['showStopLossLine', 'Display stop loss line'],
  ['showLabels', 'Display line labels'],
];

function getTimeframeSeconds(timeframe) {
  return TIMEFRAME_SECONDS[timeframe] || 900;
}

function getSlotTime(timeframe) {
  const seconds = getTimeframeSeconds(timeframe);
  return Math.floor(Date.now() / 1000 / seconds) * seconds;
}

function seedCandles(symbol, basePrice, timeframe, pip = 0.01) {
  const seconds = getTimeframeSeconds(timeframe);
  const end = getSlotTime(timeframe);
  const candles = [];
  const safePip = Number(pip) || 0.01;
  const volatility = Math.max(basePrice * 0.00045, safePip * 18);
  const symbolSeed = symbol.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  let previousClose = basePrice - volatility * 12;

  for (let index = 119; index >= 0; index -= 1) {
    const time = end - index * seconds;
    const wave = Math.sin((120 - index + symbolSeed) / 7) * volatility * 1.8;
    const drift = Math.cos((120 - index + symbolSeed) / 11) * volatility * 0.9;
    const close = previousClose + wave * 0.16 + drift * 0.12;
    const open = previousClose;
    const high = Math.max(open, close) + volatility * (0.7 + ((120 - index) % 5) * 0.12);
    const low = Math.min(open, close) - volatility * (0.7 + ((120 - index) % 3) * 0.15);

    candles.push({ time, open, high, low, close });
    previousClose = close;
  }

  const last = candles[candles.length - 1];
  candles[candles.length - 1] = {
    ...last,
    high: Math.max(last.high, basePrice),
    low: Math.min(last.low, basePrice),
    close: basePrice,
  };

  return candles;
}

function normalizeCandles(candles) {
  const byTime = new Map();

  candles.forEach((candle) => {
    const time = Number(candle?.time);
    const open = Number(candle?.open);
    const high = Number(candle?.high);
    const low = Number(candle?.low);
    const close = Number(candle?.close);

    if (![time, open, high, low, close].every(Number.isFinite)) return;
    if (time <= 0 || open <= 0 || high <= 0 || low <= 0 || close <= 0) return;

    byTime.set(time, { time, open, high, low, close });
  });

  return Array.from(byTime.values()).sort((a, b) => a.time - b.time);
}

function updateCandles(previousCandles, price, timeframe) {
  if (!Number.isFinite(price) || price <= 0) return previousCandles;

  const time = getSlotTime(timeframe);
  const candles = normalizeCandles(previousCandles);

  if (candles.length === 0) {
    return [{ time, open: price, high: price, low: price, close: price }];
  }

  const last = candles[candles.length - 1];

  if (last.time === time) {
    candles[candles.length - 1] = {
      ...last,
      high: Math.max(last.high, price),
      low: Math.min(last.low, price),
      close: price,
    };
  } else if (last.time > time) {
    return candles.slice(-240);
  } else {
    candles.push({
      time,
      open: last.close,
      high: Math.max(last.close, price),
      low: Math.min(last.close, price),
      close: price,
    });
  }

  return candles.slice(-240);
}

function toHeikinAshi(candles) {
  return candles.reduce((items, candle, index) => {
    const close = (candle.open + candle.high + candle.low + candle.close) / 4;
    const previous = items[index - 1];
    const open = previous ? (previous.open + previous.close) / 2 : (candle.open + candle.close) / 2;
    items.push({
      time: candle.time,
      open,
      high: Math.max(candle.high, open, close),
      low: Math.min(candle.low, open, close),
      close,
    });
    return items;
  }, []);
}

function getPrimarySeriesConfig(chartStyle) {
  if (chartStyle === '0') {
    return {
      type: BarSeries,
      options: { upColor: '#014421', downColor: '#ef4444', thinBars: false },
    };
  }

  if (chartStyle === '2') {
    return {
      type: LineSeries,
      options: { color: '#014421', lineWidth: 2, priceLineColor: '#014421' },
    };
  }

  if (chartStyle === '3') {
    return {
      type: AreaSeries,
      options: {
        lineColor: '#014421',
        topColor: 'rgba(1, 68, 33, 0.22)',
        bottomColor: 'rgba(212, 175, 55, 0.03)',
        lineWidth: 2,
      },
    };
  }

  if (chartStyle === '9') {
    return {
      type: CandlestickSeries,
      options: {
        upColor: 'rgba(1, 68, 33, 0.08)',
        downColor: 'rgba(239, 68, 68, 0.08)',
        borderUpColor: '#014421',
        borderDownColor: '#ef4444',
        wickUpColor: '#014421',
        wickDownColor: '#ef4444',
      },
    };
  }

  return {
    type: CandlestickSeries,
    options: {
      upColor: '#17a673',
      downColor: '#ef4444',
      borderUpColor: '#014421',
      borderDownColor: '#b91c1c',
      wickUpColor: '#014421',
      wickDownColor: '#b91c1c',
    },
  };
}

function getSeriesData(candles, chartStyle) {
  const normalizedCandles = normalizeCandles(candles);
  const source = chartStyle === '8' ? toHeikinAshi(normalizedCandles) : normalizedCandles;

  if (chartStyle === '2' || chartStyle === '3') {
    return source.map((candle) => ({ time: candle.time, value: candle.close }));
  }

  return source;
}

function calculateSma(candles, length = 20) {
  return candles
    .map((candle, index) => {
      if (index < length - 1) return null;
      const slice = candles.slice(index - length + 1, index + 1);
      const value = slice.reduce((sum, item) => sum + item.close, 0) / length;
      return { time: candle.time, value };
    })
    .filter(Boolean);
}

function calculateEma(candles, length = 20) {
  const multiplier = 2 / (length + 1);
  let previous;

  return candles.map((candle, index) => {
    previous = index === 0 ? candle.close : candle.close * multiplier + previous * (1 - multiplier);
    return { time: candle.time, value: previous };
  });
}

function calculateBollinger(candles, length = 20, deviation = 2) {
  const upper = [];
  const lower = [];

  candles.forEach((candle, index) => {
    if (index < length - 1) return;
    const slice = candles.slice(index - length + 1, index + 1);
    const average = slice.reduce((sum, item) => sum + item.close, 0) / length;
    const variance = slice.reduce((sum, item) => sum + (item.close - average) ** 2, 0) / length;
    const band = Math.sqrt(variance) * deviation;
    upper.push({ time: candle.time, value: average + band });
    lower.push({ time: candle.time, value: average - band });
  });

  return { upper, lower };
}

export default function ChartPanel({ symbol, trades = [], onTimeframeChange }) {
  const prices = usePriceStore((snapshot) => snapshot.prices);
  const connectionStatus = usePriceStore((snapshot) => snapshot.connectionStatus);
  const chartElement = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const priceLinesRef = useRef([]);
  const indicatorSeriesRef = useRef([]);
  const initializedFibSymbol = useRef(null);
  const historyKeyRef = useRef('');
  const latestMidPriceRef = useRef(null);
  const [timeframe, setTimeframe] = useState('15');
  const [candles, setCandles] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [enabledIndicators, setEnabledIndicators] = useState({
    movingAverage: false,
    ema: false,
    rsi: false,
    macd: false,
    bollingerBands: false,
    fibonacci: false,
  });
  const [fibDirection, setFibDirection] = useState('up');
  const [fibLow, setFibLow] = useState('');
  const [fibHigh, setFibHigh] = useState('');
  const [chartStyle, setChartStyle] = useState('1');
  const [activeMenu, setActiveMenu] = useState('');
  const [graphSettings, setGraphSettings] = useState({
    showBidAsk: true,
    showPositionLine: true,
    showTakeProfitLine: true,
    showStopLossLine: true,
    showLabels: true,
  });

  const meta = getSymbolMeta(symbol);
  const midPrice = getMarketPrice(prices, symbol);
  const hasLivePrice = Number.isFinite(midPrice);
  const currentPrice = hasLivePrice ? formatSymbolPrice(symbol, midPrice) : '---';
  const spread = getQuoteSpread(prices, symbol);
  const spreadText = Number.isFinite(spread) ? spread.toFixed(1) : '---';
  const currentChartStyle = CHART_STYLE_OPTIONS.find(([value]) => value === chartStyle)?.[1] || 'Candlestick';
  const chartData = useMemo(() => getSeriesData(candles, chartStyle), [candles, chartStyle]);
  const lastCandle = candles[candles.length - 1];
  const symbolTrades = useMemo(
    () => trades.filter((trade) => trade.symbol === symbol && trade.status === 'OPEN'),
    [symbol, trades]
  );

  useEffect(() => {
    latestMidPriceRef.current = midPrice;
  }, [midPrice]);

  useEffect(() => {
    let cancelled = false;
    const seedKey = `${symbol}:${timeframe}`;

    historyKeyRef.current = seedKey;
    setIsLoadingHistory(true);

    pricesAPI.getCandles(symbol, timeframe, 240)
      .then((result) => {
        if (cancelled || historyKeyRef.current !== seedKey) return;

        const historicalCandles = normalizeCandles(result?.candles || []);
        if (historicalCandles.length > 0) {
          setCandles(historicalCandles);
          return;
        }

        const latestMidPrice = latestMidPriceRef.current;
        if (Number.isFinite(latestMidPrice)) {
          setCandles(normalizeCandles(seedCandles(symbol, latestMidPrice, timeframe, meta?.pip)));
        } else {
          setCandles([]);
        }
      })
      .finally(() => {
        if (!cancelled && historyKeyRef.current === seedKey) {
          setIsLoadingHistory(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe, meta?.pip]);

  useEffect(() => {
    if (!Number.isFinite(midPrice)) return;
    setCandles((previousCandles) => updateCandles(previousCandles, midPrice, timeframe));
  }, [midPrice, timeframe]);

  useEffect(() => {
    if (initializedFibSymbol.current === symbol) return;
    if (!Number.isFinite(midPrice)) return;

    const range = midPrice * 0.01;
    setFibLow(formatSymbolPrice(symbol, midPrice - range));
    setFibHigh(formatSymbolPrice(symbol, midPrice + range));
    initializedFibSymbol.current = symbol;
  }, [midPrice, symbol]);

  const fibonacciLevels = useMemo(() => {
    const low = Number(fibLow);
    const high = Number(fibHigh);

    if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) return [];

    const range = high - low;
    const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618];

    return ratios.map((ratio) => {
      const price = fibDirection === 'up' ? high - range * ratio : low + range * ratio;
      return {
        label: `${(ratio * 100).toFixed(ratio === 0 || ratio === 1 ? 0 : 1)}%`,
        price,
      };
    });
  }, [fibDirection, fibHigh, fibLow]);

  useEffect(() => {
    if (!chartElement.current) return undefined;

    const chart = createChart(chartElement.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#334155',
      },
      grid: {
        vertLines: { color: '#e5e7eb' },
        horzLines: { color: '#e5e7eb' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#94a3b8', style: LineStyle.Dashed },
        horzLine: { color: '#94a3b8', style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: '#cbd5e1',
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor: '#cbd5e1',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    return () => {
      indicatorSeriesRef.current = [];
      priceLinesRef.current = [];
      seriesRef.current = null;
      chartRef.current = null;
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return undefined;

    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    const config = getPrimarySeriesConfig(chartStyle);
    const series = chartRef.current.addSeries(config.type, config.options);
    seriesRef.current = series;
    chartRef.current.timeScale().fitContent();

    return () => {
      if (chartRef.current && seriesRef.current === series) {
        chartRef.current.removeSeries(series);
        seriesRef.current = null;
      }
    };
  }, [chartStyle]);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(chartData);
  }, [chartData]);

  useEffect(() => {
    if (!chartRef.current) return undefined;

    const clearIndicators = () => {
      indicatorSeriesRef.current.forEach((series) => {
        chartRef.current?.removeSeries(series);
      });
      indicatorSeriesRef.current = [];
    };

    clearIndicators();

    if (enabledIndicators.movingAverage) {
      const series = chartRef.current.addSeries(LineSeries, {
        color: '#D4AF37',
        lineWidth: 2,
        priceLineVisible: false,
      });
      series.setData(calculateSma(candles));
      indicatorSeriesRef.current.push(series);
    }

    if (enabledIndicators.ema) {
      const series = chartRef.current.addSeries(LineSeries, {
        color: '#014421',
        lineWidth: 2,
        priceLineVisible: false,
      });
      series.setData(calculateEma(candles));
      indicatorSeriesRef.current.push(series);
    }

    if (enabledIndicators.bollingerBands) {
      const bands = calculateBollinger(candles);
      const upper = chartRef.current.addSeries(LineSeries, {
        color: '#64748b',
        lineWidth: 1,
        priceLineVisible: false,
      });
      const lower = chartRef.current.addSeries(LineSeries, {
        color: '#64748b',
        lineWidth: 1,
        priceLineVisible: false,
      });
      upper.setData(bands.upper);
      lower.setData(bands.lower);
      indicatorSeriesRef.current.push(upper, lower);
    }

    return clearIndicators;
  }, [
    candles,
    enabledIndicators.bollingerBands,
    enabledIndicators.ema,
    enabledIndicators.movingAverage,
  ]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    priceLinesRef.current.forEach((line) => series.removePriceLine(line));
    priceLinesRef.current = [];

    const addPriceLine = ({ price, title, color, style = LineStyle.Solid }) => {
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice <= 0) return;

      priceLinesRef.current.push(
        series.createPriceLine({
          price: numericPrice,
          color,
          lineWidth: 1,
          lineStyle: style,
          axisLabelVisible: graphSettings.showLabels,
          title: graphSettings.showLabels ? title : '',
        })
      );
    };

    if (graphSettings.showBidAsk && Number.isFinite(midPrice)) {
      addPriceLine({ price: midPrice, title: 'Market', color: '#014421' });
    }

    symbolTrades.forEach((trade) => {
      if (graphSettings.showPositionLine) {
        addPriceLine({
          price: trade.openPrice,
          title: `${trade.type} #${trade.id}`,
          color: '#014421',
          style: LineStyle.Dashed,
        });
      }

      if (graphSettings.showTakeProfitLine && trade.takeProfit) {
        addPriceLine({
          price: trade.takeProfit,
          title: `TP #${trade.id}`,
          color: '#16a34a',
          style: LineStyle.Dotted,
        });
      }

      if (graphSettings.showStopLossLine && trade.stopLoss) {
        addPriceLine({
          price: trade.stopLoss,
          title: `SL #${trade.id}`,
          color: '#dc2626',
          style: LineStyle.Dotted,
        });
      }
    });
  }, [
    chartStyle,
    graphSettings.showBidAsk,
    graphSettings.showLabels,
    graphSettings.showPositionLine,
    graphSettings.showStopLossLine,
    graphSettings.showTakeProfitLine,
    midPrice,
    symbolTrades,
  ]);

  const handleTimeframeChange = (nextTimeframe) => {
    setTimeframe(nextTimeframe);
    onTimeframeChange?.(nextTimeframe);
  };

  const toggleIndicator = (indicator) => {
    setEnabledIndicators((prev) => ({
      ...prev,
      [indicator]: !prev[indicator],
    }));
  };

  const toggleMenu = (menu) => {
    setActiveMenu((current) => (current === menu ? '' : menu));
  };

  const toggleGraphSetting = (setting) => {
    setGraphSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const closeMenus = () => setActiveMenu('');

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-nova-border">
      <div className="relative z-20 rounded-t-lg border-b border-nova-border bg-white text-slate-950 shadow-sm">
        <div className="flex min-h-10 items-center gap-2 border-b border-slate-100 px-4 py-1">
          <h3 className="text-sm font-bold">{symbol}</h3>
          <span className="text-nova-gold">v</span>
          <span className="ml-2 text-sm font-bold text-nova-green">{currentPrice}</span>
          <span className="text-sm text-slate-500">+0.00%</span>
          <span className="text-xs text-slate-500">Spread: {spreadText}</span>
          {lastCandle && (
            <span className="ml-2 hidden text-xs text-slate-500 md:inline">
              O {formatSymbolPrice(symbol, lastCandle.open)} H {formatSymbolPrice(symbol, lastCandle.high)} L{' '}
              {formatSymbolPrice(symbol, lastCandle.low)} C {formatSymbolPrice(symbol, lastCandle.close)}
            </span>
          )}
          <span className={`ml-auto hidden text-xs font-semibold capitalize lg:inline ${connectionStatus === 'connected' ? 'text-slate-500' : 'text-amber-600'}`}>
            {isLoadingHistory ? 'Loading history' : connectionStatus === 'connected' ? 'Live ticks' : connectionStatus || 'Loading'}
          </span>
        </div>

        <div className="flex min-h-10 flex-wrap items-center gap-2 px-4 py-1">
          <div className="flex flex-wrap items-center gap-1">
            {TIMEFRAME_OPTIONS.map(([value, label]) => (
              <button
                key={value}
                onClick={() => handleTimeframeChange(value)}
                className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                  timeframe === value
                    ? 'bg-nova-green text-white'
                    : 'text-slate-600 hover:bg-yellow-50 hover:text-nova-green'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-nova-border" />

          <div className="relative flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => toggleMenu('chart')}
              className={`min-h-7 rounded border px-2 py-1 text-xs font-bold transition-colors ${
                activeMenu === 'chart'
                  ? 'border-nova-green bg-yellow-50 text-nova-green'
                  : 'border-nova-border bg-white text-slate-700 hover:border-nova-gold hover:bg-yellow-50'
              }`}
            >
              Chart
            </button>
            <button
              type="button"
              onClick={() => toggleMenu('indicators')}
              className={`min-h-7 rounded border px-2 py-1 text-xs font-bold transition-colors ${
                activeMenu === 'indicators'
                  ? 'border-nova-green bg-yellow-50 text-nova-green'
                  : 'border-nova-border bg-white text-slate-700 hover:border-nova-gold hover:bg-yellow-50'
              }`}
            >
              f(x)
            </button>
            <button
              type="button"
              onClick={() => toggleMenu('settings')}
              className={`min-h-7 rounded border px-2 py-1 text-xs font-bold transition-colors ${
                activeMenu === 'settings'
                  ? 'border-nova-green bg-yellow-50 text-nova-green'
                  : 'border-nova-border bg-white text-slate-700 hover:border-nova-gold hover:bg-yellow-50'
              }`}
            >
              Settings
            </button>
            <button
              type="button"
              onClick={() => toggleMenu('drawing')}
              className={`min-h-7 rounded border px-2 py-1 text-xs font-bold transition-colors ${
                activeMenu === 'drawing'
                  ? 'border-nova-green bg-yellow-50 text-nova-green'
                  : 'border-nova-border bg-white text-slate-700 hover:border-nova-gold hover:bg-yellow-50'
              }`}
            >
              Draw
            </button>

            {activeMenu === 'chart' && (
              <div className="absolute left-0 top-9 z-50 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                <div className="px-2 py-1 text-xs font-bold uppercase text-slate-500">Chart Type</div>
                {CHART_STYLE_OPTIONS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setChartStyle(value);
                      closeMenus();
                    }}
                    className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm font-semibold ${
                      chartStyle === value ? 'bg-yellow-50 text-nova-green' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{label}</span>
                    {chartStyle === value && <span className="text-nova-gold">Selected</span>}
                  </button>
                ))}
              </div>
            )}

            {activeMenu === 'indicators' && (
              <div className="absolute left-14 top-9 z-50 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
                <div className="mb-2 text-xs font-bold uppercase text-slate-500">Indicators</div>
                <div className="space-y-1">
                  {INDICATOR_OPTIONS.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleIndicator(key)}
                      className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm font-semibold ${
                        enabledIndicators[key] ? 'bg-yellow-50 text-nova-green' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{label}</span>
                      <span className={`h-4 w-8 rounded-full ${enabledIndicators[key] ? 'bg-nova-green' : 'bg-slate-300'}`}>
                        <span
                          className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                            enabledIndicators[key] ? 'translate-x-4' : ''
                          }`}
                        />
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">MA, EMA, and Bollinger draw on the chart. RSI and MACD stay available for the next panel.</p>
              </div>
            )}

            {activeMenu === 'settings' && (
              <div className="absolute left-28 top-9 z-50 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
                <div className="mb-2 text-xs font-bold uppercase text-slate-500">Graph Settings</div>
                {GRAPH_SETTINGS.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleGraphSetting(key)}
                    className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <span>{label}</span>
                    <span className={`h-4 w-8 rounded-full ${graphSettings[key] ? 'bg-nova-green' : 'bg-slate-300'}`}>
                      <span
                        className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                          graphSettings[key] ? 'translate-x-4' : ''
                        }`}
                      />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeMenu === 'drawing' && (
              <div className="absolute left-44 top-9 z-50 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                <div className="px-2 py-1 text-xs font-bold uppercase text-slate-500">Drawing Tools</div>
                <button
                  type="button"
                  onClick={() => {
                    setEnabledIndicators((prev) => ({ ...prev, fibonacci: true }));
                    closeMenus();
                  }}
                  className="w-full rounded px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Show Fibonacci panel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEnabledIndicators((prev) => ({ ...prev, fibonacci: false }));
                    closeMenus();
                  }}
                  className="w-full rounded px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Clear drawing tools
                </button>
              </div>
            )}
          </div>

          <span className="ml-auto hidden text-xs font-semibold text-slate-500 lg:inline">{currentChartStyle}</span>
        </div>
      </div>

      {enabledIndicators.fibonacci && (
        <div className="border-b border-nova-border bg-yellow-50/50 px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="fib-direction" className="block text-xs font-medium text-gray-600 mb-1">
                Fib Direction
              </label>
              <select
                id="fib-direction"
                value={fibDirection}
                onChange={(event) => setFibDirection(event.target.value)}
                className="rounded border border-nova-border bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-nova-green"
              >
                <option value="up">High to Low</option>
                <option value="down">Low to High</option>
              </select>
            </div>
            <div>
              <label htmlFor="fib-low" className="block text-xs font-medium text-gray-600 mb-1">
                Swing Low
              </label>
              <input
                id="fib-low"
                type="number"
                value={fibLow}
                onChange={(event) => setFibLow(event.target.value)}
                className="w-28 rounded border border-nova-border bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-nova-green"
              />
            </div>
            <div>
              <label htmlFor="fib-high" className="block text-xs font-medium text-gray-600 mb-1">
                Swing High
              </label>
              <input
                id="fib-high"
                type="number"
                value={fibHigh}
                onChange={(event) => setFibHigh(event.target.value)}
                className="w-28 rounded border border-nova-border bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-nova-green"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!Number.isFinite(midPrice)) return;
                const range = midPrice * 0.01;
                setFibLow(formatSymbolPrice(symbol, midPrice - range));
                setFibHigh(formatSymbolPrice(symbol, midPrice + range));
              }}
              className="rounded border border-nova-border bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-nova-gray"
            >
              Reset
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
            {fibonacciLevels.map((level) => (
              <div key={level.label} className="rounded border border-nova-gold/40 bg-white px-2 py-1 text-right">
                <div className="text-[10px] font-semibold text-nova-green">{level.label}</div>
                <div className="text-xs text-gray-800">{formatSymbolPrice(symbol, level.price)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-0 flex-1 overflow-hidden bg-white" style={{ minHeight: '600px' }}>
        <div ref={chartElement} className="absolute inset-0" />
      </div>
    </div>
  );
}
