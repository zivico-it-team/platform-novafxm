'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/useAuth';
import { accountAPI } from '@/services/api';
import { getAccountDisplayName, getAccountShortName } from '@/utils/accountLabels';

const formatMoney = (value) => (
  Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
);

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Accounts', href: '/accounts' },
  { label: 'Profile', href: '/bank-info' },
];

const activityTabs = [
  { label: 'All', value: 'all' },
  { label: 'Deposit', value: 'deposit' },
  { label: 'Bonus', value: 'bonus' },
  { label: 'Withdrawal', value: 'withdrawal' },
];

const getTransactionCategory = (transaction) => {
  const type = String(transaction.type || '').toLowerCase();
  const amount = Number(transaction.amount || 0);

  if (type === 'bonus_credit' || type === 'bonus_debit' || type === 'bonus') return 'bonus';
  if (type === 'credit' || type === 'deposit' || amount > 0) return 'deposit';
  if (type === 'debit' || type === 'withdrawal' || amount < 0) return 'withdrawal';
  if (type === 'transfer') return 'transfer';
  return 'transfer';
};

const getTransactionLabel = (transaction) => {
  const category = getTransactionCategory(transaction);
  if (category === 'bonus') {
    return Number(transaction.amount || 0) < 0 ? 'Bonus Removed' : 'Bonus';
  }

  return category;
};

export default function CustomerDashboard({ activeNav = 'Dashboard' }) {
  const { user, token, logout } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeActivityTab, setActiveActivityTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [creatingType, setCreatingType] = useState('');
  const [error, setError] = useState('');

  const totals = useMemo(() => (
    accounts.reduce(
      (sum, account) => ({
        balance: sum.balance + Number(account.balance || 0),
        demo: sum.demo + (account.account_type === 'demo' ? 1 : 0),
        live: sum.live + (account.account_type === 'live' ? 1 : 0),
      }),
      { balance: 0, demo: 0, live: 0 }
    )
  ), [accounts]);

  const activityCounts = useMemo(() => (
    transactions.reduce(
      (counts, transaction) => {
        const category = getTransactionCategory(transaction);
        return {
          ...counts,
          all: counts.all + 1,
          [category]: (counts[category] || 0) + 1,
        };
      },
      { all: 0, deposit: 0, bonus: 0, transfer: 0, withdrawal: 0 }
    )
  ), [transactions]);

  const filteredTransactions = useMemo(() => (
    activeActivityTab === 'all'
      ? transactions
      : transactions.filter((transaction) => getTransactionCategory(transaction) === activeActivityTab)
  ), [activeActivityTab, transactions]);

  const loadAccounts = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');
    const [accountsResult, transactionsResult] = await Promise.all([
      accountAPI.getTradingAccounts(token),
      accountAPI.getTransactions(token),
    ]);

    if (accountsResult?.error || transactionsResult?.error) {
      setError(accountsResult?.error || transactionsResult?.error);
    } else {
      setAccounts(accountsResult || []);
      setTransactions(transactionsResult || []);
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const createAccount = async (accountType) => {
    setCreatingType(accountType);
    setError('');
    const result = await accountAPI.createTradingAccount(token, accountType);

    if (result?.error) {
      setError(result.error);
    } else {
      setAccounts((prev) => [result, ...prev]);
    }

    setCreatingType('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 w-56 border-r border-slate-200 bg-white">
        <div className="px-5 py-6">
          <Image
            src="/novafxm-logo.jpeg"
            alt="NovaFXM Global Forex Trading"
            width={160}
            height={49}
            priority
          />
          <p className="mt-2 text-xs text-slate-500">Client Portal</p>
        </div>

        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`block w-full rounded px-3 py-2 text-left text-sm font-medium ${
                item.label === activeNav
                  ? 'bg-nova-green text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="ml-56 min-h-screen">
        <header className="flex h-16 items-center justify-end gap-4 border-b border-slate-200 bg-white px-6">
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="rounded-lg border border-nova-gold/50 bg-yellow-50 px-4 py-2 text-sm font-semibold text-nova-green hover:bg-yellow-100"
            >
              Admin
            </Link>
          )}
          <Link
            href="/platform"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Platform
          </Link>
          <div className="text-right">
            <div className="text-sm font-semibold">User Dashboard</div>
            <div className="max-w-44 truncate text-xs text-slate-500">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Logout
          </button>
        </header>

        <div className="space-y-6 p-6">
          <section className="rounded-lg border border-slate-200 bg-gradient-to-r from-yellow-50 via-green-50 to-slate-100 p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">
                  Welcome Back, <span className="text-nova-green">{user?.username || 'User'}</span>
                </h1>
                <div className="mt-4 h-1 w-32 rounded bg-gradient-to-r from-nova-green to-nova-gold" />
                <p className="mt-4 text-sm font-medium text-slate-600">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => createAccount('demo')}
                  disabled={Boolean(creatingType)}
                  className="rounded-lg bg-nova-green px-5 py-3 text-sm font-bold text-white shadow hover:bg-nova-black disabled:opacity-60"
                >
                  {creatingType === 'demo' ? 'Creating...' : 'Create Demo'}
                </button>
                <button
                  onClick={() => createAccount('live')}
                  disabled={Boolean(creatingType)}
                  className="rounded-lg bg-nova-green px-5 py-3 text-sm font-bold text-white shadow hover:bg-nova-black disabled:opacity-60"
                >
                  {creatingType === 'live' ? 'Creating...' : 'Create Live'}
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-nova-gold/50 bg-yellow-50 p-5">
                  <p className="text-xs font-medium text-slate-500">Current Balance</p>
                  <p className="mt-2 text-2xl font-bold">{formatMoney(totals.balance)} USD</p>
                </div>
                <div className="rounded-lg border border-nova-green/30 bg-green-50 p-5">
                  <p className="text-xs font-medium text-slate-500">Demo Accounts</p>
                  <p className="mt-2 text-2xl font-bold">{totals.demo}</p>
                </div>
                <div className="rounded-lg border border-nova-green/30 bg-green-50 p-5">
                  <p className="text-xs font-medium text-slate-500">Live Accounts</p>
                  <p className="mt-2 text-2xl font-bold">{totals.live}</p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Account Summary</h2>
                  <p className="text-sm text-slate-500">Your trading accounts overview</p>
                </div>
                <button onClick={loadAccounts} className="text-sm font-semibold text-nova-green hover:underline">
                  Refresh
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {loading ? (
                  <div className="rounded-lg border border-slate-200 p-5 text-sm text-slate-500">Loading accounts...</div>
                ) : accounts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                    No trading accounts yet. Create a Demo or Live account to begin.
                  </div>
                ) : (
                  accounts.map((account) => (
                    <div key={account.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold uppercase">
                            {getAccountDisplayName(account)}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">{account.name || account.account_number}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          account.account_type === 'live'
                            ? 'bg-yellow-100 text-nova-green'
                            : 'bg-green-100 text-nova-green'
                        }`}>
                          {getAccountShortName(account)}
                        </span>
                      </div>
                      <p className="mt-5 text-xs font-medium text-slate-500">Balance</p>
                      <p className="mt-1 text-lg font-bold">{formatMoney(account.balance)} USD</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold">Recent Activity</h2>
              <p className="mt-1 text-sm text-slate-500">Your latest transactions and activities</p>

              <div className="mt-6 rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {activityTabs.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setActiveActivityTab(item.value)}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                        activeActivityTab === item.value
                          ? 'bg-nova-green text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label} {activityCounts[item.value] || 0}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 min-h-80 rounded-lg border border-slate-200">
                {filteredTransactions.length === 0 ? (
                  <div className="flex min-h-80 items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-50 text-3xl font-bold text-nova-green">
                        0
                      </div>
                      <h3 className="mt-5 text-lg font-bold text-slate-600">You have no transactions yet</h3>
                      <p className="mt-1 text-sm text-slate-500">Create or fund an account to get started.</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredTransactions.map((transaction) => {
                      const category = getTransactionCategory(transaction);
                      const label = getTransactionLabel(transaction);
                      const amount = Number(transaction.amount || 0);

                      return (
                        <div key={transaction.id} className="flex items-center justify-between gap-4 px-4 py-3">
                          <div>
                            <p className="text-sm font-bold capitalize">{label}</p>
                            <p className="text-xs text-slate-500">
                              {transaction.account_number} {transaction.note ? `- ${transaction.note}` : ''}
                            </p>
                            <p className="text-xs text-slate-400">{new Date(transaction.created_at).toLocaleString()}</p>
                          </div>
                          <div className={`text-right text-sm font-bold ${amount < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                            {amount < 0 ? '-' : '+'}{formatMoney(Math.abs(amount))} USD
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
