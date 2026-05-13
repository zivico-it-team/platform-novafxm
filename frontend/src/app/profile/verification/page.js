'use client';

import { useRef, useState } from 'react';
import { ProtectedRoute } from '@/context/ProtectedRoute';
import { useAuth } from '@/context/useAuth';
import { accountAPI } from '@/services/api';
import PortalShell, { Icon } from '@/components/common/PortalShell';

function UploadBox({ title, documentType }) {
  const { token } = useAuth();
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file) => {
    if (!file || !token) return;

    setUploading(true);
    setMessage('');
    const result = await accountAPI.uploadDocument(token, {
      document_type: documentType,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      link: file.name,
    });

    if (result?.error) {
      setMessage(result.error);
    } else {
      setFileName(file.name);
      setMessage('Uploaded for admin review');
    }

    setUploading(false);
  };

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="m-6 flex min-h-64 w-[calc(100%-3rem)] flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-center text-slate-400 hover:border-nova-gold hover:bg-yellow-50"
      >
        <Icon name="file" className="h-16 w-16 text-slate-400" />
        <span className="mt-4 text-sm">
          {uploading ? 'Uploading...' : fileName || 'Drop your file to upload or browse'}
        </span>
        {message && (
          <span className={`mt-2 text-xs ${message.includes('review') ? 'text-emerald-600' : 'text-red-600'}`}>
            {message}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => uploadFile(event.target.files?.[0])}
      />
    </section>
  );
}

function VerificationContent() {
  return (
    <PortalShell activeSubItem="Verification">
      <div className="space-y-5 px-7 py-10">
        <UploadBox title="ID Proof" documentType="ID Proof" />
        <UploadBox title="Address Proof" documentType="Address Proof" />
      </div>
    </PortalShell>
  );
}

export default function VerificationPage() {
  return (
    <ProtectedRoute>
      <VerificationContent />
    </ProtectedRoute>
  );
}
