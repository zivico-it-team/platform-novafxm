'use client';

import { create } from 'zustand';
import { getSymbolMeta } from '@/lib/symbolMeta';
import { getNumericPrice } from '@/lib/tradingEngine';

/**
 * @typedef {'idle'|'connecting'|'connected'|'reconnecting'|'disconnected'} ConnectionStatus
 *
 * @typedef {Object} PriceQuote
 * @property {string} symbol
 * @property {number} bid
 * @property {number} ask
 * @property {number} midPrice
 * @property {number} mid
 * @property {number} spread Spread in pips/points according to symbol metadata.
 * @property {'live'|'initial'|'snapshot'} source
 * @property {string} lastUpdate
 *
 * @typedef {Object} PriceState
 * @property {number|null} bid
 * @property {number|null} ask
 * @property {number|null} midPrice
 * @property {number|null} spread
 * @property {string} symbol
 * @property {string|null} lastUpdate
 * @property {Record<string, PriceQuote>} prices
 * @property {ConnectionStatus} connectionStatus
 * @property {string} error
 * @property {(symbol: string) => void} setSelectedSymbol
 * @property {(connectionStatus: ConnectionStatus, error?: string) => void} setConnectionStatus
 * @property {(priceMap: Record<string, unknown>|Array<unknown>) => void} upsertPrices
 */

const DEFAULT_SYMBOL = 'EUR/USD';

const roundToDigits = (value, digits) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(digits)) : null;
};

const getQuoteTimestamp = (quote) => (
  quote?.lastUpdate ||
  quote?.updatedAt ||
  quote?.updated_at ||
  quote?.timestamp ||
  new Date().toISOString()
);

export const normalizePriceQuote = (symbol, value) => {
  const meta = getSymbolMeta(symbol);
  if (!meta || value == null || typeof value !== 'object') return null;

  const digits = meta.digits ?? 2;
  const bid = getNumericPrice(value.bid, NaN);
  const ask = getNumericPrice(value.ask, NaN);
  const providedMid = getNumericPrice(value.mid ?? value.midPrice ?? value.price, NaN);
  const mid = Number.isFinite(providedMid)
    ? providedMid
    : Number.isFinite(bid) && Number.isFinite(ask)
      ? (bid + ask) / 2
      : NaN;

  if (!Number.isFinite(bid) || !Number.isFinite(ask) || !Number.isFinite(mid)) {
    return null;
  }

  const roundedBid = roundToDigits(bid, digits);
  const roundedAsk = roundToDigits(ask, digits);
  const roundedMid = roundToDigits(mid, digits);
  const pip = getNumericPrice(meta.pip, 1);
  const spread = pip > 0 ? Number(((roundedAsk - roundedBid) / pip).toFixed(1)) : 0;

  return {
    symbol,
    bid: roundedBid,
    ask: roundedAsk,
    midPrice: roundedMid,
    mid: roundedMid,
    spread,
    source: value.source === 'live' ? 'live' : value.source === 'snapshot' ? 'snapshot' : 'initial',
    lastUpdate: getQuoteTimestamp(value),
  };
};

const normalizePriceMap = (input) => {
  const entries = Array.isArray(input)
    ? input.map((item) => [item?.symbol, item])
    : Object.entries(input || {});

  return entries.reduce((priceMap, [symbol, quote]) => {
    if (!symbol) return priceMap;
    const normalized = normalizePriceQuote(symbol, quote);
    if (normalized) priceMap[symbol] = normalized;
    return priceMap;
  }, {});
};

const deriveActiveQuote = (prices, symbol) => {
  const quote = prices[symbol];

  return {
    bid: quote?.bid ?? null,
    ask: quote?.ask ?? null,
    midPrice: quote?.midPrice ?? null,
    spread: quote?.spread ?? null,
    lastUpdate: quote?.lastUpdate ?? null,
  };
};

const shallowQuoteEqual = (a, b) => (
  Boolean(a && b) &&
  a.bid === b.bid &&
  a.ask === b.ask &&
  a.midPrice === b.midPrice &&
  a.spread === b.spread &&
  a.source === b.source &&
  a.lastUpdate === b.lastUpdate
);

export const usePriceStore = create((set, get) => ({
  bid: null,
  ask: null,
  midPrice: null,
  spread: null,
  symbol: DEFAULT_SYMBOL,
  lastUpdate: null,
  prices: {},
  connectionStatus: 'idle',
  error: '',

  setSelectedSymbol: (symbol) => {
    if (!symbol || symbol === get().symbol) return;
    set((state) => ({
      symbol,
      ...deriveActiveQuote(state.prices, symbol),
    }));
  },

  setConnectionStatus: (connectionStatus, error = '') => {
    const state = get();
    if (state.connectionStatus === connectionStatus && state.error === error) return;
    set({ connectionStatus, error });
  },

  upsertPrices: (priceMap = {}) => {
    const normalizedPrices = normalizePriceMap(priceMap);
    if (Object.keys(normalizedPrices).length === 0) return;

    set((state) => {
      const nextPrices = { ...state.prices };
      let changed = false;

      Object.entries(normalizedPrices).forEach(([symbol, quote]) => {
        if (!shallowQuoteEqual(nextPrices[symbol], quote)) {
          nextPrices[symbol] = quote;
          changed = true;
        }
      });

      if (!changed) return state;

      return {
        prices: nextPrices,
        ...deriveActiveQuote(nextPrices, state.symbol),
      };
    });
  },
}));

export const priceStoreApi = {
  getState: usePriceStore.getState,
  subscribe: usePriceStore.subscribe,
  setSelectedSymbol: (symbol) => usePriceStore.getState().setSelectedSymbol(symbol),
  setConnectionStatus: (connectionStatus, error = '') => (
    usePriceStore.getState().setConnectionStatus(connectionStatus, error)
  ),
  upsertPrices: (priceMap) => usePriceStore.getState().upsertPrices(priceMap),
};

export const selectQuote = (symbol) => usePriceStore.getState().prices[symbol] || null;
