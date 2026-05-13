'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/context/ProtectedRoute';
import { useAuth } from '@/context/useAuth';
import { accountAPI } from '@/services/api';
import PortalShell, { Icon } from '@/components/common/PortalShell';

const maskAccountNumber = (value) => {
  const text = String(value || '');
  if (text.length <= 4) return text;
  return `${'*'.repeat(Math.max(text.length - 4, 0))}${text.slice(-4)}`;
};

function EmptyFinancialInfo() {
  return (
    <div className="flex min-h-[460px] items-center justify-center rounded-lg bg-white">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-yellow-50 text-nova-green">
          <svg
            className="h-28 w-28"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            viewBox="0 0 120 120"
            aria-hidden="true"
          >
            <path d="M28 28h64v70H28z" />
            <path d="M40 28v-8h40v8M43 47h34M43 62h25M43 77h19" />
            <path d="M78 49l5 5 12-14M78 66l5 5 12-14M78 83l5 5 12-14" />
            <path d="M19 39h18M19 55h18M19 71h18" opacity=".45" />
          </svg>
        </div>
        <h2 className="mt-7 text-lg font-bold">No Financial Information Available</h2>
        <p className="mt-3 text-sm text-slate-600">
          You haven&apos;t added any bank account information yet. Click the Create button to
          add your financial details and get started.
        </p>
      </div>
    </div>
  );
}

function BankInfoContent() {
  const { token } = useAuth();
  const [bankInfos, setBankInfos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBankInfos = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');
    const result = await accountAPI.getBankInfos(token);

    if (result?.error) {
      setError(result.error);
    } else {
      setBankInfos(result || []);
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadBankInfos();
  }, [loadBankInfos]);

  return (
    <PortalShell activeSubItem="Bank Info">
      <div className="px-7 py-10">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Financial Info</h1>
          <div className="flex items-center gap-4">
            <Link href="/bank-info/create" className="flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-nova-green">
              <span className="text-lg leading-none">+</span>
              Create
            </Link>
            <button
              type="button"
              onClick={loadBankInfos}
              className="rounded-lg border border-slate-200 bg-white p-3 text-slate-600 shadow-sm hover:bg-slate-50"
              aria-label="Refresh bank information"
            >
              <Icon name="clock" className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center text-sm text-slate-500">Loading financial info...</div>
        ) : bankInfos.length === 0 ? (
          <EmptyFinancialInfo />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {bankInfos.map((bankInfo) => (
              <section key={bankInfo.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">{bankInfo.bank_account_alias || bankInfo.bank_name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{bankInfo.bank_name} - {bankInfo.branch}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Active</span>
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-400">Account Holder</dt>
                    <dd className="mt-1 font-semibold">{bankInfo.account_holder_name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-400">Account Number</dt>
                    <dd className="mt-1 font-semibold">{maskAccountNumber(bankInfo.bank_account_number)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-400">Swift Code</dt>
                    <dd className="mt-1 font-semibold">{bankInfo.swift_code || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-400">Created</dt>
                    <dd className="mt-1 font-semibold">{new Date(bankInfo.created_at).toLocaleDateString()}</dd>
                  </div>
                </dl>
              </section>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}

export default function BankInfoPage() {
  return (
    <ProtectedRoute>
      <BankInfoContent />
    </ProtectedRoute>
  );
}
