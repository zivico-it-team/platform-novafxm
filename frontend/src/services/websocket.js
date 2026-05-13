'use client';

import { priceStoreApi } from '@/store/usePriceStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3002';
const SOCKET_URL = API_BASE.replace(/^http/, 'ws') + '/ws/prices';
const PRICE_URL = `${API_BASE}/api/prices`;
const MAX_RECONNECT_DELAY = 30000;

let socket = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let subscribers = 0;
let stopped = true;

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const loadInitialPrices = async () => {
  try {
    const response = await fetch(PRICE_URL);
    if (!response.ok) throw new Error(`Price snapshot failed with ${response.status}`);

    const payload = await response.json();
    const priceMap = Array.isArray(payload)
      ? payload.reduce((acc, item) => {
        if (item.symbol) acc[item.symbol] = item;
        return acc;
      }, {})
      : payload;

    priceStoreApi.upsertPrices(priceMap);
  } catch (error) {
    priceStoreApi.setConnectionStatus('reconnecting', error.message);
  }
};

const scheduleReconnect = () => {
  if (stopped) return;

  reconnectAttempts += 1;
  const delay = Math.min(1000 * 2 ** Math.max(0, reconnectAttempts - 1), MAX_RECONNECT_DELAY);
  priceStoreApi.setConnectionStatus('reconnecting');
  clearReconnectTimer();
  reconnectTimer = setTimeout(connectPriceSocket, delay);
};

export const connectPriceSocket = () => {
  if (typeof window === 'undefined' || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) {
    return;
  }

  stopped = false;
  clearReconnectTimer();
  priceStoreApi.setConnectionStatus('connecting');

  try {
    socket = new WebSocket(SOCKET_URL);

    socket.addEventListener('open', () => {
      reconnectAttempts = 0;
      priceStoreApi.setConnectionStatus('connected');
      loadInitialPrices();
    });

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === 'priceUpdate' && payload.data) {
          priceStoreApi.upsertPrices(payload.data);
        }
      } catch (error) {
        priceStoreApi.setConnectionStatus('connected', 'Ignored malformed price tick');
      }
    });

    socket.addEventListener('error', () => {
      priceStoreApi.setConnectionStatus('reconnecting', 'Live price socket error');
    });

    socket.addEventListener('close', () => {
      socket = null;
      scheduleReconnect();
    });
  } catch (error) {
    socket = null;
    priceStoreApi.setConnectionStatus('reconnecting', error.message);
    scheduleReconnect();
  }
};

export const subscribeToPriceFeed = () => {
  subscribers += 1;
  connectPriceSocket();
  loadInitialPrices();

  return () => {
    subscribers = Math.max(0, subscribers - 1);
    if (subscribers > 0) return;

    stopped = true;
    clearReconnectTimer();
    if (socket) {
      socket.close();
      socket = null;
    }
    priceStoreApi.setConnectionStatus('idle');
  };
};
