'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/context/ProtectedRoute';
import { useAuth } from '@/context/useAuth';
import { adminAPI } from '@/services/api';
import { getAccountDisplayName, getAccountShortName } from '@/utils/accountLabels';
import { useRouter } from 'next/navigation';

const formatMoney = (value) => (
  Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
);

const formatTransactionType = (type) => String(type || '')
  .split('_')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

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
  const [bonusAmounts, setBonusAmounts] = useState({});
  const [bonusNotes, setBonusNotes] = useState({});
  const [savingAccountId, setSavingAccountId] = useState(null);
  const [savingBonusAccountId, setSavingBonusAccountId] = useState(null);
  const [documentReasons, setDocumentReasons] = useState({});
  const [savingDocumentId, setSavingDocumentId] = useState(null);

  const loadAccounts = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');
    const [accountsResult, documentsResult] = await Promise.all([
      adminAPI.getAccounts(token),
      adminAPI.getDocuments(token),
    ]);

    if (accountsResult?.error || documentsResult?.error) {
      setError(accountsResult?.error || documentsResult?.error);
    } else {
      setData({ ...accountsResult, documents: documentsResult || [] });
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
    bonus: data.live.reduce((sum, account) => sum + Number(account.bonus || 0), 0),
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

  const adjustBonus = async (accountId, direction) => {
    const rawAmount = Number(bonusAmounts[accountId]);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      setError('Enter a bonus amount greater than 0');
      return;
    }

    const amount = direction === 'remove' ? -rawAmount : rawAmount;
    setSavingBonusAccountId(accountId);
    setError('');
    setSuccess('');

    const result = await adminAPI.adjustLiveAccountBonus(token, accountId, amount, bonusNotes[accountId] || '');

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(`Bonus ${direction === 'remove' ? 'removed' : 'applied'} successfully`);
      setBonusAmounts((prev) => ({ ...prev, [accountId]: '' }));
      setBonusNotes((prev) => ({ ...prev, [accountId]: '' }));
      await loadAccounts();
    }

    setSavingBonusAccountId(null);
  };

  const decideDocument = async (documentId, status) => {
    setSavingDocumentId(documentId);
    setError('');
    setSuccess('');

    const result = await adminAPI.decideDocument(token, documentId, status, documentReasons[documentId] || '');

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(`Document ${status}`);
      setDocumentReasons((prev) => ({ ...prev, [documentId]: '' }));
      await loadAccounts();
    }

    setSavingDocumentId(null);
  };

  const renderDocumentRows = () => (
    <div className="overflow-x-auto border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Customer</th>
            <th className="px-4 py-3 text-left">Document</th>
            <th className="px-4 py-3 text-left">File</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Reason</th>
            <th className="px-4 py-3 text-left">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(data.documents || []).length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                No documents uploaded
              </td>
            </tr>
          ) : (data.documents || []).map((document) => (
            <tr key={document.id} className="align-top">
              <td className="px-4 py-3">{new Date(document.created_at).toLocaleString()}</td>
              <td className="px-4 py-3">
                <div className="font-semibold">{document.user?.email || document.user_id}</div>
                <div className="text-xs text-slate-500">{document.user?.username}</div>
              </td>
              <td className="px-4 py-3 font-semibold">{document.document_type}</td>
              <td className="px-4 py-3 text-nova-green">{document.file_name || document.link}</td>
              <td className="px-4 py-3 capitalize">
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                  document.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700'
                    : document.status === 'rejected'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                }`}>
                  {document.status}
                </span>
              </td>
              <td className="min-w-56 px-4 py-3">
                <input
                  type="text"
                  value={documentReasons[document.id] ?? document.reason ?? ''}
                  onChange={(event) => setDocumentReasons((prev) => ({ ...prev, [document.id]: event.target.value }))}
                  placeholder="Reject reason"
                  disabled={document.status !== 'pending'}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                />
              </td>
              <td className="px-4 py-3">
                {document.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => decideDocument(document.id, 'approved')}
                      disabled={savingDocumentId === document.id}
                      className="rounded bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decideDocument(document.id, 'rejected')}
                      disabled={savingDocumentId === document.id}
                      className="rounded bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">
                    {document.processed_at ? new Date(document.processed_at).toLocaleString() : 'Processed'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAccountRows = (accounts, showControls = false) => (
    <div className="overflow-x-auto border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Account</th>
            <th className="px-4 py-3 text-left font-semibold">User</th>
            <th className="px-4 py-3 text-right font-semibold">Balance</th>
            <th className="px-4 py-3 text-right font-semibold">Bonus</th>
            <th className="px-4 py-3 text-right font-semibold">Equity</th>
            <th className="px-4 py-3 text-right font-semibold">Free Margin</th>
            <th className="px-4 py-3 text-right font-semibold">Used Margin</th>
            {showControls && <th className="px-4 py-3 text-left font-semibold">Live Balance Control</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {accounts.length === 0 ? (
            <tr>
              <td colSpan={showControls ? 8 : 7} className="px-4 py-8 text-center text-slate-500">
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
              <td className="px-4 py-3 text-right font-semibold text-nova-green">{formatMoney(account.bonus)}</td>
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
                      className="rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nova-green"
                    />
                    <input
                      type="text"
                      value={notes[account.id] || ''}
                      onChange={(event) => setNotes((prev) => ({ ...prev, [account.id]: event.target.value }))}
                      placeholder="Note"
                      className="rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nova-green"
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
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Bonus Control</div>
                    <div className="grid gap-2 md:grid-cols-[120px_1fr]">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={bonusAmounts[account.id] || ''}
                        onChange={(event) => setBonusAmounts((prev) => ({ ...prev, [account.id]: event.target.value }))}
                        placeholder="Bonus"
                        className="rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nova-green"
                      />
                      <input
                        type="text"
                        value={bonusNotes[account.id] || ''}
                        onChange={(event) => setBonusNotes((prev) => ({ ...prev, [account.id]: event.target.value }))}
                        placeholder="Bonus note"
                        className="rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nova-green"
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => adjustBonus(account.id, 'add')}
                        disabled={savingBonusAccountId === account.id}
                        className="rounded bg-nova-green px-3 py-2 text-xs font-bold text-white hover:bg-nova-black disabled:opacity-60"
                      >
                        Add Bonus
                      </button>
                      <button
                        onClick={() => adjustBonus(account.id, 'remove')}
                        disabled={savingBonusAccountId === account.id}
                        className="rounded bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-60"
                      >
                        Remove Bonus (-)
                      </button>
                    </div>
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
        <section className="grid gap-4 md:grid-cols-5">
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
            <p className="text-xs uppercase text-slate-500">Live Bonus</p>
            <p className="mt-2 text-2xl font-bold">{formatMoney(liveTotals.bonus)}</p>
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
                ['documents', `Documents (${(data.documents || []).filter((document) => document.status === 'pending').length})`],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  className={`rounded px-3 py-2 text-sm font-semibold ${
                    activeTab === value ? 'bg-nova-green text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
          ) : activeTab === 'documents' ? (
            renderDocumentRows()
          ) : (
            <div className="overflow-x-auto border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Account</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">New Value</th>
                    <th className="px-4 py-3 text-left">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.transactions || []).map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-4 py-3">{new Date(transaction.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold">{transaction.account_number}</td>
                      <td className="px-4 py-3">{formatTransactionType(transaction.type)}</td>
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
