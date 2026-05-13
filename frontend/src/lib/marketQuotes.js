import { getNumericPrice } from './tradingEngine';
import { priceStoreApi } from '@/store/usePriceStore';

const getPriceMap = (prices) => prices || priceStoreApi.getState().prices;

export const getLiveQuote = (prices, symbol) => {
  const quote = getPriceMap(prices)?.[symbol] || null;

  if (!quote) {
    return {
      bid: NaN,
      ask: NaN,
      mid: NaN,
      midPrice: NaN,
      spread: NaN,
      source: 'loading',
      updatedAt: null,
    };
  }

  return {
    bid: getNumericPrice(quote.bid, NaN),
    ask: getNumericPrice(quote.ask, NaN),
    mid: getNumericPrice(quote.midPrice ?? quote.mid, NaN),
    midPrice: getNumericPrice(quote.midPrice ?? quote.mid, NaN),
    spread: getNumericPrice(quote.spread, NaN),
    source: quote.source || 'live',
    updatedAt: quote.lastUpdate || quote.updatedAt || quote.updated_at || null,
  };
};

export const getMarketPrice = (prices, symbol) => {
  const quote = getLiveQuote(prices, symbol);
  return getNumericPrice(quote.midPrice, NaN);
};

export const getOpenExecutionPrice = (prices, symbol, type) => {
  const quote = getLiveQuote(prices, symbol);
  return String(type).toUpperCase() === 'BUY' ? quote.ask : quote.bid;
};

export const getCloseExecutionPrice = (prices, trade) => {
  const quote = getLiveQuote(prices, trade.symbol);
  return String(trade.type).toUpperCase() === 'BUY' ? quote.bid : quote.ask;
};

export const getQuoteSpread = (prices, symbol) => {
  return getLiveQuote(prices, symbol).spread;
};

export const isLiveQuote = (prices, symbol) => {
  return getLiveQuote(prices, symbol).source === 'live';
};
