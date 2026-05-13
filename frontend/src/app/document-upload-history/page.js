'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/context/ProtectedRoute';
import { useAuth } from '@/context/useAuth';
import { accountAPI } from '@/services/api';
import PortalShell, { Icon } from '@/components/common/PortalShell';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const getStatusClass = (status) => ({
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  pending: 'bg-amber-50 text-amber-700',
}[status] || 'bg-slate-100 text-slate-600');

function DocumentHistoryContent() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDocuments = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');
    const result = await accountAPI.getDocuments(token);

    if (result?.error) {
      setError(result.error);
    } else {
      setDocuments(result || []);
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <PortalShell activeSubItem="Documents">
      <div className="px-7 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Document Upload History</h1>
          <button
            type="button"
            onClick={loadDocuments}
            className="rounded-lg border border-nova-gold/40 bg-white p-3 text-slate-600 shadow-sm hover:bg-yellow-50"
            aria-label="Refresh documents"
          >
            <Icon name="clock" className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Document Type</th>
                <th className="px-4 py-3">Date Created</th>
                <th className="px-4 py-3">Date Processed</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-5 text-slate-500">Loading documents...</td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-5 text-slate-500">No Data Found</td>
                </tr>
              ) : documents.map((document) => (
                <tr key={document.id}>
                  <td className="px-4 py-3 font-semibold">#{document.id}</td>
                  <td className="px-4 py-3">{document.document_type}</td>
                  <td className="px-4 py-3">{formatDate(document.created_at)}</td>
                  <td className="px-4 py-3">{formatDate(document.processed_at)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-nova-green">{document.file_name || document.link || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClass(document.status)}`}>
                      {document.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{document.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}

export default function DocumentUploadHistoryPage() {
  return (
    <ProtectedRoute>
      <DocumentHistoryContent />
    </ProtectedRoute>
  );
}
