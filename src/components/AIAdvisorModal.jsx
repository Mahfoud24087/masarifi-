import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, X, User, ArrowDownCircle, Plus, 
  MessageSquare, Trash2, ChevronLeft, ChevronRight, Menu, Zap,
  Mic, MicOff, Volume2, VolumeX, Radio, Square
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
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [voiceLanguage, setVoiceLanguage] = useState(() => (lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US'));
  const [voices, setVoices] = useState([]);
  const [lastUserSpeech, setLastUserSpeech] = useState('');
  const [lastAiSpeech, setLastAiSpeech] = useState('');
  const [micError, setMicError] = useState(null);

  const recognitionRef = useRef(null);
  const handleSendRef = useRef(null);
  const voiceModeActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const voiceLanguageRef = useRef(voiceLanguage);
  const audioRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Keep refs synchronized to prevent stale closures
  voiceModeActiveRef.current = voiceModeActive;
  isSpeakingRef.current = isSpeaking;
  isListeningRef.current = isListening;
  voiceLanguageRef.current = voiceLanguage;

  // Sync default voice language when app language changes
  useEffect(() => {
    const code = lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US';
    setVoiceLanguage(code);
  }, [lang]);

  // Load and cache browser voices with onvoiceschanged support
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const loaded = window.speechSynthesis.getVoices();
        if (loaded && loaded.length > 0) {
          setVoices(loaded);
        }
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Initialize Speech Recognition once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = voiceLanguageRef.current;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
        if (voiceModeActiveRef.current) {
          setVoiceStatus('listening');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // If voice mode is active and not currently thinking or speaking, stay ready
        if (voiceModeActiveRef.current && !isSpeakingRef.current && voiceStatus !== 'thinking') {
          // Keep idle or auto-restart
        }
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setMicError(lang === 'ar' ? 'يرجى السماح بالوصول للميكروفون من إعدادات المتصفح' : 'Microphone permission denied');
        } else if (event.error === 'no-speech' && voiceModeActiveRef.current && !isSpeakingRef.current) {
          // Restart listening after timeout in voice mode
          setTimeout(() => {
            if (voiceModeActiveRef.current && !isSpeakingRef.current) {
              try {
                recognition.start();
              } catch {}
            }
          }, 400);
        }
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          const text = transcript.trim();
          setLastUserSpeech(text);
          if (voiceModeActiveRef.current) {
            setVoiceStatus('thinking');
          }
          if (handleSendRef.current) {
            handleSendRef.current(text);
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch {}
      try {
        if (recognitionRef.current) recognitionRef.current.abort();
      } catch {}
    };
  }, []);

  // Update recognition language dynamically
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = voiceLanguage;
    }
  }, [voiceLanguage]);

  // Safe voice start and stop helpers
  const startListening = () => {
    if (!recognitionRef.current) {
      alert(lang === 'ar' ? 'المتصفح لا يدعم التعرف على الصوت مباشرة' : 'Speech recognition not supported in this browser');
      return;
    }
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      recognitionRef.current.lang = voiceLanguage;
      recognitionRef.current.start();
      setIsListening(true);
      setVoiceStatus('listening');
    } catch (e) {
      console.warn('Recognition start exception:', e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    if (voiceStatus === 'listening') {
      setVoiceStatus('idle');
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      } catch {}
    }
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsSpeaking(false);
    if (voiceModeActive) {
      setVoiceStatus('idle');
    }
  };

  // Genuine language voice verification helpers
  const isGenuineArabicVoice = (v) => {
    if (!v) return false;
    const l = (v.lang || '').toLowerCase();
    const n = (v.name || '').toLowerCase();
    return (
      (l.startsWith('ar') || /arabic|arabe|عربي|saudi|egypt|naayf|hoda|maged|zariyah|salma|shakir|tarik|mariam|laila/i.test(n)) &&
      !l.startsWith('fr') && !/french|français/i.test(n)
    );
  };

  const isGenuineEnglishVoice = (v) => {
    if (!v) return false;
    const l = (v.lang || '').toLowerCase();
    const n = (v.name || '').toLowerCase();
    return (
      (l.startsWith('en') || /english|anglais/i.test(n)) &&
      !l.startsWith('fr') && !/french|français/i.test(n)
    );
  };

  const isGenuineFrenchVoice = (v) => {
    if (!v) return false;
    const l = (v.lang || '').toLowerCase();
    const n = (v.name || '').toLowerCase();
    return l.startsWith('fr') || /french|français|hortense|paul|julie/i.test(n);
  };

  // High-accuracy native voice selection matching language
  const getNativeVoice = (targetLangCode) => {
    if (!window.speechSynthesis) return null;
    const available = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    if (!available || available.length === 0) return null;

    const prefix = targetLangCode.slice(0, 2).toLowerCase();

    if (prefix === 'ar') {
      const arVoices = available.filter(isGenuineArabicVoice);
      if (arVoices.length === 0) return null;
      return arVoices.find(v => /natural|online|google/i.test(v.name)) || arVoices[0];
    }

    if (prefix === 'en') {
      const enVoices = available.filter(isGenuineEnglishVoice);
      if (enVoices.length === 0) return null;
      return enVoices.find(v => /natural|online|google|david|zira/i.test(v.name)) || enVoices[0];
    }

    if (prefix === 'fr') {
      const frVoices = available.filter(isGenuineFrenchVoice);
      if (frVoices.length === 0) return null;
      return frVoices.find(v => /natural|online|google|hortense|paul/i.test(v.name)) || frVoices[0];
    }

    return null;
  };

  // Voice speech synthesis with guaranteed native accent
  const speakText = (text = '', onFinish = null) => {
    stopSpeaking();

    // Clean markdown, symbols, and currency for natural speech
    const clean = text
      .replace(/\*\*/g, '')
      .replace(/[*_#`~>]/g, '')
      .replace(/MRU/g, 'أوقية')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();

    if (!clean) {
      if (onFinish) onFinish();
      return;
    }

    setLastAiSpeech(clean);

    // 1. Detect language accurately
    const isArabic = /[\u0600-\u06FF]/.test(clean);
    const isEnglish = !isArabic && /\b(the|is|was|are|by|who|what|where|how|why|you|your|have|has|spent|spend|spending|money|cost|developed|built|created|student|app|application|save|saving|total|expenses|income|balance|hello|friend)\b/i.test(clean);
    const isFrench = !isArabic && !isEnglish && /\b(bonjour|salut|oui|non|merci|dépenses|dépense|vous|votre|notre|cette|l'application|pourquoi|argent|budget|étudiant|développé|créé)\b/i.test(clean);

    const targetLang = isArabic ? 'ar-SA' : isEnglish ? 'en-US' : isFrench ? 'fr-FR' : (voiceLanguage || 'en-US');
    const targetPrefix = targetLang.slice(0, 2).toLowerCase(); // 'ar' | 'en' | 'fr'

    // 2. Check for authentic browser voice
    const voice = getNativeVoice(targetLang);

    // If genuine native voice exists in browser, use window.speechSynthesis
    if (voice && (targetPrefix !== 'ar' || isGenuineArabicVoice(voice))) {
      try {
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = targetLang;
        utterance.voice = voice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
          if (voiceModeActiveRef.current) setVoiceStatus('speaking');
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          if (onFinish) onFinish();
        };

        utterance.onerror = (e) => {
          console.warn('Speech synthesis error:', e);
          setIsSpeaking(false);
          if (onFinish) onFinish();
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn('SpeechSynthesis error, falling back to Audio TTS stream:', err);
      }
    }

    // 3. Fallback: High-Quality Google TTS Audio Stream
    // Provides 100% genuine Arabic/English audio when browser lacks native voice!
    try {
      const langCode = targetPrefix === 'ar' ? 'ar' : targetPrefix === 'fr' ? 'fr' : 'en';
      const cleanSnippet = clean.slice(0, 190);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(cleanSnippet)}`;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
        if (voiceModeActiveRef.current) setVoiceStatus('speaking');
      };

      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
        if (onFinish) onFinish();
      };

      audio.onerror = (e) => {
        console.warn('Audio TTS stream error:', e);
        setIsSpeaking(false);
        audioRef.current = null;
        if (onFinish) onFinish();
      };

      audio.play().catch((err) => {
        console.warn('Audio play error:', err);
        setIsSpeaking(false);
        if (onFinish) onFinish();
      });
    } catch (e) {
      console.warn('Audio TTS exception:', e);
      setIsSpeaking(false);
      if (onFinish) onFinish();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
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

    // Auto-speak reply if Voice Mode is active (ChatGPT hands-free talk loop)
    if (voiceModeActiveRef.current && reply) {
      setVoiceStatus('speaking');
      speakText(reply, () => {
        // When AI finishes speaking, reopen microphone hands-free if Voice Mode is still active
        if (voiceModeActiveRef.current) {
          setTimeout(() => {
            if (voiceModeActiveRef.current && !isSpeakingRef.current) {
              startListening();
            }
          }, 400);
        }
      });
    }
  };

  // Keep handleSendRef updated
  handleSendRef.current = handleSend;

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

  if (!isOpen) return null;

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
            {/* Left group: back + history + AI identity */}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={lang === 'ar' ? 'رجوع' : lang === 'fr' ? 'Retour' : 'Back'}
              >
                {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                <span className="hidden sm:inline">{lang === 'ar' ? 'رجوع' : lang === 'fr' ? 'Retour' : 'Back'}</span>
              </button>

              <button
                onClick={() => setShowSidebar(p => !p)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight truncate max-w-[120px] sm:max-w-xs">
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

            {/* Right group: voice mode + new chat */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const next = !voiceModeActive;
                  setVoiceModeActive(next);
                  if (next) {
                    setTimeout(() => startListening(), 150);
                  } else {
                    stopListening();
                    stopSpeaking();
                  }
                }}
                title={
                  voiceModeActive 
                    ? (lang === 'ar' ? 'العودة للمحادثة النصية' : 'Back to text chat') 
                    : (lang === 'ar' ? 'محادثة صوتية ذكية (مثل ChatGPT)' : 'Live ChatGPT Voice Mode')
                }
                className={`p-2 sm:px-3 sm:py-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
                  voiceModeActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                    : isDark ? 'hover:bg-slate-800 text-emerald-400 bg-slate-900 border border-slate-800' : 'hover:bg-slate-100 text-emerald-700 bg-emerald-50/80 border border-emerald-200'
                }`}
              >
                <Radio size={17} className={voiceModeActive ? 'animate-pulse text-white' : 'text-emerald-500'} />
                <span className="hidden sm:inline">
                  {voiceModeActive 
                    ? (lang === 'ar' ? 'صوت مباشر' : 'Voice Live') 
                    : (lang === 'ar' ? 'محادثة صوتية' : 'Talk Mode')}
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
            </div>
          </div>

          {voiceModeActive ? (
            /* ─── DEDICATED CHATGPT VOICE CONVERSATION SCREEN ─── */
            <div className={`flex-1 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto ${
              isDark 
                ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white' 
                : 'bg-gradient-to-b from-slate-50 via-emerald-50/20 to-white text-slate-900'
            }`}>
              {/* Voice Bar Header */}
              <div className="flex items-center justify-between gap-2 border-b border-white/10 dark:border-slate-800 pb-3">
                <button
                  onClick={() => {
                    setVoiceModeActive(false);
                    stopListening();
                    stopSpeaking();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    isDark ? 'bg-white/10 hover:bg-white/15 text-slate-200' : 'bg-slate-200/80 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  {isRTL ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                  <span>{lang === 'ar' ? 'الدردشة النصية' : lang === 'fr' ? 'Mode Texte' : 'Text Chat'}</span>
                </button>

                {/* Spoken Language Selector Chips */}
                <div className={`flex items-center gap-1 p-1 rounded-2xl border ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  {[
                    { code: 'ar-SA', flag: '🇲🇷', label: 'العربية' },
                    { code: 'en-US', flag: '🇬🇧', label: 'English' },
                    { code: 'fr-FR', flag: '🇫🇷', label: 'Français' },
                  ].map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        setVoiceLanguage(item.code);
                        if (recognitionRef.current) {
                          recognitionRef.current.lang = item.code;
                        }
                        if (isSpeaking) {
                          stopSpeaking();
                        }
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                        voiceLanguage === item.code
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105'
                          : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{item.flag}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-emerald-500 hidden sm:inline">ChatGPT Voice</span>
                </div>
              </div>

              {/* Center Animated Orb (ChatGPT Style) */}
              <div className="flex-1 flex flex-col items-center justify-center my-auto py-4 sm:py-8">
                {/* Visualizer Orb */}
                <div 
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                      setTimeout(() => startListening(), 200);
                    } else if (isListening) {
                      stopListening();
                    } else {
                      startListening();
                    }
                  }}
                  className="relative cursor-pointer group flex items-center justify-center select-none"
                  title={isSpeaking ? (lang === 'ar' ? 'انقر لمقاطعة الذكاء الاصطناعي والتحدث' : 'Tap to interrupt and talk') : (lang === 'ar' ? 'انقر للتحدث' : 'Tap to talk')}
                >
                  {/* Outer pulsating aura */}
                  <div className={`absolute w-48 h-48 sm:w-60 sm:h-60 rounded-full blur-2xl opacity-60 transition-all duration-700 ${
                    voiceStatus === 'listening'
                      ? 'bg-emerald-500 animate-pulse scale-110'
                      : voiceStatus === 'thinking'
                      ? 'bg-amber-400 animate-pulse scale-105'
                      : voiceStatus === 'speaking'
                      ? 'bg-purple-500 animate-pulse scale-125'
                      : 'bg-emerald-700/30 scale-95'
                  }`} />

                  {/* Secondary rotating ripples */}
                  <div className={`absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full border-2 border-dashed transition-all duration-1000 ${
                    voiceStatus === 'listening'
                      ? 'border-emerald-400/60 animate-spin scale-105'
                      : voiceStatus === 'thinking'
                      ? 'border-amber-300/60 animate-spin'
                      : voiceStatus === 'speaking'
                      ? 'border-purple-400/60 animate-spin scale-110'
                      : 'border-slate-500/20'
                  }`} style={{ animationDuration: '6s' }} />

                  {/* Main Central Sphere */}
                  <div className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full shadow-2xl flex flex-col items-center justify-center text-white transition-all duration-300 group-hover:scale-105 ${
                    voiceStatus === 'listening'
                      ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 shadow-emerald-500/50'
                      : voiceStatus === 'thinking'
                      ? 'bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 shadow-amber-500/50'
                      : voiceStatus === 'speaking'
                      ? 'bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 shadow-purple-500/50'
                      : 'bg-gradient-to-tr from-slate-700 via-slate-600 to-slate-800 shadow-black/40'
                  }`}>
                    {voiceStatus === 'listening' ? (
                      <div className="flex flex-col items-center gap-1 animate-bounce">
                        <Mic size={34} className="text-white" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">{lang === 'ar' ? 'أستمع...' : 'Listening'}</span>
                      </div>
                    ) : voiceStatus === 'thinking' ? (
                      <div className="flex flex-col items-center gap-1">
                        <Sparkles size={34} className="text-white animate-spin" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">{lang === 'ar' ? 'أفكر...' : 'Thinking'}</span>
                      </div>
                    ) : voiceStatus === 'speaking' ? (
                      <div className="flex flex-col items-center gap-1">
                        <Volume2 size={34} className="text-white animate-pulse" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">{lang === 'ar' ? 'أتحدث...' : 'Speaking'}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Mic size={34} className="text-white/80" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">{lang === 'ar' ? 'اضغط للتحدث' : 'Tap to speak'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Indicator Label */}
                <div className="mt-5 text-center">
                  <p className="text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      voiceStatus === 'listening'
                        ? 'bg-emerald-400 animate-ping'
                        : voiceStatus === 'thinking'
                        ? 'bg-amber-400 animate-ping'
                        : voiceStatus === 'speaking'
                        ? 'bg-purple-400 animate-ping'
                        : 'bg-slate-400'
                    }`} />
                    <span>
                      {voiceStatus === 'listening'
                        ? (lang === 'ar' ? 'أستمع إليك الآن... تفضل بالكلام' : lang === 'fr' ? 'Je vous écoute... Parlez' : 'Listening to you... Speak now')
                        : voiceStatus === 'thinking'
                        ? (lang === 'ar' ? 'جاري التفكير وتحضير الرد...' : lang === 'fr' ? 'Réflexion en cours...' : 'Thinking and preparing response...')
                        : voiceStatus === 'speaking'
                        ? (lang === 'ar' ? 'يتحدث الآن (انقر على الدائرة للمقاطعة)' : lang === 'fr' ? 'L\'IA parle (touchez pour interrompre)' : 'AI is speaking (tap orb to interrupt)')
                        : (lang === 'ar' ? 'جاهز للاستماع إليك' : lang === 'fr' ? 'Prêt à écouter' : 'Ready to listen')}
                    </span>
                  </p>
                </div>

                {/* Subtitle / Live Subtitles Card */}
                <div className={`mt-4 w-full max-w-lg rounded-2xl p-4 text-xs sm:text-sm backdrop-blur-md border ${
                  isDark ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-white/80 border-slate-200 text-slate-800 shadow-md'
                }`}>
                  {lastUserSpeech && (
                    <div className="mb-2 pb-2 border-b border-inherit">
                      <span className="font-bold text-emerald-500 block mb-0.5">{lang === 'ar' ? 'أنت:' : 'You:'}</span>
                      <p className="leading-relaxed font-medium">{lastUserSpeech}</p>
                    </div>
                  )}

                  {lastAiSpeech ? (
                    <div>
                      <span className="font-bold text-purple-400 block mb-0.5">{lang === 'ar' ? 'المستشار الذكي:' : 'AI Advisor:'}</span>
                      <p className="leading-relaxed line-clamp-3">{lastAiSpeech}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center italic text-xs">
                      {lang === 'ar' 
                        ? 'تحدث بصوتك بأي لغة وسيرد عليك الذكاء الاصطناعي بنطق طبيعي أصيل.' 
                        : 'Speak naturally in any language and the AI will reply with authentic native pronunciation.'}
                    </p>
                  )}

                  {micError && (
                    <p className="mt-2 text-red-400 font-bold text-center text-xs">
                      ⚠️ {micError}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Quick Prompts & Controls */}
              <div className="space-y-3 pt-2">
                {/* Voice quick suggestion pills */}
                <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {[
                    { text: 'Who created this app and why?', ar: 'من صنع هذا التطبيق؟', fr: 'Qui a créé cette app ?' },
                    { text: 'How can I reduce my expenses?', ar: 'كيف أقلص مصاريفي؟', fr: 'Comment réduire mes dépenses ?' },
                    { text: 'Where did most of my money go?', ar: 'أين ذهبت أموالي هذا الشهر؟', fr: 'Où est passé mon argent ?' },
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const targetText = voiceLanguage.startsWith('ar') ? q.ar : voiceLanguage.startsWith('fr') ? q.fr : q.text;
                        setLastUserSpeech(targetText);
                        setVoiceStatus('thinking');
                        handleSend(targetText);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${
                        isDark 
                          ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
                      }`}
                    >
                      {voiceLanguage.startsWith('ar') ? q.ar : voiceLanguage.startsWith('fr') ? q.fr : q.text}
                    </button>
                  ))}
                </div>

                {/* Main Action Bar */}
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  {isSpeaking && (
                    <button
                      onClick={() => {
                        stopSpeaking();
                        setTimeout(() => startListening(), 200);
                      }}
                      className="px-3.5 sm:px-4 py-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-2 hover:bg-red-500/30 transition-all active:scale-95"
                    >
                      <Square size={14} className="fill-current" />
                      <span>{lang === 'ar' ? 'إيقاف الكلام والتحدث' : 'Interrupt'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (isListening) {
                        stopListening();
                      } else {
                        startListening();
                      }
                    }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                      isListening
                        ? 'bg-red-500 text-white shadow-red-500/30 animate-pulse'
                        : 'bg-emerald-500 text-white shadow-emerald-500/30 hover:scale-105'
                    }`}
                  >
                    {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                  </button>

                  <button
                    onClick={() => {
                      setVoiceModeActive(false);
                      stopListening();
                      stopSpeaking();
                    }}
                    className={`px-3.5 sm:px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${
                      isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm'
                    }`}
                  >
                    <MessageSquare size={14} />
                    <span>{lang === 'ar' ? 'الدردشة النصية' : 'Text Chat'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ─── STANDARD TEXT CHAT STREAM + INPUT ─── */
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
