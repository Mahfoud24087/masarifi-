import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import translations from '../i18n/translations';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const MasarifiContext = createContext(null);

const KEYS = {
  LANG: 'masarifi_lang',
  THEME: 'masarifi_theme',
  CURRENT_USER: 'masarifi_current_user',
  USERS: 'masarifi_users',
  EXPENSES: 'masarifi_expenses',
  BUDGETS: 'masarifi_budgets',
  REVIEWS: 'masarifi_reviews',
  TICKETS: 'masarifi_support_tickets',
  ADMIN_LOGGED: 'masarifi_admin_logged_in',
  DISMISSED_NOTIFS: 'masarifi_dismissed_ticket_notifs',
};

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export function MasarifiProvider({ children }) {
  const [lang, setLangState]      = useState(() => load(KEYS.LANG, 'ar'));
  const [theme, setThemeState]    = useState(() => load(KEYS.THEME, 'light'));
  const [currentUser, setCurrentUser] = useState(() => load(KEYS.CURRENT_USER, null));
  const [screen, setScreen]       = useState(() => load(KEYS.CURRENT_USER, null) ? 'app' : 'landing');
  const [activeTab, setActiveTab] = useState('home');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense]   = useState(null);
  const [confirmDialog, setConfirmDialog]     = useState(null);
  const [toast, setToast]         = useState(null);
  const [expenseVer, setExpenseVer] = useState(0);
  const [reviewVer, setReviewVer] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [ticketVer, setTicketVer] = useState(0);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => load(KEYS.ADMIN_LOGGED, false));

  // Month navigation: { year, month } 0-indexed month
  const now = new Date();
  const [viewMonth, setViewMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });

  // Apply dark class to <html> so Tailwind dark: classes work
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  // Apply dir to <html>
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // ── Language ──────────────────────────────────────────────────────
  const setLang = useCallback((l) => { setLangState(l); save(KEYS.LANG, l); }, []);
  const isRTL   = lang === 'ar';
  const t = useCallback((path) => {
    const keys = path.split('.');
    let obj = translations[lang] ?? translations['ar'];
    for (const k of keys) { if (obj == null) return path; obj = obj[k]; }
    return obj ?? path;
  }, [lang]);

  // ── Theme ─────────────────────────────────────────────────────────
  const isDark      = theme === 'dark';
  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next); save(KEYS.THEME, next);
  }, [theme]);

  // ── Toast ─────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  useEffect(() => {
    if (toast) { const tm = setTimeout(() => setToast(null), 3000); return () => clearTimeout(tm); }
  }, [toast]);

  // ── Auth ──────────────────────────────────────────────────────────
  const signUp = useCallback(async (name, password) => {
    const cleanName = name.trim();
    const users = load(KEYS.USERS, []);

    // 1. Supabase check & insert if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .ilike('name', cleanName)
          .maybeSingle();

        if (existing) return { success: false, error: 'nameExists' };

        const { data: newProfile, error } = await supabase
          .from('profiles')
          .insert([{ name: cleanName, password }])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') return { success: false, error: 'nameExists' };
        } else if (newProfile) {
          const safe = { id: newProfile.id, name: newProfile.name, createdAt: newProfile.created_at };
          save(KEYS.CURRENT_USER, safe);
          setCurrentUser(safe);
          setScreen('app');
          setActiveTab('home');
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase signup fallback to local:', err);
      }
    }

    // Local fallback
    if (users.find((u) => u.name.toLowerCase() === cleanName.toLowerCase()))
      return { success: false, error: 'nameExists' };
    const nu = { id: genId(), name: cleanName, password, createdAt: new Date().toISOString() };
    save(KEYS.USERS, [...users, nu]);
    const safe = { id: nu.id, name: nu.name, createdAt: nu.createdAt };
    save(KEYS.CURRENT_USER, safe); setCurrentUser(safe);
    setScreen('app'); setActiveTab('home');
    return { success: true };
  }, []);

  const signIn = useCallback(async (name, password) => {
    const cleanName = name.trim().toLowerCase();

    // 1. Try Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .ilike('name', cleanName)
          .maybeSingle();

        if (profile && profile.password === password) {
          const safe = { id: profile.id, name: profile.name, createdAt: profile.created_at };
          save(KEYS.CURRENT_USER, safe);
          setCurrentUser(safe);
          setScreen('app');
          setActiveTab('home');
          return { success: true };
        } else if (profile && profile.password !== password) {
          return { success: false, error: 'invalidCredentials' };
        }
      } catch (err) {
        console.warn('Supabase signin fallback to local:', err);
      }
    }

    // Local fallback
    const users = load(KEYS.USERS, []);
    const user = users.find((u) => u.name.toLowerCase() === cleanName && u.password === password);
    if (!user) return { success: false, error: 'invalidCredentials' };
    const safe = { id: user.id, name: user.name, createdAt: user.createdAt };
    save(KEYS.CURRENT_USER, safe); setCurrentUser(safe);
    setScreen('app'); setActiveTab('home');
    return { success: true };
  }, []);

  const signOut = useCallback(() => {
    save(KEYS.CURRENT_USER, null); setCurrentUser(null);
    setScreen('landing'); setActiveTab('home');
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!currentUser) return { success: false };
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update(updates).eq('id', currentUser.id);
      } catch {}
    }
    const users = load(KEYS.USERS, []);
    const idx   = users.findIndex((u) => u.id === currentUser.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      save(KEYS.USERS, users);
    }
    const safe = { ...currentUser, ...updates };
    save(KEYS.CURRENT_USER, safe); setCurrentUser(safe);
    return { success: true };
  }, [currentUser]);

  const changePassword = useCallback(async (currentPass, newPass) => {
    if (!currentUser) return { success: false };
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('profiles').select('password').eq('id', currentUser.id).single();
        if (data && data.password !== currentPass) return { success: false, error: 'wrongPassword' };
        await supabase.from('profiles').update({ password: newPass }).eq('id', currentUser.id);
        return { success: true };
      } catch {}
    }
    const users = load(KEYS.USERS, []);
    const idx   = users.findIndex((u) => u.id === currentUser.id);
    if (idx === -1) return { success: false };
    if (users[idx].password !== currentPass) return { success: false, error: 'wrongPassword' };
    users[idx].password = newPass;
    save(KEYS.USERS, users);
    return { success: true };
  }, [currentUser]);

  // ── Budgets ──────────────────────────────────────────────────────
  const getBudgetKey = useCallback(() => currentUser ? `${KEYS.BUDGETS}_${currentUser.id}` : null, [currentUser]);

  const budgets = useMemo(() => {
    if (!currentUser) return {};
    return load(getBudgetKey(), {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, getBudgetKey]);

  const saveBudget = useCallback((category, amount) => {
    const key = getBudgetKey();
    if (!key) return;
    const current = load(key, {});
    const updated = { ...current, [category]: parseFloat(amount) || 0 };
    save(key, updated);
    // Force re-render by bumping a counter
    setExpenseVer((v) => v + 1);
  }, [getBudgetKey]);

  const getBudget = useCallback((category) => {
    const key = getBudgetKey();
    if (!key) return 0;
    return load(key, {})[category] || 0;
  }, [getBudgetKey]);

  // ── Expenses ──────────────────────────────────────────────────────
  const bump = useCallback(() => setExpenseVer((v) => v + 1), []);

  // Fetch expenses from Supabase on user sign-in
  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured || !supabase) return;
    async function fetchSupabaseExpenses() {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('date', { ascending: false });

        if (!error && data) {
          const mapped = data.map((d) => ({
            id: d.id,
            userId: d.user_id,
            title: d.title,
            amount: parseFloat(d.amount),
            category: d.category,
            date: d.date,
            notes: d.notes || '',
            type: d.type || 'expense',
            recurring: d.recurring || false,
            customCategory: d.custom_category || undefined,
            createdAt: d.created_at,
          }));
          // Merge with local expenses without duplicates
          const local = load(KEYS.EXPENSES, []);
          const otherUsersExpenses = local.filter((e) => e.userId !== currentUser.id);
          save(KEYS.EXPENSES, [...otherUsersExpenses, ...mapped]);
          bump();
        }
      } catch (err) {
        console.warn('Error fetching Supabase expenses:', err);
      }
    }
    fetchSupabaseExpenses();
  }, [currentUser, bump]);

  const allUserExpenses = useMemo(() => {
    if (!currentUser) return [];
    return load(KEYS.EXPENSES, []).filter((e) => e.userId === currentUser.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, expenseVer]);

  // Expenses for the current view month
  const expenses = useMemo(() => {
    const { year, month } = viewMonth;
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return allUserExpenses
      .filter((e) => e.date && e.date.startsWith(prefix))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allUserExpenses, viewMonth]);

  const addExpense = useCallback(async (data) => {
    if (!currentUser) return;
    const id = genId();
    const newEntry = {
      id, userId: currentUser.id,
      title: data.title, amount: parseFloat(data.amount),
      category: data.category, date: data.date,
      notes: data.notes || '',
      type: data.type || 'expense',   // 'expense' | 'income'
      recurring: data.recurring || false,
      customCategory: data.customCategory,
      createdAt: new Date().toISOString(),
    };

    // 1. Save locally first (instant UI update)
    const all = load(KEYS.EXPENSES, []);
    save(KEYS.EXPENSES, [...all, newEntry]);
    bump();

    // 2. Sync to Supabase in background
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('expenses').insert([{
          id: newEntry.id,
          user_id: currentUser.id,
          title: newEntry.title,
          amount: newEntry.amount,
          category: newEntry.category,
          date: newEntry.date,
          notes: newEntry.notes,
          type: newEntry.type,
          recurring: newEntry.recurring,
          custom_category: newEntry.customCategory || null,
        }]);
      } catch (err) {
        console.warn('Supabase add expense error:', err);
      }
    }
  }, [currentUser, bump]);

  const updateExpense = useCallback(async (id, data) => {
    const all = load(KEYS.EXPENSES, []);
    const idx = all.findIndex((e) => e.id === id);
    if (idx === -1) return;
    all[idx] = {
      ...all[idx],
      title: data.title, amount: parseFloat(data.amount),
      category: data.category, date: data.date,
      notes: data.notes || '',
      type: data.type || 'expense',
      recurring: data.recurring || false,
      customCategory: data.customCategory,
    };
    save(KEYS.EXPENSES, all);
    bump();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('expenses').update({
          title: data.title,
          amount: parseFloat(data.amount),
          category: data.category,
          date: data.date,
          notes: data.notes || '',
          type: data.type || 'expense',
          recurring: data.recurring || false,
          custom_category: data.customCategory || null,
        }).eq('id', id);
      } catch (err) {
        console.warn('Supabase update expense error:', err);
      }
    }
  }, [bump]);

  const deleteExpense = useCallback(async (id) => {
    save(KEYS.EXPENSES, load(KEYS.EXPENSES, []).filter((e) => e.id !== id));
    bump();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('expenses').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete expense error:', err);
      }
    }
  }, [bump]);

  // Derived totals for current view month
  const totalExpenses = useMemo(
    () => expenses.filter(e => e.type !== 'income').reduce((s, e) => s + e.amount, 0),
    [expenses]
  );
  const totalIncome = useMemo(
    () => expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0),
    [expenses]
  );
  const netBalance = totalIncome - totalExpenses;

  // Last month comparison
  const lastMonthExpenses = useMemo(() => {
    const { year, month } = viewMonth;
    const lm = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
    const prefix = `${lm.year}-${String(lm.month + 1).padStart(2, '0')}`;
    return allUserExpenses.filter((e) => e.date && e.date.startsWith(prefix) && e.type !== 'income');
  }, [allUserExpenses, viewMonth]);

  const lastMonthTotal = useMemo(
    () => lastMonthExpenses.reduce((s, e) => s + e.amount, 0),
    [lastMonthExpenses]
  );

  // Month navigation helpers
  const goToPrevMonth = useCallback(() => {
    setViewMonth(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  }, []);
  const goToNextMonth = useCallback(() => {
    const n = new Date();
    setViewMonth(({ year, month }) => {
      const isCurrentMonth = year === n.getFullYear() && month === n.getMonth();
      if (isCurrentMonth) return { year, month }; // Don't go to future
      return month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
    });
  }, []);
  const isCurrentMonth = useMemo(() => {
    const n = new Date();
    return viewMonth.year === n.getFullYear() && viewMonth.month === n.getMonth();
  }, [viewMonth]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const rows = [
      ['Date', 'Title', 'Type', 'Category', 'Amount', 'Currency', 'Recurring', 'Notes'],
      ...allUserExpenses.map(e => [
        e.date, e.title, e.type || 'expense', e.category,
        e.amount, 'MRU', e.recurring ? 'Yes' : 'No', e.notes || '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url; a.download = `masarifi_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    return { success: true };
  }, [allUserExpenses]);

  // ── Reviews ───────────────────────────────────────────────────────
  const bumpReview = useCallback(() => setReviewVer((v) => v + 1), []);

  const reviews = useMemo(() => {
    void reviewVer;
    return load(KEYS.REVIEWS, []);
  }, [reviewVer]);

  // Featured reviews on landing:
  // - Show maximum 4 reviews total
  // - Only 4 or 5 stars, with at most ONE 3-star review
  // - 1 and 2 stars are NEVER displayed on the landing page
  const featuredReviews = useMemo(() => {
    // Exclude anything under 3 stars immediately
    const valid = reviews.filter((r) => r.stars >= 3);

    // Separate 4-5 stars and 3 stars
    const highRatings = valid
      .filter((r) => r.stars >= 4)
      .sort((a, b) => b.stars - a.stars || new Date(b.date) - new Date(a.date));

    const threeStarRatings = valid
      .filter((r) => r.stars === 3)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const selected = [];

    // Add up to 3 (or 4) high rating reviews
    // If we have at least one 3-star review, we can show up to three 4-5 stars + one 3-star (total 4)
    // If no 3-star reviews, show up to 4 high ratings
    if (threeStarRatings.length > 0) {
      selected.push(...highRatings.slice(0, 3));
      selected.push(threeStarRatings[0]); // at most one 3-star review
    } else {
      selected.push(...highRatings.slice(0, 4));
    }

    return selected.sort((a, b) => b.stars - a.stars || new Date(b.date) - new Date(a.date));
  }, [reviews]);

  // Fetch public reviews from Supabase so all visitors see real community feedback
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    async function fetchPublicReviews() {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data) {
          const mapped = data.map((d) => ({
            id: d.id,
            userId: d.user_id,
            userName: d.user_name,
            stars: d.stars,
            comment: d.comment,
            date: d.date,
          }));
          save(KEYS.REVIEWS, mapped);
          bumpReview();
        }
      } catch (err) {
        console.warn('Error fetching Supabase reviews:', err);
      }
    }
    fetchPublicReviews();
  }, [bumpReview]);

  const addReview = useCallback(async ({ stars, comment }) => {
    if (!currentUser) return { success: false };
    const all = load(KEYS.REVIEWS, []);
    // One review per user – replace if exists
    const existing = all.findIndex((r) => r.userId === currentUser.id);
    const entry = {
      id: existing >= 0 ? all[existing].id : genId(),
      userId: currentUser.id,
      userName: currentUser.name,
      stars,
      comment: comment.trim(),
      date: new Date().toISOString(),
    };
    if (existing >= 0) all[existing] = entry;
    else all.push(entry);
    save(KEYS.REVIEWS, all);
    bumpReview();

    // Sync to Supabase reviews table
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('reviews').upsert([{
          user_id: currentUser.id,
          user_name: currentUser.name,
          stars,
          comment: comment.trim(),
          date: new Date().toISOString(),
        }], { onConflict: 'user_id' });
      } catch (err) {
        console.warn('Supabase review sync error:', err);
      }
    }

    return { success: true };
  }, [currentUser, bumpReview]);

  const userReview = useMemo(() =>
    reviews.find((r) => r.userId === currentUser?.id) || null,
    [reviews, currentUser]
  );

  // ── Support Tickets & Admin ────────────────────────────────────────
  const bumpTicket = useCallback(() => setTicketVer((v) => v + 1), []);

  const tickets = useMemo(() => {
    return load(KEYS.TICKETS, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketVer]);

  // Fetch tickets from Supabase if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    async function fetchSupabaseTickets() {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map((d) => ({
            id: d.id,
            userId: d.user_id,
            userName: d.user_name || 'مستخدم',
            category: d.category || 'general',
            subject: d.subject || '',
            message: d.message || '',
            contact: d.contact || '',
            status: d.status || 'new',
            adminNotes: d.admin_notes || '',
            createdAt: d.created_at,
            updatedAt: d.updated_at || d.created_at,
          }));
          save(KEYS.TICKETS, mapped);
          bumpTicket();
        }
      } catch (err) {
        console.warn('Error fetching Supabase tickets:', err);
      }
    }
    fetchSupabaseTickets();
  }, [bumpTicket]);

  const addTicket = useCallback(async ({ category, subject, message, contact }) => {
    const all = load(KEYS.TICKETS, []);
    const newTicket = {
      id: genId(),
      userId: currentUser?.id || 'anonymous',
      userName: currentUser?.name || 'مستخدم',
      category: category || 'general',
      subject: (subject || '').trim(),
      message: (message || '').trim(),
      contact: (contact || '').trim(),
      status: 'new', // 'new' | 'in_progress' | 'resolved'
      adminNotes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    all.unshift(newTicket);
    save(KEYS.TICKETS, all);
    bumpTicket();

    // Sync to Supabase support_tickets table if available
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('support_tickets').insert([{
          id: newTicket.id,
          user_id: newTicket.userId,
          user_name: newTicket.userName,
          category: newTicket.category,
          subject: newTicket.subject,
          message: newTicket.message,
          contact: newTicket.contact,
          status: newTicket.status,
          admin_notes: newTicket.adminNotes,
          created_at: newTicket.createdAt,
        }]);
      } catch (err) {
        console.warn('Supabase support ticket sync error:', err);
      }
    }

    return { success: true };
  }, [currentUser, bumpTicket]);

  const updateTicketStatus = useCallback(async (ticketId, status, adminNotes = null) => {
    const all = load(KEYS.TICKETS, []);
    const idx = all.findIndex((t) => t.id === ticketId);
    if (idx === -1) return { success: false };

    all[idx].status = status;
    if (adminNotes !== null) all[idx].adminNotes = adminNotes;
    all[idx].updatedAt = new Date().toISOString();

    save(KEYS.TICKETS, all);
    bumpTicket();

    if (isSupabaseConfigured && supabase) {
      try {
        const updateData = { status, updated_at: all[idx].updatedAt };
        if (adminNotes !== null) updateData.admin_notes = adminNotes;
        await supabase.from('support_tickets').update(updateData).eq('id', ticketId);
      } catch (err) {
        console.warn('Supabase update ticket error:', err);
      }
    }

    return { success: true };
  }, [bumpTicket]);

  const deleteTicket = useCallback(async (ticketId) => {
    const all = load(KEYS.TICKETS, []);
    const filtered = all.filter((t) => t.id !== ticketId);
    save(KEYS.TICKETS, filtered);
    bumpTicket();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('support_tickets').delete().eq('id', ticketId);
      } catch (err) {
        console.warn('Supabase delete ticket error:', err);
      }
    }

    return { success: true };
  }, [bumpTicket]);

  // Track dismissed notifications for resolved tickets
  const [dismissedTicketIds, setDismissedTicketIds] = useState(() => load(KEYS.DISMISSED_NOTIFS, []));

  const dismissTicketNotification = useCallback((ticketId) => {
    setDismissedTicketIds((prev) => {
      if (prev.includes(ticketId)) return prev;
      const next = [...prev, ticketId];
      save(KEYS.DISMISSED_NOTIFS, next);
      return next;
    });
  }, []);

  // Tickets submitted by current user
  const userTickets = useMemo(() => {
    if (!currentUser) return [];
    return tickets.filter((t) => t.userId === currentUser.id || t.userName === currentUser.name);
  }, [tickets, currentUser]);

  // Resolved tickets that user hasn't dismissed yet
  const userResolvedTickets = useMemo(() => {
    if (!currentUser) return [];
    return userTickets.filter((t) => t.status === 'resolved' && !dismissedTicketIds.includes(t.id));
  }, [userTickets, currentUser, dismissedTicketIds]);

  const verifyAdminPin = useCallback((pin) => {
    const cleanPin = (pin || '').trim();
    if (cleanPin === '2026') {
      setIsAdminLoggedIn(true);
      save(KEYS.ADMIN_LOGGED, true);
      return { success: true };
    }
    return { success: false, error: 'invalidPin' };
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdminLoggedIn(false);
    save(KEYS.ADMIN_LOGGED, false);
  }, []);

  // Community review moderation for admin
  const deleteReview = useCallback(async (reviewId) => {
    const all = load(KEYS.REVIEWS, []);
    const filtered = all.filter((r) => r.id !== reviewId);
    save(KEYS.REVIEWS, filtered);
    bumpReview();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('reviews').delete().eq('id', reviewId);
      } catch (err) {
        console.warn('Supabase delete review error:', err);
      }
    }
    return { success: true };
  }, [bumpReview]);

  // Platform all users list (local + Supabase)
  const [allUsersList, setAllUsersList] = useState(() => load(KEYS.USERS, []));
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    async function fetchAllProfiles() {
      try {
        const { data } = await supabase.from('profiles').select('id, name, created_at');
        if (data && data.length > 0) {
          const mapped = data.map((p) => ({
            id: p.id,
            name: p.name,
            createdAt: p.created_at,
          }));
          setAllUsersList(mapped);
        }
      } catch {}
    }
    fetchAllProfiles();
  }, [currentUser]);

  const value = {
    lang, setLang, t, isRTL,
    theme, isDark, toggleTheme,
    user: currentUser, signUp, signIn, signOut, updateProfile, changePassword,
    screen, setScreen, activeTab, setActiveTab,
    showExpenseForm, setShowExpenseForm,
    editingExpense,  setEditingExpense,
    confirmDialog,   setConfirmDialog,
    toast, showToast,
    // Expenses
    expenses, allUserExpenses, addExpense, updateExpense, deleteExpense,
    totalExpenses, totalIncome, netBalance,
    lastMonthTotal, lastMonthExpenses,
    // Month nav
    viewMonth, goToPrevMonth, goToNextMonth, isCurrentMonth,
    // Budgets
    budgets, saveBudget, getBudget,
    // Export
    exportToCSV,
    // Reviews
    reviews, featuredReviews, userReview, addReview, deleteReview,
    showReviewModal, setShowReviewModal,
    // Support & Admin
    showSupportModal, setShowSupportModal,
    tickets, userTickets, userResolvedTickets, dismissTicketNotification,
    addTicket, updateTicketStatus, deleteTicket,
    isAdminLoggedIn, verifyAdminPin, logoutAdmin,
    allUsersList,
  };

  return <MasarifiContext.Provider value={value}>{children}</MasarifiContext.Provider>;
}

export function useMasarifi() {
  const ctx = useContext(MasarifiContext);
  if (!ctx) throw new Error('useMasarifi must be used inside MasarifiProvider');
  return ctx;
}

export default MasarifiContext;
