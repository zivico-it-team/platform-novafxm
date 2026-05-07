'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/context/ProtectedRoute';
import { useAuth } from '@/context/useAuth';
import { adminAPI } from '@/lib/api';
import { getAccountDisplayName, getAccountShortName } from '@/lib/accountLabels';
import { useRouter } from 'next/navigation';

const formatMoney = (value) => (
  Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
);

function AdminContent() {
  const { token, user, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState({ demo: [], live: [], totals: {}, transactions: [] });
  const [activeTab, setActiveTab] = useState('live');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [amounts, setAmounts] = useState({});
  const [notes, setNotes] = useState({});
  const [savingAccountId, setSavingAccountId] = useState(null);

  const loadAccounts = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');
    const result = await adminAPI.getAccounts(token);

    if (result?.error) {
      setError(result.error);
    } else {
      setData(result);
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (user?.role && user.role !== 'admin') {
      router.replace('/');
      return;
    }

    loadAccounts();
  }, [loadAccounts, router, user?.role]);

  const liveTotals = useMemo(() => ({
    balance: data.live.reduce((sum, account) => sum + Number(account.balance || 0), 0),
    equity: data.live.reduce((sum, account) => sum + Number(account.equity || 0), 0),
    freeMargin: data.live.reduce((sum, account) => sum + Number(account.free_margin || 0), 0),
  }), [data.live]);

  const adjustAccount = async (accountId, direction) => {
    const rawAmount = Number(amounts[accountId]);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      setError('Enter an amount greater than 0');
      return;
    }

    const amount = direction === 'debit' ? -rawAmount : rawAmount;
    setSavingAccountId(accountId);
    setError('');
    setSuccess('');

    const result = await adminAPI.adjustLiveAccount(token, accountId, amount, notes[accountId] || '');

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(`${direction === 'debit' ? 'Withdrawal' : 'Deposit'} applied successfully`);
      setAmounts((prev) => ({ ...prev, [accountId]: '' }));
      setNotes((prev) => ({ ...prev, [accountId]: '' }));
      await loadAccounts();
    }

    setSavingAccountId(null);
  };

  const renderAccountRows = (accounts, showControls = false) => (
    <div className="overflow-x-auto border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Account</th>
            <th className="px-4 py-3 text-left font-semibold">User</th>
            <th className="px-4 py-3 text-right font-semibold">Balance</th>
            <th className="px-4 py-3 text-right font-semibold">Equity</th>
            <th className="px-4 py-3 text-right font-semibold">Free Margin</th>
            <th className="px-4 py-3 text-right font-semibold">Used Margin</th>
            {showControls && <th className="px-4 py-3 text-left font-semibold">Live Balance Control</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {accounts.length === 0 ? (
            <tr>
              <td colSpan={showControls ? 7 : 6} className="px-4 py-8 text-center text-slate-500">
                No accounts found
              </td>
            </tr>
          ) : accounts.map((account) => (
            <tr key={account.id} className="align-top">
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-900">{getAccountDisplayName(account)}</div>
                <div className="text-xs text-slate-500">{getAccountShortName(account)} - {account.account_number}</div>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{account.user?.email || 'Unknown'}</div>
                <div className="text-xs text-slate-500">{account.user?.username}</div>
              </td>
              <td className="px-4 py-3 text-right font-semibold">{formatMoney(account.balance)}</td>
              <td className="px-4 py-3 text-right">{formatMoney(account.equity)}</td>
              <td className="px-4 py-3 text-right">{formatMoney(account.free_margin)}</td>
              <td className="px-4 py-3 text-right">{formatMoney(account.used_margin)}</td>
              {showControls && (
                <td className="min-w-96 px-4 py-3">
                  <div className="grid gap-2 md:grid-cols-[120px_1fr]">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amounts[account.id] || ''}
                      onChange={(event) => setAmounts((prev) => ({ ...prev, [account.id]: event.target.value }))}
                      placeholder="Amount"
                      className="rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <input
                      type="text"
                      value={notes[account.id] || ''}
                      onChange={(event) => setNotes((prev) => ({ ...prev, [account.id]: event.target.value }))}
                      placeholder="Note"
                      className="rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => adjustAccount(account.id, 'credit')}
                      disabled={savingAccountId === account.id}
                      className="rounded bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Add Amount
                    </button>
                    <button
                      onClick={() => adjustAccount(account.id, 'debit')}
                      disabled={savingAccountId === account.id}
                      className="rounded bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      Withdraw (-)
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Controller</h1>
            <p className="text-sm text-slate-500">Manage registered Demo and Live trading accounts</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <div className="font-semibold">{user?.email}</div>
              <div className="text-xs uppercase text-slate-500">{user?.role || 'admin'}</div>
            </div>
            <button onClick={logout} className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-4">
          <div className="border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-500">Demo Accounts</p>
            <p className="mt-2 text-2xl font-bold">{data.totals?.demoAccounts || 0}</p>
          </div>
          <div className="border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-500">Live Accounts</p>
            <p className="mt-2 text-2xl font-bold">{data.totals?.liveAccounts || 0}</p>
          </div>
          <div className="border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-500">Live Balance</p>
            <p className="mt-2 text-2xl font-bold">{formatMoney(liveTotals.balance)}</p>
          </div>
          <div className="border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-500">Live Free Margin</p>
            <p className="mt-2 text-2xl font-bold">{formatMoney(liveTotals.freeMargin)}</p>
          </div>
        </section>

        {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        {success && <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>}

        <section className="bg-white">
          <div className="flex items-center justify-between border border-slate-200 border-b-0 px-4 py-3">
            <div className="flex gap-2">
              {[
                ['live', 'Live Accounts'],
                ['demo', 'Demo Accounts'],
                ['history', 'Admin Transactions'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  className={`rounded px-3 py-2 text-sm font-semibold ${
                    activeTab === value ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button onClick={loadAccounts} className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="border border-slate-200 bg-white p-8 text-center text-slate-500">Loading admin data...</div>
          ) : activeTab === 'live' ? (
            renderAccountRows(data.live, true)
          ) : activeTab === 'demo' ? (
            renderAccountRows(data.demo)
          ) : (
            <div className="overflow-x-auto border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Account</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">New Balance</th>
                    <th className="px-4 py-3 text-left">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.transactions || []).map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-4 py-3">{new Date(transaction.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold">{transaction.account_number}</td>
                      <td className="px-4 py-3 capitalize">{transaction.type}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        Number(transaction.amount) < 0 ? 'text-red-700' : 'text-emerald-700'
                      }`}>
                        {formatMoney(transaction.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">{formatMoney(transaction.new_balance)}</td>
                      <td className="px-4 py-3">{transaction.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  );
}
