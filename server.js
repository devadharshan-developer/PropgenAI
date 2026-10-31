import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple .env parser for Node environment
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envLines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  } catch (e) {
    console.warn('Error reading .env file:', e.message);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'proposals.json');

// Supabase Backend Client Configuration
let SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
let SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
let supabaseClient = null;

function initSupabase(url, key) {
  if (url && url.startsWith('https://') && key && key.length > 20) {
    try {
      supabaseClient = createClient(url, key);
      console.log('[Backend Supabase] Connected to Supabase at:', url);
      return true;
    } catch (e) {
      console.warn('[Backend Supabase] Connection error:', e.message);
      supabaseClient = null;
      return false;
    }
  }
  return false;
}

initSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);

// OpenRouter API Key (kept secure on backend)
const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY ||
  '';

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf-8');
}

function loadProposals() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('Error reading proposals file:', err);
    return {};
  }
}

function saveProposals(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving proposals file:', err);
  }
}

/**
 * Backend function to store/upsert customer proposal data in Supabase
 */
async function saveProposalToSupabase(proposal) {
  if (!supabaseClient) return null;
  try {
    const record = {
      proposal_id: proposal.proposalId,
      client_name: proposal.clientName || 'Valued Client',
      client_industry: proposal.industry || 'General Business',
      agency_name: proposal.agencyName || 'ProgenAI Studio',
      estimated_budget: Number(proposal.budget) || 0,
      work_cost: Number(proposal.workCost) || 0,
      total_investment: Number(proposal.totalInvestment || proposal.costBreakdown?.totalInvestment || proposal.budget) || 0,
      currency: proposal.currency || '₹',
      requirements: proposal.rawRequirements || proposal.requirements || [],
      scope_of_work: proposal.scopeOfWork || [],
      timeline: proposal.timeline || {},
      cost_breakdown: proposal.costBreakdown || {},
      is_signed: Boolean(proposal.isSigned),
      signer_name: proposal.signedRecord?.signerName || null,
      signer_title: proposal.signedRecord?.signerTitle || null,
      signature_data: proposal.signedRecord?.signatureDataUrl || null,
      verification_hash: proposal.signedRecord?.verificationHash || null,
      signed_at: proposal.signedRecord?.signedAt || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseClient
      .from('proposals')
      .upsert([record], { onConflict: 'proposal_id' })
      .select();

    if (error) {
      console.warn('[Backend Supabase] Proposal upsert warning:', error.message);
      return { success: false, error: error.message };
    }
    console.log('[Backend Supabase] Proposal stored in Supabase:', proposal.proposalId);
    return { success: true, data };
  } catch (err) {
    console.warn('[Backend Supabase] Exception syncing proposal:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Backend function to store customer signature data in Supabase
 */
async function saveSignatureToSupabase(proposalId, signedRecord, proposal) {
  if (!supabaseClient) return null;
  try {
    const updatePayload = {
      proposal_id: proposalId,
      is_signed: true,
      signer_name: signedRecord.signerName || 'Authorized Officer',
      signer_title: signedRecord.signerTitle || 'Client Partner',
      signature_data: signedRecord.signatureDataUrl,
      verification_hash: signedRecord.verificationHash,
      signed_at: signedRecord.signedAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (proposal) {
      updatePayload.client_name = proposal.clientName || 'Valued Client';
      updatePayload.total_investment = Number(proposal.totalInvestment || proposal.budget) || 0;
    }

    const { data, error } = await supabaseClient
      .from('proposals')
      .upsert([updatePayload], { onConflict: 'proposal_id' })
      .select();

    if (error) {
      console.warn('[Backend Supabase] Signature upsert warning:', error.message);
      return { success: false, error: error.message };
    }
    console.log('[Backend Supabase] Customer signature stored in Supabase for proposal:', proposalId);
    return { success: true, data };
  } catch (err) {
    console.warn('[Backend Supabase] Exception syncing signature:', err.message);
    return { success: false, error: err.message };
  }
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    server: 'ProgenAI Full-Stack Backend', 
    supabaseConnected: Boolean(supabaseClient),
    time: new Date().toISOString() 
  });
});

// Local Network Info Endpoint (Returns server LAN IPv4 address for mobile/other devices)
app.get('/api/network-info', (req, res) => {
  let lanIp = 'localhost';
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          lanIp = iface.address;
          break;
        }
      }
      if (lanIp !== 'localhost') break;
    }
  } catch (err) {
    console.warn('Could not detect LAN IP:', err);
  }

  res.json({
    lanIp,
    vitePort: 5173,
    serverPort: PORT,
    timestamp: new Date().toISOString()
  });
});

// Supabase Status Endpoint
app.get('/api/supabase/status', (req, res) => {
  res.json({
    configured: Boolean(supabaseClient),
    url: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 20)}...` : null,
    message: supabaseClient
      ? 'Supabase backend connection active. All customer intake data and signatures sync directly to Supabase.'
      : 'Operating with full-stack local database fallback. Connect Supabase credentials in the Database modal.'
  });
});

// Supabase Dynamic Config Endpoint
app.post('/api/supabase/config', (req, res) => {
  const { url, key } = req.body;
  if (!url || !key) {
    return res.status(400).json({ success: false, error: 'Supabase URL and Anon Key are required' });
  }

  const ok = initSupabase(url.trim(), key.trim());
  if (ok) {
    SUPABASE_URL = url.trim();
    SUPABASE_ANON_KEY = key.trim();

    try {
      const content = `VITE_SUPABASE_URL=${SUPABASE_URL}\nVITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}\nOPENROUTER_API_KEY=${OPENROUTER_API_KEY}\n`;
      fs.writeFileSync(envPath, content, 'utf-8');
    } catch (e) {
      console.warn('Could not write to .env:', e.message);
    }

    return res.json({ success: true, message: 'Connected to Supabase successfully!' });
  }

  res.status(400).json({ success: false, error: 'Could not connect with provided Supabase URL/Key' });
});

// Save or Update Proposal
app.post('/api/proposals', (req, res) => {
  const proposal = req.body;
  if (!proposal || !proposal.proposalId) {
    return res.status(400).json({ success: false, error: 'Proposal ID is required' });
  }

  const proposals = loadProposals();
  proposals[proposal.proposalId] = {
    ...proposal,
    updatedAt: new Date().toISOString()
  };
  saveProposals(proposals);

  // Asynchronously store customer proposal data in Supabase (Backend Function)
  saveProposalToSupabase(proposal).catch(() => {});

  res.json({ 
    success: true, 
    proposalId: proposal.proposalId, 
    proposal: proposals[proposal.proposalId],
    supabaseSynced: Boolean(supabaseClient)
  });
});

// Get Proposal by ID
app.get('/api/proposals/:id', (req, res) => {
  const { id } = req.params;
  const proposals = loadProposals();
  const proposal = proposals[id];

  if (!proposal) {
    return res.status(404).json({ success: false, error: 'Proposal not found' });
  }

  res.json({ success: true, proposal });
});

// Record Customer Approach (Opened Link)
app.post('/api/proposals/:id/approach', (req, res) => {
  const { id } = req.params;
  const proposals = loadProposals();

  if (proposals[id]) {
    proposals[id].approachedAt = new Date().toISOString();
    saveProposals(proposals);
    return res.json({ success: true, approachedAt: proposals[id].approachedAt });
  }

  res.status(404).json({ success: false, error: 'Proposal not found' });
});

// Record E-Signature
app.post('/api/proposals/:id/sign', (req, res) => {
  const { id } = req.params;
  const { signerName, signerTitle, signatureDataUrl, verificationHash } = req.body;

  const proposals = loadProposals();
  const proposal = proposals[id] || { proposalId: id };

  const signedRecord = {
    proposalId: id,
    signerName: signerName || 'Authorized Officer',
    signerTitle: signerTitle || 'Client Partner',
    signatureDataUrl,
    verificationHash: verificationHash || `SHA256-${Date.now().toString(16).toUpperCase()}`,
    signedAt: new Date().toISOString()
  };

  proposal.isSigned = true;
  proposal.signedRecord = signedRecord;
  proposals[id] = proposal;
  saveProposals(proposals);

  // Asynchronously store customer signature data in Supabase (Backend Function)
  saveSignatureToSupabase(id, signedRecord, proposal).catch(() => {});

  res.json({ 
    success: true, 
    signedRecord,
    supabaseSynced: Boolean(supabaseClient)
  });
});

// AI Q&A Proxy: Enforces Short, Concise Answers
app.post('/api/ai/ask', async (req, res) => {
  const { question, proposal, history = [] } = req.body;

  if (!question || !question.trim()) {
    return res.json({ success: false, answer: 'Please ask a specific question.' });
  }

  const clientName = proposal?.clientName || 'Client';
  const totalAmount = proposal?.costBreakdown?.totalInvestment || proposal?.budget || 0;
  const currency = proposal?.currency || '₹';
  const workCost = proposal?.workCost || Math.round(totalAmount * 0.1);
  const weeks = proposal?.timeline?.totalDurationWeeks || proposal?.totalWeeks || 9;

  const systemPrompt = `You are ProgenAI Copilot for ${clientName}.
Context:
- Client: ${clientName}
- Industry: ${proposal?.industry || 'Commercial Services'}
- Base Requirements Budget: ${currency}${totalAmount - workCost}
- Agency Work & Execution Cost: ${currency}${workCost}
- Total Final Investment: ${currency}${totalAmount}
- Delivery Timeline: ${weeks} weeks (Target: ${proposal?.timeline?.finalCompletionDate || 'Agreed schedule'})
- Payment: 40% Kickoff, 40% Mid-milestone, 20% Handover.

STRICT INSTRUCTION: Provide a SHORT, DIRECT answer. Maximum 2 sentences or 2 short bullet points. Be extremely concise.`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4).map((h) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text
      })),
      { role: 'user', content: question.trim() }
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const apiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://progenai.app',
        'X-Title': 'ProgenAI Backend Copilot'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages,
        temperature: 0.4,
        max_tokens: 150
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (apiRes.ok) {
      const data = await apiRes.json();
      const answer = data?.choices?.[0]?.message?.content?.trim();
      if (answer) {
        return res.json({ success: true, answer });
      }
    }
  } catch (err) {
    console.info('Backend OpenRouter fallback triggered:', err.message);
  }

  // Fallback short concise answer
  const qLower = question.toLowerCase();
  let shortAnswer = `The total investment is ${currency}${totalAmount} (including ${currency}${workCost} for agency engineering & management) delivered over ${weeks} weeks.`;

  if (qLower.includes('timeline') || qLower.includes('time') || qLower.includes('week') || qLower.includes('when')) {
    shortAnswer = `The project takes ${weeks} weeks across 3 phases, targeting final handover by ${proposal?.timeline?.finalCompletionDate || 'the agreed milestone'}.`;
  } else if (qLower.includes('cost') || qLower.includes('price') || qLower.includes('work cost') || qLower.includes('budget') || qLower.includes('total')) {
    shortAnswer = `Total investment is ${currency}${totalAmount}, combining base scope requirements (${currency}${totalAmount - workCost}) plus our turnkey engineering work cost (${currency}${workCost}).`;
  } else if (qLower.includes('sign') || qLower.includes('e-sign') || qLower.includes('certificate')) {
    shortAnswer = `Draw your signature on the pad below and click Accept & Sign. You can immediately download the verified JPG Audit Certificate and PDF.`;
  }

  res.json({ success: true, answer: shortAnswer });
});

app.listen(PORT, () => {
  console.log(`ProgenAI Backend Server running on port ${PORT}`);
});

