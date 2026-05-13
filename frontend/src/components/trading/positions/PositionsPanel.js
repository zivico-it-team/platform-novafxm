'use client';

import { useState } from 'react';
import { usePriceStore } from '@/store/usePriceStore';
import { formatSymbolPrice, getNumericPrice } from '@/lib/tradingEngine';
import { getCloseExecutionPrice } from '@/lib/marketQuotes';

export default function PositionsPanel({ trades, history, onCloseTrade }) {
  const prices = usePriceStore((snapshot) => snapshot.prices);
  const [activeTab, setActiveTab] = useState('positions');

  const formatPrice = (price, symbol) => {
    return Number.isFinite(Number(price)) ? formatSymbolPrice(symbol, price) : '---';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '---';
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '---';
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const getPnLColor = (pnl) => {
    if (pnl > 0) return 'text-green-600';
    if (pnl < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-nova-border overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-nova-border flex">
        {['positions', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-nova-blue border-b-nova-blue'
                : 'text-gray-600 border-b-transparent hover:text-gray-900'
            }`}
          >
            {tab === 'positions' ? 'Open Positions' : 'History'}
            {tab === 'positions' && trades.length > 0 && (
              <span className="ml-2 inline-block bg-nova-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {trades.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        {activeTab === 'positions' ? (
          <div>
            {trades.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No open positions</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-nova-gray border-b border-nova-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Symbol</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Lot</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Open Price</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">T/P</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">S/L</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Current</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">PnL</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => {
                    const currentPrice = Number(trade.currentPrice ?? getCloseExecutionPrice(prices, trade));
                    const pnl = Number(trade.floatingPnL);

                    return (
                      <tr key={trade.id} className="border-b border-nova-border hover:bg-nova-gray transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{trade.symbol}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.type === 'BUY'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{trade.lot}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatPrice(trade.openPrice, trade.symbol)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {trade.takeProfit ? formatPrice(trade.takeProfit, trade.symbol) : '---'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {trade.stopLoss ? formatPrice(trade.stopLoss, trade.symbol) : '---'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatPrice(currentPrice, trade.symbol)}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${getPnLColor(pnl)}`}>
                          {Number.isFinite(pnl) ? `$${getNumericPrice(pnl).toFixed(2)}` : '---'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => onCloseTrade(trade.id)}
                            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded transition-colors"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div>
            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No closed positions</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-nova-gray border-b border-nova-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Symbol</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Lot</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Open</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Close</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Profit</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((trade) => (
                    <tr key={trade.id} className="border-b border-nova-border hover:bg-nova-gray transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{trade.symbol}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.type === 'BUY'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{trade.lot}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatPrice(trade.openPrice, trade.symbol)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatPrice(trade.closePrice, trade.symbol)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${getPnLColor(trade.pnl)}`}>
                        ${getNumericPrice(trade.pnl).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(trade.openTime)} {formatTime(trade.openTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
