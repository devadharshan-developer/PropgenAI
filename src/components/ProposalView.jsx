import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Printer, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Shield, 
  Clock, 
  Building2, 
  Briefcase, 
  FileText, 
  Sparkles, 
  BadgeCheck,
  Database,
  ListChecks,
  Zap,
  Lightbulb,
  Eye,
  ExternalLink,
  ShieldCheck,
  Image as ImageIcon,
  Copy,
  Check,
  MessageCircle,
  Mail,
  AlertCircle
} from 'lucide-react';
import SignaturePad from './SignaturePad';
import ProposalAIChat from './ProposalAIChat';
import { formatCurrency } from '../lib/currency';
import { 
  subscribeToSyncEvents, 
  getProposalEvents,
  recordProposalEvent
} from '../lib/syncChannel';
import { getStoredProposals } from '../lib/supabase';
import { downloadAuditCertificateJpg, downloadProposalPhotoJpg } from '../lib/certificateGenerator';
import { buildCustomerShareUrl, copyToClipboard } from '../lib/proposalLink';
import { apiGetProposal, apiSaveProposal, apiRecordApproach, apiSignProposal } from '../lib/api';
import confetti from 'canvas-confetti';

export default function ProposalView({ 
  proposal, 
  onBackToEdit, 
  onToast, 
  onOpenShareModal,
  onOpenSupabaseModal,
  isCustomerView = false 
}) {
  const [signedData, setSignedData] = useState(() => {
    // Check if proposal was already signed
    const existing = getStoredProposals();
    const match = existing.find(p => p.proposal_id === proposal?.proposalId || p.proposalId === proposal?.proposalId);
    return match || proposal?.signedRecord || null;
  });

  const [customerApproachedAt, setCustomerApproachedAt] = useState(() => {
    const events = getProposalEvents(proposal?.proposalId);
    const approachEvt = events.find(e => e.eventType === 'APPROACHED');
    return approachEvt ? approachEvt.timestamp : null;
  });

  const [isDownloadingJpg, setIsDownloadingJpg] = useState(false);
  const [isDownloadingPhoto, setIsDownloadingPhoto] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Subscribe to real-time cross-tab sync events
  useEffect(() => {
    if (!proposal?.proposalId) return;

    const unsubscribe = subscribeToSyncEvents((data) => {
      // Check if event belongs to this proposal
      if (data.proposalId === proposal.proposalId) {
        if (data.type === 'PROPOSAL_APPROACHED') {
          setCustomerApproachedAt(data.timestamp);
          if (!isCustomerView) {
            onToast?.(`👀 Customer approached Proposal #${proposal.proposalId}!`, 'info');
          }
        }

        if (data.type === 'PROPOSAL_SIGNED') {
          setSignedData(data.signedRecord);
          if (!isCustomerView) {
            onToast?.(`🎉 Customer ${data.signedRecord?.signerName || 'Client'} has accepted & signed Proposal #${proposal.proposalId}!`, 'success');
            // Trigger confetti on agency dashboard too!
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
              });
            } catch (e) {
              console.warn(e);
            }
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [proposal?.proposalId, isCustomerView, onToast]);

  // Real-time backend polling to reflect customer signatures signed across any link, phone, or browser
  useEffect(() => {
    if (!proposal?.proposalId || isCustomerView || signedData) return;

    const interval = setInterval(async () => {
      try {
        const remote = await apiGetProposal(proposal.proposalId);
        if (remote) {
          if (remote.approachedAt && !customerApproachedAt) {
            setCustomerApproachedAt(remote.approachedAt);
            onToast?.(`👀 Customer opened proposal link!`, 'info');
          }
          if (remote.isSigned && remote.signedRecord) {
            setSignedData(remote.signedRecord);
            onToast?.(`🎉 Customer ${remote.signedRecord.signerName || 'Client'} has accepted & signed Proposal #${proposal.proposalId}!`, 'success');
            try {
              confetti({
                particleCount: 90,
                spread: 75,
                origin: { y: 0.6 }
              });
            } catch (e) {
              console.warn(e);
            }
          }
        }
      } catch {
        // silent
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [proposal?.proposalId, isCustomerView, signedData, customerApproachedAt, onToast]);

  // Synchronize proposal and approach status with backend
  useEffect(() => {
    if (proposal && proposal.proposalId) {
      apiSaveProposal(proposal);
      if (isCustomerView) {
        apiRecordApproach(proposal.proposalId);
      }
    }
  }, [proposal, isCustomerView]);

  if (!proposal) {
    return (
      <div className="w-full max-w-xl mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Proposal Not Found
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          The proposal link you opened could not be loaded or has expired.
        </p>
        <button
          type="button"
          onClick={onBackToEdit}
          className="mt-6 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-500 transition"
        >
          Return to Proposal Builder
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Proposal-${proposal.proposalId}-${proposal.clientName.replace(/\s+/g, '_')}`;
    window.print();
    document.title = originalTitle;
  };

  const generateCustomerLink = () => {
    return buildCustomerShareUrl(proposal);
  };

  const handleShareClick = () => {
    const customerUrl = generateCustomerLink();
    recordProposalEvent(proposal.proposalId, 'LINK_SHARED', { customerUrl });

    copyToClipboard(customerUrl).then(
      () => {
        onToast?.('Customer Blueprint link copied to clipboard!', 'success');
      },
      () => {
        onToast?.(`Link generated: ${customerUrl}`, 'info');
      }
    );

    if (onOpenShareModal) {
      onOpenShareModal(customerUrl);
    }
  };

  const handleOpenCustomerInNewTab = () => {
    const customerUrl = generateCustomerLink();
    window.open(customerUrl, '_blank');
    onToast?.('Opening customer view in new tab...', 'info');
  };

  const handleDirectCopyLink = () => {
    const customerUrl = generateCustomerLink();
    recordProposalEvent(proposal.proposalId, 'LINK_SHARED', { customerUrl });
    copyToClipboard(customerUrl).then((ok) => {
      setCopiedLink(true);
      if (ok) {
        onToast?.('Customer Blueprint link copied! Share with client.', 'success');
      } else {
        onToast?.('Link: ' + customerUrl, 'info');
      }
      setTimeout(() => setCopiedLink(false), 3000);
    }).catch(() => {
      onToast?.('Link: ' + customerUrl, 'info');
    });
  };

  const handleDownloadProposalPhoto = async () => {
    setIsDownloadingPhoto(true);
    try {
      await downloadProposalPhotoJpg(proposal, signedData);
      onToast?.('Proposal Blueprint Photo (.jpg) saved to device!', 'success');
    } catch (err) {
      console.error(err);
      onToast?.('Failed to save proposal photo.', 'error');
    } finally {
      setIsDownloadingPhoto(false);
    }
  };

  const handleDownloadSignedJpg = async () => {
    if (!signedData) return;
    setIsDownloadingJpg(true);
    try {
      await downloadAuditCertificateJpg(signedData, proposal);
      onToast?.('Audit Certificate (.jpg) downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      onToast?.('Failed to download JPG certificate.', 'error');
    } finally {
      setIsDownloadingJpg(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20">
      
      {/* Customer Mode Banner (visible only when customer opened link) */}
      {isCustomerView && (
        <div className="no-print mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base">
                Project Proposal & Quote for {proposal.clientName}
              </div>
              <p className="text-xs text-white/90">
                Prepared by {proposal.agencyName}. Please review the project tasks, timeline, and price below and sign to approve.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-800 shadow-xs">
            Client View
          </span>
        </div>
      )}

      {/* Top Action Bar (hidden in print) */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          {!isCustomerView && (
            <button
              type="button"
              onClick={onBackToEdit}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              #{proposal.proposalId}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              signedData 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                : customerApproachedAt
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
            }`}>
              {signedData 
                ? 'Signed & Approved' 
                : customerApproachedAt 
                  ? 'Opened by Client' 
                  : 'Proposal Ready'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Open as Customer button */}
          {!isCustomerView && (
            <button
              type="button"
              onClick={handleOpenCustomerInNewTab}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="See what the client sees"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
              <span>Open Client View</span>
            </button>
          )}

          {/* Database trigger */}
          <button
            type="button"
            onClick={onOpenSupabaseModal}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span>Saved Proposals</span>
          </button>

          {/* Save Proposal as Photo (JPG) Button */}
          <button
            type="button"
            onClick={handleDownloadProposalPhoto}
            disabled={isDownloadingPhoto}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/60 border border-violet-200 dark:border-violet-800 transition shadow-xs active:scale-95 disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>{isDownloadingPhoto ? 'Saving Photo...' : 'Save as Photo (JPG)'}</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShareClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-xs active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Link</span>
          </button>

          {/* Print / PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition shadow-xs active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* REAL-TIME CUSTOMER ENGAGEMENT (Agency View) */}
      {!isCustomerView && (
        <div className="no-print mb-6 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Live Client Link & Signing Status
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Live Real-Time Sync
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>1. Proposal Link Created</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Created on {proposal.issueDate}
              </p>
            </div>

            {/* Step 2 */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              customerApproachedAt
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white mb-1">
                {customerApproachedAt ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                <span>2. Client Opened Link</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {customerApproachedAt ? (
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                    Opened at: {new Date(customerApproachedAt).toLocaleTimeString()}
                  </span>
                ) : (
                  'Waiting for client to open link...'
                )}
              </p>
            </div>

            {/* Step 3 */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              signedData
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white mb-1">
                {signedData ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span>3. Client Signed Online</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {signedData ? (
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                    Signed by {signedData.signerName || signedData.signer_name}
                  </span>
                ) : (
                  'Waiting for client e-signature...'
                )}
              </p>
            </div>
          </div>

          {/* Customer Signature & Audit Certificate Quick Actions (Agency View) */}
          {signedData && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 rounded-2xl">
              <div className="flex items-center gap-3 text-xs">
                {signedData.signatureDataUrl && (
                  <img 
                    src={signedData.signatureDataUrl} 
                    alt="Customer Signature" 
                    className="h-7 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-1.5 object-contain filter dark:invert" 
                  />
                )}
                <div className="text-slate-700 dark:text-slate-300">
                  <strong>Executed by:</strong> {signedData.signerName} ({signedData.signerTitle}) • {new Date(signedData.signedAt).toLocaleTimeString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSignedJpg}
                  disabled={isDownloadingJpg}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{isDownloadingJpg ? 'Rendering JPG...' : "Download Customer's Audit Certificate (JPG)"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLIENT SHARE & EXECUTION HUB (Agency View) */}
      {!isCustomerView && (
        <div className="no-print mb-6 p-5 sm:p-6 rounded-2xl bg-indigo-950 border border-indigo-800/80 text-white shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-900/80 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-700/60">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Client Link Generated • Ready to Share</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">
                Share Proposal & Quote with {proposal.clientName}
              </h3>
              <p className="text-xs text-indigo-200/80 mt-1 max-w-xl">
                Send this link to your client to review the proposal and sign digitally. When they view or sign, it updates on this screen in real time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDirectCopyLink}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-95"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Client Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCustomerInNewTab}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 border border-white/15 transition active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-300" />
                <span>Open as Client</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hello! Here is the Project Proposal & Quote for ${proposal.clientName}: ${generateCustomerLink()}\n\nPlease review the tasks, timeline, and quote, and sign online.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition active:scale-95"
                title="Share via WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>

              <a
                href={`mailto:?subject=${encodeURIComponent(`Project Proposal & Quote - ${proposal.clientName}`)}&body=${encodeURIComponent(`Hello,\n\nPlease review your project proposal and price quote here:\n${generateCustomerLink()}\n\nYou can sign directly online to approve.\n\nBest regards,\n${proposal.agencyName}`)}`}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition active:scale-95"
                title="Share via Email"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Email</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* THE PROPOSAL DOCUMENT CONTAINER */}
      <div className="proposal-print-container bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs p-6 sm:p-10 md:p-12 relative overflow-hidden transition-all">
        
        {/* Subtle Decorative top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600" />

        {/* PROPOSAL HEADER */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-8 pt-2">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400">
                  Official Proposal & Price Estimate
                </span>
                <span className="px-2 py-0.5 text-[10px] rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
                  Ready to Sign
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
                Project Proposal & Quote
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Prepared by <strong className="text-slate-800 dark:text-slate-200">{proposal.agencyName}</strong>
              </p>
            </div>

            {/* Metadata card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 min-w-[240px] space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Proposal ID:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">#{proposal.proposalId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Date:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{proposal.issueDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Valid Until:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{proposal.validUntil}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Completion Date:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{proposal.timeline?.finalCompletionDate}</span>
              </div>
            </div>
          </div>

          {/* Client & Industry Badges with beautiful colors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <div className="p-3.5 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Client</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-4 h-4 text-blue-500" />
                {proposal.clientName}
              </span>
            </div>

            <div className="p-3.5 bg-gradient-to-br from-purple-50/70 to-violet-50/40 dark:from-purple-950/20 dark:to-violet-950/20 rounded-2xl border border-purple-200/60 dark:border-purple-900/40">
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Business Type</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                <Briefcase className="w-4 h-4 text-purple-500" />
                {proposal.industry}
              </span>
            </div>

            <div className="p-3.5 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Total Price</span>
              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mt-0.5 font-mono">
                {formatCurrency(proposal.costBreakdown?.totalInvestment || proposal.totalInvestment || proposal.budget, proposal.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* INTAKE SUMMARY: 3 CORE PROJECT TASKS */}
        <div className="py-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 -mx-6 sm:-mx-10 md:-mx-12 px-6 sm:px-10 md:px-12">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              What You Requested (3 Project Tasks)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {proposal.rawRequirements?.map((req, rIdx) => (
              <div key={rIdx} className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                  Task 0{rIdx + 1}
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-snug">
                  "{req}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* PROJECT OVERVIEW */}
        <div className="py-8 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Project Overview
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {proposal.executiveSummary}
          </p>
        </div>

        {/* AI ADAPTIVE ALTERNATIVES CALLOUT (Timeline vs Budget Optimizer) */}
        {proposal.adaptiveStrategy && (
          <div className="my-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-violet-50/70 to-pink-50/80 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-pink-950/40 border border-indigo-200/80 dark:border-indigo-800/80 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-200/60 dark:border-indigo-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      AI Feasibility & Timeline-Budget Optimizer
                    </span>
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 font-bold">
                      {proposal.adaptiveStrategy.statusBadge}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {proposal.adaptiveStrategy.strategyTitle}
                  </h3>
                </div>
              </div>

              <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-white/70 dark:bg-slate-900/70 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/60 shrink-0">
                {proposal.adaptiveStrategy.budgetImpact}
              </div>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {proposal.adaptiveStrategy.analysisSummary}
            </p>

            <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-900/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Adaptive Methodology Adaptations Applied by AI:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                {proposal.adaptiveStrategy.keyAdaptations?.map((adapt, aIdx) => (
                  <div key={aIdx} className="flex items-start gap-2 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>{adapt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2A: SCOPE OF WORK */}
        <div className="py-8 border-b border-slate-200 dark:border-slate-800" id="scope-of-work-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  What We Will Deliver (Scope of Work)
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Detailed plan and list of work for the 3 client tasks
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
              3 Main Work Items
            </span>
          </div>

          <div className="space-y-6">
            {proposal.scopeOfWork?.map((item) => (
              <div 
                key={item.index} 
                className="print-break-inside-avoid p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                      0{item.index}
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5 italic">
                        Requirement: "{item.requirementInput}"
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                      {formatCurrency(item.cost, proposal.currency)} ({item.percentage}%)
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 pl-10">
                  {item.summary}
                </p>

                {/* Tangible deliverables checklist */}
                <div className="pl-10 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {item.deliverables?.map((del, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{del}</span>
                    </div>
                  ))}
                </div>

                {/* Business Impact badge */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 pl-10 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <BadgeCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span><strong>Strategic Value:</strong> {item.businessImpact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2B: TIMELINE TABLE */}
        <div className="py-8 border-b border-slate-200 dark:border-slate-800" id="timeline-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Delivery Schedule & Milestones
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Step-by-step timeline showing what gets completed during each phase
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-semibold">
                Total Time: {proposal.timeline?.totalDurationWeeks} Weeks
              </span>
            </div>
          </div>

          {/* Timeline Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Phase</th>
                  <th className="py-3.5 px-4">Milestone Description</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Schedule Window</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {proposal.timeline?.phases?.map((phase, pIdx) => (
                  <tr key={pIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold flex items-center justify-center">
                          {phase.phaseNumber}
                        </span>
                        <span>Phase {phase.phaseNumber}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{phase.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                        {phase.milestones?.map((m, mIdx) => (
                          <div key={mIdx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {phase.duration}
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {phase.dateRange}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {phase.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Final Completion Date Highlight Banner */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-violet-50 to-pink-50 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-pink-950/30 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Target Project Completion & Handover Date
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Calculated based on standard {proposal.timeline?.totalDurationWeeks}-week execution schedule starting upon execution.
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">Target Launch</span>
              <span className="text-base font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">
                {proposal.timeline?.finalCompletionDate}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2C: COST BREAKDOWN */}
        <div className="py-8 border-b border-slate-200 dark:border-slate-800" id="cost-breakdown-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Price & Cost Breakdown
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Clear price breakdown of the 3 project tasks and agency work fee
              </p>
            </div>

            <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              Currency: {proposal.currency} (Fixed Price)
            </div>
          </div>

          {/* Cost Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Item #</th>
                  <th className="py-3.5 px-4">Project Work Item</th>
                  <th className="py-3.5 px-4 text-center">Share</th>
                  <th className="py-3.5 px-4 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {proposal.costBreakdown?.items?.map((item) => (
                  <tr key={item.index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-mono text-xs font-bold text-slate-500">
                      0{item.index}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{item.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        Task: {item.requirement}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-xs text-slate-600 dark:text-slate-400 font-semibold">
                      {item.percentage}%
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.cost, proposal.currency)}
                    </td>
                  </tr>
                ))}

                {/* Scope Requirements Subtotal */}
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800">
                  <td colSpan={2} className="py-3 px-4">
                    <span>Base Work Cost (3 Tasks)</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {Math.round(((proposal.costBreakdown?.requirementsSubtotal || proposal.budget || 0) / (proposal.costBreakdown?.totalInvestment || proposal.totalInvestment || proposal.budget || 1)) * 100)}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {formatCurrency(proposal.costBreakdown?.requirementsSubtotal || proposal.budget || 0, proposal.currency)}
                  </td>
                </tr>

                {/* Our Work Cost Row */}
                <tr className="bg-indigo-50/50 dark:bg-indigo-950/30 text-xs font-semibold text-indigo-900 dark:text-indigo-200 border-t border-indigo-100 dark:border-indigo-900/50">
                  <td colSpan={2} className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>+ Agency Work Fee (Management, Design & Execution)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                      Dedicated project lead, regular updates, quality testing, and launch support.
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {Math.round(((proposal.workCost || proposal.costBreakdown?.workCost || Math.round((proposal.budget || 0) * 0.1)) / (proposal.costBreakdown?.totalInvestment || proposal.totalInvestment || proposal.budget || 1)) * 100)}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-700 dark:text-indigo-300">
                    {formatCurrency(proposal.workCost || proposal.costBreakdown?.workCost || Math.round((proposal.budget || 0) * 0.1), proposal.currency)}
                  </td>
                </tr>

                {/* BOLD TOTAL FINAL INVESTMENT ROW */}
                <tr className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/70 dark:via-teal-950/50 dark:to-indigo-950/70 font-extrabold text-base border-t-2 border-emerald-500 dark:border-emerald-600">
                  <td colSpan={2} className="py-5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-slate-900 dark:text-white uppercase tracking-wider text-sm font-extrabold">
                        Total Final Price for Client
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                      Fixed price guaranteed upon online e-signature.
                    </div>
                  </td>
                  <td className="py-5 px-4 text-center font-mono text-sm text-emerald-700 dark:text-emerald-300 font-bold">
                    100%
                  </td>
                  <td className="py-5 px-4 text-right">
                    <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(proposal.costBreakdown?.totalInvestment || proposal.totalInvestment || proposal.budget, proposal.currency)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Terms Schedule */}
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
              Payment Schedule & Commercial Invoicing
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {proposal.costBreakdown?.paymentSchedule?.map((term, tIdx) => (
                <div key={tIdx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-800 dark:text-slate-200">{term.milestone}</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{term.percentage}</span>
                  </div>
                  <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                    {formatCurrency(term.amount, proposal.currency)}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {term.trigger}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2D: GUARANTEES & COMMERCIAL TERMS */}
        <div className="py-8 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Our Quality Guarantee & Support
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {proposal.serviceLevelAgreements?.map((sla, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{sla.label}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {sla.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: CLIENT ACTION & E-SIGNATURE */}
        {isCustomerView ? (
          /* When viewing via the Customer Blueprint Link, the client signs directly */
          <SignaturePad
            proposal={proposal}
            onSigned={(data) => {
              setSignedData(data);
              apiSignProposal(proposal.proposalId, data);
            }}
            onToast={onToast}
          />
        ) : (
          /* When viewing on Agency Screen: No signature stamp/pad here. Client signs via link. */
          <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            {signedData ? (
              <div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Proposal Approved & Signed by Client</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                  {signedData.signerName} ({signedData.signerTitle || 'Authorized Client'}) reviewed the 3 tasks, timeline, and quote, and signed online on {new Date(signedData.signedAt).toLocaleString()}.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 items-center shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Signatory</span>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{signedData.signerName}</p>
                    <p className="text-xs text-slate-500">{signedData.signerTitle} • {signedData.clientName}</p>
                    <p className="text-[11px] font-mono text-indigo-500 mt-2">Hash: {signedData.verificationHash || 'VERIFIED'}</p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Client Drawn Signature</span>
                    {signedData.signatureDataUrl ? (
                      <img src={signedData.signatureDataUrl} alt="Client Signature" className="h-16 object-contain filter dark:invert" />
                    ) : (
                      <span className="text-xs text-slate-400 italic">Signature on file</span>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadSignedJpg}
                    disabled={isDownloadingJpg}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>{isDownloadingJpg ? 'Rendering...' : 'Download Audit Certificate (JPG Photo)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadProposalPhoto}
                    disabled={isDownloadingPhoto}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-500 transition shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Proposal Photo (JPG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 transition flex items-center gap-2 active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Download Proposal (PDF)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wider">
                      Client E-Signature via Link
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Awaiting Client Signature via Link
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                  This proposal is ready for client review. Share the direct link with <strong>{proposal.clientName}</strong>. When they open the link, they will see the complete scope of work, timeline schedule, and budget breakdown, and can sign electronically directly on their page.
                </p>

                {/* Direct Link Box */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="w-full sm:flex-1 truncate">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Direct Client Signing Link
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={generateCustomerLink()}
                      className="w-full text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-transparent outline-none truncate select-all"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleDirectCopyLink}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenCustomerInNewTab}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Open Link as Client</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Document Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 gap-3">
          <div>
            ProgenAI Proposal #{proposal.proposalId} • Generated for {proposal.clientName}
          </div>
          <div>
            Confidential & Proprietary Commercial Quote
          </div>
        </div>

      </div>

      {/* IN-APP AI PROPOSAL ADVISOR & COPILOT */}
      <ProposalAIChat
        proposal={proposal}
        isCustomerView={isCustomerView}
      />
    </div>
  );
}
