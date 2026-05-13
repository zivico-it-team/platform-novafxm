'use client';

import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { subscribeToPriceFeed } from '@/services/websocket';
import { usePriceStore } from '@/store/usePriceStore';

export const useLivePrice = (symbol) => {
  useEffect(() => subscribeToPriceFeed(), []);

  useEffect(() => {
    if (symbol) {
      usePriceStore.getState().setSelectedSymbol(symbol);
    }
  }, [symbol]);

  return usePriceStore(useShallow((state) => {
    const quote = state.prices[symbol || state.symbol];

    return {
      bid: quote?.bid ?? state.bid,
      ask: quote?.ask ?? state.ask,
      midPrice: quote?.midPrice ?? state.midPrice,
      spread: quote?.spread ?? state.spread,
      symbol: symbol || state.symbol,
      lastUpdate: quote?.lastUpdate ?? state.lastUpdate,
      prices: state.prices,
      connectionStatus: state.connectionStatus,
      error: state.error,
    };
  }));
};
