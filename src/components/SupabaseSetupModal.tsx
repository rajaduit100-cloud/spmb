import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Database, 
  Download, 
  Activity, 
  ShieldCheck, 
  ExternalLink, 
  Radio, 
  Terminal,
  AlertCircle
} from 'lucide-react';
import { 
  DEFAULT_SUPABASE_URL, 
  DEFAULT_SUPABASE_ANON_KEY, 
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  testSupabaseConnection 
} from '../lib/supabase';
import { SUPABASE_SQL_SCHEMA } from '../lib/schemaSql';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    connected: boolean;
    tableExists: boolean;
    error?: string;
    count?: number;
  }>({
    tested: false,
    connected: false,
    tableExists: false,
  });

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadSql = () => {
    const element = document.createElement('a');
    const file = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'spmb_supabase_schema.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    const result = await testSupabaseConnection();
    setTestResult({
      tested: true,
      ...result,
    });
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Koneksi & Skema Supabase Realtime</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  SERVER UTAMA
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Penyimpanan terpusat database PostgreSQL & sinkronisasi live data multi-user.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Diagnostic Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Uji Konektivitas Realtime Supabase</h4>
                <p className="text-xs text-slate-600">
                  Periksa apakah endpoint REST dan tabel <code className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded">spmb_registrations</code> siap menerima sinkronisasi.
                </p>
                {testResult.tested && (
                  <div className="mt-2 text-xs">
                    {testResult.tableExists ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                        <Check className="w-3.5 h-3.5" />
                        Tabel aktif & tersambung! Terdeteksi {testResult.count} data pendaftar.
                      </span>
                    ) : testResult.connected ? (
                      <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Koneksi ke Supabase OK, namun tabel belum dibuat. Silakan salin & jalankan skrip SQL di bawah.
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {testResult.error || 'Gagal tersambung ke endpoint Supabase.'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Menguji...' : 'Uji Koneksi Tabel'}
            </button>
          </div>

          {/* Kredensial Resmi Supabase */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Kredensial Resmi Terkonfigurasi
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between">
                <div className="truncate mr-2">
                  <span className="block text-[10px] font-semibold text-slate-500">API URL (Project)</span>
                  <span className="font-mono text-xs font-bold text-slate-900 truncate block">
                    {DEFAULT_SUPABASE_URL}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyText(DEFAULT_SUPABASE_URL, 'url')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                  title="Salin URL"
                >
                  {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between">
                <div className="truncate mr-2">
                  <span className="block text-[10px] font-semibold text-slate-500">Anon Public Key</span>
                  <span className="font-mono text-xs text-slate-800 truncate block">
                    {DEFAULT_SUPABASE_ANON_KEY.substring(0, 32)}...
                  </span>
                </div>
                <button
                  onClick={() => handleCopyText(DEFAULT_SUPABASE_ANON_KEY, 'anon')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                  title="Salin Anon Key"
                >
                  {copiedKey === 'anon' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between">
                <div className="truncate mr-2">
                  <span className="block text-[10px] font-semibold text-slate-500">Publishable Key</span>
                  <span className="font-mono text-xs text-slate-800 truncate block">
                    {SUPABASE_PUBLISHABLE_KEY}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyText(SUPABASE_PUBLISHABLE_KEY, 'pub')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                  title="Salin Publishable Key"
                >
                  {copiedKey === 'pub' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between">
                <div className="truncate mr-2">
                  <span className="block text-[10px] font-semibold text-slate-500">Secret / Service Role Key</span>
                  <span className="font-mono text-xs text-slate-800 truncate block">
                    {SUPABASE_SERVICE_ROLE_KEY.substring(0, 32)}...
                  </span>
                </div>
                <button
                  onClick={() => handleCopyText(SUPABASE_SERVICE_ROLE_KEY, 'role')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                  title="Salin Service Key"
                >
                  {copiedKey === 'role' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Langkah Eksekusi SQL Otomatis */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-blue-700" />
              Langkah 1-Menit Setup Database Supabase
            </h4>
            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside">
              <li>
                Buka Dashboard Supabase pada menu <strong className="text-blue-900">SQL Editor</strong> di project Anda:
                <a 
                  href="https://supabase.com/dashboard/project/nirptvwydntzsqyvpsoa/sql" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline ml-1"
                >
                  Buka SQL Editor <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Klik tombol <strong>"Salin Skrip SQL Lengkap"</strong> di bawah ini (atau unduh file .sql).</li>
              <li>Tempel (Paste) seluruh kode ke SQL Editor Supabase, lalu klik tombol hijau <strong>"RUN"</strong>.</li>
              <li>Tabel, indeks, hak akses (RLS Policies), dan publikasi <strong>Realtime</strong> otomatis aktif seketika!</li>
            </ol>
          </div>

          {/* Code View Preview & Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Pratinjau Skrip SQL (Lengkap dengan Tabel, RLS, & Realtime)
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh .sql
                </button>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Salin Skrip SQL Lengkap
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="bg-slate-900 text-slate-200 text-xs p-4 rounded-xl font-mono overflow-x-auto max-h-64 border border-slate-800 leading-relaxed">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 p-4 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            Aplikasi tetap bekerja normal dengan local-cache bila database Supabase belum dieksekusi.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
