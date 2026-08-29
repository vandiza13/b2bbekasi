'use client';

import React, { useState, useEffect } from 'react';
import { Send, Copy, Check, X, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';

interface TelegramPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: string;
}

export const TelegramPreviewModal: React.FC<TelegramPreviewModalProps> = ({
  isOpen,
  onClose,
  period,
}) => {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPreview = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/telegram/broadcast?period=${encodeURIComponent(period)}`);
      const data = await res.json();
      if (data.success && data.report?.message) {
        setMessage(data.report.message);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Gagal memuat pesan' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Koneksi ke server gagal' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPreview();
    }
  }, [isOpen, period]);

  const handleCopy = async () => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSend = async () => {
    if (!message || sending) return;
    setSending(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/telegram/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, customMessage: message }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: '✅ Pesan berhasil terkirim ke channel Telegram!' });
      } else {
        setStatusMessage({ type: 'error', text: `❌ ${data.error || 'Gagal mengirim pesan'}` });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: `❌ Terjadi kesalahan: ${(err as Error).message}` });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-xs sm:p-5">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Preview Broadcast Telegram
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Format resmi sesuai sheet &quot;Report&quot; KPI Assurance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {statusMessage && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500 font-medium">Menyusun format laporan...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Isi Pesan Telegram:</span>
                <span className="text-[11px] text-slate-400 font-mono">Markdown V2 / Standard</span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={16}
                className="w-full rounded-2xl border border-slate-200 bg-slate-900 p-4 text-xs font-mono leading-relaxed text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none shadow-inner"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={fetchPreview}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!message}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={!message || sending}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:from-sky-400 hover:to-blue-500 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className={`w-4 h-4 ${sending ? 'animate-pulse' : ''}`} />
              <span>{sending ? 'Mengirim...' : 'Kirim Sekarang'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
