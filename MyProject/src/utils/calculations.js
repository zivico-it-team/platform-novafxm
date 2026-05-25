export const contractSize = (symbol) => {
  if (symbol.includes('BTC') || symbol.includes('ETH') || symbol === 'US500') return 1;
  if (symbol.includes('XAU') || symbol.includes('OIL')) return 100;
  return 100000;
};

export const calculateProfit = (position, price) => {
  const direction = position.side === 'BUY' ? 1 : -1;
  return (Number(price) - Number(position.openPrice)) * direction * Number(position.lots) * contractSize(position.symbol);
};

export const calculateSummary = (balance, positions) => {
  const openProfit = positions.reduce((total, position) => total + Number(position.profit || 0), 0);
  const margin = positions.reduce((total, position) => total + Number(position.lots) * 100, 0);
  const equity = Number(balance) + openProfit;
  const freeFunds = equity - margin;
  const marginLevel = margin ? (equity / margin) * 100 : 0;
  return { balance: Number(balance), equity, margin, freeFunds, marginLevel, openProfit, bonus: 0 };
};
