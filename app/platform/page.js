'use client';

import { useTrading } from '@/lib/useTrading';
import { getSymbolMeta } from '@/lib/symbolMeta';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ChartPanel from '@/components/ChartPanel';
import TradingPanel from '@/components/TradingPanel';
import PositionsPanel from '@/components/PositionsPanel';
import { ProtectedRoute } from '@/context/ProtectedRoute';
import { useState } from 'react';

function PlatformContent() {
  const trading = useTrading();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSymbolSelect = (symbol) => {
    trading.setSelectedSymbol(symbol);
  };

  const handleSearch = (query) => {
    setSearchQuery(query.toUpperCase());
    if (query.trim()) {
      const meta = getSymbolMeta(query.toUpperCase());
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
          prices={trading.prices}
          selectedSymbol={trading.selectedSymbol}
          onSymbolSelect={handleSymbolSelect}
          account={trading.account}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex gap-4 p-4 overflow-hidden">
            <ChartPanel symbol={trading.selectedSymbol} prices={trading.prices} />
            <TradingPanel
              symbol={trading.selectedSymbol}
              prices={trading.prices}
              account={trading.account}
              onOpenTrade={trading.openTrade}
            />
          </div>

          <div className="border-t border-nova-border p-4 overflow-auto" style={{ maxHeight: '300px' }}>
            <PositionsPanel
              trades={trading.trades}
              history={trading.closedTrades}
              prices={trading.prices}
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
