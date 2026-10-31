/**
 * Safe Proposal URL Encoding, Decoding & Sharing Engine
 * Supports:
 * - Indian Rupee symbol (₹)
 * - Multilingual Unicode characters
 * - Universal parsing from Search Query Params, Hash Fragments, and LocalStorage
 * - Resilient clipboard copying on both HTTPS and HTTP (mobile/LAN)
 */

import { generateProposal } from './aiGenerator.js';

/**
 * Encodes a proposal into a URL-safe Base64 string
 */
export function encodeProposalToHash(proposal) {
  if (!proposal) return '';

  const payload = {
    id: proposal.proposalId || `PROP-${Math.floor(1000 + Math.random() * 9000)}`,
    client: proposal.clientName || 'Client',
    agency: proposal.agencyName || 'ProgenAI Studio',
    industry: proposal.industry || 'Web Agency & E-Commerce',
    budget: Number(proposal.budget) || 1500000,
    workCost: proposal.workCost !== undefined ? Number(proposal.workCost) : Math.round((Number(proposal.budget) || 1500000) * 0.1),
    currency: proposal.currency || '₹',
    requirements: proposal.rawRequirements || proposal.requirements || [],
    timelineSpeed: proposal.timelineSpeed || 'standard',
    createdAt: proposal.issueDate || new Date().toISOString(),
    isSigned: Boolean(proposal.isSigned),
    signedRecord: proposal.signedRecord || null
  };

  try {
    const jsonStr = JSON.stringify(payload);
    // Safe UTF-8 to byte string mapping
    const utf8Bytes = encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    });
    // RFC 4648 URL-safe Base64 (replace + with -, / with _, strip =)
    return btoa(utf8Bytes)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (err) {
    console.warn('Fallback link encoding:', err);
    return encodeURIComponent(JSON.stringify(payload));
  }
}

/**
 * Universal Decoder: Decodes a proposal from any URL, Search Query, or Hash Fragment
 */
export function decodeProposalFromHash(urlOrHash) {
  if (!urlOrHash) return null;

  try {
    let rawPayload = null;
    let fallbackId = null;

    // 1. Try parsing as a full URL
    if (urlOrHash.includes('http://') || urlOrHash.includes('https://') || urlOrHash.includes('?')) {
      try {
        const dummyBase = 'http://localhost:5173';
        const parsed = new URL(urlOrHash, dummyBase);

        // Check query parameters
        rawPayload = parsed.searchParams.get('blueprint') || parsed.searchParams.get('proposal');
        fallbackId = parsed.searchParams.get('proposalId') || parsed.searchParams.get('id');

        // Check hash parameters if query didn't have it
        if (!rawPayload && parsed.hash) {
          const hashClean = parsed.hash.replace(/^#/, '');
          const hashParams = new URLSearchParams(hashClean);
          rawPayload = hashParams.get('blueprint') || hashParams.get('proposal');
          if (!rawPayload) {
            // Raw hash split fallback
            const match = hashClean.match(/(?:blueprint|proposal)=([^&]+)/);
            if (match) rawPayload = match[1];
          }
        }
      } catch {
        // continue
      }
    }

    // 2. Direct string/hash inspection
    if (!rawPayload) {
      let str = urlOrHash.replace(/^#/, '').replace(/^\?/, '');

      // Check regex for blueprint= or proposal=
      const match = str.match(/(?:blueprint|proposal)=([^&]+)/);
      if (match) {
        rawPayload = match[1];
      } else if (str.startsWith('PROP-')) {
        fallbackId = str.split('&')[0];
      } else if (!str.includes('=') && !str.includes('&') && str.length > 20) {
        rawPayload = str;
      }
    }

    // 3. Decode payload if found
    if (rawPayload) {
      let b64 = rawPayload.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4 !== 0) {
        b64 += '=';
      }

      let jsonStr = '';
      try {
        const binaryStr = atob(b64);
        jsonStr = decodeURIComponent(
          Array.prototype.map
            .call(binaryStr, (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      } catch {
        try {
          const decodedUrl = decodeURIComponent(rawPayload);
          const directBinary = atob(decodedUrl);
          jsonStr = decodeURIComponent(
            Array.prototype.map
              .call(directBinary, (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
        } catch {
          jsonStr = decodeURIComponent(rawPayload);
        }
      }

      const data = JSON.parse(jsonStr);

      if (data && (data.client || data.clientName)) {
        const clientName = data.client || data.clientName;
        const proposal = generateProposal({
          clientName,
          agencyName: data.agency || data.agencyName || 'ProgenAI Studio',
          industry: data.industry || 'Web Agency & E-Commerce',
          budget: data.budget || 1500000,
          workCost: data.workCost,
          currency: data.currency || '₹',
          requirements: data.requirements || [
            'Primary architectural requirement and core scope specification.',
            'Specialized implementation deliverable with milestone integration.',
            'Final deployment, commissioning, and continuous quality validation.'
          ],
          timelineSpeed: data.timelineSpeed || 'standard'
        });

        if (data.id) {
          proposal.proposalId = data.id;
        }
        if (data.createdAt) {
          proposal.issueDate = data.createdAt;
        }
        if (data.isSigned && data.signedRecord) {
          proposal.isSigned = true;
          proposal.signedRecord = data.signedRecord;
        }

        // Cache decoded proposal for fast subsequent retrieval
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(`progen_proposal_${proposal.proposalId}`, JSON.stringify(proposal));
            localStorage.setItem('progen_active_proposal', JSON.stringify(proposal));
          } catch {
            // ignore
          }
        }

        return proposal;
      }
    }

    // 4. Fallback: ID lookup in localStorage
    if (fallbackId && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(`progen_proposal_${fallbackId}`);
        if (stored) return JSON.parse(stored);
      } catch {
        // continue
      }
    }

    // 5. Fallback: active proposal in localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        const activeStored = localStorage.getItem('progen_active_proposal');
        if (activeStored) {
          const parsed = JSON.parse(activeStored);
          if (!fallbackId || parsed.proposalId === fallbackId) {
            return parsed;
          }
        }
      } catch {
        // continue
      }
    }
  } catch (err) {
    console.warn('Could not decode proposal from URL/hash:', err);
  }

  return null;
}

/**
 * Builds a clean, standard, proper customer web link URL
 * Format: http://localhost:5173/?proposalId=PROP-2026-2397&role=customer
 */
export function buildCustomerShareUrl(proposal, customHost = null) {
  if (!proposal) {
    return typeof window !== 'undefined' ? window.location.href : '';
  }

  let origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  if (customHost) {
    origin = customHost.startsWith('http') ? customHost : `http://${customHost}`;
  }

  const proposalId = encodeURIComponent(proposal.proposalId);

  // Clean, standard, professional web URL
  const customerUrl = `${origin}/?proposalId=${proposalId}&role=customer`;

  // Always save active proposal to localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(`progen_proposal_${proposal.proposalId}`, JSON.stringify(proposal));
      localStorage.setItem('progen_active_proposal', JSON.stringify(proposal));
    } catch {
      // ignore
    }
  }

  return customerUrl;
}

/**
 * Resilient Clipboard Copying (Works over HTTPS, HTTP, Localhost, Mobile, and WebViews)
 */
export async function copyToClipboard(text) {
  if (!text) return false;

  // 1. Try modern navigator.clipboard if in secure context
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback to execCommand
    }
  }

  // 2. Universal fallback using temporary textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('Fallback clipboard copy failed:', err);
    return false;
  }
}
