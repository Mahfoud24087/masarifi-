import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, X, User, ArrowDownCircle, Plus, 
  MessageSquare, Trash2, ChevronLeft, ChevronRight, Menu, Zap,
  Mic, MicOff, Volume2, VolumeX, Radio
} from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';
import { generateFinancialInsight } from '../lib/aiAdvisor';
import { askGemini } from '../lib/geminiApi';
import { askGroqAI } from '../lib/groqApi';

const SESSIONS_STORAGE_KEY = 'masarifi_ai_chat_sessions_v1';
const ACTIVE_SESSION_STORAGE_KEY = 'masarifi_ai_active_session_id';

export default function AIAdvisorModal({ isOpen, onClose }) {
  const {
    t, isDark, isRTL, lang, user,
    expenses, totalExpenses, totalIncome, netBalance, budgets,
  } = useMasarifi();

  // Multi-chat sessions state
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      // Migrate old single chat history if exists
      const oldHistory = localStorage.getItem('masarifi_ai_chat_history');
      if (oldHistory) {
        const msgs = JSON.parse(oldHistory);
        return [{
          id: 'session-' + Date.now(),
          title: msgs.find(m => m.sender === 'user')?.text?.slice(0, 28) || (lang === 'ar' ? 'محادثة سابقة' : 'Previous Chat'),
          createdAt: Date.now(),
          messages: msgs,
        }];
      }
    } catch {}
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    return localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY) || null;
  });

  const [showSidebar, setShowSidebar] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);

  const recognitionRef = useRef(null);
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('masarifi_gemini_api_key') || '';
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSend(transcript);
        }
      };
      recognitionRef.current = recognition;
    }
    return () => {
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch {}
    };
  }, [lang]);

  // Voice speech synthesis
  const speakText = (text = '') => {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Strip markdown asterisks and emojis for speech
      const clean = text
        .replace(/\*\*/g, '')
        .replace(/[•\-\*]/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(clean);
      const isArabic = /[\u0600-\u06FF]/.test(clean);
      utterance.lang = isArabic ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US';
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(lang === 'ar' ? 'متصفحك لا يدعم التعرف على الصوت مباشرة.' : 'Speech recognition not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        recognitionRef.current.lang = lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US';
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  // Synchronize and persist sessions
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
      if (activeSessionId) {
        localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId);
      }
    } catch {}
  }, [sessions, activeSessionId]);

  // Ensure an active session always exists when modal opens
  useEffect(() => {
    if (isOpen) {
      if (sessions.length === 0) {
        createNewChat();
      } else if (!activeSessionId || !sessions.some(s => s.id === activeSessionId)) {
        setActiveSessionId(sessions[0].id);
      }
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const createNewChat = () => {
    const initialWelcome = generateFinancialInsight({
      prompt: 'hello',
      expenses, totalExpenses, totalIncome, netBalance, budgets, user, lang, t,
      conversationHistory: [],
    });

    const newSession = {
      id: 'session-' + Date.now(),
      title: lang === 'ar' ? 'محادثة جديدة' : lang === 'fr' ? 'Nouvelle discussion' : 'New Conversation',
      createdAt: Date.now(),
      messages: [
        {
          id: 1,
          sender: 'ai',
          text: initialWelcome,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setShowSidebar(false);
  };

  const deleteSession = (sessionId, e) => {
    e?.stopPropagation();
    const filtered = sessions.filter(s => s.id !== sessionId);
    setSessions(filtered);
    if (activeSessionId === sessionId) {
      if (filtered.length > 0) {
        setActiveSessionId(filtered[0].id);
      } else {
        createNewChat();
      }
    }
  };

  const handleSend = async (text) => {
    const textToSend = (text || input).trim();
    if (!textToSend || !currentSession) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: Date.now(), sender: 'user', text: textToSend, time: currentTime };
    
    const updatedMessages = [...messages, userMsg];

    // Determine smart title if this is the first user message
    const isFirstUserMsg = !messages.some(m => m.sender === 'user');
    const newTitle = isFirstUserMsg 
      ? textToSend.slice(0, 26) + (textToSend.length > 26 ? '…' : '')
      : currentSession.title;

    setSessions(prev => prev.map(s => {
      if (s.id === currentSession.id) {
        return {
          ...s,
          title: newTitle,
          messages: updatedMessages,
        };
      }
      return s;
    }));

    setInput('');
    setIsTyping(true);

    let reply = '';

    // 1. Primary: High-speed Generative LLM via Groq
    try {
      const groqRes = await askGroqAI({
        prompt: textToSend,
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        expenses, totalExpenses, totalIncome, netBalance, budgets, user, lang,
        conversationHistory: updatedMessages,
      });

      if (groqRes.success && groqRes.text) {
        reply = groqRes.text;
      }
    } catch (err) {
      console.warn('Groq call error:', err);
    }

    // 2. Fallback to adaptive engine if needed
    if (!reply) {
      reply = generateFinancialInsight({
        prompt: textToSend,
        expenses, totalExpenses, totalIncome, netBalance, budgets, user, lang, t,
        conversationHistory: updatedMessages,
      });
    }

    const aiMsg = {
      id: Date.now() + 1,
      sender: 'ai',
      text: reply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Auto-speak reply if voice mode is active
    if (voiceModeEnabled && reply) {
      speakText(reply);
    }

    setSessions(prev => prev.map(s => {
      if (s.id === currentSession.id) {
        return {
          ...s,
          messages: [...updatedMessages, aiMsg],
        };
      }
      return s;
    }));

    setIsTyping(false);
  };

  const quickCategories = lang === 'en' ? [
    { label: '👨‍💻 Who created the app?', text: 'Who created this app and why?' },
    { label: '🔍 Where did my money go?', text: 'Where did most of my money go this month?' },
    { label: '🍽️ Food spending?', text: 'How much did I spend on food this month?' },
    { label: '💡 How to save money?', text: 'How can I reduce my spending and save money?' },
    { label: '📊 Financial status report', text: 'Give me a complete summary of my financial status.' },
  ] : lang === 'fr' ? [
    { label: '👨‍💻 Qui a créé l\'application ?', text: 'Qui a créé cette application et pourquoi ?' },
    { label: '🔍 Où est passé mon argent ?', text: 'Où est passée la majorité de mon argent ce mois-ci ?' },
    { label: '🍽️ Dépenses nourriture ?', text: 'Combien ai-je dépensé pour la nourriture ce mois-ci ?' },
    { label: '💡 Comment économiser ?', text: 'Comment réduire mes dépenses et économiser ce mois-ci ?' },
    { label: '📊 Bilan financier complet', text: 'Donne-moi un résumé complet de ma situation financière.' },
  ] : [
    { label: '👨‍💻 من صنع التطبيق؟', text: 'من صنع هذا التطبيق ومتى ولماذا؟' },
    { label: '🔍 أين ذهبت أموالي؟', text: 'أين ذهبت أغلب أموالي هذا الشهر؟' },
    { label: '🍽️ كم صرفت على الطعام؟', text: 'كم صرفت على الطعام هذا الشهر؟' },
    { label: '💡 خطة تقليص المصاريف', text: 'كيف أقلص مصاريفي وأوفر قبل نهاية الشهر؟' },
    { label: '📊 تقرير وضعي المالي', text: 'أعطني ملخصاً شاملاً عن وضعي المالي' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-4xl rounded-3xl shadow-2xl flex h-[92vh] max-h-[820px] overflow-hidden border ${
          isDark 
            ? 'bg-slate-950 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        style={{ animation: 'slideUp 0.25s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        {/* ─── SIDEBAR: Conversations History List ─── */}
        <div
          className={`absolute sm:relative z-20 inset-y-0 ${isRTL ? 'right-0' : 'left-0'} w-72 flex flex-col border-r ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
          } transition-transform duration-200 ${
            showSidebar ? 'translate-x-0 shadow-2xl' : (isRTL ? 'translate-x-full sm:translate-x-0' : '-translate-x-full sm:translate-x-0')
          }`}
        >
          {/* New Chat Button */}
          <div className="p-4 border-b border-inherit flex items-center justify-between gap-2">
            <button
              onClick={createNewChat}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              <Plus size={16} />
              <span>{lang === 'ar' ? 'محادثة جديدة' : lang === 'fr' ? 'Nouvelle conversation' : 'New Chat'}</span>
            </button>
            <button
              onClick={() => setShowSidebar(false)}
              className="sm:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
              {lang === 'ar' ? 'سجل المحادثات' : lang === 'fr' ? 'Historique des discussions' : 'Chat History'}
            </p>

            {sessions.map((s) => {
              const isActive = s.id === currentSession?.id;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setShowSidebar(false);
                  }}
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer text-xs transition-all ${
                    isActive
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                        : 'bg-emerald-100/70 text-emerald-800 font-bold border border-emerald-200'
                      : isDark
                      ? 'hover:bg-slate-800/80 text-slate-300'
                      : 'hover:bg-slate-200/60 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                    <MessageSquare size={14} className={isActive ? 'text-emerald-500' : 'text-slate-400'} />
                    <span className="truncate">{s.title || (lang === 'ar' ? 'محادثة سابقة' : 'Chat')}</span>
                  </div>

                  <button
                    onClick={(e) => deleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-red-500 transition-opacity"
                    title={lang === 'ar' ? 'حذف المحادثة' : 'Delete'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── MAIN CHAT AREA ─── */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Header */}
          <div className={`px-4 sm:px-5 py-3.5 flex items-center justify-between border-b ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-100'
          }`}>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowSidebar(p => !p)}
                className="p-2 -mr-1 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={lang === 'ar' ? 'سجل المحادثات' : 'History'}
              >
                <Menu size={20} />
              </button>

              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight truncate max-w-[160px] sm:max-w-xs">
                    {currentSession?.title || (lang === 'ar' ? 'مستشارك المالي الذكي' : 'AI Financial Coach')}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Live AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                  <Zap size={11} className="text-amber-400" />
                  {lang === 'ar' ? 'يحفظ محادثاتك للرجوع إليها دائماً' : 'Saves your chats for easy return'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const next = !voiceModeEnabled;
                  setVoiceModeEnabled(next);
                  if (!next && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }
                }}
                title={
                  voiceModeEnabled 
                    ? (lang === 'ar' ? 'تعطيل القراءة الصوتية' : 'Disable Voice Reading') 
                    : (lang === 'ar' ? 'تفعيل المحادثة الصوتية التفاعلية' : 'Enable Voice Conversation')
                }
                className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  voiceModeEnabled
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 animate-pulse'
                    : isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                {voiceModeEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                <span className="hidden sm:inline">
                  {voiceModeEnabled 
                    ? (lang === 'ar' ? 'صوت مفعل' : 'Voice On') 
                    : (lang === 'ar' ? 'تحدث معي' : 'Talk Mode')}
                </span>
              </button>

              <button
                onClick={createNewChat}
                title={lang === 'ar' ? 'محادثة جديدة' : 'New chat'}
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <Plus size={19} />
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

          {/* Messages Stream */}
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

                {/* Auto text direction helper: inspect first letter */}
                {(() => {
                  const isArabicText = /[\u0600-\u06FF]/.test(m.text || '');
                  const messageDir = isArabicText ? 'rtl' : 'ltr';

                  // Format text nicely (handle **bold** -> semi-bold, *italics*, bullet points)
                  const renderFormattedMessage = (content = '') => {
                    const lines = content.split('\n');
                    return lines.map((line, lineIdx) => {
                      if (!line.trim()) {
                        return <div key={lineIdx} className="h-2" />;
                      }

                      // Check if line is a bullet point
                      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('* ');
                      const cleanLine = isBullet ? line.trim().replace(/^[•\-\*]\s*/, '') : line;

                      // Parse bold tokens (**text**)
                      const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);

                      const formattedParts = parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return (
                            <strong 
                              key={pIdx} 
                              className={`font-bold ${
                                m.sender === 'user' 
                                  ? 'text-white' 
                                  : isDark ? 'text-emerald-300' : 'text-emerald-700'
                              }`}
                            >
                              {part.slice(2, -2)}
                            </strong>
                          );
                        }
                        if (part.startsWith('*') && part.endsWith('*')) {
                          return <em key={pIdx} className="italic opacity-90">{part.slice(1, -1)}</em>;
                        }
                        return part;
                      });

                      if (isBullet) {
                        return (
                          <div key={lineIdx} className="flex items-start gap-2 my-1">
                            <span className={`text-xs mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>•</span>
                            <div className="flex-1">{formattedParts}</div>
                          </div>
                        );
                      }

                      return (
                        <p key={lineIdx} className="my-0.5 leading-relaxed">
                          {formattedParts}
                        </p>
                      );
                    });
                  };

                  return (
                    <div
                      dir={messageDir}
                      className={`max-w-[85%] sm:max-w-[78%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all font-sans ${
                        messageDir === 'ltr' ? 'text-left' : 'text-right'
                      } ${
                        m.sender === 'user'
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-medium rounded-br-none'
                          : isDark
                          ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none shadow-md'
                          : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
                      }`}
                    >
                      <div className="space-y-0.5">{renderFormattedMessage(m.text)}</div>
                      {m.time && (
                        <div className={`text-[10px] mt-1.5 font-medium ${
                          m.sender === 'user' ? 'text-white/70' : 'text-slate-400'
                        } ${messageDir === 'ltr' ? 'text-right' : 'text-left'}`}>
                          {m.time}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot size={18} />
                </div>
                <div className={`rounded-2xl px-4 py-2.5 flex items-center gap-1.5 ${
                  isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className={`px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-t ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/70 border-slate-100'
          }`}>
            {quickCategories.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.text)}
                className={`text-xs px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all border flex-shrink-0 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-emerald-500/50'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Floating Chat Input */}
          <div className={`p-3.5 sm:p-4 border-t ${
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
                <button
                  type="button"
                  onClick={toggleListening}
                  title={isListening ? (lang === 'ar' ? 'جاري الاستماع... اضغط للإيقاف' : 'Listening... click to stop') : (lang === 'ar' ? 'تحدث مع الذكاء الاصطناعي' : 'Speak to AI')}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                      : isDark ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-700' : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-200'
                  }`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
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
          </div>
        </div>
      </div>
    </div>
  );
}
