'use client';

import { useTrading } from '@/hooks/useTrading';
import { useLivePrice } from '@/hooks/useLivePrice';
import { getSymbolMeta } from '@/lib/symbolMeta';
import Navbar from '@/components/trading/Navbar';
import Sidebar from '@/components/trading/market-watch/MarketWatch';
import ChartPanel from '@/components/trading/chart/ChartPanel';
import TradingPanel from '@/components/trading/order-panel/OrderPanel';
import PositionsPanel from '@/components/trading/positions/PositionsPanel';
import { ProtectedRoute } from '@/context/ProtectedRoute';
import { useState } from 'react';

const normalizeSymbolSearch = (value) => value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

function PlatformContent() {
  const trading = useTrading();
  const livePrice = useLivePrice(trading.selectedSymbol);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSymbolSelect = (symbol) => {
    trading.setSelectedSymbol(symbol);
  };

  const handleSearch = (query) => {
    const normalizedQuery = query.toUpperCase();
    setSearchQuery(normalizedQuery);

    if (query.trim()) {
      const searchKey = normalizeSymbolSearch(query);
      const meta = getSymbolMeta(normalizedQuery.trim()) ||
        getSymbolMeta(`${searchKey.slice(0, 3)}/${searchKey.slice(3)}`);

      if (meta) {
        trading.setSelectedSymbol(meta.symbol);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <Navbar
        account={trading.account}
        accounts={trading.accounts}
        selectedAccountId={trading.selectedAccountId}
        onAccountChange={trading.switchAccount}
        onSearch={handleSearch}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedSymbol={trading.selectedSymbol}
          onSymbolSelect={handleSymbolSelect}
          account={trading.account}
          searchQuery={searchQuery}
          connectionStatus={livePrice.connectionStatus}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex gap-4 p-4 overflow-hidden">
            <ChartPanel
              symbol={trading.selectedSymbol}
              trades={trading.trades}
            />
            <TradingPanel
              symbol={trading.selectedSymbol}
              account={trading.account}
              onOpenTrade={trading.openTrade}
            />
          </div>

          <div className="border-t border-nova-border p-4 overflow-auto" style={{ maxHeight: '300px' }}>
            <PositionsPanel
              trades={trading.trades}
              history={trading.closedTrades}
              onCloseTrade={trading.closeTrade}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlatformPage() {
  return (
    <ProtectedRoute>
      <PlatformContent />
    </ProtectedRoute>
  );
}
