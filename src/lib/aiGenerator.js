// ProgenAI Client-side Proposal Synthesis Engine (Zero-Backend Ready)

export const INDUSTRY_PRESETS = [
  {
    id: 'web-agency-in',
    name: '🇮🇳 Web Agency & E-Commerce (₹)',
    industry: 'Web Agency & E-Commerce',
    clientName: 'Aura Lifestyle & Fashion India',
    budget: 450000,
    currency: '₹',
    requirements: [
      'Headless Shopify Next.js storefront with Razorpay / UPI gateway & sub-second page loads.',
      'AI recommendation quiz for personalized Indian festive & apparel collections with WhatsApp CRM sync.',
      'Pan-India edge CDN setup with pin-code serviceability check and multi-state GST invoicing.'
    ]
  },
  {
    id: 'construction-in',
    name: '🇮🇳 Commercial Construction & Fit-Out (₹)',
    industry: 'Construction & Fit-Out',
    clientName: 'DLF CyberCity Tech Hub (Gurugram)',
    budget: 1850000,
    currency: '₹',
    requirements: [
      'Turnkey VRV/HVAC air filtration system with smart IoT zoning and GRIHA green building compliance.',
      'Acoustic double-glazed glass partitions and ergonomic modular conference rooms across 2 wings.',
      'Heavy-duty anti-static flooring, zero-VOC Asian Paints architectural finish, and fire safety NOC.'
    ]
  },
  {
    id: 'ai-saas-in',
    name: '🇮🇳 Enterprise AI & FinTech SaaS (₹)',
    industry: 'Software & AI Development',
    clientName: 'Bharat Financial Intelligence (Bengaluru)',
    budget: 850000,
    currency: '₹',
    requirements: [
      'Self-hosted OCR and multilingual LLM document parser for Indian GST, PAN, and bank statements.',
      'RBI & CERT-In compliant role-based authentication with end-to-end audit logging.',
      'Real-time WebSocket analytics dashboard with interactive financial projections and automated PDF reports.'
    ]
  },
  {
    id: 'architecture-in',
    name: '🇮🇳 Luxury Architecture & Interior (₹)',
    industry: 'Architecture & Interior Design',
    clientName: 'Palm Grove Luxury Villas (Goa)',
    budget: 1500000,
    currency: '₹',
    requirements: [
      'Comprehensive architectural blueprint, structural engineering certificates, and municipal permit set.',
      'Ultra-realistic 4K 3D BIM walkthroughs showcasing tropical modernism with local stone and teakwood.',
      'Bespoke Italian marble procurement schedule, custom veneer millwork detailing, and site supervision.'
    ]
  },
  {
    id: 'global-web',
    name: '🌐 Global SaaS Platform ($)',
    industry: 'Web Agency & Digital',
    clientName: 'Nexus Cloud Technologies',
    budget: 45000,
    currency: '$',
    requirements: [
      'Next-generation responsive web application with sub-second page transitions.',
      'Real-time collaborative workspace with automated workflow triggers and notification pipeline.',
      'Global multi-region edge deployment with SOC-2 security protocols and automated backups.'
    ]
  }
];

export const INDUSTRY_OPTIONS = [
  'Web Agency & E-Commerce',
  'Commercial Construction & Fit-Out',
  'Software & AI Development',
  'Architecture & Interior Design',
  'FinTech & Banking Solutions',
  'Healthcare & MedTech',
  'Digital Marketing & Creative',
  'Manufacturing & Industrial',
  'Professional Consulting & Legal'
];

/**
 * Computes Adaptive Alternatives based on Timeline vs Budget constraints
 */
export function computeAdaptiveAlternatives(industry, _requirements, budget, currency, timelineSpeed) {
  const isExpedited = timelineSpeed === 'expedited';
  const isINR = currency === '₹' || currency === 'INR';
  const isConstrained = (isINR && budget < 800000 && isExpedited) || (!isINR && budget < 50000 && isExpedited);

  if (isConstrained || isExpedited) {
    return {
      isAdaptive: true,
      strategyTitle: 'AI Adaptive Timeline & Cost Optimization',
      statusBadge: 'Adaptive Fast-Track Mode',
      analysisSummary: `Client requested an expedited ${isExpedited ? '5-week' : 'accelerated'} execution timeline. Standard linear development under this schedule typically triggers heavy overtime costs. Our AI has re-architected the delivery framework into an optimized modular pathway that achieves 100% of the 3 requirements within budget.`,
      recommendedApproach: 'Critical-Path Modular Acceleration & Pre-Engineered Frameworks',
      keyAdaptations: [
        'Pre-Fabricated/Pre-Engineered Components: Eliminates up to 50 hours of boilerplate groundwork by deploying certified architectural modules.',
        'Concurrent Sprint Tracks: Phase 1 (Blueprint & Design Tokens) overlaps Phase 2 (Core Build) to collapse delivery window by 2-3 weeks.',
        'Continuous Quality Gateways: Automated validation pipelines replace bureaucratic sign-off delays without sacrificing safety or code quality.',
        'Zero Overtime Inflation: Accomplishes accelerated delivery while maintaining fixed budget certainty.'
      ],
      budgetImpact: 'Avoids standard 20-30% emergency rush surcharges through intelligent scheduling.'
    };
  }

  return {
    isAdaptive: false,
    strategyTitle: 'AI Standard Turnkey Milestone Framework',
    statusBadge: 'Balanced Value Delivery',
    analysisSummary: `Project timeline and budget parameters are balanced. The AI has engineered a structured sprint sequence that maximizes quality, thorough testing, and predictable milestone deliverables.`,
    recommendedApproach: 'Phased High-Assurance Iteration with Dual-Stage QA',
    keyAdaptations: [
      'Structured Discovery: Comprehensive alignment sprints to lock in all specifications prior to execution.',
      'Systematic Sprint Execution: Bi-weekly client reviews ensuring total transparency and milestone sign-offs.',
      'Dedicated UAT & Commissioning: Final 2 weeks reserved exclusively for testing, hardening, and knowledge transfer.'
    ],
    budgetImpact: 'Optimal capital efficiency with 100% fixed-price transparency.'
  };
}

/**
 * Transforms raw requirement inputs into professional deliverable scopes
 */
function synthesizeScope(industry, requirements, totalBudget) {
  // Budget allocation percentages: 40%, 35%, 25%
  const ratios = [0.40, 0.35, 0.25];
  
  // Calculate cost allocations ensuring total adds up to exact budget
  const cost1 = Math.round(totalBudget * ratios[0]);
  const cost2 = Math.round(totalBudget * ratios[1]);
  const cost3 = totalBudget - (cost1 + cost2); // guarantees 100% exact match
  const costs = [cost1, cost2, cost3];

  return requirements.map((rawReq, index) => {
    const cost = costs[index];
    const percentage = Math.round((cost / totalBudget) * 100);
    const trimmed = (rawReq || '').trim();
    
    // Synthesize professional deliverable headline & specifics based on keywords & order
    const deliverable = buildDeliverableDetails(industry, trimmed, index + 1, cost);

    return {
      index: index + 1,
      requirementInput: trimmed,
      title: deliverable.title,
      summary: deliverable.summary,
      deliverables: deliverable.deliverables,
      businessImpact: deliverable.businessImpact,
      cost: cost,
      percentage: percentage,
    };
  });
}

function buildDeliverableDetails(_industry, reqText, itemNum, _cost) {
  const textLower = reqText.toLowerCase();

  // Smart heuristic based on content and industry
  if (textLower.includes('hvac') || textLower.includes('building') || textLower.includes('fit-out') || textLower.includes('construction') || textLower.includes('structural') || textLower.includes('flooring')) {
    return {
      title: `Deliverable 0${itemNum}: Structural & Environmental Engineering Specification`,
      summary: `End-to-end site preparation, rigorous structural code verification, and high-performance execution of ${reqText.toLowerCase()}. Delivered with zero safety incidents and strict adherence to statutory building codes.`,
      deliverables: [
        'Detailed engineering CAD schematics & safety risk assessments',
        'Certified contractor deployment, procurement of commercial-grade materials',
        'Mid-stage structural stress testing and statutory compliance sign-offs',
        'Final commissioning report with manufacturer warranties and lifecycle maintenance guide'
      ],
      businessImpact: 'Maximizes commercial asset longevity, cuts ongoing energy overhead by up to 24%, and guarantees full regulatory compliance.'
    };
  }

  if (textLower.includes('api') || textLower.includes('database') || textLower.includes('backend') || textLower.includes('llm') || textLower.includes('ai') || textLower.includes('auth') || textLower.includes('saas')) {
    return {
      title: `Deliverable 0${itemNum}: Core Architecture, Cloud Infrastructure & Intelligence Layer`,
      summary: `High-availability cloud engineering and enterprise data architecture for ${reqText.toLowerCase()}. Engineered for sub-100ms latency, horizontal scalability, and bank-grade data security.`,
      deliverables: [
        'Secure multi-tier microservice architecture & automated CI/CD pipeline',
        'Data encryption at rest and in transit (AES-256 / TLS 1.3)',
        'Full test suite coverage (unit, integration, load testing up to 10k req/sec)',
        'API schema documentation, Swagger OpenAPI sandbox, and runbook handoff'
      ],
      businessImpact: 'Eliminates technical debt, guarantees 99.95% uptime SLA, and provides a scalable foundation for future product evolution.'
    };
  }

  if (textLower.includes('ui') || textLower.includes('design') || textLower.includes('storefront') || textLower.includes('frontend') || textLower.includes('web') || textLower.includes('razorpay') || textLower.includes('shopify')) {
    return {
      title: `Deliverable 0${itemNum}: Next-Gen Experience Design & Interactive Interface Engine`,
      summary: `Bespoke digital interface crafted to delight users and maximize conversion rates for ${reqText.toLowerCase()}. Built with modern reactive frameworks, fluid motion design, and WCAG AA accessibility compliance.`,
      deliverables: [
        'High-fidelity interactive prototype & design system tokenization',
        'Mobile-first responsive frontend implementation with edge SSR',
        'Lighthouse performance optimization targeting 95+ score across Core Web Vitals',
        'Cross-device testing suite and payment gateway checkout validation'
      ],
      businessImpact: 'Drives user engagement, elevates customer perceived brand value, and reduces drop-off rates across checkouts.'
    };
  }

  // Default professional synthesis
  return {
    title: `Deliverable 0${itemNum}: Executive Implementation & Strategic Execution`,
    summary: `Professional, turnkey deployment addressing: "${reqText}". Executed using industry-leading methodologies, milestone verification, and quality oversight.`,
    deliverables: [
      'Comprehensive discovery specification and milestone roadmap',
      'Execution sprint cycle with weekly asynchronous stakeholder status reporting',
      'Rigorous quality assurance testing and peer-review protocols',
      'Turnkey handover documentation, training assets, and executive debrief'
    ],
    businessImpact: 'Achieves key strategic outcomes on schedule while mitigating operational risks and resource strain.'
  };
}

/**
 * Generates an accurate 3-phase timeline with calculated completion dates
 */
function generateTimeline(speed = 'standard') {
  const now = new Date();
  
  // Phase durations in weeks
  const durationMap = {
    expedited: [1, 3, 1], // 5 weeks total
    standard: [2, 5, 2],  // 9 weeks total
    extended: [3, 8, 3]   // 14 weeks total
  };

  const durations = durationMap[speed] || durationMap.standard;

  const addWeeks = (date, weeks) => {
    const d = new Date(date);
    d.setDate(d.getDate() + weeks * 7);
    return d;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const phase1Start = new Date(now.getTime());
  const phase1End = addWeeks(phase1Start, durations[0]);

  const phase2Start = new Date(phase1End);
  phase2Start.setDate(phase2Start.getDate() + 1);
  const phase2End = addWeeks(phase2Start, durations[1]);

  const phase3Start = new Date(phase2End);
  phase3Start.setDate(phase3Start.getDate() + 1);
  const phase3End = addWeeks(phase3Start, durations[2]);

  const totalWeeks = durations.reduce((a, b) => a + b, 0);

  return {
    totalDurationWeeks: totalWeeks,
    finalCompletionDate: formatDate(phase3End),
    phases: [
      {
        phaseNumber: '01',
        title: 'Discovery, Strategic Architecture & Planning',
        duration: `${durations[0]} Weeks`,
        dateRange: `${formatDate(phase1Start)} – ${formatDate(phase1End)}`,
        status: 'Kickoff Phase',
        milestones: [
          'Stakeholder alignment workshop & KPI definition',
          'Technical & architectural blueprint approval',
          'Resource allocation and sprint environment provisioning'
        ]
      },
      {
        phaseNumber: '02',
        title: 'Core Development, Engineering & Buildout',
        duration: `${durations[1]} Weeks`,
        dateRange: `${formatDate(phase2Start)} – ${formatDate(phase2End)}`,
        status: 'Active Build',
        milestones: [
          'Iterative sprint deliverables with bi-weekly staging demos',
          'Core integration of primary requirements and specifications',
          'Mid-point progress audit and client review sign-off'
        ]
      },
      {
        phaseNumber: '03',
        title: 'Quality Verification, Commissioning & Final Launch',
        duration: `${durations[2]} Weeks`,
        dateRange: `${formatDate(phase3Start)} – ${formatDate(phase3End)}`,
        status: 'Launch & Handoff',
        milestones: [
          'End-to-end stress, security, and user acceptance testing (UAT)',
          'Production rollout, final commissioning, and DNS/site cutover',
          'Knowledge transfer, documentation handover, and warranty kickoff'
        ]
      }
    ]
  };
}

/**
 * Main AI Proposal Generation Engine (Client-side)
 */
export function generateProposal(inputs) {
  const {
    clientName = 'Valued Client',
    agencyName = 'ProgenAI Creative & Engineering Studio',
    industry = 'Web Agency & E-Commerce',
    requirements = [],
    budget = 450000,
    currency = '₹',
    timelineSpeed = 'standard',
    workCost = undefined,
    workCostRate = 0.10
  } = inputs;

  const validRequirements = requirements
    .map(r => (typeof r === 'string' ? r : ''))
    .filter(r => r.trim().length > 0);

  while (validRequirements.length < 3) {
    validRequirements.push(
      `Deliverable requirement 0${validRequirements.length + 1} for ${industry} with end-to-end quality validation.`
    );
  }

  const numericBudget = Math.max(100, Math.round(Number(budget) || 100000));
  // Our Work Cost (Agency Engineering, Management & Supervision) added to total
  const calculatedWorkCost = workCost !== undefined && !isNaN(Number(workCost))
    ? Math.max(0, Math.round(Number(workCost)))
    : Math.round(numericBudget * (Number(workCostRate) || 0.10));

  const totalInvestment = numericBudget + calculatedWorkCost;

  const scopeOfWork = synthesizeScope(industry, validRequirements.slice(0, 3), numericBudget);
  const timeline = generateTimeline(timelineSpeed);
  const adaptiveStrategy = computeAdaptiveAlternatives(industry, validRequirements, totalInvestment, currency, timelineSpeed);

  const proposalId = `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const issueDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + 30);
  const validUntil = validUntilDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const paymentSchedule = [
    {
      milestone: 'Project Initiation Deposit',
      percentage: '40%',
      amount: Math.round(totalInvestment * 0.40),
      trigger: 'Due upon proposal execution to mobilize resources and start Phase 1'
    },
    {
      milestone: 'Mid-Stage Milestone Acceptance',
      percentage: '40%',
      amount: Math.round(totalInvestment * 0.40),
      trigger: 'Due upon completion and client review of Phase 2 core deliverables'
    },
    {
      milestone: 'Final Delivery & Acceptance Sign-off',
      percentage: '20%',
      amount: totalInvestment - (Math.round(totalInvestment * 0.40) * 2),
      trigger: 'Due upon final commissioning, testing sign-off, and IP handover'
    }
  ];

  return {
    proposalId,
    clientName,
    agencyName,
    industry,
    rawRequirements: validRequirements.slice(0, 3),
    requirements: validRequirements.slice(0, 3),
    budget: numericBudget,
    requirementsBudget: numericBudget,
    workCost: calculatedWorkCost,
    totalInvestment,
    currency,
    issueDate,
    validUntil,
    timelineSpeed,
    executiveSummary: `This executive proposal outlines the turnkey scope of work, timeline, and investment required by ${agencyName} to deliver exceptional, measurable results for ${clientName}. Tailored specifically for the ${industry} sector, our approach merges battle-tested engineering, human-centered design, and transparent milestone management to eliminate risk and maximize return on investment.`,
    adaptiveStrategy,
    scopeOfWork,
    sow: scopeOfWork,
    timeline,
    totalWeeks: timeline.totalDurationWeeks,
    targetCompletionDate: timeline.finalCompletionDate,
    costBreakdown: {
      requirementsSubtotal: numericBudget,
      workCost: calculatedWorkCost,
      workCostLabel: 'Our Work, Engineering & Delivery Management Cost',
      items: scopeOfWork.map(s => ({
        index: s.index,
        title: s.title,
        requirement: s.requirementInput,
        cost: s.cost,
        percentage: Math.round((s.cost / totalInvestment) * 100)
      })),
      totalInvestment,
      paymentSchedule
    },
    serviceLevelAgreements: [
      { label: 'On-Time Guarantee', detail: 'Guaranteed milestone delivery within the stipulated project schedule.' },
      { label: 'Post-Launch Warranty', detail: '30 days of comprehensive post-deployment bug fixing and support.' },
      { label: 'Intellectual Property', detail: '100% full transfer of all code, assets, blueprints, and IP upon final payment.' }
    ]
  };
}
