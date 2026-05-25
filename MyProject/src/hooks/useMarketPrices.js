import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { io } from 'socket.io-client';
import { SYMBOLS } from '../constants/symbols';
import { createDemoTick, marketService } from '../services/marketService';

export function useMarketPrices() {
  const [prices, setPrices] = useState(() => createDemoTick(SYMBOLS));
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    let receivingSocketPrices = false;
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api');
    const socket = io(apiUrl.replace(/\/api\/?$/, ''), { transports: ['websocket'], timeout: 4000, reconnection: true });
    socket.on('market:prices', (next) => {
      if (active && next?.length) {
        receivingSocketPrices = true;
        setPrices(next);
        setConnected(true);
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
          setPrices(next);
          setConnected(true);
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
