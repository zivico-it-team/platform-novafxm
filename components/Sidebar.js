'use client';

import { useEffect, useState } from 'react';
import { getCategories, getSymbolsByCategory } from '@/lib/symbolMeta';
import { formatSymbolPrice, getNumericPrice } from '@/lib/tradingEngine';
import { getLiveQuote, getQuoteSpread } from '@/lib/marketQuotes';

export default function Sidebar({ prices, selectedSymbol, onSymbolSelect, account }) {
  const [expandedCategory, setExpandedCategory] = useState('forex');
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const categories = getCategories();

  useEffect(() => {
    if (prices && Object.keys(prices).length > 0) {
      setPricesLoaded(true);
    }
  }, [prices]);

  const formatPrice = (price, symbol) => formatSymbolPrice(symbol, price);

  const getCategoryLabel = (category) => ({
    forex: 'Forex',
    metals: 'Metals',
    energies: 'Energies',
    indices: 'Indices',
    crypto: 'Crypto',
  }[category] || category);

  if (!pricesLoaded) {
    return (
      <div className="w-72 border-r border-nova-border bg-white h-screen overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-nova-border">
          <h2 className="font-semibold text-gray-900">Market Watch</h2>
        </div>
        <div className="p-4 text-center text-gray-500">Loading prices...</div>
      </div>
    );
  }

  return (
    <div className="w-72 border-r border-nova-border bg-white h-screen overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-nova-border">
        <h2 className="font-semibold text-gray-900">Market Watch</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {categories.map((category) => (
          <div key={category} className="border-b border-nova-border">
            <button
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="w-full px-4 py-3 text-left font-medium text-sm text-gray-700 hover:bg-nova-gray transition-colors flex items-center justify-between"
            >
              <span>{getCategoryLabel(category)}</span>
              <span className="text-gray-400 text-xs">
                {expandedCategory === category ? '-' : '+'}
              </span>
            </button>

            {expandedCategory === category && (
              <div className="bg-nova-gray">
                {getSymbolsByCategory(category).map((meta) => {
                  const quote = getLiveQuote(prices, meta.symbol);
                  const spread = getQuoteSpread(prices, meta.symbol);

                  return (
                    <button
                      key={meta.symbol}
                      onClick={() => onSymbolSelect(meta.symbol)}
                      className={`w-full px-4 py-2 text-left text-xs transition-colors border-l-2 ${
                        selectedSymbol === meta.symbol
                          ? 'bg-blue-50 border-l-nova-blue'
                          : 'border-l-transparent hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{meta.symbol}</span>
                        <span className={`text-[10px] font-semibold uppercase ${quote.source === 'live' ? 'text-green-600' : 'text-amber-600'}`}>
                          {quote.source === 'live' ? 'Live' : 'Fallback'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-gray-600 text-xs">
                        <span>Bid</span>
                        <span>{formatPrice(quote.bid, meta.symbol)}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600 text-xs">
                        <span>Ask</span>
                        <span>{formatPrice(quote.ask, meta.symbol)}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500 text-[10px] mt-1">
                        <span>Spread</span>
                        <span>{getNumericPrice(spread).toFixed(1)} pips</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-nova-border bg-nova-gray text-xs text-gray-600">
        <div>Leverage: 1:{account?.leverage || 200}</div>
        <div className="mt-1">Shared Live Market Feed</div>
        <div className="mt-1 text-gray-500">
          {account?.accountType === 'live' ? 'Live Account' : 'Demo Account'}
        </div>
      </div>
    </div>
  );
}
