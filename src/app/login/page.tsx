'use client';

import React, { useState } from 'react';
import { Loader2, LogIn, AlertCircle, Lock } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal melakukan login');
      }
      const from = new URLSearchParams(window.location.search).get('from');
      window.location.href = from && from.startsWith('/') ? from : '/';
    } catch (err) {
      setErrorMsg((err as Error).message || 'Terjadi kesalahan saat login');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-blue-500/20">
            <span className="text-base font-black text-white">KPI</span>
          </div>
          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900">
            Dashboard Branch Bekasi
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Masuk untuk mengakses monitoring performa
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-card"
        >
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Masukkan username"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Masukkan password"
            />
          </label>

          <button
            type="submit"
            disabled={!username || !password || isLoading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Masuk</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Lock className="h-3 w-3" />
          <span>Akses terbatas untuk internal Branch Bekasi</span>
        </div>

      </div>
    </div>
  );
}
