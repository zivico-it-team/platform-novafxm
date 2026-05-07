// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getNetworkErrorMessage = () => {
  if (typeof window === 'undefined') {
    return 'Unable to reach the API server';
  }

  return `Unable to reach the backend at ${API_URL}. Make sure the backend is running.`;
};

const handleApiResponse = async (response) => {
  let data = {};

  if (response.headers.get('content-type')?.includes('application/json')) {
    try {
      data = await response.json();
    } catch (err) {
      console.error('Failed to parse JSON response:', err);
    }
  } else {
    const text = await response.text();
    if (text) {
      data = { error: text };
    }
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.details || response.statusText || 'Request failed';
    const error = new Error(errorMessage);
    error.status = response.status;
    error.details = data?.details;
    throw error;
  }

  return data;
};

// Auth endpoints
export const authAPI = {
  register: async (email, username, password, accountType = 'demo') => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, account_type: accountType }),
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.error('Register error:', error);
      return { error: error instanceof TypeError ? getNetworkErrorMessage() : error.message || 'Failed to register' };
    }
  },

  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      return await handleApiResponse(response);
    } catch (error) {
      console.error('Login error:', error);
      return { error: error instanceof TypeError ? getNetworkErrorMessage() : error.message || 'Failed to login' };
    }
  },
};

// Account endpoints
export const accountAPI = {
  getAccount: async (token) => {
    try {
      const response = await fetch(`${API_URL}/account/account`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Get account error:', error);
      return { error: error.message };
    }
  },

  getStats: async (token) => {
    try {
      const response = await fetch(`${API_URL}/account/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Get stats error:', error);
      return { error: error.message };
    }
  },

  updateLeverage: async (token, leverage) => {
    try {
      const response = await fetch(`${API_URL}/account/leverage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ leverage }),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Update leverage error:', error);
      return { error: error.message };
    }
  },

  getTradingAccounts: async (token) => {
    try {
      const response = await fetch(`${API_URL}/account/trading-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Get trading accounts error:', error);
      return { error: error.message };
    }
  },

  createTradingAccount: async (token, accountType) => {
    try {
      const response = await fetch(`${API_URL}/account/trading-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ account_type: accountType }),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Create trading account error:', error);
      return { error: error.message };
    }
  },
};

// Trades endpoints
const withAccountQuery = (url, accountId) => {
  if (!accountId) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}account_id=${encodeURIComponent(accountId)}`;
};

export const tradesAPI = {
  getOpenTrades: async (token, accountId) => {
    try {
      const response = await fetch(withAccountQuery(`${API_URL}/trades/open`, accountId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Get open trades error:', error);
      return { error: error.message };
    }
  },

  getAllTrades: async (token, accountId) => {
    try {
      const response = await fetch(withAccountQuery(`${API_URL}/trades`, accountId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Get all trades error:', error);
      return { error: error.message };
    }
  },

  getHistory: async (token, accountId) => {
    try {
      const response = await fetch(withAccountQuery(`${API_URL}/trades/history`, accountId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Get history error:', error);
      return { error: error.message };
    }
  },

  openTrade: async (token, tradeData) => {
    try {
      const response = await fetch(`${API_URL}/trades/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tradeData),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Open trade error:', error);
      return { error: error.message };
    }
  },

  closeTrade: async (token, tradeId, _closePrice, accountId) => {
    try {
      const response = await fetch(`${API_URL}/trades/${tradeId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ account_id: accountId }),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Close trade error:', error);
      return { error: error.message };
    }
  },

  updateTrade: async (token, tradeId, updates, accountId) => {
    try {
      const response = await fetch(withAccountQuery(`${API_URL}/trades/${tradeId}`, accountId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Update trade error:', error);
      return { error: error.message };
    }
  },
};

// Prices endpoints
export const pricesAPI = {
  getPrices: async () => {
    try {
      const response = await fetch(`${API_URL}/prices`);
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Get prices error:', error);
      return { error: error.message };
    }
  },

  getPrice: async (symbol) => {
    try {
      const response = await fetch(`${API_URL}/prices/${symbol}`);
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Get price error:', error);
      return { error: error.message };
    }
  },

  updatePrice: async (symbol, bid, ask, mid) => {
    try {
      const response = await fetch(`${API_URL}/prices/${symbol}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bid, ask, mid }),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Update price error:', error);
      return { error: error.message };
    }
  },
};

export const adminAPI = {
  getAccounts: async (token) => {
    try {
      const response = await fetch(`${API_URL}/admin/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Get admin accounts error:', error);
      return { error: error.message };
    }
  },

  adjustLiveAccount: async (token, accountId, amount, note = '') => {
    try {
      const response = await fetch(`${API_URL}/admin/live-accounts/${accountId}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, note }),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Adjust live account error:', error);
      return { error: error.message };
    }
  },
};
