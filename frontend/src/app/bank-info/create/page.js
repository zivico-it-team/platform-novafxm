'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/context/ProtectedRoute';
import { useAuth } from '@/context/useAuth';
import { accountAPI } from '@/services/api';
import PortalShell from '@/components/common/PortalShell';

const initialForm = {
  bank_account_number: '',
  account_holder_name: '',
  bank_name: '',
  branch: '',
  swift_code: '',
  bank_account_alias: '',
};

function Field({ label, name, value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={label}
        className="mt-2 w-full rounded border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none focus:border-nova-green focus:ring-2 focus:ring-yellow-100"
      />
    </label>
  );
}

function CreateBankInfoContent() {
  const { token } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const result = await accountAPI.createBankInfo(token, form);

    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push('/bank-info');
  };

  return (
    <PortalShell activeSubItem="Bank Info">
      <div className="px-7 py-10">
        <h1 className="mb-6 text-2xl font-bold">Create Bank Information</h1>

        <form onSubmit={submitForm} className="rounded-lg bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-x-10 gap-y-6 xl:grid-cols-2">
            <Field
              label="Bank Account Number"
              name="bank_account_number"
              value={form.bank_account_number}
              onChange={updateForm}
              required
            />
            <Field
              label="Account Holders Name"
              name="account_holder_name"
              value={form.account_holder_name}
              onChange={updateForm}
              required
            />
            <Field
              label="Bank Name"
              name="bank_name"
              value={form.bank_name}
              onChange={updateForm}
              required
            />
            <Field
              label="Branch"
              name="branch"
              value={form.branch}
              onChange={updateForm}
              required
            />
            <Field
              label="Swift Code"
              name="swift_code"
              value={form.swift_code}
              onChange={updateForm}
            />
            <Field
              label="Bank Account Alias"
              name="bank_account_alias"
              value={form.bank_account_alias}
              onChange={updateForm}
            />
          </div>

          <div className="mt-6 grid gap-2 xl:grid-cols-2 xl:pl-[calc(50%+1.25rem)]">
            <button
              type="button"
              onClick={() => router.push('/bank-info')}
              className="rounded border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-nova-green px-6 py-3 text-sm font-bold text-white hover:bg-nova-black disabled:opacity-60"
            >
              {saving ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </PortalShell>
  );
}

export default function CreateBankInfoPage() {
  return (
    <ProtectedRoute>
      <CreateBankInfoContent />
    </ProtectedRoute>
  );
}
