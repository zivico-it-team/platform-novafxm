const getAccountType = (account = {}) => account.accountType || account.account_type || 'demo';

const getAccountNumber = (account = {}) => account.accountNumber || account.account_number || '';

const getUsername = (account = {}) => account.username || account.user?.username || '';

const getAccountSuffix = (account = {}) => {
  const accountNumber = getAccountNumber(account);
  const match = accountNumber.match(/(?:DEMO|LIVE)-(.+)$/i);
  return match?.[1] || accountNumber;
};

export const getAccountTypeLabel = (account = {}) => (
  getAccountType(account) === 'live' ? 'live' : 'demo'
);

export const getAccountDisplayName = (account = {}) => {
  const suffix = getAccountSuffix(account);
  const accountName = suffix ? `${getAccountTypeLabel(account)} ${suffix}` : getAccountTypeLabel(account);
  const username = getUsername(account);

  return username ? `${username}:${accountName}` : accountName;
};

export const getAccountShortName = (account = {}) => (
  getAccountType(account) === 'live' ? 'live' : 'demo'
);
