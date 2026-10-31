import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, CheckCircle2, Clock, Calculator, ArrowRight, UserCheck, ListTodo, FileCheck } from 'lucide-react';

export default function ProposalSkeleton({ onComplete, currency = '₹' }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(20);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const steps = [
    { label: 'Step 1: Setting up client details...', icon: UserCheck, color: 'text-blue-500' },
    { label: 'Step 2: Organizing the 3 project tasks...', icon: ListTodo, color: 'text-purple-500' },
    { label: 'Step 3: Calculating delivery timeline...', icon: Clock, color: 'text-amber-500' },
    { label: `Step 4: Totaling budget and work fee in ${currency}...`, icon: Calculator, color: 'text-emerald-500' },
    { label: 'Step 5: Proposal ready! Opening now...', icon: FileCheck, color: 'text-indigo-500' },
  ];

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStepIndex(1);
      setProgress(45);
    }, 350);

    const t2 = setTimeout(() => {
      setStepIndex(2);
      setProgress(70);
    }, 700);

    const t3 = setTimeout(() => {
      setStepIndex(3);
      setProgress(90);
    }, 1050);

    const t4 = setTimeout(() => {
      setStepIndex(4);
      setProgress(100);
    }, 1400);

    const t5 = setTimeout(() => {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 1700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  const handleInstantView = () => {
    if (onCompleteRef.current) {
      onCompleteRef.current();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-10 px-4">
      {/* Central Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-lg border border-slate-200/90 dark:border-slate-800 text-center">
        
        <div className="flex flex-col items-center">
          
          {/* Animated Colorful Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-5 animate-pulse">
            <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Creating Your Proposal & Quote
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Organizing your project tasks, price estimate, and client e-sign link...
          </p>

          {/* Progress Bar with vibrant gradient */}
          <div className="w-full mt-6">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              <span>PREPARING PROPOSAL</span>
              <span className="text-indigo-600 dark:text-indigo-400">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="w-full mt-6 space-y-2 text-left bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {steps.map((s, idx) => {
              const isPast = idx < stepIndex;
              const isCurrent = idx === stepIndex;
              const StepIcon = s.icon;

              return (
                <div 
                  key={idx}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 ${
                    isCurrent 
                      ? 'bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800 shadow-xs' 
                      : isPast 
                        ? 'text-slate-700 dark:text-slate-300' 
                        : 'text-slate-400 dark:text-slate-600 opacity-60'
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <StepIcon className={`w-4 h-4 shrink-0 ${s.color}`} />
                  )}
                  <span className="truncate">{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* Instant View Button */}
          <div className="mt-5">
            <button
              type="button"
              onClick={handleInstantView}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
            >
              <span>Skip & View Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
