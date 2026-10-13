import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, X, User, ArrowDownCircle, RefreshCw, 
  HelpCircle, Lightbulb, PieChart, Info, ShieldCheck, Zap, Key, Settings, Check
} from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';
import { generateFinancialInsight } from '../lib/aiAdvisor';
import { askGemini } from '../lib/geminiApi';

export default function AIAdvisorModal({ isOpen, onClose }) {
  const {
    t, isDark, isRTL, lang, user,
    expenses, totalExpenses, totalIncome, netBalance, budgets,
  } = useMasarifi();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('masarifi_ai_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isTyping, setIsTyping] = useState(false);
  const [geminiKey, setGeminiKey] = useState(() => {
    return localStorage.getItem('masarifi_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [activeEngine, setActiveEngine] = useState(() => {
    return (localStorage.getItem('masarifi_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY) ? 'gemini' : 'local';
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Save conversation history locally for persistent learning
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem('masarifi_ai_chat_history', JSON.stringify(messages.slice(-30)));
      }
    } catch {}
  }, [messages]);

  // Initial welcome message if conversation is empty
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initial = generateFinancialInsight({
        prompt: 'hello',
        expenses, totalExpenses, totalIncome, netBalance, budgets, user, lang, t,
        conversationHistory: [],
      });
      setMessages([
        { id: 1, sender: 'ai', text: initial, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }
  }, [isOpen]);

  // Focus input on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    const cleaned = tempKey.trim();
    if (cleaned) {
      localStorage.setItem('masarifi_gemini_api_key', cleaned);
      setGeminiKey(cleaned);
      setActiveEngine('gemini');
    } else {
      localStorage.removeItem('masarifi_gemini_api_key');
      setGeminiKey('');
      setActiveEngine('local');
    }
    setShowKeyModal(false);
  };

  const handleSend = async (text) => {
    const textToSend = (text || input).trim();
    if (!textToSend) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: Date.now(), sender: 'user', text: textToSend, time: currentTime };
    
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setIsTyping(true);

    let reply = '';

    // 1. If Gemini is configured and active, call real Gemini API
    if (geminiKey && geminiKey.trim()) {
      try {
        const geminiRes = await askGemini({
          prompt: textToSend,
          apiKey: geminiKey,
          expenses, totalExpenses, totalIncome, netBalance, budgets, user, lang,
          conversationHistory: updatedHistory,
        });

        if (geminiRes.success && geminiRes.text) {
          reply = geminiRes.text;
        } else {
          console.warn('Gemini error, falling back to local engine:', geminiRes.error);
          reply = generateFinancialInsight({
            prompt: textToSend,
            expenses, totalExpenses, totalIncome, netBalance, budgets, user, lang, t,
            conversationHistory: updatedHistory,
          });
        }
      } catch (err) {
        console.warn('Gemini call failed, using local engine:', err);
        reply = generateFinancialInsight({
          prompt: textToSend,
          expenses, totalExpenses, totalIncome, netBalance, budgets, user, lang, t,
          conversationHistory: updatedHistory,
        });
      }
    } else {
      // 2. Local fallback engine
      reply = generateFinancialInsight({
        prompt: textToSend,
        expenses, totalExpenses, totalIncome, netBalance, budgets, user, lang, t,
        conversationHistory: updatedHistory,
      });
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setIsTyping(false);
  };

  const handleClearHistory = () => {
    localStorage.removeItem('masarifi_ai_chat_history');
    const initial = generateFinancialInsight({
      prompt: 'hello',
      expenses, totalExpenses, totalIncome, netBalance, budgets, user, lang, t,
      conversationHistory: [],
    });
    setMessages([
      { id: Date.now(), sender: 'ai', text: initial, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
  };

  // Dynamic quick prompts
  const quickCategories = [
    { label: '👨‍💻 من صنع التطبيق؟', text: 'من صنع هذا التطبيق ومتى ولماذا؟' },
    { label: '🔍 أين ذهبت أموالي؟', text: 'أين ذهبت أغلب أموالي هذا الشهر؟' },
    { label: '🍽️ كم صرفت على الطعام؟', text: 'كم صرفت على الطعام هذا الشهر؟' },
    { label: '🚕 كم صرفت على النقل؟', text: 'كم صرفت على المواصلات هذا الشهر؟' },
    { label: '💡 خطة تقليص المصاريف', text: 'كيف أقلص مصاريفي وأوفر قبل نهاية الشهر؟' },
    { label: '📊 تقرير وضعي المالي', text: 'أعطني ملخصاً شاملاً عن وضعي المالي' },
    { label: '🚀 ما هو رقم الإصدار؟', text: 'ما هو هذا التطبيق وما هو رقم إصداره؟' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-2 sm:p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col h-[92vh] max-h-[780px] overflow-hidden border ${
          isDark 
            ? 'bg-slate-950 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        style={{ animation: 'slideUp 0.25s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        {/* ─── Premium Header (ChatGPT / Claude Style) ─── */}
        <div className={`px-5 py-4 flex items-center justify-between border-b ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  {lang === 'ar' ? 'مستشارك المالي الذكي' : lang === 'fr' ? 'Conseiller Financier IA' : 'AI Financial Coach'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  GPT-Powered
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Zap size={11} className="text-amber-400" />
                {lang === 'ar' ? 'يتعلم تلقائياً من معاملاتك وأسئلتك' : lang === 'fr' ? 'Apprentissage dynamique continu' : 'Adaptive real-time intelligence'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setTempKey(geminiKey);
                setShowKeyModal(true);
              }}
              title={lang === 'ar' ? 'إعدادات مفتاح Google Gemini' : 'Google Gemini API Settings'}
              className={`p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                geminiKey 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                  : isDark ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-amber-600'
              }`}
            >
              <Key size={16} />
              <span className="hidden sm:inline">{geminiKey ? 'Gemini 1.5' : (lang === 'ar' ? 'تفعيل Gemini' : 'Enable Gemini')}</span>
            </button>
            <button
              onClick={handleClearHistory}
              title={lang === 'ar' ? 'بدء محادثة جديدة' : 'New chat'}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <RefreshCw size={17} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ─── Chat Message Stream ─── */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 ${
          isDark ? 'bg-slate-950' : 'bg-slate-50/50'
        }`}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot size={18} />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-3xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-sm transition-all ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-medium rounded-br-none'
                    : isDark
                    ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none shadow-md'
                    : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
                }`}
              >
                <div>{m.text}</div>
                {m.time && (
                  <div className={`text-[10px] mt-1.5 font-medium ${
                    m.sender === 'user' ? 'text-white/70 text-end' : 'text-slate-400 text-end'
                  }`}>
                    {m.time}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 mt-1 font-bold text-xs">
                  {user?.name?.[0]?.toUpperCase() || <User size={16} />}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2.5 text-xs text-slate-400 px-2 py-1">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Bot size={15} className="animate-spin-slow" />
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="italic ml-1">
                {lang === 'ar' ? 'الذكاء الاصطناعي يحلل بياناتك...' : lang === 'fr' ? 'Analyse en cours...' : 'Analyzing finances...'}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ─── Quick Prompt Carousel ─── */}
        <div className={`px-4 py-2 overflow-x-auto flex gap-2 no-scrollbar border-t ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          {quickCategories.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.text)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                isDark
                  ? 'bg-slate-800/90 border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-white'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ─── Ultra-Visible, High-Contrast Floating Chat Input ─── */}
        <div className={`p-4 border-t ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]'
        }`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2.5"
          >
            <div className={`flex-1 flex items-center rounded-2xl border-2 transition-all px-4 py-1.5 ${
              isDark
                ? 'bg-slate-800/90 border-slate-700 focus-within:border-emerald-500 text-white'
                : 'bg-slate-50 border-slate-300 focus-within:border-emerald-500 focus-within:bg-white text-slate-900'
            }`}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  lang === 'ar' 
                    ? 'اكتب سؤالك هنا باللغة العربية أو الفرنسية أو الإنجليزية...' 
                    : lang === 'fr' 
                    ? 'Posez votre question en français, arabe ou anglais...' 
                    : 'Ask anything in English, Arabic, or French...'
                }
                className="w-full py-2.5 text-sm bg-transparent outline-none placeholder-slate-400 dark:placeholder-slate-500 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim()}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              <Send size={19} className={isRTL ? 'rotate-180' : ''} />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
            💡 {lang === 'ar' ? 'يدعم Gemini 1.5 الذكي للإجابة عن أي سؤال بأي لغة أو لهجة في العالم' : 'Powered by Gemini 1.5 Flash for natural answers in any language'}
          </p>
        </div>

        {/* ─── Gemini Key Settings Modal ─── */}
        {showKeyModal && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center">
                    <Key size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base">Google Gemini API</h4>
                    <p className="text-xs text-slate-400">Gemini 1.5 Flash (Free Tier)</p>
                  </div>
                </div>
                <button onClick={() => setShowKeyModal(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 mb-4">
                {lang === 'ar'
                  ? 'ضع مفتاح Gemini المجاني ليتحول المستشار إلى ذكاء اصطناعي حقيقي 100% يجيب على أي سؤال، يفهم أي لغة ولهجة، ويحلل مصاريفك بطلاقة.'
                  : 'Enter your free Google Gemini API Key to enable true generative AI intelligence.'}
              </p>

              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1.5 text-slate-400">
                  {lang === 'ar' ? 'مفتاح الـ API (API Key)' : 'API Key'}
                </label>
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-mono border outline-none ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                  }`}
                />
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-[11px] text-emerald-500 hover:underline font-semibold"
                >
                  🔗 {lang === 'ar' ? 'احصل على مفتاح مجاني في ثوانٍ من Google AI Studio' : 'Get a free key from Google AI Studio'}
                </a>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className={`flex-1 py-3 rounded-2xl text-xs font-semibold ${
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleSaveKey}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold text-white shadow-lg shadow-emerald-500/20"
                  style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
                >
                  {lang === 'ar' ? 'حفظ وتفعيل' : 'Save & Enable'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
