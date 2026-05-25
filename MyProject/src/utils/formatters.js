export const money = (value) =>
  Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const quote = (value, decimals = 5) => Number(value || 0).toFixed(decimals);

export const percent = (value) => `${Number(value || 0) >= 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`;

export const dateTime = (value) =>
  new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
