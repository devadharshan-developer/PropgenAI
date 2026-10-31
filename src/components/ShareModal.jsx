import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink, 
  Eye, 
  Smartphone, 
  Laptop, 
  MessageCircle, 
  Mail
} from 'lucide-react';
import { copyToClipboard } from '../lib/proposalLink';

export default function ShareModal({ url, proposal, onClose, onToast, onOpenCustomerTab }) {
  const [copiedLocal, setCopiedLocal] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState(false);
  const [lanIp, setLanIp] = useState(null);

  // Fetch local network IP from backend (e.g. 172.20.10.197) so link works on mobile phones over Wi-Fi
  useEffect(() => {
    fetch('/api/network-info')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.lanIp && data.lanIp !== 'localhost') {
          setLanIp(data.lanIp);
        }
      })
      .catch(() => {});
  }, []);

  // Compute mobile-friendly URL using LAN IP if on localhost
  const proposalId = proposal?.proposalId || new URL(url || window.location.href, 'http://localhost:5173').searchParams.get('proposalId') || 'PROP';
  const mobileUrl = lanIp 
    ? `http://${lanIp}:5173/?proposalId=${encodeURIComponent(proposalId)}&role=customer`
    : url;

  const handleCopyLocal = () => {
    copyToClipboard(url).then((ok) => {
      setCopiedLocal(true);
      if (ok) {
        onToast?.('Client Proposal link copied to clipboard!', 'success');
      } else {
        onToast?.('Link: ' + url, 'info');
      }
      setTimeout(() => setCopiedLocal(false), 2500);
    });
  };

  const handleCopyMobile = () => {
    copyToClipboard(mobileUrl).then((ok) => {
      setCopiedMobile(true);
      if (ok) {
        onToast?.('Mobile / Wi-Fi link copied! Send to phone.', 'success');
      } else {
        onToast?.('Link: ' + mobileUrl, 'info');
      }
      setTimeout(() => setCopiedMobile(false), 2500);
    });
  };

  const handleOpenTab = () => {
    if (onOpenCustomerTab) {
      onOpenCustomerTab(url);
    } else {
      window.open(url, '_blank');
    }
    onToast?.('Opened Client Proposal in new tab!', 'info');
  };

  // WhatsApp and Email use mobile-friendly URL if on phone
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Hello! Here is the Project Proposal & Quote for ${proposal?.clientName || 'your project'}: ${mobileUrl}\n\nPlease review and e-sign online.`
  )}`;

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(
    `Project Proposal & Quote - ${proposal?.clientName || 'Your Project'}`
  )}&body=${encodeURIComponent(
    `Hello,\n\nPlease review your project proposal and price quote here:\n${mobileUrl}\n\nYou can sign directly online to confirm.\n\nBest regards,\n${proposal?.agencyName || 'Agency'}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Share Proposal Link
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clean web link for your client to review the proposal and sign.
            </p>
          </div>
        </div>

        {/* Primary Clean Link Box */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-indigo-500" />
              <span>Client Proposal Link (Web / PC)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={url}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-mono select-all outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLocal}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shrink-0 ${
                  copiedLocal
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                }`}
              >
                {copiedLocal ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLocal ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Mobile / Wi-Fi Link Box (if LAN IP available) */}
          {lanIp && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/80">
              <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Mobile & Wi-Fi Link (For Phone / Clients)</span>
              </label>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mb-2">
                Use this link to open the proposal on your mobile phone or send to clients on your Wi-Fi network.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={mobileUrl}
                  className="flex-1 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-mono select-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyMobile}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shrink-0 ${
                    copiedMobile
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {copiedMobile ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedMobile ? 'Copied!' : 'Copy Phone Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 1-Click WhatsApp & Email Share Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </a>

            <a
              href={mailtoUrl}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition active:scale-95"
            >
              <Mail className="w-4 h-4" />
              <span>Share via Email</span>
            </a>
          </div>

          {/* Simulate Customer Open in New Tab */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between gap-3">
            <div className="text-xs text-indigo-900 dark:text-indigo-200">
              <span className="font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Test Client View</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Open in a new tab to see how the client reviews and signs.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenTab}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0 active:scale-95"
            >
              <span>Open View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
