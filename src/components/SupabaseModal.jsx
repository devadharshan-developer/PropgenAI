import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  Trash2, 
  Server, 
  Shield, 
  FileCheck, 
  Code, 
  Copy, 
  Check, 
  Key, 
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { isSupabaseConfigured, getStoredProposals, clearStoredProposals } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';

export default function SupabaseModal({ onClose, onToast }) {
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'connect' | 'sql'
  const [records, setRecords] = useState(() => getStoredProposals());
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);

  const isConfigured = isSupabaseConfigured() || backendStatus?.configured;

  useEffect(() => {
    fetch('/api/supabase/status')
      .then((r) => r.json())
      .then((data) => setBackendStatus(data))
      .catch(() => {});
  }, []);

  const handleClearRecords = () => {
    clearStoredProposals();
    setRecords([]);
    onToast?.('Signed proposals database cleared.', 'info');
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      onToast?.('Please enter both Supabase URL and Anon Key.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: supabaseUrl.trim(), key: supabaseKey.trim() })
      });
      const data = await res.json();
      if (data.success) {
        onToast?.('Connected to Supabase successfully!', 'success');
        setBackendStatus({ configured: true, url: supabaseUrl });
        setActiveTab('records');
      } else {
        onToast?.(data.error || 'Connection failed.', 'error');
      }
    } catch (err) {
      onToast?.('Failed to reach backend: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const sqlSchema = `-- Run this in your Supabase SQL Editor (SQL Editor > New Query)
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_industry TEXT,
  agency_name TEXT,
  estimated_budget NUMERIC,
  work_cost NUMERIC,
  total_investment NUMERIC,
  currency TEXT DEFAULT '₹',
  requirements JSONB,
  scope_of_work JSONB,
  timeline JSONB,
  cost_breakdown JSONB,
  is_signed BOOLEAN DEFAULT false,
  signer_name TEXT,
  signer_title TEXT,
  signature_data TEXT,
  verification_hash TEXT,
  approached_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (Optional: allow authenticated & anon inserts)
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write for proposals" 
  ON public.proposals FOR ALL USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema).then(() => {
      setCopiedSql(true);
      onToast?.('SQL Schema copied to clipboard!', 'success');
      setTimeout(() => setCopiedSql(false), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[88vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Supabase & Customer Proposals Database
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cloud persistence, digital signature archives & real-time telemetry
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('records')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'records'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Archived Proposals ({records.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('connect')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'connect'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Connect Supabase</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'sql'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>SQL Schema</span>
          </button>
        </div>

        {/* Database Status Banner */}
        <div className="my-3">
          <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
            isConfigured
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
          }`}>
            {isConfigured ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <Server className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-xs sm:text-sm">
                {isConfigured ? 'Supabase Database Connected' : 'Full-Stack Local & Browser Database Active'}
              </div>
              <p className="opacity-90 leading-relaxed text-[11px]">
                {isConfigured
                  ? 'Customer intake specifications and drawn e-signatures automatically sync to your cloud Supabase "proposals" table.'
                  : 'Customer intake specifications, e-signatures, and audit certificates are securely recorded in backend JSON data and browser storage.'}
              </p>
            </div>
          </div>
        </div>

        {/* TAB 1: RECORDS */}
        {activeTab === 'records' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Executed Customer Proposals
              </span>
              {records.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearRecords}
                  className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear List
                </button>
              )}
            </div>

            {records.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                <Shield className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No signed proposals yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">When a customer signs via the blueprint link, their executed record will appear here.</p>
              </div>
            ) : (
              records.map((rec, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-2 hover:border-emerald-300 dark:hover:border-emerald-700 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400 text-sm">
                      #{rec.proposal_id}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(rec.signed_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                    <div><strong>Client:</strong> {rec.client_name}</div>
                    <div><strong>Industry:</strong> {rec.client_industry}</div>
                    <div><strong>Signatory:</strong> {rec.signer_name} ({rec.signer_title})</div>
                    <div><strong>Investment:</strong> <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(rec.estimated_budget, rec.currency)}</span></div>
                  </div>
                  {rec.signature_data && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Customer Drawn Signature</span>
                      <img src={rec.signature_data} alt="Sign" className="h-6 object-contain filter dark:invert" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: CONNECT SUPABASE */}
        {activeTab === 'connect' && (
          <form onSubmit={handleSaveConfig} className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Connect your live Supabase project to enable cloud database storage. Create a free project at{' '}
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold inline-flex items-center gap-0.5">
                supabase.com <ExternalLink className="w-3 h-3" />
              </a>{' '}
              and paste your credentials below:
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzproject.supabase.co"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Credentials are validated against the backend function.
              </span>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing & Connecting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Connect & Save</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: SQL SCHEMA */}
        {activeTab === 'sql' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Copy and run this in your Supabase SQL Editor:
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-100 transition active:scale-95"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-xl bg-slate-950 text-indigo-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
              {sqlSchema}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
