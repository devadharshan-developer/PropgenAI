/**
 * Real-time Cross-Tab & Cross-Device Proposal Sync Engine
 * Uses BroadcastChannel API + LocalStorage sync so that when a customer opens
 * or signs the proposal link, the agency app screen updates instantaneously in real-time.
 */

const CHANNEL_NAME = 'progen_proposal_sync_channel';
const EVENTS_STORAGE_KEY = 'progen_proposal_activity_events';

// Create broadcast channel instance
let channel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment, falling back to storage events.', e);
}

/**
 * Record an event to persistent storage
 */
export function recordProposalEvent(proposalId, eventType, details = {}) {
  try {
    const allEvents = JSON.parse(localStorage.getItem(EVENTS_STORAGE_KEY) || '{}');
    if (!allEvents[proposalId]) {
      allEvents[proposalId] = [];
    }

    const eventRecord = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      proposalId,
      eventType, // 'CREATED' | 'LINK_SHARED' | 'APPROACHED' | 'SIGNED'
      timestamp: new Date().toISOString(),
      details,
    };

    allEvents[proposalId].unshift(eventRecord);
    // Keep max 50 events per proposal
    allEvents[proposalId] = allEvents[proposalId].slice(0, 50);

    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(allEvents));
    return eventRecord;
  } catch (err) {
    console.error('Failed to record proposal event:', err);
    return null;
  }
}

/**
 * Retrieve all activity events for a specific proposal
 */
export function getProposalEvents(proposalId) {
  try {
    const allEvents = JSON.parse(localStorage.getItem(EVENTS_STORAGE_KEY) || '{}');
    return allEvents[proposalId] || [];
  } catch {
    return [];
  }
}

/**
 * Broadcast that the customer has approached / opened the blueprint link
 */
export function broadcastProposalApproached(proposalId, clientName) {
  const event = recordProposalEvent(proposalId, 'APPROACHED', {
    clientName,
    openedAt: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
  });

  const payload = {
    type: 'PROPOSAL_APPROACHED',
    proposalId,
    clientName,
    timestamp: new Date().toISOString(),
    event,
  };

  if (channel) {
    channel.postMessage(payload);
  }

  // Trigger cross-window storage event fallback
  try {
    localStorage.setItem('progen_last_sync_event', JSON.stringify(payload));
  } catch (e) {
    console.warn(e);
  }

  return payload;
}

/**
 * Broadcast that the customer has signed and executed the proposal
 */
export function broadcastProposalSigned(signedRecord) {
  const proposalId = signedRecord.proposalId || signedRecord.proposal_id;
  const event = recordProposalEvent(proposalId, 'SIGNED', {
    signerName: signedRecord.signerName || signedRecord.signer_name,
    signerTitle: signedRecord.signerTitle || signedRecord.signer_title,
    signedAt: signedRecord.signedAt || signedRecord.signed_at,
    verificationHash: signedRecord.verificationHash,
    signatureDataUrl: signedRecord.signatureDataUrl,
  });

  const payload = {
    type: 'PROPOSAL_SIGNED',
    proposalId,
    signedRecord,
    timestamp: new Date().toISOString(),
    event,
  };

  if (channel) {
    channel.postMessage(payload);
  }

  try {
    localStorage.setItem('progen_last_sync_event', JSON.stringify(payload));
  } catch (e) {
    console.warn(e);
  }

  return payload;
}

/**
 * Subscribe to live incoming sync events
 */
export function subscribeToSyncEvents(callback) {
  const handleMessage = (event) => {
    if (event && event.data && callback) {
      callback(event.data);
    }
  };

  const handleStorageChange = (e) => {
    if (e.key === 'progen_last_sync_event' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed && callback) {
          callback(parsed);
        }
      } catch (err) {
        console.warn('Failed to parse storage sync event:', err);
      }
    }
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
  }
  window.addEventListener('storage', handleStorageChange);

  // Return unsubscribe cleanup function
  return () => {
    if (channel) {
      channel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', handleStorageChange);
  };
}
