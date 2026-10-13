import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, X, TrendingDown, DollarSign, PieChart, ShieldAlert } from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';
import { generateFinancialInsight } from '../lib/aiAdvisor';

export default function AIAdvisorModal({ isOpen, onClose }) {
  const {
    t, isDark, isRTL, lang, user,
    expenses, totalExpenses, totalIncome, netBalance, budgets,
  } = useMasarifi();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initial = generateFinancialInsight({
        prompt: 'hello',
        expenses, totalExpenses, totalIncome, netBalance, budgets, user, lang, t,
      });
      setMessages([{ id: 1, sender: 'ai', text: initial, time: new Date() }]);
    }
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = (userText) => {
    const textToSend = userText || input;
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate natural thinking delay
    setTimeout(() => {
      const reply = generateFinancialInsight({
        prompt: textToSend,
        expenses, totalExpenses, totalIncome, netBalance, budgets, user, lang, t,
      });
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai', text: reply, time: new Date() },
      ]);
      setIsTyping(false);
    }, 450);
  };

  const quickPrompts = {
    ar: [
      { label: '🔍 أين ذهبت أموالي؟', text: 'أين ذهبت أغلب أموالي هذا الشهر؟' },
      { label: '💡 كيف أوفر هذا الشهر؟', text: 'كيف أقلص مصاريفي وأوفر قبل نهاية الشهر؟' },
      { label: '📊 ملخص وضعي المالي', text: 'أعطني ملخصاً شاملاً عن وضعي المالي' },
      { label: '🎯 سقف الصرف اليومي', text: 'كم يجب أن أصرف يومياً حتى لا أعجز؟' },
    ],
    fr: [
      { label: '🔍 Où est passé mon argent ?', text: 'Où est passé la majorité de mon argent ce mois-ci ?' },
      { label: '💡 Comment économiser ?', text: 'Donne-moi des conseils pour réduire mes dépenses.' },
      { label: '📊 Bilan financier', text: 'Donne-moi un bilan financier complet.' },
    ],
    en: [
      { label: '🔍 Where did my money go?', text: 'Where did most of my money go this month?' },
      { label: '💡 How can I save?', text: 'How can I reduce my expenses and save money?' },
      { label: '📊 Full financial summary', text: 'Give me a full financial summary.' },
    ],
  }[lang] || [
    { label: '🔍 أين ذهبت أموالي؟', text: 'أين ذهبت أغلب أموالي هذا الشهر؟' },
    { label: '💡 كيف أوفر هذا الشهر؟', text: 'كيف أقلص مصاريفي وأوفر قبل نهاية الشهر؟' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] sm:h-[680px] overflow-hidden ${
          isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'
        }`}
        style={{ animation: 'slideUp 0.3s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between border-b ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-emerald-50/80 border-emerald-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {lang === 'ar' ? 'مستشارك المالي الذكي' : lang === 'fr' ? 'Conseiller Financier IA' : 'Smart AI Advisor'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  AI Live
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {lang === 'ar' ? 'تحليل مباشر لمصاريفك وميزانيتك' : lang === 'fr' ? 'Analyse directe de vos dépenses' : 'Real-time financial analysis'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat message area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mr-2 ml-2 flex-shrink-0 mt-1">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-medium'
                    : isDark
                    ? 'bg-slate-800 border border-slate-700 text-slate-100'
                    : 'bg-slate-50 border border-slate-100 text-slate-800'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic px-2">
              <Bot size={14} className="animate-pulse text-emerald-500" />
              <span>{lang === 'ar' ? 'جاري التحليل والحساب...' : lang === 'fr' ? 'Analyse en cours...' : 'Analyzing your finances...'}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt chips */}
        <div className="px-3 py-2 overflow-x-auto flex gap-1.5 no-scrollbar border-t border-slate-100 dark:border-slate-800">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p.text)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-emerald-500'
                  : 'bg-emerald-50 border-emerald-100 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className={`p-3 border-t ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-white border-slate-100'}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === 'ar' ? 'اسأل مستشارك عن مصاريفك...' : lang === 'fr' ? 'Posez une question sur vos finances...' : 'Ask about your expenses...'}
              className={`flex-1 px-4 py-3 rounded-2xl text-sm outline-none border transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-400'
              }`}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40 shadow-md shadow-emerald-500/20"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              <Send size={18} className={isRTL ? 'rotate-180' : ''} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
