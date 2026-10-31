import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import BuilderForm from './components/BuilderForm';
import ProposalSkeleton from './components/ProposalSkeleton';
import ProposalView from './components/ProposalView';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import ShareModal from './components/ShareModal';
import SupabaseModal from './components/SupabaseModal';
import { generateProposal } from './lib/aiGenerator';
import { broadcastProposalApproached } from './lib/syncChannel';
import { decodeProposalFromHash } from './lib/proposalLink';
import { apiGetProposal, apiSaveProposal, apiRecordApproach } from './lib/api';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('progen_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [currentProposal, setCurrentProposal] = useState(() => {
    if (typeof window === 'undefined') return null;
    const decoded = decodeProposalFromHash(window.location.href);
    if (decoded) {
      setTimeout(() => {
        broadcastProposalApproached(decoded.proposalId, decoded.clientName);
      }, 300);
      return decoded;
    }
    return null;
  });

  const [isLoadingProposal, setIsLoadingProposal] = useState(() => {
    if (typeof window === 'undefined') return false;
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('proposalId');
    const decoded = decodeProposalFromHash(window.location.href);
    return Boolean(id && !decoded);
  });

  const [isCustomerView, setIsCustomerView] = useState(() => {
    if (typeof window === 'undefined') return false;
    const url = window.location.href;
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const isCustomerParam = searchParams.get('role') === 'customer';
    return Boolean(
      isCustomerParam || 
      url.includes('role=customer') || 
      (hash && (hash.includes('role=customer') || hash.includes('#blueprint=')))
    );
  });

  const [activeView, setActiveView] = useState(() => {
    if (typeof window === 'undefined') return 'builder';
    const searchParams = new URLSearchParams(window.location.search);
    const url = window.location.href;
    const hasProposalInUrl = Boolean(
      searchParams.get('proposalId') ||
      searchParams.get('blueprint') ||
      url.includes('blueprint=') ||
      url.includes('#proposal=')
    );
    if (hasProposalInUrl) return 'proposal';
    return 'builder';
  });

  const [pendingInputs, setPendingInputs] = useState(null);
  const [toast, setToast] = useState(null);
  const [shareModalUrl, setShareModalUrl] = useState(null);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // Sync dark mode class on documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('progen_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('progen_theme', 'light');
    }
  }, [darkMode]);

  // Check backend for proposalId in URL query params (?proposalId=PROP-...)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const idFromSearch = searchParams.get('proposalId');
    if (idFromSearch) {
      apiGetProposal(idFromSearch).then((p) => {
        if (p) {
          setCurrentProposal(p);
          setActiveView('proposal');
          setIsCustomerView(Boolean(searchParams.get('role') === 'customer' || window.location.href.includes('role=customer')));
          broadcastProposalApproached(p.proposalId, p.clientName);
          apiRecordApproach(p.proposalId);
        }
      }).finally(() => {
        setIsLoadingProposal(false);
      });
    }
  }, []);

  // Listen for hash & URL navigation changes
  useEffect(() => {
    const handleUrlChange = () => {
      const decoded = decodeProposalFromHash(window.location.href);
      if (decoded) {
        setCurrentProposal(decoded);
        setIsCustomerView(Boolean(window.location.href.includes('role=customer')));
        setActiveView('proposal');
        broadcastProposalApproached(decoded.proposalId, decoded.clientName);
        showToast(`Opened Blueprint for ${decoded.clientName}`, 'info');
      } else if (!window.location.hash || window.location.hash === '#') {
        const searchParams = new URLSearchParams(window.location.search);
        if (!searchParams.get('proposalId')) {
          setActiveView('builder');
          setIsCustomerView(false);
        }
      }
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [showToast]);

  const handleStartGenerate = (inputs) => {
    try {
      // 1. Synthesize proposal immediately so it is guaranteed to be ready
      const generated = generateProposal(inputs);
      setCurrentProposal(generated);
      setPendingInputs(inputs);
      // 2. Persist proposal locally & backend asynchronously
      apiSaveProposal(generated);
      // 3. Set active view to generating for the AI animation
      setActiveView('generating');
      setIsCustomerView(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Proposal generation error:', err);
      showToast('Error generating proposal: ' + err.message, 'error');
    }
  };

  const handleSkeletonComplete = useCallback(() => {
    setActiveView('proposal');
    setIsCustomerView(false);
    showToast('Project Delivery Blueprint generated successfully!', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [showToast]);

  const handleBackToEdit = () => {
    setActiveView('builder');
    setIsCustomerView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewProposal = () => {
    window.history.pushState(null, '', window.location.pathname);
    setCurrentProposal(null);
    setActiveView('builder');
    setIsCustomerView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      
      {/* Navigation Header */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onNewProposal={handleNewProposal}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
        activeView={activeView}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {activeView === 'builder' && (
          <BuilderForm
            onGenerate={handleStartGenerate}
            isGenerating={false}
            onToast={showToast}
          />
        )}

        {activeView === 'generating' && (
          <ProposalSkeleton
            onComplete={handleSkeletonComplete}
            currency={pendingInputs?.currency || '₹'}
          />
        )}

        {activeView === 'proposal' && isLoadingProposal && !currentProposal && (
          <div className="w-full max-w-xl mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-xl">
            <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Loading Customer Delivery Blueprint...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Synchronizing deliverables, timeline roadmap, and financial quote.
            </p>
          </div>
        )}

        {activeView === 'proposal' && (!isLoadingProposal || currentProposal) && (
          <ErrorBoundary onReturnHome={handleBackToEdit} onReset={handleBackToEdit}>
            <ProposalView
              proposal={currentProposal}
              onBackToEdit={handleBackToEdit}
              onToast={showToast}
              onOpenShareModal={(url) => setShareModalUrl(url)}
              onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
              isCustomerView={isCustomerView}
            />
          </ErrorBoundary>
        )}
      </main>

      {/* Footer (hidden when printing) */}
      <footer className="no-print mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">ProgenAI</span>
            <span>•</span>
            <span>Customer Project Delivery Blueprint</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Real-Time Customer Sync Active</span>
            </span>
            <span>•</span>
            <span>React 19</span>
            <span>•</span>
            <span>Tailwind CSS v4</span>
            <span>•</span>
            <span>JPG Audit Certificates</span>
          </div>

          <div className="text-center md:text-right">
            <span>© 2026 ProgenAI. 1-Minute Client Quotes.</span>
          </div>

        </div>
      </footer>

      {/* Toast Notification Container */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Share Modal */}
      {shareModalUrl && (
        <ShareModal
          url={shareModalUrl}
          proposal={currentProposal}
          onClose={() => setShareModalUrl(null)}
          onToast={showToast}
        />
      )}

      {/* Saved Proposals Database Modal */}
      {supabaseModalOpen && (
        <SupabaseModal
          onClose={() => setSupabaseModalOpen(false)}
          onToast={showToast}
        />
      )}

    </div>
  );
}
