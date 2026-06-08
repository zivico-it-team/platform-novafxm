import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SYMBOLS } from '../constants/symbols';
import { socketBaseUrl } from '../services/apiConfig';
import { createDemoTick, marketService } from '../services/marketService';

const hasTradingViewPrices = (symbols) => symbols?.some((item) => item.source === 'tradingview');

const keepPreviousPrices = (previous, next) => {
  const previousBySymbol = new Map(previous.map((item) => [item.symbol, item]));
  return next.map((item) => {
    const previousItem = previousBySymbol.get(item.symbol);
    if (previousItem && item.source !== 'tradingview' && !Number(item.price)) return previousItem;
    return item;
  });
};

export function useMarketPrices() {
  const [prices, setPrices] = useState(() => createDemoTick(SYMBOLS));
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    let receivingSocketPrices = false;
    const socket = io(socketBaseUrl(), { transports: ['websocket'], timeout: 4000, reconnection: true });
    socket.on('market:prices', (next) => {
      if (active && next?.length) {
        receivingSocketPrices = true;
        setPrices((current) => {
          const merged = keepPreviousPrices(current, next);
          setConnected(hasTradingViewPrices(merged));
          return merged;
        });
      }
    });
    socket.on('disconnect', () => {
      receivingSocketPrices = false;
      if (active) setConnected(false);
    });
    const load = async () => {
      try {
        const next = await marketService.getPrices();
        if (active) {
          setPrices((current) => {
            const merged = keepPreviousPrices(current, next);
            setConnected(hasTradingViewPrices(merged));
            return merged;
          });
        }
      } catch {
        if (active) {
          setPrices((current) => createDemoTick(current));
          setConnected(false);
        }
      }
    };
    load();
    const timer = setInterval(() => {
      if (!receivingSocketPrices) load();
    }, 2000);
    return () => {
      active = false;
      clearInterval(timer);
      socket.disconnect();
    };
  }, []);

  return { prices, connected };
}
