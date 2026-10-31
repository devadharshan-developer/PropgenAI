import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase (if provided)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if valid credentials are provided
export const isSupabaseConfigured = () => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.startsWith('https://') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 20
  );
};

// Initialize Supabase client safely
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local storage key for fallback storage
const LOCAL_STORAGE_KEY = 'progen_signed_proposals';

/**
 * SQL Schema definition provided for Supabase SQL Editor:
 * 
 * create table public.proposals (
 *   id uuid primary key default gen_random_uuid(),
 *   proposal_id text not null,
 *   client_name text not null,
 *   client_industry text not null,
 *   estimated_budget numeric not null,
 *   currency text default 'USD',
 *   requirements jsonb not null,
 *   scope_of_work jsonb not null,
 *   timeline jsonb not null,
 *   cost_breakdown jsonb not null,
 *   signer_name text not null,
 *   signer_title text,
 *   signature_data text not null,
 *   status text default 'signed',
 *   signed_at timestamptz default now(),
 *   created_at timestamptz default now()
 * );
 */

/**
 * Saves a signed proposal to Supabase with fallback to localStorage
 * @param {Object} proposalData The signed proposal payload
 * @returns {Promise<{success: boolean, id: string, source: 'supabase' | 'local_mock', error?: string}>}
 */
export async function saveSignedProposal(proposalData) {
  const payload = {
    proposal_id: proposalData.proposalId || `PROP-${Date.now().toString(36).toUpperCase()}`,
    client_name: proposalData.clientName || 'Valued Client',
    client_industry: proposalData.industry || 'General Business',
    estimated_budget: Number(proposalData.budget) || 0,
    currency: proposalData.currency || 'USD',
    requirements: proposalData.requirements || [],
    scope_of_work: proposalData.scopeOfWork || [],
    timeline: proposalData.timeline || [],
    cost_breakdown: proposalData.costBreakdown || [],
    signer_name: proposalData.signerName || 'Anonymous',
    signer_title: proposalData.signerTitle || 'Authorized Representative',
    signature_data: proposalData.signatureDataUrl || '',
    status: 'signed',
    signed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  // If Supabase is properly configured, attempt actual database insertion
  if (supabase) {
    try {
      console.info('[Supabase] Inserting signed proposal into "proposals" table...', payload);
      const { data, error } = await supabase
        .from('proposals')
        .insert([payload])
        .select();

      if (error) {
        console.warn('[Supabase] Insert returned error, falling back to local simulation:', error.message);
        return fallbackSave(payload, `Supabase notice: ${error.message}`);
      }

      console.info('[Supabase] Successfully saved record:', data);
      // Also cache locally for immediate offline access
      persistToLocal(payload);
      return {
        success: true,
        id: data?.[0]?.id || payload.proposal_id,
        source: 'supabase',
        data: data?.[0] || payload,
      };
    } catch (err) {
      console.warn('[Supabase] Network or client exception, falling back to local:', err);
      return fallbackSave(payload, err.message);
    }
  }

  // Graceful simulation when Supabase credentials are not connected
  return fallbackSave(payload);
}

function fallbackSave(payload, notice = null) {
  // Simulate 400ms network roundtrip for realistic client-side experience
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockId = `mock-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)}`;
      const savedRecord = { ...payload, id: mockId, local_mock: true };
      
      persistToLocal(savedRecord);
      
      console.info('[ProgenAI Mock DB] Signed proposal successfully stored locally:', savedRecord);
      resolve({
        success: true,
        id: mockId,
        source: 'local_mock',
        data: savedRecord,
        notice,
      });
    }, 450);
  });
}

function persistToLocal(record) {
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    existing.unshift(record);
    // Keep last 25 records
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing.slice(0, 25)));
  } catch (e) {
    console.error('Failed to write to localStorage:', e);
  }
}

export function getStoredProposals() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearStoredProposals() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

/**
 * Fetch a proposal by proposalId directly from Supabase
 */
export async function fetchProposalFromSupabase(proposalId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('proposal_id', proposalId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      proposalId: data.proposal_id,
      clientName: data.client_name,
      agencyName: data.agency_name || 'ProgenAI Studio',
      industry: data.client_industry,
      budget: Number(data.estimated_budget) || 0,
      workCost: data.work_cost !== undefined ? Number(data.work_cost) : Math.round((Number(data.estimated_budget) || 0) * 0.1),
      currency: data.currency || '₹',
      requirements: data.requirements || [],
      scopeOfWork: data.scope_of_work || [],
      timeline: data.timeline || [],
      costBreakdown: data.cost_breakdown || [],
      isSigned: data.status === 'signed' || Boolean(data.signature_data),
      signedRecord: data.signature_data ? {
        signerName: data.signer_name || 'Authorized Client',
        signerTitle: data.signer_title || '',
        signatureDataUrl: data.signature_data,
        signedAt: data.signed_at || new Date().toISOString()
      } : null,
      issueDate: data.created_at || new Date().toISOString()
    };
  } catch (err) {
    console.warn('[Supabase] Failed to fetch proposal directly from cloud:', err.message);
    return null;
  }
}

/**
 * Save / upsert a proposal to Supabase from the client
 */
export async function saveDraftProposalToSupabase(proposal) {
  if (!supabase || !proposal) return null;
  try {
    const payload = {
      proposal_id: proposal.proposalId,
      client_name: proposal.clientName || 'Valued Client',
      client_industry: proposal.industry || 'General Business',
      estimated_budget: Number(proposal.budget) || 0,
      currency: proposal.currency || '₹',
      requirements: proposal.requirements || [],
      scope_of_work: proposal.scopeOfWork || [],
      timeline: proposal.timeline || [],
      cost_breakdown: proposal.costBreakdown || [],
      status: proposal.isSigned ? 'signed' : 'draft',
      signer_name: proposal.signedRecord?.signerName || 'Pending',
      signer_title: proposal.signedRecord?.signerTitle || '',
      signature_data: proposal.signedRecord?.signatureDataUrl || '',
      created_at: proposal.issueDate || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('proposals')
      .upsert([payload], { onConflict: 'proposal_id' })
      .select();

    if (error) {
      console.warn('[Supabase] Draft proposal upsert warning:', error.message);
      return null;
    }
    return data?.[0] || payload;
  } catch (err) {
    console.warn('[Supabase] Draft save error:', err.message);
    return null;
  }
}
