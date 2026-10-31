/**
 * ProgenAI In-App AI Assistant Service
 * Connects to OpenRouter for independent question answering on proposals.
 * Provides fallback heuristic reasoning if offline.
 */

import { formatCurrency, formatCompactCurrency } from './currency';

const OPENROUTER_API_KEY =
  import.meta.env.VITE_OPENROUTER_API_KEY ||
  '';

/**
 * Builds the proposal context prompt for the AI model
 */
function buildProposalContext(proposal) {
  if (!proposal) return 'No proposal context available.';

  const reqText = (proposal.rawRequirements || proposal.requirements || [])
    .map((r, i) => `Requirement ${i + 1}: ${r}`)
    .join('\n');

  const sowItems = proposal.scopeOfWork || proposal.sow || [];
  const sowText = sowItems
    .map(
      (s, i) =>
        `Deliverable ${i + 1}: ${s.title}\nSummary: ${s.summary || s.deliverable || ''}\nItemized Deliverables: ${(s.deliverables || s.deliverablesList || []).join(', ')}`
    )
    .join('\n\n');

  const timelinePhases = proposal.timeline?.phases || (Array.isArray(proposal.timeline) ? proposal.timeline : []);
  const timelineText = timelinePhases
    .map((t) => `${t.phase} (${t.durationWeeks} weeks) - ${t.milestone}: ${t.description}`)
    .join('\n');

  const costItems = proposal.costBreakdown?.items || (Array.isArray(proposal.costBreakdown) ? proposal.costBreakdown : []);
  const costText = costItems
    .map((c) => `${c.title || c.item}: ${formatCurrency(c.cost || c.amount, proposal.currency || '₹')} (${c.percentage}%)`)
    .join('\n');

  const totalAmount = proposal.costBreakdown?.totalInvestment || proposal.budget || 0;

  return `
--- ACTIVE PROPOSAL CONTEXT ---
Proposal ID: ${proposal.proposalId || 'PROP-CURRENT'}
Client Name: ${proposal.clientName || 'Valued Client'}
Agency: ${proposal.agencyName || 'ProgenAI Creative Studio'}
Industry: ${proposal.industry || 'Technology'}
Total Budget: ${formatCurrency(totalAmount, proposal.currency || '₹')} (${formatCompactCurrency(totalAmount, proposal.currency || '₹')})
Delivery Cadence: ${proposal.timelineSpeed || 'standard'} (~${proposal.totalWeeks || proposal.timeline?.totalDurationWeeks || 9} weeks)
Target Completion Date: ${proposal.targetCompletionDate || proposal.timeline?.finalCompletionDate || 'To be finalized'}
Execution Status: ${proposal.isSigned ? 'SIGNED & EXECUTED' : 'PENDING CLIENT DIGITAL SIGNATURE'}

CORE CLIENT REQUIREMENTS:
${reqText}

SCOPE OF WORK & DELIVERABLES:
${sowText}

SCHEDULE & PHASES:
${timelineText}

FINANCIAL BREAKDOWN & INVESTMENT:
${costText}
Total Agreed Amount: ${formatCurrency(totalAmount, proposal.currency || '₹')}

PAYMENT TERMS:
- Phase 1 Kickoff Deposit: 40% (${formatCurrency(totalAmount * 0.4, proposal.currency || '₹')})
- Phase 2 Mid-Milestone: 40% (${formatCurrency(totalAmount * 0.4, proposal.currency || '₹')})
- Phase 3 Final Delivery & Signoff: 20% (${formatCurrency(totalAmount * 0.2, proposal.currency || '₹')})
------------------------------`;
}

/**
 * Intelligent local synthesis engine if OpenRouter is unreachable or offline
 */
function generateLocalAssistantReply(question, proposal) {
  const q = (question || '').toLowerCase();
  const client = proposal?.clientName || 'Client';
  const budgetStr = formatCurrency(proposal?.budget || 0, proposal?.currency || '₹');
  const compactBudget = formatCompactCurrency(proposal?.budget || 0, proposal?.currency || '₹');
  const weeks = proposal?.totalWeeks || 9;

  if (q.includes('timeline') || q.includes('time') || q.includes('week') || q.includes('when') || q.includes('finish') || q.includes('deadline')) {
    return `The project for **${client}** is scheduled for **${weeks} weeks**, targeting final completion by **${proposal?.targetCompletionDate || 'the agreed deadline'}**.\n\n• **Phase 1 (Discovery & Architecture):** Weeks 1–${Math.max(1, Math.round(weeks * 0.3))}\n• **Phase 2 (Core Build & Integration):** Weeks ${Math.max(1, Math.round(weeks * 0.3)) + 1}–${Math.round(weeks * 0.75)}\n• **Phase 3 (QA, Testing & Launch):** Final ${weeks - Math.round(weeks * 0.75)} weeks\n\nAll milestones include weekly progress check-ins and review sign-offs before transitioning to subsequent stages.`;
  }

  if (q.includes('cost') || q.includes('budget') || q.includes('price') || q.includes('payment') || q.includes('lakh') || q.includes('rupee') || q.includes('investment')) {
    const p1 = formatCurrency((proposal?.budget || 0) * 0.4, proposal?.currency || '₹');
    const p2 = formatCurrency((proposal?.budget || 0) * 0.4, proposal?.currency || '₹');
    const p3 = formatCurrency((proposal?.budget || 0) * 0.2, proposal?.currency || '₹');
    return `The total investment is fixed at **${budgetStr} (${compactBudget})** covering all three project requirements.\n\nStructured milestone disbursements:\n1. **40% Mobilization Deposit:** ${p1} upon formal contract execution.\n2. **40% Mid-Milestone Delivery:** ${p2} upon completion of core development & staging validation.\n3. **20% Handover & Acceptance:** ${p3} following QA sign-off and final production deployment.\n\nThere are no hidden fees, and all licensing and initial warranty coverage are bundled.`;
  }

  if (q.includes('sign') || q.includes('signature') || q.includes('certificate') || q.includes('jpg') || q.includes('pdf') || q.includes('legal')) {
    return `You can e-sign directly on the page using the **Digital Signature Pad** at the bottom of the proposal.\n\nUpon clicking **Accept & Legally Sign**:\n1. An official **Audit Certificate (JPG Photo)** with your drawn signature, timestamp, and cryptographic hash is generated instantly for download.\n2. A complete **PDF Document** can also be saved to your device.\n3. Execution status is transmitted in real-time to the project dashboard.`;
  }

  if (q.includes('deliverable') || q.includes('scope') || q.includes('requirement') || q.includes('feature') || q.includes('what will')) {
    const deliverables = (proposal?.sow || []).map((s, idx) => `**${idx + 1}. ${s.title}:** ${s.deliverable}`).join('\n\n');
    return `Here is a summary of the key deliverables for **${client}**:\n\n${deliverables}\n\nEach deliverable includes full source assets, deployment documentation, and post-launch onboarding.`;
  }

  if (q.includes('change') || q.includes('modify') || q.includes('cancel') || q.includes('custom') || q.includes('edit')) {
    return `Modifications can be easily accommodated before digital signing. If you need to adjust budget allocations, expedite delivery, or expand any of the 3 requirements, please notify your project manager or adjust the inputs in the builder to recalculate the scope.`;
  }

  // Default intelligent assistant response
  return `Thank you for asking about this project delivery blueprint for **${client}**.\n\nThis proposal outlines **${weeks} weeks of delivery** for a total investment of **${budgetStr}** across **${(proposal?.requirements || []).length} core requirements**.\n\nYou can review each deliverable card above, inspect the milestone timeline, and e-sign directly using the signature pad below. Feel free to ask any specific questions regarding timeline, scope, or payment breakdown!`;
}

/**
 * Ask the In-App AI Proposal Assistant
 * Calls OpenRouter with proposal context, falling back smoothly to heuristic reasoning.
 */
export async function askProposalAssistant({ question, proposal, history = [] }) {
  if (!question || !question.trim()) {
    return 'Please ask a question regarding the proposal.';
  }

  const proposalContext = buildProposalContext(proposal);

  const systemMessage = {
    role: 'system',
    content: `You are the ProgenAI Proposal Copilot — an expert client commercial advisor and project management consultant.
Your role is to independently answer questions from the client or agency regarding the active proposal.
Always be professional, concise, reassuring, and precise.
Use bullet points and bold highlights for readability.
Reference exact numbers, Indian currency amounts (Lakhs / ₹ INR), timelines, and requirements from the active proposal context provided below.
Do not invent requirements that are not in the scope. If asked something outside the scope, politely clarify how it would be treated as an add-on.

${proposalContext}`
  };

  const messages = [
    systemMessage,
    ...history.slice(-6).map((h) => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.text
    })),
    {
      role: 'user',
      content: question.trim()
    }
  ];

  // Try OpenRouter API first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin || 'https://progenai.app',
        'X-Title': 'ProgenAI Client Proposal Copilot'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages,
        temperature: 0.6,
        max_tokens: 650
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const answer = data?.choices?.[0]?.message?.content;
      if (answer && answer.trim()) {
        return answer.trim();
      }
    }
  } catch (err) {
    // Graceful fallback to heuristic synthesis (e.g. offline, timeout, or CORS)
    console.info('Switching to ProgenAI Heuristic Assistant Engine:', err?.message || err);
  }

  // Fallback to intelligent local proposal-aware answer
  return generateLocalAssistantReply(question, proposal);
}

