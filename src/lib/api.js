/**
 * Full-Stack API Client for ProgenAI
 * Connects to the Express backend (/api/...) with seamless client-side persistence fallback.
 */

import { broadcastProposalSigned } from './syncChannel';
import { 
  fetchProposalFromSupabase, 
  saveDraftProposalToSupabase, 
  saveSignedProposal 
} from './supabase';

const API_BASE = '/api';

/**
 * Save proposal to backend and local cache
 */
export async function apiSaveProposal(proposal) {
  // Always cache locally first
  try {
    localStorage.setItem(`progen_proposal_${proposal.proposalId}`, JSON.stringify(proposal));
    localStorage.setItem('progen_active_proposal', JSON.stringify(proposal));
  } catch (e) {
    console.warn('Local storage cache warning:', e);
  }

  // Cloud persistence for Netlify static deployments
  try {
    saveDraftProposalToSupabase(proposal).catch(() => {});
  } catch {
    // ignore
  }

  try {
    const res = await fetch(`${API_BASE}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposal)
    });
    if (res.ok) {
      const data = await res.json();
      return data.proposal || proposal;
    }
  } catch (err) {
    console.info('Backend unavailable, using local client storage for proposal:', err.message);
  }

  return proposal;
}

/**
 * Fetch proposal by ID from backend or local fallback
 */
export async function apiGetProposal(proposalId) {
  try {
    const res = await fetch(`${API_BASE}/proposals/${proposalId}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.proposal) {
        // Cache to local storage
        try {
          localStorage.setItem(`progen_proposal_${proposalId}`, JSON.stringify(data.proposal));
        } catch {
          // ignore
        }
        return data.proposal;
      }
    }
  } catch {
    // Fall back to cloud or local storage
  }

  // Cloud Supabase lookup (works seamlessly across devices on Netlify)
  try {
    const cloudProposal = await fetchProposalFromSupabase(proposalId);
    if (cloudProposal) {
      try {
        localStorage.setItem(`progen_proposal_${proposalId}`, JSON.stringify(cloudProposal));
      } catch {
        // ignore
      }
      return cloudProposal;
    }
  } catch {
    // continue
  }

  try {
    const stored = localStorage.getItem(`progen_proposal_${proposalId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // continue
  }

  return null;
}

/**
 * Record customer approached/opened link
 */
export async function apiRecordApproach(proposalId) {
  try {
    await fetch(`${API_BASE}/proposals/${proposalId}/approach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    // silent fallback
  }
}

/**
 * Record customer E-signature
 */
export async function apiSignProposal(proposalId, signPayload) {
  // Save locally
  let updatedProposal = null;
  try {
    const existing = localStorage.getItem(`progen_proposal_${proposalId}`);
    if (existing) {
      const parsed = JSON.parse(existing);
      parsed.isSigned = true;
      parsed.signedRecord = signPayload;
      updatedProposal = parsed;
      localStorage.setItem(`progen_proposal_${proposalId}`, JSON.stringify(parsed));
      localStorage.setItem('progen_active_proposal', JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }

  // Real-time broadcast to open agency tabs
  try {
    broadcastProposalSigned(signPayload);
  } catch (e) {
    console.warn('Sync broadcast warning:', e);
  }

  // Cloud sync for Netlify static deployments
  if (updatedProposal) {
    try {
      saveSignedProposal(updatedProposal).catch(() => {});
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch(`${API_BASE}/proposals/${proposalId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signPayload)
    });
    if (res.ok) {
      const data = await res.json();
      return data.signedRecord || signPayload;
    }
  } catch {
    // fallback
  }

  return signPayload;
}

/**
 * Ask In-App AI Assistant (Server-side proxy with short answer enforcement)
 */
export async function apiAskAssistant(question, proposal, history = []) {
  try {
    const res = await fetch(`${API_BASE}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, proposal, history })
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.answer) {
        return data.answer;
      }
    }
  } catch {
    // fallback
  }

  // Frontend short fallback
  const total = proposal?.costBreakdown?.totalInvestment || proposal?.budget || 0;
  const currency = proposal?.currency || '₹';
  const work = proposal?.workCost || Math.round(total * 0.1);
  const weeks = proposal?.timeline?.totalDurationWeeks || 9;

  return `The total investment is ${currency}${total.toLocaleString()} (${currency}${(total - work).toLocaleString()} base scope + ${currency}${work.toLocaleString()} agency work cost) delivered across ${weeks} weeks.`;
}
