const fs = require('fs');
const path = require('path');
const {
  calculateAccountMetrics,
  calculatePnL,
  getExecutionPrice,
  getTriggeredExit,
} = require('./brokerEngine');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'local-db.json');

const defaultData = {
  nextUserId: 1,
  nextTradeId: 1,
  nextTradingAccountId: 1,
  nextAdminTransactionId: 1,
  nextBankInfoId: 1,
  nextDocumentId: 1,
  users: [],
  tradingAccounts: [],
  adminTransactions: [],
  bankInfos: [],
  documents: [],
  trades: [],
  history: [],
  prices: [],
};

const ensureStore = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
  }
};

const readData = () => {
  ensureStore();

  try {
    return { ...defaultData, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
  } catch (error) {
    return { ...defaultData };
  }
};

const writeData = (data) => {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role || (user.email === process.env.ADMIN_EMAIL ? 'admin' : 'customer'),
  account_type: user.account_type || 'demo',
  balance: user.balance,
  equity: user.equity,
  used_margin: user.used_margin,
  free_margin: user.free_margin,
  margin_level: user.margin_level,
  leverage: user.leverage,
});

const getDefaultAccountId = (data, userId) => {
  const accounts = data.tradingAccounts.filter((account) => account.user_id === Number(userId));
  return (
    accounts.find((account) => account.account_type === 'demo') ||
    accounts[0] ||
    null
  )?.id ?? null;
};

const getTradeAccountId = (data, trade) => trade.account_id ?? getDefaultAccountId(data, trade.user_id);

const publicAccount = (account) => ({
  id: account.id,
  user_id: account.user_id,
  username: account.username,
  account_number: account.account_number,
  account_type: account.account_type,
  name: account.name,
  balance: account.balance,
  bonus: Number(account.bonus || 0),
  equity: account.equity,
  used_margin: account.used_margin,
  free_margin: account.free_margin,
  margin_level: account.margin_level,
  leverage: account.leverage,
  status: account.status,
  created_at: account.created_at,
  updated_at: account.updated_at,
});

const publicBankInfo = (bankInfo) => ({
  id: bankInfo.id,
  user_id: bankInfo.user_id,
  bank_account_number: bankInfo.bank_account_number,
  account_holder_name: bankInfo.account_holder_name,
  bank_name: bankInfo.bank_name,
  branch: bankInfo.branch,
  swift_code: bankInfo.swift_code,
  bank_account_alias: bankInfo.bank_account_alias,
  created_at: bankInfo.created_at,
  updated_at: bankInfo.updated_at,
});

const publicDocument = (document, user = null) => ({
  id: document.id,
  user_id: document.user_id,
  document_type: document.document_type,
  file_name: document.file_name,
  file_size: document.file_size,
  mime_type: document.mime_type,
  link: document.link,
  status: document.status,
  reason: document.reason || '',
  created_at: document.created_at,
  processed_at: document.processed_at || null,
  processed_by: document.processed_by || null,
  user: user ? publicUser(user) : undefined,
});

const recalculateAccount = (data, account) => {
  const openTrades = data.trades.filter((trade) => (
    trade.user_id === Number(account.user_id) &&
    getTradeAccountId(data, trade) === Number(account.id) &&
    trade.status === 'open'
  ));
  const metrics = calculateAccountMetrics(account, openTrades);

  Object.assign(account, metrics, { updated_at: new Date().toISOString() });
  return account;
};

const localStore = {
  findUserByEmailOrUsername(email, username) {
    const data = readData();
    return data.users.find((user) => user.email === email || user.username === username) || null;
  },

  findUserByEmail(email) {
    const data = readData();
    return data.users.find((user) => user.email === email) || null;
  },

  getUser(id) {
    const data = readData();
    const user = data.users.find((item) => item.id === Number(id));
    return user ? publicUser(user) : null;
  },

  isAdmin(userId) {
    const data = readData();
    const user = data.users.find((item) => item.id === Number(userId));
    return Boolean(user && (user.role === 'admin' || user.email === process.env.ADMIN_EMAIL));
  },

  createUser({ email, username, password, accountType = 'demo', startingBalance = 10000 }) {
    const data = readData();
    const balance = Number(startingBalance);
    const user = {
      id: data.nextUserId++,
      email,
      username,
      password,
      role: email === process.env.ADMIN_EMAIL ? 'admin' : 'customer',
      account_type: accountType,
      balance,
      equity: balance,
      used_margin: 0,
      free_margin: balance,
      margin_level: 0,
      leverage: 200,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    data.users.push(user);
    writeData(data);
    return user.id;
  },

  getAdminAccounts() {
    const data = readData();
    const usersById = new Map(data.users.map((user) => [user.id, publicUser(user)]));
    const accounts = data.tradingAccounts
      .map((account) => ({
        ...publicAccount(account),
        user: usersById.get(account.user_id) || null,
      }))
      .filter((account) => account.user?.role !== 'admin');
    const live = accounts.filter((account) => account.account_type === 'live');
    const demo = accounts.filter((account) => account.account_type === 'demo');

    return {
      demo,
      live,
      totals: {
        demoAccounts: demo.length,
        liveAccounts: live.length,
        demoBalance: demo.reduce((sum, account) => sum + Number(account.balance || 0), 0),
        liveBalance: live.reduce((sum, account) => sum + Number(account.balance || 0), 0),
        liveBonus: live.reduce((sum, account) => sum + Number(account.bonus || 0), 0),
      },
      transactions: (data.adminTransactions || [])
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 100),
    };
  },

  adjustLiveAccountBalance({ adminUserId, accountId, amount, note = '' }) {
    const data = readData();
    const account = data.tradingAccounts.find(
      (item) => item.id === Number(accountId) && item.account_type === 'live' && item.status === 'active'
    );

    if (!account) {
      return { error: 'Live account not found', status: 404 };
    }

    const owner = data.users.find((user) => user.id === Number(account.user_id));
    if (owner && (owner.role === 'admin' || owner.email === process.env.ADMIN_EMAIL)) {
      return { error: 'Admin users do not use trading accounts', status: 403 };
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount === 0) {
      return { error: 'Amount must be a non-zero number', status: 400 };
    }

    account.balance = Number(account.balance || 0) + numericAmount;
    account.equity = Number(account.equity || 0) + numericAmount;
    account.free_margin = account.balance + Number(account.bonus || 0) - Number(account.used_margin || 0);
    account.updated_at = new Date().toISOString();

    const transaction = {
      id: data.nextAdminTransactionId++,
      admin_user_id: Number(adminUserId),
      account_id: account.id,
      user_id: account.user_id,
      account_number: account.account_number,
      type: numericAmount > 0 ? 'credit' : 'debit',
      amount: numericAmount,
      previous_balance: account.balance - numericAmount,
      new_balance: account.balance,
      note,
      created_at: new Date().toISOString(),
    };

    data.adminTransactions.push(transaction);
    writeData(data);

    return { account: publicAccount(account), transaction };
  },

  adjustLiveAccountBonus({ adminUserId, accountId, amount, note = '' }) {
    const data = readData();
    const account = data.tradingAccounts.find(
      (item) => item.id === Number(accountId) && item.account_type === 'live' && item.status === 'active'
    );

    if (!account) {
      return { error: 'Live account not found', status: 404 };
    }

    const owner = data.users.find((user) => user.id === Number(account.user_id));
    if (owner && (owner.role === 'admin' || owner.email === process.env.ADMIN_EMAIL)) {
      return { error: 'Admin users do not use trading accounts', status: 403 };
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount === 0) {
      return { error: 'Bonus amount must be a non-zero number', status: 400 };
    }

    const previousBonus = Number(account.bonus || 0);
    const nextBonus = previousBonus + numericAmount;
    if (nextBonus < 0) {
      return { error: 'Bonus cannot be less than 0', status: 400 };
    }

    account.bonus = nextBonus;
    recalculateAccount(data, account);
    account.updated_at = new Date().toISOString();

    const transaction = {
      id: data.nextAdminTransactionId++,
      admin_user_id: Number(adminUserId),
      account_id: account.id,
      user_id: account.user_id,
      account_number: account.account_number,
      type: numericAmount > 0 ? 'bonus_credit' : 'bonus_debit',
      amount: numericAmount,
      previous_balance: previousBonus,
      new_balance: account.bonus,
      note,
      created_at: new Date().toISOString(),
    };

    data.adminTransactions.push(transaction);
    writeData(data);

    return { account: publicAccount(account), transaction };
  },

  updateLeverage(userId, leverage) {
    const data = readData();
    const user = data.users.find((item) => item.id === Number(userId));
    if (!user) return false;

    user.leverage = Number(leverage);
    user.updated_at = new Date().toISOString();
    writeData(data);
    return true;
  },

  getTradingAccounts(userId) {
    if (this.isAdmin(userId)) return [];

    const data = readData();
    const user = data.users.find((item) => item.id === Number(userId));
    let changed = false;
    const accounts = data.tradingAccounts
      .filter((account) => account.user_id === Number(userId))
      .map((account) => {
        const before = JSON.stringify({
          equity: account.equity,
          used_margin: account.used_margin,
          free_margin: account.free_margin,
        });
        recalculateAccount(data, account);
        const after = JSON.stringify({
          equity: account.equity,
          used_margin: account.used_margin,
          free_margin: account.free_margin,
        });
        changed = changed || before !== after;
        return publicAccount({ ...account, username: user?.username });
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (changed) writeData(data);
    return accounts;
  },

  getAccountTransactions(userId) {
    const data = readData();
    return (data.adminTransactions || [])
      .filter((transaction) => transaction.user_id === Number(userId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 100);
  },

  createTradingAccount(userId, accountType) {
    const data = readData();
    const user = data.users.find((item) => item.id === Number(userId));
    if (!user) return { error: 'User not found', status: 404 };
    if (user.role === 'admin' || user.email === process.env.ADMIN_EMAIL) {
      return { error: 'Admin users do not use trading accounts', status: 403 };
    }

    const normalizedType = accountType === 'live' ? 'live' : 'demo';
    const startingBalance = normalizedType === 'live' ? 0 : 10000;
    const nextNumber = String(data.nextTradingAccountId).padStart(6, '0');
    const account = {
      id: data.nextTradingAccountId++,
      user_id: Number(userId),
      username: user.username,
      account_number: `${normalizedType.toUpperCase()}-${nextNumber}`,
      account_type: normalizedType,
      name: normalizedType === 'live' ? 'NovaFXM Live Account' : 'NovaFXM Demo Account',
      balance: startingBalance,
      bonus: 0,
      equity: startingBalance,
      used_margin: 0,
      free_margin: startingBalance,
      margin_level: 0,
      leverage: 200,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    data.tradingAccounts.push(account);
    writeData(data);
    return { account: publicAccount(account) };
  },

  getBankInfos(userId) {
    const data = readData();
    return (data.bankInfos || [])
      .filter((bankInfo) => bankInfo.user_id === Number(userId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((bankInfo) => publicBankInfo(bankInfo));
  },

  createBankInfo(userId, bankInfoData) {
    const data = readData();
    const user = data.users.find((item) => item.id === Number(userId));
    if (!user) return { error: 'User not found', status: 404 };
    if (user.role === 'admin' || user.email === process.env.ADMIN_EMAIL) {
      return { error: 'Admin users do not use bank information', status: 403 };
    }

    const requiredFields = [
      ['bank_account_number', 'Bank account number'],
      ['account_holder_name', 'Account holder name'],
      ['bank_name', 'Bank name'],
      ['branch', 'Branch'],
    ];

    for (const [field, label] of requiredFields) {
      if (!String(bankInfoData[field] || '').trim()) {
        return { error: `${label} is required`, status: 400 };
      }
    }

    const now = new Date().toISOString();
    const bankInfo = {
      id: data.nextBankInfoId++,
      user_id: Number(userId),
      bank_account_number: String(bankInfoData.bank_account_number || '').trim(),
      account_holder_name: String(bankInfoData.account_holder_name || '').trim(),
      bank_name: String(bankInfoData.bank_name || '').trim(),
      branch: String(bankInfoData.branch || '').trim(),
      swift_code: String(bankInfoData.swift_code || '').trim(),
      bank_account_alias: String(bankInfoData.bank_account_alias || '').trim(),
      created_at: now,
      updated_at: now,
    };

    data.bankInfos = data.bankInfos || [];
    data.bankInfos.push(bankInfo);
    writeData(data);
    return { bankInfo: publicBankInfo(bankInfo) };
  },

  getDocuments(userId) {
    const data = readData();
    return (data.documents || [])
      .filter((document) => document.user_id === Number(userId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((document) => publicDocument(document));
  },

  createDocument(userId, documentData) {
    const data = readData();
    const user = data.users.find((item) => item.id === Number(userId));
    if (!user) return { error: 'User not found', status: 404 };
    if (user.role === 'admin' || user.email === process.env.ADMIN_EMAIL) {
      return { error: 'Admin users do not upload account documents', status: 403 };
    }

    const documentType = String(documentData.document_type || '').trim();
    const fileName = String(documentData.file_name || '').trim();

    if (!documentType || !fileName) {
      return { error: 'Document type and file name are required', status: 400 };
    }

    const document = {
      id: data.nextDocumentId++,
      user_id: Number(userId),
      document_type: documentType,
      file_name: fileName,
      file_size: Number(documentData.file_size || 0),
      mime_type: documentData.mime_type || '',
      link: documentData.link || fileName,
      status: 'pending',
      reason: '',
      created_at: new Date().toISOString(),
      processed_at: null,
      processed_by: null,
    };

    data.documents = data.documents || [];
    data.documents.push(document);
    writeData(data);
    return { document: publicDocument(document) };
  },

  getAdminDocuments() {
    const data = readData();
    const usersById = new Map(data.users.map((user) => [user.id, user]));

    return (data.documents || [])
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((document) => publicDocument(document, usersById.get(document.user_id) || null));
  },

  decideDocument({ documentId, adminUserId, status, reason = '' }) {
    const data = readData();
    const document = (data.documents || []).find((item) => item.id === Number(documentId));
    if (!document) return { error: 'Document not found', status: 404 };

    if (!['approved', 'rejected'].includes(status)) {
      return { error: 'Status must be approved or rejected', status: 400 };
    }

    document.status = status;
    document.reason = status === 'rejected' ? String(reason || '') : '';
    document.processed_at = new Date().toISOString();
    document.processed_by = Number(adminUserId);

    writeData(data);
    return { document: publicDocument(document) };
  },

  getOpenTrades(userId, accountId = null) {
    const data = readData();
    return data.trades.filter((trade) => (
      trade.user_id === Number(userId) &&
      trade.status === 'open' &&
      (!accountId || getTradeAccountId(data, trade) === Number(accountId))
    ));
  },

  getTrades(userId, accountId = null) {
    const data = readData();
    return data.trades
      .filter((trade) => (
        trade.user_id === Number(userId) &&
        (!accountId || getTradeAccountId(data, trade) === Number(accountId))
      ))
      .sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at));
  },

  getHistory(userId, accountId = null) {
    const data = readData();
    return data.history
      .filter((trade) => (
        trade.user_id === Number(userId) &&
        (!accountId || getTradeAccountId(data, trade) === Number(accountId))
      ))
      .sort((a, b) => new Date(b.closed_at) - new Date(a.closed_at))
      .slice(0, 100);
  },

  openTrade(userId, accountId, tradeData, marginRequired) {
    const data = readData();
    const account = data.tradingAccounts.find(
      (item) => item.id === Number(accountId) && item.user_id === Number(userId) && item.status === 'active'
    );
    if (!account) return { error: 'Trading account not found', status: 404 };

    recalculateAccount(data, account);

    if (marginRequired > account.free_margin) {
      return { error: 'Insufficient margin', status: 400 };
    }

    const trade = {
      id: data.nextTradeId++,
      user_id: Number(userId),
      account_id: Number(accountId),
      symbol: tradeData.symbol,
      type: tradeData.type,
      lot_size: Number(tradeData.lot_size),
      open_price: Number(tradeData.open_price),
      close_price: null,
      take_profit: tradeData.take_profit,
      stop_loss: tradeData.stop_loss,
      pnl: 0,
      status: 'open',
      opened_at: new Date().toISOString(),
      closed_at: null,
      updated_at: new Date().toISOString(),
    };

    account.used_margin = Number(account.used_margin || 0) + Number(marginRequired);
    account.free_margin = Number(account.equity || account.balance) - account.used_margin;
    account.updated_at = new Date().toISOString();
    data.trades.push(trade);
    writeData(data);

    return { tradeId: trade.id };
  },

  closeTrade(userId, accountId, tradeId, requestedClosePrice = null) {
    const data = readData();
    const trade = data.trades.find(
      (item) => (
        item.id === Number(tradeId) &&
        item.user_id === Number(userId) &&
        getTradeAccountId(data, item) === Number(accountId) &&
        item.status === 'open'
      )
    );
    if (!trade) return { error: 'Trade not found', status: 404 };

    const closePrice = requestedClosePrice || getExecutionPrice({
      symbol: trade.symbol,
      type: trade.type,
      action: 'close',
    });
    if (!closePrice) {
      return { error: 'No executable broker quote is available for this symbol', status: 422 };
    }

    const pnl = calculatePnL({
      symbol: trade.symbol,
      type: trade.type,
      lotSize: trade.lot_size,
      openPrice: trade.open_price,
      closePrice,
    });

    trade.close_price = Number(closePrice);
    trade.pnl = pnl;
    trade.account_id = Number(accountId);
    trade.status = 'closed';
    trade.closed_at = new Date().toISOString();
    trade.updated_at = new Date().toISOString();

    data.history.push({ ...trade });

    const account = data.tradingAccounts.find(
      (item) => item.id === Number(accountId) && item.user_id === Number(userId)
    );
    if (account) {
      account.balance += pnl;
      recalculateAccount(data, account);
      account.updated_at = new Date().toISOString();
    }

    writeData(data);
    return { pnl };
  },

  updateTrade(userId, accountId, tradeId, updates) {
    const data = readData();
    const trade = data.trades.find((item) => (
      item.id === Number(tradeId) &&
      item.user_id === Number(userId) &&
      (!accountId || getTradeAccountId(data, item) === Number(accountId))
    ));
    if (!trade) return false;

    if (updates.take_profit !== undefined) trade.take_profit = updates.take_profit;
    if (updates.stop_loss !== undefined) trade.stop_loss = updates.stop_loss;
    trade.updated_at = new Date().toISOString();
    writeData(data);
    return true;
  },

  processTriggeredStops() {
    const data = readData();
    let closedCount = 0;

    data.trades
      .filter((trade) => trade.status === 'open')
      .forEach((trade) => {
        const triggeredExit = getTriggeredExit(trade);
        if (!triggeredExit) return;

        const accountId = getTradeAccountId(data, trade);
        const account = data.tradingAccounts.find(
          (item) => item.id === Number(accountId) && item.user_id === Number(trade.user_id)
        );
        if (!account) return;

        const pnl = calculatePnL({
          symbol: trade.symbol,
          type: trade.type,
          lotSize: trade.lot_size,
          openPrice: trade.open_price,
          closePrice: triggeredExit.closePrice,
        });

        trade.close_price = Number(triggeredExit.closePrice);
        trade.pnl = pnl;
        trade.account_id = Number(accountId);
        trade.status = 'closed';
        trade.close_reason = triggeredExit.reason;
        trade.closed_at = new Date().toISOString();
        trade.updated_at = new Date().toISOString();
        data.history.push({ ...trade });

        account.balance += pnl;
        recalculateAccount(data, account);
        closedCount++;
      });

    if (closedCount > 0) {
      writeData(data);
    }

    return closedCount;
  },

  getStats(userId) {
    const account = this.getUser(userId);
    const trades = this.getTrades(userId);
    const history = this.getHistory(userId);

    return {
      account,
      trades: {
        total_trades: trades.length,
        open_trades: trades.filter((trade) => trade.status === 'open').length,
      },
      history: {
        total_pnl: history.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0),
        closed_trades: history.length,
      },
    };
  },

  getPrices() {
    return readData().prices;
  },

  getPrice(symbol) {
    return readData().prices.find((price) => price.symbol === symbol) || null;
  },

  upsertPrice(symbol, price) {
    const data = readData();
    const existing = data.prices.find((item) => item.symbol === symbol);
    const nextPrice = {
      symbol,
      bid: Number(price.bid),
      ask: Number(price.ask),
      mid: Number(price.mid),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      Object.assign(existing, nextPrice);
    } else {
      data.prices.push(nextPrice);
    }

    writeData(data);
  },
};

module.exports = localStore;
