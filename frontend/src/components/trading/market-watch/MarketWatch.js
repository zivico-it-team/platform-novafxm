'use client';

import { useEffect, useState } from 'react';
import { usePriceStore } from '@/store/usePriceStore';
import { getCategories, getSymbolsByCategory } from '@/lib/symbolMeta';
import { formatSymbolPrice, getNumericPrice } from '@/lib/tradingEngine';
import { getLiveQuote, getQuoteSpread, isLiveQuote } from '@/lib/marketQuotes';

const normalizeSymbolSearch = (value) => value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

const symbolMatchesSearch = (meta, searchQuery) => {
  const query = normalizeSymbolSearch(searchQuery);
  if (!query) return true;

  const symbolKey = normalizeSymbolSearch(meta.symbol);
  const tvKey = normalizeSymbolSearch(meta.tv || '');
  const categoryKey = normalizeSymbolSearch(meta.category || '');

  return (
    symbolKey.includes(query) ||
    tvKey.includes(query) ||
    categoryKey.includes(query)
  );
};

const getSourceLabel = (source) => {
  if (source === 'live') return 'Live';
  if (source === 'loading') return 'Loading';
  return 'Initial';
};

const formatSpread = (spread) => (
  Number.isFinite(spread) ? `${getNumericPrice(spread).toFixed(1)} pips` : '---'
);

export default function Sidebar({ selectedSymbol, onSymbolSelect, account, searchQuery = '', connectionStatus }) {
  const prices = usePriceStore((snapshot) => snapshot.prices);
  const storeConnectionStatus = usePriceStore((snapshot) => snapshot.connectionStatus);
  const [expandedCategory, setExpandedCategory] = useState('forex');
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const categories = getCategories();
  const hasSearch = Boolean(searchQuery.trim());
  const searchResults = categories
    .flatMap((category) => getSymbolsByCategory(category))
    .filter((meta) => symbolMatchesSearch(meta, searchQuery));
  const liveCount = categories
    .flatMap((category) => getSymbolsByCategory(category))
    .filter((meta) => isLiveQuote(prices, meta.symbol))
    .length;
  const totalSymbols = categories
    .flatMap((category) => getSymbolsByCategory(category))
    .length;

  useEffect(() => {
    if (prices && Object.keys(prices).length > 0) {
      setPricesLoaded(true);
    }
  }, [prices]);

  const formatPrice = (price, symbol) => (
    Number.isFinite(Number(price)) ? formatSymbolPrice(symbol, price) : '---'
  );

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
        <div className="p-4 text-center text-gray-500">
          Loading prices...
          <div className="mt-2 text-xs capitalize">{connectionStatus || storeConnectionStatus}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 border-r border-nova-border bg-white h-screen overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-nova-border">
        <h2 className="font-semibold text-gray-900">Market Watch</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {hasSearch ? (
          <div className="bg-nova-gray">
            {searchResults.length === 0 ? (
              <div className="px-4 py-5 text-sm text-gray-500">No symbols found</div>
            ) : searchResults.map((meta) => {
              const quote = getLiveQuote(prices, meta.symbol);
              const spread = getQuoteSpread(prices, meta.symbol);

              return (
                <button
                  key={meta.symbol}
                  onClick={() => onSymbolSelect(meta.symbol)}
                  className={`w-full px-4 py-2 text-left text-xs transition-colors border-l-2 ${
                    selectedSymbol === meta.symbol
                      ? 'bg-yellow-50 border-l-nova-blue'
                      : 'border-l-transparent hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{meta.symbol}</span>
                    <span className={`text-[10px] font-semibold uppercase ${quote.source === 'live' ? 'text-green-600' : 'text-amber-600'}`}>
                      {getSourceLabel(quote.source)}
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
                    <span>{formatSpread(spread)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : categories.map((category) => (
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
                          ? 'bg-yellow-50 border-l-nova-blue'
                          : 'border-l-transparent hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{meta.symbol}</span>
                        <span className={`text-[10px] font-semibold uppercase ${quote.source === 'live' ? 'text-green-600' : 'text-amber-600'}`}>
                          {getSourceLabel(quote.source)}
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
                        <span>{formatSpread(spread)}</span>
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
        <div className="mt-1">Live feed: {liveCount}/{totalSymbols} symbols</div>
        <div className="mt-1 capitalize">Status: {connectionStatus || storeConnectionStatus}</div>
        <div className="mt-1 text-gray-500">
          {account?.accountType === 'live' ? 'Live Account' : 'Demo Account'}
        </div>
      </div>
    </div>
  );
}
