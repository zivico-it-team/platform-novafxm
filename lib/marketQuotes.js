import { getSymbolMeta } from './symbolMeta';
import { getBrokerQuote, getNumericPrice } from './tradingEngine';

export const getLiveQuote = (prices, symbol) => {
  const meta = getSymbolMeta(symbol);
  const rawQuote = prices?.[symbol] ?? meta?.base ?? 0;
  const quote = getBrokerQuote(symbol, rawQuote);

  return {
    ...quote,
    source: rawQuote?.source || 'fallback',
    updatedAt: rawQuote?.updatedAt || rawQuote?.updated_at || null,
  };
};

export const getOpenExecutionPrice = (prices, symbol, type) => {
  const quote = getLiveQuote(prices, symbol);
  return type === 'BUY' ? quote.ask : quote.bid;
};

export const getCloseExecutionPrice = (prices, trade) => {
  const quote = getLiveQuote(prices, trade.symbol);
  return trade.type === 'BUY' ? quote.bid : quote.ask;
};

export const getQuoteSpread = (prices, symbol) => {
  const meta = getSymbolMeta(symbol);
  const quote = getLiveQuote(prices, symbol);
  const pip = getNumericPrice(meta?.pip, 1);

  return pip > 0 ? (quote.ask - quote.bid) / pip : 0;
};

export const isLiveQuote = (prices, symbol) => {
  const source = getLiveQuote(prices, symbol).source;
  return source === 'live';
};
