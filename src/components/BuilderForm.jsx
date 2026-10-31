import React, { useState } from 'react';
import { 
  Sparkles, 
  Building2, 
  Briefcase, 
  User, 
  ChevronRight, 
  RotateCcw,
  Check,
  Zap,
  Clock,
  Calendar,
  Wallet
} from 'lucide-react';
import { INDUSTRY_OPTIONS } from '../lib/aiGenerator';
import { 
  formatCompactCurrency,
  MIN_LAKHS,
  MAX_LAKHS,
  MIN_INR_BUDGET,
  MAX_INR_BUDGET,
  amountToLakhs,
  lakhsToAmount
} from '../lib/currency';

export default function BuilderForm({ onGenerate, isGenerating, onToast }) {
  const [clientName, setClientName] = useState('Aura Lifestyle Store');
  const [industry, setIndustry] = useState('E-Commerce & Retail');
  const [agencyName, setAgencyName] = useState('Creative Digital Agency');
  
  const [requirements, setRequirements] = useState([
    'Modern e-commerce website with fast pages and mobile product catalog.',
    'Online payments (UPI, Cards), customer login, and WhatsApp order alerts.',
    'Complete setup, launch testing, Google search setup, and 30 days free support.'
  ]);
  
  const [budget, setBudget] = useState(1500000); // 15 Lakhs default
  const [workCostRate, setWorkCostRate] = useState(0.10); // 10% Work Fee
  const [customWorkCost, setCustomWorkCost] = useState('');
  const [timelineSpeed, setTimelineSpeed] = useState('standard');
  const [errors, setErrors] = useState({});

  const currentLakhs = amountToLakhs(budget);

  // Calculate Our Work Cost and Final Total Investment
  const workCost = customWorkCost !== '' && !isNaN(Number(customWorkCost))
    ? Math.max(0, Number(customWorkCost))
    : Math.round(Number(budget) * workCostRate);
  const finalTotalAmount = Number(budget) + workCost;

  const handleRequirementChange = (index, value) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
    if (errors[`req_${index}`]) {
      setErrors((prev) => ({ ...prev, [`req_${index}`]: null }));
    }
  };

  const handleLakhSliderChange = (e) => {
    const lk = parseFloat(e.target.value);
    const amt = lakhsToAmount(lk);
    setBudget(amt);
    if (errors.budget) setErrors((prev) => ({ ...prev, budget: null }));
  };

  const handleClear = () => {
    setClientName('');
    setIndustry('');
    setAgencyName('Creative Digital Agency');
    setRequirements(['', '', '']);
    setBudget(1500000);
    setWorkCostRate(0.10);
    setCustomWorkCost('');
    setErrors({});
    onToast?.('Form cleared. Ready for new proposal!', 'info');
  };

  const validate = () => {
    const newErrors = {};
    if (!clientName.trim()) newErrors.clientName = 'Please enter the client name';
    if (!industry.trim()) newErrors.industry = 'Please enter or pick business type';

    if (!budget || Number(budget) < MIN_INR_BUDGET || Number(budget) > MAX_INR_BUDGET) {
      newErrors.budget = 'Please enter budget between ₹1 Lakh and ₹80 Lakhs';
    }

    requirements.forEach((req, idx) => {
      if (!req.trim()) {
        newErrors[`req_${idx}`] = `Task ${idx + 1} cannot be empty`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      onToast?.('Please check the form: enter client name and 3 tasks.', 'error');
      return;
    }

    onGenerate({
      industry: industry.trim(),
      clientName: clientName.trim(),
      agencyName: agencyName.trim() || 'Creative Digital Agency',
      requirements: requirements.map((r) => r.trim()),
      budget: Number(budget),
      workCost: Number(workCost),
      totalInvestment: Number(finalTotalAmount),
      currency: '₹',
      timelineSpeed
    });
  };

  const lakhShortcuts = [
    { label: '5L', amt: 500000, desc: '5 Lakhs' },
    { label: '10L', amt: 1000000, desc: '10 Lakhs' },
    { label: '15L', amt: 1500000, desc: '15 Lakhs' },
    { label: '25L', amt: 2500000, desc: '25 Lakhs' },
    { label: '50L', amt: 5000000, desc: '50 Lakhs' },
    { label: '80L', amt: 8000000, desc: '80 Lakhs' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      
      {/* Friendly Header with beautiful colorful accents */}
      <div className="text-center mb-7">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-500 via-indigo-600 to-pink-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simple Proposal Maker</span>
        </div>
        
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create Proposal & Price Quote
        </h1>
        
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          Fill in 4 simple steps below. We will create a clean proposal link your client can view and sign online.
        </p>
      </div>

      {/* Main Clean Card with colorful step badges */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-9 shadow-md shadow-slate-200/40 dark:shadow-none transition">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* STEP 1: CLIENT & YOUR NAME */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-blue-500/30">
                1
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Client & Your Name
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Who is this proposal for?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Client or Company Name</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (errors.clientName) setErrors((prev) => ({ ...prev, clientName: null }));
                  }}
                  placeholder="e.g. Rahul Sharma or Ramesh Supermarket"
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none transition focus:bg-white dark:focus:bg-slate-900 focus:ring-2 ${
                    errors.clientName
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                {errors.clientName && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.clientName}</p>
                )}
              </div>

              {/* Client Business Type / Industry */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Business Type</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="industry-options"
                  value={industry}
                  onChange={(e) => {
                    setIndustry(e.target.value);
                    if (errors.industry) setErrors((prev) => ({ ...prev, industry: null }));
                  }}
                  placeholder="e.g. Retail Store, Restaurant, Software, Clinic"
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none transition focus:bg-white dark:focus:bg-slate-900 focus:ring-2 ${
                    errors.industry
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                <datalist id="industry-options">
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
                {errors.industry && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.industry}</p>
                )}
              </div>

              {/* Agency Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-500" />
                  <span>Your Name or Business Name</span>
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="e.g. Kumar Digital Agency"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none transition focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* STEP 2: 3 PROJECT TASKS */}
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-purple-500/30">
                2
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  3 Things You Will Do (Project Tasks)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Write the 3 main parts of work you will deliver to the client.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 mt-3">
              {[
                { 
                  tag: 'Task 1: Main Work', 
                  desc: 'e.g. Design & build new modern e-commerce website with product catalog' 
                },
                { 
                  tag: 'Task 2: Key Features', 
                  desc: 'e.g. Online UPI payments, customer accounts, and WhatsApp order alerts' 
                },
                { 
                  tag: 'Task 3: Launch & Support', 
                  desc: 'e.g. Domain setup, testing, Google search setup, and 30 days free support' 
                }
              ].map((item, idx) => {
                const reqValue = requirements[idx] || '';
                const hasError = errors[`req_${idx}`];

                return (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span>{item.tag}</span>
                      </span>
                      <span className="text-[11px] text-rose-500 font-semibold">*Required</span>
                    </label>
                    <textarea
                      rows={2}
                      value={reqValue}
                      onChange={(e) => handleRequirementChange(idx, e.target.value)}
                      placeholder={item.desc}
                      className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition resize-none focus:ring-2 ${
                        hasError
                          ? 'border-rose-400 focus:ring-rose-400'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                    />
                    {hasError && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">{hasError}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* STEP 3: PRICE & YOUR WORK FEE */}
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-emerald-500/30">
                3
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Project Price & Your Fee</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    ₹1L to ₹80L
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose the project cost and add your fee. The total will be calculated automatically.
                </p>
              </div>
            </div>

            {/* Price control box */}
            <div className="mt-3 p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-indigo-50/20 dark:from-slate-950 dark:to-indigo-950/10 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              
              {/* Big, Clear Price display */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Base Project Budget:
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white flex items-center gap-2">
                    <span>₹{Number(budget).toLocaleString('en-IN')}</span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-sans">
                      ({currentLakhs} Lakhs)
                    </span>
                  </div>
                </div>

                {/* Direct Number Input */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Or type amount:</span>
                  <input
                    type="number"
                    min={MIN_INR_BUDGET}
                    max={MAX_INR_BUDGET}
                    step={50000}
                    value={budget}
                    onChange={(e) => {
                      setBudget(e.target.value);
                      if (errors.budget) setErrors((prev) => ({ ...prev, budget: null }));
                    }}
                    className="w-32 px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Smooth Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={MIN_LAKHS}
                  max={MAX_LAKHS}
                  step="0.5"
                  value={currentLakhs >= 1 && currentLakhs <= 80 ? currentLakhs : 15}
                  onChange={handleLakhSliderChange}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>₹1 Lakh</span>
                  <span>₹20L</span>
                  <span>₹40L</span>
                  <span>₹60L</span>
                  <span>₹80 Lakhs</span>
                </div>
              </div>

              {/* Fast 1-Click Selectors */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  Quick Pick:
                </span>
                {lakhShortcuts.map((item) => {
                  const isSelected = Number(budget) === item.amt;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setBudget(item.amt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      {item.desc}
                    </button>
                  );
                })}
              </div>

              {/* Your Work Fee / Profit */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                    <span>+ Your Work Fee (Profit / Management):</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    Added to project cost
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: '+5%', rate: 0.05 },
                    { label: '+10% (Normal)', rate: 0.10 },
                    { label: '+15%', rate: 0.15 },
                    { label: '+20%', rate: 0.20 }
                  ].map((tier) => (
                    <button
                      key={tier.label}
                      type="button"
                      onClick={() => {
                        setWorkCostRate(tier.rate);
                        setCustomWorkCost('');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        customWorkCost === '' && workCostRate === tier.rate
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}

                  <div className="flex items-center gap-1 ml-1">
                    <span className="text-[11px] text-slate-400">Custom ₹:</span>
                    <input
                      type="number"
                      placeholder="150000"
                      value={customWorkCost}
                      onChange={(e) => setCustomWorkCost(e.target.value)}
                      className="w-20 px-2 py-0.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Beautiful, Easy-to-Understand Receipt Card */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-300/80 dark:border-emerald-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                    Total Final Price for Client:
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    (Base ₹{Number(budget).toLocaleString('en-IN')} + Fee ₹{Number(workCost).toLocaleString('en-IN')})
                  </span>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-800 dark:text-emerald-200">
                    ₹{Number(finalTotalAmount).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCompactCurrency(finalTotalAmount, '₹')}
                  </div>
                </div>
              </div>

            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* STEP 4: DELIVERY TIME */}
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-amber-500/30">
                4
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Delivery Time (How Fast?)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  How long will it take to complete the work?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {[
                { 
                  id: 'expedited', 
                  title: 'Fast', 
                  time: '5 Weeks', 
                  desc: 'Quick delivery for urgent work',
                  color: 'text-amber-500',
                  icon: Zap 
                },
                { 
                  id: 'standard', 
                  title: 'Standard', 
                  time: '9 Weeks', 
                  desc: 'Normal comfortable delivery (Recommended)',
                  color: 'text-indigo-500',
                  icon: Clock 
                },
                { 
                  id: 'extended', 
                  title: 'Phased', 
                  time: '14 Weeks', 
                  desc: 'Step-by-step launch over time',
                  color: 'text-emerald-500',
                  icon: Calendar 
                }
              ].map((item) => {
                const isSelected = timelineSpeed === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTimelineSpeed(item.id)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                        <IconComponent className={`w-3.5 h-3.5 ${item.color}`} />
                        <span>{item.title}</span>
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[3]" />}
                    </div>
                    <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                      {item.time}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTION BUTTONS WITH BEAUTIFUL COLOR */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1.5 transition px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Form</span>
            </button>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full sm:w-auto px-8 sm:px-10 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-400 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02]"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Proposal...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Proposal & Get Link</span>
                  <ChevronRight className="w-4 h-4 opacity-80" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
