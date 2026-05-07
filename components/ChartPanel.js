'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getSymbolMeta } from '@/lib/symbolMeta';
import { getLiveQuote } from '@/lib/marketQuotes';
import { formatSymbolPrice, getNumericPrice } from '@/lib/tradingEngine';

export default function ChartPanel({ symbol, prices = {}, onTimeframeChange }) {
  const container = useRef(null);
  const initializedFibSymbol = useRef(null);
  const [timeframe, setTimeframe] = useState('15');
  const quote = getLiveQuote(prices, symbol);
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

  const studies = useMemo(() => {
    const nextStudies = [];

    if (enabledIndicators.movingAverage) nextStudies.push('MASimple@tv-basicstudies');
    if (enabledIndicators.ema) nextStudies.push('MAExp@tv-basicstudies');
    if (enabledIndicators.rsi) nextStudies.push('RSI@tv-basicstudies');
    if (enabledIndicators.macd) nextStudies.push('MACD@tv-basicstudies');
    if (enabledIndicators.bollingerBands) nextStudies.push('BB@tv-basicstudies');

    return nextStudies;
  }, [enabledIndicators]);

  useEffect(() => {
    if (initializedFibSymbol.current === symbol) return;

    const mid = getNumericPrice(quote.mid, 0);
    if (!mid) return;

    const range = mid * 0.01;
    setFibLow(formatSymbolPrice(symbol, mid - range));
    setFibHigh(formatSymbolPrice(symbol, mid + range));
    initializedFibSymbol.current = symbol;
  }, [quote.mid, symbol]);

  const fibonacciLevels = useMemo(() => {
    const low = Number(fibLow);
    const high = Number(fibHigh);

    if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) {
      return [];
    }

    const range = high - low;
    const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618];

    return ratios.map((ratio) => {
      const price = fibDirection === 'up'
        ? high - range * ratio
        : low + range * ratio;

      return {
        label: `${(ratio * 100).toFixed(ratio === 0 || ratio === 1 ? 0 : 1)}%`,
        price,
      };
    });
  }, [fibDirection, fibHigh, fibLow]);

  useEffect(() => {
    if (!container.current) return;

    const meta = getSymbolMeta(symbol);
    const tvSymbol = meta?.tv || 'OANDA:XAUUSD';

    // Clear existing chart
    if (container.current) {
      container.current.innerHTML = '<div id="tradingview-chart" style="height: 100%; width: 100%;"></div>';
    }

    // Wait for TradingView to load
    const initChart = () => {
      if (window.TradingView && typeof window.TradingView.widget === 'function') {
        new window.TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: timeframe,
          timezone: 'Etc/UTC',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: 'rgba(255, 255, 255, 1)',
          enable_publishing: false,
          allow_symbol_change: false,
          hide_side_toolbar: !enabledIndicators.fibonacci,
          enabled_features: ['study_templates'],
          drawings_access: {
            type: 'black',
            tools: [{ name: 'Regression Trend' }],
          },
          studies,
          container_id: 'tradingview-chart',
        });
      } else {
        // Retry after a short delay if TradingView isn't loaded yet
        setTimeout(initChart, 500);
      }
    };

    initChart();
  }, [symbol, timeframe, studies, enabledIndicators.fibonacci]);

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

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-nova-border">
      {/* Chart Header */}
      <div className="p-4 border-b border-nova-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">{symbol}</h3>
          <span className="text-sm text-gray-600">TradingView Chart</span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex gap-1">
            {[
              ['1', '1M'],
              ['5', '5M'],
              ['15', '15M'],
              ['60', '1H'],
              ['240', '4H'],
              ['D', '1D'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => handleTimeframeChange(value)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  timeframe === value
                    ? 'bg-nova-blue text-white'
                    : 'text-gray-600 hover:bg-nova-gray'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              ['movingAverage', 'SMA'],
              ['ema', 'EMA'],
              ['rsi', 'RSI'],
              ['macd', 'MACD'],
              ['bollingerBands', 'BB'],
              ['fibonacci', 'FIB'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => toggleIndicator(key)}
                className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                  enabledIndicators[key]
                    ? 'border-nova-blue bg-blue-50 text-nova-blue'
                    : 'border-nova-border text-gray-600 hover:bg-nova-gray'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {enabledIndicators.fibonacci && (
        <div className="border-b border-nova-border bg-blue-50/50 px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="fib-direction" className="block text-xs font-medium text-gray-600 mb-1">
                Fib Direction
              </label>
              <select
                id="fib-direction"
                value={fibDirection}
                onChange={(event) => setFibDirection(event.target.value)}
                className="rounded border border-nova-border bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-nova-blue"
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
                className="w-28 rounded border border-nova-border bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-nova-blue"
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
                className="w-28 rounded border border-nova-border bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-nova-blue"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const mid = getNumericPrice(quote.mid, 0);
                if (!mid) return;
                const range = mid * 0.01;
                setFibLow(formatSymbolPrice(symbol, mid - range));
                setFibHigh(formatSymbolPrice(symbol, mid + range));
              }}
              className="rounded border border-nova-border bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-nova-gray"
            >
              Reset
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
            {fibonacciLevels.map((level) => (
              <div key={level.label} className="rounded border border-blue-100 bg-white px-2 py-1 text-right">
                <div className="text-[10px] font-semibold text-blue-700">{level.label}</div>
                <div className="text-xs text-gray-800">{formatSymbolPrice(symbol, level.price)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div ref={container} className="flex-1 relative overflow-hidden" style={{ minHeight: '600px' }}>
        <div id="tradingview-chart" style={{ height: '100%', width: '100%' }}>
          {/* TradingView widget will be rendered here */}
          <div className="h-full w-full flex items-center justify-center bg-nova-gray">
            <div className="text-center">
              <p className="text-gray-600 mb-2">Chart for {symbol}</p>
              <p className="text-xs text-gray-500">TradingView Advanced Chart Widget</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
