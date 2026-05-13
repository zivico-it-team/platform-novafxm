'use client';

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePriceStore } from '@/store/usePriceStore';
import { getSymbolMeta } from '@/lib/symbolMeta';
import {
  calculateMargin,
  calculatePipValue,
  formatSymbolPrice,
  getNumericPrice,
} from '@/lib/tradingEngine';
import { getLiveQuote, getMarketPrice, getOpenExecutionPrice, getQuoteSpread } from '@/lib/marketQuotes';

export default function TradingPanel({ symbol, account, onOpenTrade }) {
  const { prices, connectionStatus } = usePriceStore(useShallow((snapshot) => ({
    prices: snapshot.prices,
    connectionStatus: snapshot.connectionStatus,
  })));
  const [tradeType, setTradeType] = useState('BUY');
  const [lotSize, setLotSize] = useState('0.01');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [errors, setErrors] = useState({});

  const meta = getSymbolMeta(symbol);
  const parsedLotSize = Number(lotSize);
  const normalizedLotSize = Number.isFinite(parsedLotSize) ? parsedLotSize : 0;

  const { source } = getLiveQuote(prices, symbol);
  const marketPrice = getMarketPrice(prices, symbol);
  const orderPrice = getOpenExecutionPrice(prices, symbol, tradeType);
  const liveSpread = getQuoteSpread(prices, symbol);
  const isPriceReady = Number.isFinite(orderPrice);

  // Calculate margin and pip value using the actual order price
  const requiredMargin = calculateMargin(normalizedLotSize, meta?.contractSize || 1, orderPrice, account?.leverage || 1);
  const pipValue = calculatePipValue(symbol, normalizedLotSize);

  const canTrade = account && isPriceReady && requiredMargin <= account.freeMargin;

  const formatPrice = (price) => {
    const numericPrice = getNumericPrice(price, NaN);
    if (!Number.isFinite(numericPrice)) return '---';
    return formatSymbolPrice(symbol, numericPrice);
  };

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: '', form: '' }));
  };

  const validateTrade = (type) => {
    const nextErrors = {};
    const parsedTakeProfit = takeProfit === '' ? null : Number(takeProfit);
    const parsedStopLoss = stopLoss === '' ? null : Number(stopLoss);

    if (!Number.isFinite(normalizedLotSize) || normalizedLotSize < 0.01) {
      nextErrors.lotSize = 'Lot size must be at least 0.01';
    }

    if (takeProfit !== '' && (!Number.isFinite(parsedTakeProfit) || parsedTakeProfit <= 0)) {
      nextErrors.takeProfit = 'Take profit must be a positive price';
    }

    if (stopLoss !== '' && (!Number.isFinite(parsedStopLoss) || parsedStopLoss <= 0)) {
      nextErrors.stopLoss = 'Stop loss must be a positive price';
    }

    if (type === 'BUY') {
      if (parsedTakeProfit !== null && parsedTakeProfit <= orderPrice) {
        nextErrors.takeProfit = 'Take profit must be above the buy price';
      }
      if (parsedStopLoss !== null && parsedStopLoss >= orderPrice) {
        nextErrors.stopLoss = 'Stop loss must be below the buy price';
      }
    }

    if (type === 'SELL') {
      if (parsedTakeProfit !== null && parsedTakeProfit >= orderPrice) {
        nextErrors.takeProfit = 'Take profit must be below the sell price';
      }
      if (parsedStopLoss !== null && parsedStopLoss <= orderPrice) {
        nextErrors.stopLoss = 'Stop loss must be above the sell price';
      }
    }

    return nextErrors;
  };

  const handleOpenTrade = async (type) => {
    const nextErrors = validateTrade(type);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!canTrade) {
      setErrors({ form: isPriceReady ? 'Insufficient margin available' : 'Waiting for live price' });
      return;
    }

    const opened = await onOpenTrade(
      symbol,
      type,
      normalizedLotSize,
      takeProfit ? parseFloat(takeProfit) : null,
      stopLoss ? parseFloat(stopLoss) : null
    );

    if (!opened) return;

    setTakeProfit('');
    setStopLoss('');
    setErrors({});
  };

  return (
    <div className="w-72 bg-white border-l border-nova-border rounded-lg shadow-sm overflow-auto">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-nova-border sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{symbol}</h3>
          <p className="text-xs text-gray-500 mt-1">Open a Position</p>
        </div>

        <div className="p-4 border-b border-nova-border space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Market Price</span>
            <span className="font-medium text-gray-900">{formatPrice(marketPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Spread</span>
            <span className="font-medium text-gray-900">
              {Number.isFinite(liveSpread) ? `${getNumericPrice(liveSpread).toFixed(1)} pips` : '---'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Price Source</span>
            <span className={`font-medium ${source === 'live' ? 'text-green-700' : 'text-amber-700'}`}>
              {source === 'live' ? 'Live' : source === 'loading' ? 'Loading' : 'Initial'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Connection</span>
            <span className={`font-medium ${connectionStatus === 'connected' ? 'text-green-700' : 'text-amber-700'}`}>
              {connectionStatus === 'connected' ? 'Connected' : connectionStatus || 'Loading'}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-nova-border">
            <span className="text-gray-600">Order Price ({tradeType})</span>
            <span className="font-medium text-gray-900">{formatPrice(orderPrice)}</span>
          </div>
        </div>

        <div className="p-4 border-b border-nova-border">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setTradeType('BUY');
                setErrors({});
              }}
              className={`py-2 px-3 rounded font-medium text-sm transition-colors ${
                tradeType === 'BUY'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-nova-gray text-gray-600 border border-nova-border hover:bg-white'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => {
                setTradeType('SELL');
                setErrors({});
              }}
              className={`py-2 px-3 rounded font-medium text-sm transition-colors ${
                tradeType === 'SELL'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-nova-gray text-gray-600 border border-nova-border hover:bg-white'
              }`}
            >
              SELL
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-nova-border">
          <label htmlFor="lotSize" className="block text-sm font-medium text-gray-700 mb-2">
            Lot Size
          </label>
          <input
            id="lotSize"
            type="number"
            step="0.01"
            min="0.01"
            value={lotSize}
            onChange={(e) => {
              setLotSize(e.target.value);
              clearError('lotSize');
            }}
            aria-invalid={Boolean(errors.lotSize)}
            aria-describedby={errors.lotSize ? 'lot-size-error' : undefined}
            className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-nova-blue ${
              errors.lotSize ? 'border-red-500' : 'border-nova-border'
            }`}
          />
          {errors.lotSize && (
            <p id="lot-size-error" className="mt-2 text-xs text-red-600">
              {errors.lotSize}
            </p>
          )}
        </div>

        <div className="p-4 border-b border-nova-border space-y-3">
          <div>
            <label htmlFor="takeProfit" className="block text-sm font-medium text-gray-700 mb-2">
              Take Profit (Optional)
            </label>
            <input
              id="takeProfit"
              type="number"
              step="0.0001"
              value={takeProfit}
              onChange={(e) => {
                setTakeProfit(e.target.value);
                clearError('takeProfit');
              }}
              placeholder="Target price"
              aria-invalid={Boolean(errors.takeProfit)}
              aria-describedby={errors.takeProfit ? 'take-profit-error' : undefined}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-nova-blue ${
                errors.takeProfit ? 'border-red-500' : 'border-nova-border'
              }`}
            />
            {errors.takeProfit && (
              <p id="take-profit-error" className="mt-2 text-xs text-red-600">
                {errors.takeProfit}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="stopLoss" className="block text-sm font-medium text-gray-700 mb-2">
              Stop Loss (Optional)
            </label>
            <input
              id="stopLoss"
              type="number"
              step="0.0001"
              value={stopLoss}
              onChange={(e) => {
                setStopLoss(e.target.value);
                clearError('stopLoss');
              }}
              placeholder="Stop price"
              aria-invalid={Boolean(errors.stopLoss)}
              aria-describedby={errors.stopLoss ? 'stop-loss-error' : undefined}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-nova-blue ${
                errors.stopLoss ? 'border-red-500' : 'border-nova-border'
              }`}
            />
            {errors.stopLoss && (
              <p id="stop-loss-error" className="mt-2 text-xs text-red-600">
                {errors.stopLoss}
              </p>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-nova-border space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Required Margin:</span>
            <span className={`font-medium ${canTrade ? 'text-gray-900' : 'text-red-600'}`}>
              ${getNumericPrice(requiredMargin).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pip Value:</span>
            <span className="font-medium text-gray-900">${getNumericPrice(pipValue).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Free Margin:</span>
            <span className="font-medium text-gray-900">${getNumericPrice(account?.freeMargin).toFixed(2)}</span>
          </div>
        </div>

        <div className="p-4 space-y-2 flex-1 flex flex-col justify-end">
          <button
            onClick={() => handleOpenTrade('BUY')}
            disabled={!canTrade}
            className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
          >
            BUY
          </button>
          <button
            onClick={() => handleOpenTrade('SELL')}
            disabled={!canTrade}
            className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
          >
            SELL
          </button>
          {!canTrade && (
            <p className="text-xs text-red-600 text-center mt-2">
              {isPriceReady ? 'Insufficient margin' : 'Waiting for live price'}
            </p>
          )}
          {errors.form && (
            <p className="text-xs text-red-600 text-center mt-2">{errors.form}</p>
          )}
        </div>
      </div>
    </div>
  );
}
