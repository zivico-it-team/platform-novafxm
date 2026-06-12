import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SYMBOLS } from '../constants/symbols';
import { socketBaseUrl } from '../services/apiConfig';
import { createDemoTick, marketService } from '../services/marketService';

const hasTradingViewPrices = (symbols) => symbols?.some((item) => item.source === 'tradingview');

const hasValue = (value, allowZero = false) => {
  const number = Number(value);
  return Number.isFinite(number) && (allowZero || number !== 0);
};

const withPreviousValue = (item, previousItem, key, allowZero = false) => (
  hasValue(item?.[key], allowZero) || !hasValue(previousItem?.[key], allowZero)
    ? item?.[key]
    : previousItem[key]
);

const keepPreviousPrices = (previous, next) => {
  const previousBySymbol = new Map(previous.map((item) => [item.symbol, item]));
  const nextSymbols = new Set();
  const merged = next.map((item) => {
    const previousItem = previousBySymbol.get(item.symbol);
    nextSymbols.add(item.symbol);
    if (!previousItem) return item;

    return {
      ...previousItem,
      ...item,
      price: withPreviousValue(item, previousItem, 'price'),
      bid: withPreviousValue(item, previousItem, 'bid'),
      ask: withPreviousValue(item, previousItem, 'ask'),
      spread: withPreviousValue(item, previousItem, 'spread', true),
      spreadPoints: withPreviousValue(item, previousItem, 'spreadPoints', true),
      change: withPreviousValue(item, previousItem, 'change', true),
      decimals: item.decimals ?? previousItem.decimals,
      previousPrice: hasValue(previousItem.price) ? previousItem.price : previousItem.previousPrice,
      previousBid: hasValue(previousItem.bid) ? previousItem.bid : previousItem.previousBid,
      previousAsk: hasValue(previousItem.ask) ? previousItem.ask : previousItem.previousAsk,
    };
  });

  previous.forEach((item) => {
    if (!nextSymbols.has(item.symbol)) merged.push(item);
  });

  return merged;
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
