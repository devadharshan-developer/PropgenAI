import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  X, 
  Maximize2, 
  Minimize2, 
  HelpCircle,
  Loader2
} from 'lucide-react';
import { apiAskAssistant } from '../lib/api';

let msgCounter = 1;
const getUniqueId = (prefix) => `${prefix}-${++msgCounter}`;
const getNowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function ProposalAIChat({ proposal, _isCustomerView = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I am your AI Assistant for **${proposal?.clientName || 'this project'}**.\n\nAsk me any question about the project tasks, delivery time, total price, or online signing!`,
      timestamp: getNowTime()
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    { label: 'Timeline?', query: 'When will this project be completed?' },
    { label: 'Total price?', query: 'What is the final total price including fees?' },
    { label: 'Project tasks?', query: 'What are the 3 main tasks we will deliver?' },
    { label: 'How to sign?', query: 'How does the client sign this proposal online?' }
  ];

  const handleSend = useCallback(async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend || !textToSend.trim() || loading) return;

    const userMessage = {
      id: getUniqueId('user'),
      role: 'user',
      text: textToSend.trim(),
      timestamp: getNowTime()
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const reply = await apiAskAssistant(textToSend.trim(), proposal, messages);

      const assistantMessage = {
        id: getUniqueId('ai'),
        role: 'assistant',
        text: reply,
        timestamp: getNowTime()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: getUniqueId('ai-err'),
          role: 'assistant',
          text: 'I could not process your question. Please try asking again.',
          timestamp: getNowTime()
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, proposal, messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 print:hidden animate-fade-in">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-white/20"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-indigo-600" />
            </div>
            <span>Ask AI Question</span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-medium text-white/95">
              Online
            </span>
          </button>
        </div>
      )}

      {/* Chat Drawer Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl overflow-hidden print:hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10 md:inset-16 max-w-4xl mx-auto'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[420px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                <Bot className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight">Proposal AI Assistant</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-indigo-100/80 truncate max-w-[210px] sm:max-w-xs">
                  {proposal?.clientName ? `Advising on ${proposal.clientName}'s proposal` : 'Instant independent proposal answers'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-0.5 shrink-0">
              <HelpCircle className="w-3 h-3 text-indigo-500" /> Suggestions:
            </span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(qp.query)}
                disabled={loading}
                className="shrink-0 px-2 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition shadow-xs disabled:opacity-50"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs ${
                      isAssistant
                        ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60'
                        : 'bg-indigo-600 text-white rounded-br-xs'
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                      {msg.text}
                    </div>
                    <div
                      className={`text-[10px] mt-1 text-right ${
                        isAssistant ? 'text-slate-400 dark:text-slate-500' : 'text-indigo-200'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {!isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/90 rounded-2xl px-4 py-2.5 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  <span>Developing independent answer...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="relative flex items-center">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask any question about this proposal..."
                disabled={loading}
                className="w-full resize-none pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="absolute right-1.5 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[11px] text-slate-400 dark:text-slate-500">
              <span>Press Enter to send</span>
              <span className="flex items-center gap-1 text-[10px]">
                <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> In-App Proposal AI
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
