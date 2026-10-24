import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import translations from '../i18n/translations';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { hashPassword } from '../lib/hash';
import { EXPENSE_CATEGORIES } from '../models/categories';

const MasarifiContext = createContext(null);

const KEYS = {
  LANG:             'masarifi_lang',
  THEME:            'masarifi_theme',
  CURRENT_USER:     'masarifi_current_user',
  USERS:            'masarifi_users',
  EXPENSES:         'masarifi_expenses',
  BUDGETS:          'masarifi_budgets',
  REVIEWS:          'masarifi_reviews',
  TICKETS:          'masarifi_support_tickets',
  ADMIN_LOGGED:     'masarifi_admin_logged_in',
  DISMISSED_NOTIFS: 'masarifi_dismissed_ticket_notifs',
  DISMISSED_BUDGETS:'masarifi_dismissed_budget_alerts',
  ADMIN_ACCOUNT:    'masarifi_admin_account',
  CURRENT_SCREEN:   'masarifi_current_screen',
  ACTIVE_TAB:       'masarifi_active_tab',
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
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => load(KEYS.ADMIN_LOGGED, false));

  // Determine initial screen on load/refresh:
  const [screen, setScreenState] = useState(() => {
    const savedScreen = load(KEYS.CURRENT_SCREEN, null);
    const hasAdmin = load(KEYS.ADMIN_LOGGED, false);
    const hasUser = load(KEYS.CURRENT_USER, null);

    if (savedScreen === 'admin' && hasAdmin) return 'admin';
    if (savedScreen === 'app' && hasUser) return 'app';
    if (savedScreen && ['landing', 'auth-signin', 'auth-signup'].includes(savedScreen)) return savedScreen;

    if (hasAdmin) return 'admin';
    if (hasUser) return 'app';
    return 'landing';
  });

  const [activeTab, setActiveTabState] = useState(() => load(KEYS.ACTIVE_TAB, 'home'));

  const setScreen = useCallback((s) => {
    setScreenState(s);
    save(KEYS.CURRENT_SCREEN, s);
  }, []);

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    save(KEYS.ACTIVE_TAB, tab);
  }, []);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense]   = useState(null);
  const [confirmDialog, setConfirmDialog]     = useState(null);
  const [toast, setToast]         = useState(null);
  const [expenseVer, setExpenseVer] = useState(0);
  const [reviewVer, setReviewVer] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [ticketVer, setTicketVer] = useState(0);

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
  const t = useCallback((path, params) => {
    const keys = path.split('.');
    let obj = translations[lang] ?? translations['ar'];
    for (const k of keys) { if (obj == null) return path; obj = obj[k]; }
    if (typeof obj !== 'string') return obj ?? path;
    if (params && typeof params === 'object') {
      return Object.entries(params).reduce((str, [pKey, pVal]) => {
        return str.replaceAll(`{${pKey}}`, String(pVal));
      }, obj);
    }
    return obj;
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
    if (toast) { const tm = setTimeout(() => setToast(null), 3500); return () => clearTimeout(tm); }
  }, [toast]);

  // ── Browser Notifications ──────────────────────────────────────────
  const sendBrowserNotification = useCallback((title, body) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.warn('Browser notification error:', err);
      }
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          return await Notification.requestPermission();
        } catch (_) {
          return 'denied';
        }
      }
      return Notification.permission;
    }
    return 'unsupported';
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────
  const signUp = useCallback(async (name, password) => {
    const cleanName = name.trim();
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'noDatabase' };
    }
    try {
      const hashed = await hashPassword(password);

      // 1. Try secure server-side RPC register_user first (works even when direct profiles table SELECT is revoked)
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('register_user', {
          p_name: cleanName,
          p_password: hashed,
        });

        if (!rpcErr && rpcRes && rpcRes.length > 0) {
          const res = rpcRes[0];
          if (!res.success && res.error_code === 'nameExists') {
            return { success: false, error: 'nameExists' };
          }
          if (res.success && res.id) {
            // Redirect to login screen instead of auto-logging in
            setScreen('auth-signin');
            showToast(t('auth.accountCreatedSuccess') || '✅ تم إنشاء الحساب بنجاح! الرجاء تسجيل الدخول.', 'success');
            return { success: true };
          }
        }
      } catch (e) {
        console.debug('RPC register_user fallback:', e);
      }

      // 2. Direct Table Fallback: check uniqueness via public_profiles view
      const { data: existing } = await supabase
        .from('public_profiles')
        .select('id')
        .ilike('name', cleanName)
        .maybeSingle();

      if (existing) return { success: false, error: 'nameExists' };

      // Direct insert
      const { data: insertedList, error } = await supabase
        .from('profiles')
        .insert([{ name: cleanName, password: hashed, role: 'user' }])
        .select('id, name, role, created_at');

      if (error) {
        if (error.code === '23505') return { success: false, error: 'nameExists' };
        return { success: false, error: 'serverError' };
      }

      const newProfile = insertedList?.[0];
      if (newProfile) {
        // Redirect to login screen instead of auto-logging in
        setScreen('auth-signin');
        showToast(t('auth.accountCreatedSuccess') || '✅ تم إنشاء الحساب بنجاح! الرجاء تسجيل الدخول.', 'success');
        return { success: true };
      }
    } catch (err) {
      console.warn('signUp error:', err);
      return { success: false, error: 'serverError' };
    }
    return { success: false, error: 'serverError' };
  }, []);

  const signIn = useCallback(async (name, password) => {
    const cleanName = name.trim().toLowerCase();
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'noDatabase' };
    }
    try {
      const hashed = await hashPassword(password);

      // 1. Try secure RPC function first (keeps password verification server-side)
      const { data: rpcData, error: rpcError } = await supabase.rpc('login_user', {
        p_name: cleanName,
        p_password: hashed,
      });

      let profile = null;
      if (!rpcError && rpcData && rpcData.length > 0 && rpcData[0].success) {
        profile = rpcData[0];
      } else {
        // Fallback to direct query if RPC is not yet created in Supabase
        const { data: fallbackProfile } = await supabase
          .from('profiles')
          .select('*')
          .ilike('name', cleanName)
          .maybeSingle();

        if (fallbackProfile) {
          let passwordMatch = fallbackProfile.password === hashed;
          if (!passwordMatch && fallbackProfile.password === password) {
            passwordMatch = true;
            supabase.from('profiles').update({ password: hashed }).eq('id', fallbackProfile.id).then(() => {});
          }
          if (passwordMatch) {
            profile = fallbackProfile;
          }
        }
      }

      if (!profile) return { success: false, error: 'invalidCredentials' };

      const role = profile.role || 'user';
      const safe = { id: profile.id, name: profile.name, role, createdAt: profile.created_at };
      save(KEYS.CURRENT_USER, safe);

      // Load cloud budgets into local cache
      if (profile.budgets && typeof profile.budgets === 'object') {
        save(`${KEYS.BUDGETS}_${profile.id}`, profile.budgets);
      }

      setCurrentUser(safe);

      // Route based on role
      if (role === 'admin') {
        setIsAdminLoggedIn(true);
        save(KEYS.ADMIN_LOGGED, true);
        setScreen('admin');
      } else {
        setScreen('app');
        setActiveTab('home');
      }

      return { success: true };
    } catch (err) {
      console.warn('signIn error:', err);
      return { success: false, error: 'serverError' };
    }
  }, []);

  const signOut = useCallback(() => {
    save(KEYS.CURRENT_USER, null);
    save(KEYS.CURRENT_SCREEN, 'landing');
    save(KEYS.ACTIVE_TAB, 'home');
    setCurrentUser(null);
    setScreenState('landing');
    setActiveTabState('home');
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
        if (!data) return { success: false, error: 'wrongPassword' };

        const currentHashed = await hashPassword(currentPass);
        let match = data.password === currentHashed;
        if (!match && data.password === currentPass) {
          match = true;
        }

        if (!match) return { success: false, error: 'wrongPassword' };

        const newHashed = await hashPassword(newPass);
        const { error } = await supabase.from('profiles').update({ password: newHashed }).eq('id', currentUser.id);
        if (error) return { success: false, error: 'serverError' };
        return { success: true };
      } catch (err) {
        console.warn('changePassword error:', err);
        return { success: false, error: 'serverError' };
      }
    }
    return { success: false, error: 'noDatabase' };
  }, [currentUser]);

  // ── Budgets ──────────────────────────────────────────────────────
  const getBudgetKey = useCallback(() => currentUser ? `${KEYS.BUDGETS}_${currentUser.id}` : null, [currentUser]);

  const [budgets, setBudgets] = useState(() => {
    if (!currentUser) return {};
    return load(getBudgetKey(), {});
  });

  // Fetch budgets from Supabase cloud on login / load / device switch & listen for realtime updates
  useEffect(() => {
    if (!currentUser) {
      setBudgets({});
      return;
    }

    const key = getBudgetKey();
    // 1. Immediately load local cache for zero delay
    if (key) {
      const cached = load(key, {});
      setBudgets(cached);
    }

    if (!isSupabaseConfigured || !supabase) return;

    let isMounted = true;
    async function fetchCloudBudgets() {
      try {
        let budgetMap = {};
        // 2. Query dedicated budgets table
        const { data, error } = await supabase
          .from('budgets')
          .select('category, amount')
          .eq('user_id', currentUser.id);

        if (!error && data && data.length > 0) {
          data.forEach((row) => {
            budgetMap[row.category] = parseFloat(row.amount) || 0;
          });
        } else {
          // 3. Fallback to public_profiles column
          const { data: profData } = await supabase
            .from('public_profiles')
            .select('budgets')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (profData?.budgets && typeof profData.budgets === 'object') {
            budgetMap = { ...profData.budgets };
          }
        }

        if (isMounted && Object.keys(budgetMap).length > 0) {
          setBudgets(budgetMap);
          if (key) save(key, budgetMap);
        }
      } catch (err) {
        console.warn('Error fetching cloud budgets:', err);
      }
    }

    fetchCloudBudgets();

    // 4. Supabase Realtime for instant multi-device budget sync
    const channel = supabase
      .channel(`realtime_budgets_${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${currentUser.id}` },
        () => {
          fetchCloudBudgets();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [currentUser, getBudgetKey]);

  // Unified batch save for budgets across devices
  const saveAllBudgets = useCallback(async (newBudgets) => {
    if (!currentUser) return;
    const key = getBudgetKey();
    const updated = { ...(budgets || {}), ...newBudgets };

    // Optimistic UI update
    setBudgets(updated);
    if (key) save(key, updated);
    setExpenseVer((v) => v + 1);

    // Sync to Supabase budgets table
    if (isSupabaseConfigured && supabase) {
      try {
        const rows = Object.entries(updated).map(([category, amount]) => ({
          user_id: currentUser.id,
          category,
          amount: parseFloat(amount) || 0,
        }));
        if (rows.length > 0) {
          const { error: bErr } = await supabase.from('budgets').upsert(rows, { onConflict: 'user_id, category' });
          if (bErr) console.warn('Supabase budget upsert error:', bErr.message);
        }
        // Also sync to profiles via RPC if available
        try {
          await supabase.rpc('save_user_budgets', {
            p_user_id: currentUser.id,
            p_budgets: updated,
          });
        } catch {}
      } catch (err) {
        console.warn('Cloud budget sync error:', err);
      }
    }
  }, [currentUser, getBudgetKey, budgets]);

  const saveBudget = useCallback((category, amount) => {
    saveAllBudgets({ [category]: parseFloat(amount) || 0 });
  }, [saveAllBudgets]);

  const getBudget = useCallback((category) => {
    return budgets[category] || 0;
  }, [budgets]);

  // ── Dismissed Budget Alerts ─────────────────────────────────────
  const [dismissedBudgetAlerts, setDismissedBudgetAlerts] = useState(() => {
    if (!currentUser) return {};
    return load(`${KEYS.DISMISSED_BUDGETS}_${currentUser.id}`, {});
  });

  useEffect(() => {
    if (currentUser) {
      setDismissedBudgetAlerts(load(`${KEYS.DISMISSED_BUDGETS}_${currentUser.id}`, {}));
    } else {
      setDismissedBudgetAlerts({});
    }
  }, [currentUser]);

  const dismissBudgetAlert = useCallback((catId, threshold) => {
    if (!currentUser) return;
    const currentKey = `${viewMonth.year}-${viewMonth.month}`;
    const storageKey = `${KEYS.DISMISSED_BUDGETS}_${currentUser.id}`;
    setDismissedBudgetAlerts((prev) => {
      const updated = {
        ...prev,
        [`${currentKey}_${catId}`]: threshold,
      };
      save(storageKey, updated);
      return updated;
    });
  }, [currentUser, viewMonth]);

  // ── Expenses ──────────────────────────────────────────────────────
  const bump = useCallback(() => setExpenseVer((v) => v + 1), []);

  // Fetch expenses from Supabase on user sign-in securely
  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured || !supabase) return;
    async function fetchSupabaseExpenses() {
      try {
        // 1. Try calling isolated secure RPC function first
        let fetchedData = null;
        const { data: rpcExpenses, error: rpcErr } = await supabase.rpc('get_user_expenses', {
          p_user_id: currentUser.id,
        });

        if (!rpcErr && rpcExpenses) {
          fetchedData = rpcExpenses;
        } else {
          // Fallback to direct query filtered by user_id
          const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: false });
          if (!error && data) fetchedData = data;
        }

        if (fetchedData) {
          const mapped = fetchedData
            .filter((d) => d.category !== '__support_ticket__')
            .map((d) => ({
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

    // Supabase Realtime sync for instant multi-device expenses updates
    const channel = supabase
      .channel(`realtime_expenses_${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${currentUser.id}` },
        () => {
          fetchSupabaseExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // Active budget alerts for current view month (>= 80% or >= 100%)
  const budgetAlerts = useMemo(() => {
    if (!currentUser) return [];
    const currentKey = `${viewMonth.year}-${viewMonth.month}`;
    const prefix = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}`;

    const spendPerCat = {};
    allUserExpenses
      .filter((e) => e.date && e.date.startsWith(prefix) && (e.type || 'expense') !== 'income')
      .forEach((e) => {
        spendPerCat[e.category] = (spendPerCat[e.category] || 0) + (parseFloat(e.amount) || 0);
      });

    const alerts = [];
    EXPENSE_CATEGORIES.forEach((cat) => {
      const b = getBudget(cat.id);
      if (b > 0) {
        const spent = spendPerCat[cat.id] || 0;
        const pct = (spent / b) * 100;
        if (pct >= 80) {
          const threshold = pct >= 100 ? 100 : 80;
          const dismissedThreshold = dismissedBudgetAlerts[`${currentKey}_${cat.id}`];
          const isDismissed = dismissedThreshold >= threshold;
          if (!isDismissed) {
            alerts.push({
              catId: cat.id,
              categoryName: t(`categories.${cat.id}`),
              spent,
              budget: b,
              pct: Math.round(pct),
              isOver: pct >= 100,
              threshold,
            });
          }
        }
      }
    });

    return alerts.sort((a, b) => (b.isOver ? 1 : 0) - (a.isOver ? 1 : 0) || b.pct - a.pct);
  }, [currentUser, viewMonth, allUserExpenses, getBudget, dismissedBudgetAlerts, t]);

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

    // 2. Real-time budget warning notification
    if (newEntry.type === 'expense') {
      const catBudget = getBudget(newEntry.category);
      if (catBudget > 0) {
        const expMonth = (newEntry.date || new Date().toISOString().slice(0, 10)).slice(0, 7);
        const existingCatSpend = all
          .filter((e) => e.userId === currentUser.id && e.date && e.date.startsWith(expMonth) && e.category === newEntry.category && (e.type || 'expense') !== 'income')
          .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        const newCatSpend = existingCatSpend + newEntry.amount;
        const pct = (newCatSpend / catBudget) * 100;
        const catName = t(`categories.${newEntry.category}`) || newEntry.category;

        if (pct >= 100) {
          showToast(`🚨 ${t('budget.toast100')} ${catName} (${Math.round(pct)}%)`, 'error');
          sendBrowserNotification(
            t('budget.warningOverTitle'),
            `${catName}: ${newCatSpend.toLocaleString('en-US')} / ${catBudget.toLocaleString('en-US')} ${t('common.currency')} (${Math.round(pct)}%)`
          );
        } else if (pct >= 80) {
          showToast(`⚠️ ${t('budget.toast80')} ${catName} (${Math.round(pct)}%)`, 'warning');
          sendBrowserNotification(
            t('budget.warningTitle'),
            `${catName}: ${newCatSpend.toLocaleString('en-US')} / ${catBudget.toLocaleString('en-US')} ${t('common.currency')} (${Math.round(pct)}%)`
          );
        } else {
          showToast('✅ ' + t('form.save'), 'success');
        }
      } else {
        showToast('✅ ' + t('form.save'), 'success');
      }
    } else {
      showToast('✅ ' + t('form.save'), 'success');
    }

    // 3. Sync to Supabase in background
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
  }, [currentUser, bump, getBudget, t, showToast, sendBrowserNotification]);

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

    // Budget warning check on update
    if (data.type === 'expense') {
      const catBudget = getBudget(data.category);
      if (catBudget > 0) {
        const expMonth = (data.date || new Date().toISOString().slice(0, 10)).slice(0, 7);
        const otherCatSpend = all
          .filter((e) => e.userId === currentUser.id && e.id !== id && e.date && e.date.startsWith(expMonth) && e.category === data.category && (e.type || 'expense') !== 'income')
          .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        const newCatSpend = otherCatSpend + parseFloat(data.amount);
        const pct = (newCatSpend / catBudget) * 100;
        const catName = t(`categories.${data.category}`) || data.category;

        if (pct >= 100) {
          showToast(`🚨 ${t('budget.toast100')} ${catName} (${Math.round(pct)}%)`, 'error');
          sendBrowserNotification(
            t('budget.warningOverTitle'),
            `${catName}: ${newCatSpend.toLocaleString('en-US')} / ${catBudget.toLocaleString('en-US')} ${t('common.currency')} (${Math.round(pct)}%)`
          );
        } else if (pct >= 80) {
          showToast(`⚠️ ${t('budget.toast80')} ${catName} (${Math.round(pct)}%)`, 'warning');
          sendBrowserNotification(
            t('budget.warningTitle'),
            `${catName}: ${newCatSpend.toLocaleString('en-US')} / ${catBudget.toLocaleString('en-US')} ${t('common.currency')} (${Math.round(pct)}%)`
          );
        } else {
          showToast('✅ ' + t('form.update'), 'success');
        }
      } else {
        showToast('✅ ' + t('form.update'), 'success');
      }
    } else {
      showToast('✅ ' + t('form.update'), 'success');
    }

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
  }, [currentUser, bump, getBudget, t, showToast, sendBrowserNotification]);

  const deleteExpense = useCallback(async (id) => {
    save(KEYS.EXPENSES, load(KEYS.EXPENSES, []).filter((e) => e.id !== id));
    bump();

    if (isSupabaseConfigured && supabase) {
      try {
        if (currentUser?.id) {
          await supabase.from('expenses').delete().eq('id', id).eq('user_id', currentUser.id);
        } else {
          await supabase.from('expenses').delete().eq('id', id);
        }
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
  const exportToPDF = useCallback(() => {
    const dateStr = new Date().toISOString().split('T')[0];
    const total = allUserExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    
    // Group expenses by category
    const byCategory = {};
    allUserExpenses.forEach(e => {
      const cat = e.category || 'other';
      if (!byCategory[cat]) byCategory[cat] = { items: [], total: 0 };
      byCategory[cat].items.push(e);
      byCategory[cat].total += Number(e.amount) || 0;
    });

    const tableRows = allUserExpenses
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(e => `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;">${e.date || '-'}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600;">${e.title || '-'}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;">${e.category || '-'}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:600;">${Number(e.amount).toLocaleString('en-US')} MRU</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#64748b;">${e.notes || '-'}</td>
        </tr>
      `).join('');

    const summaryRows = Object.entries(byCategory)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([cat, data]) => `
        <tr>
          <td style="padding:6px 10px;font-size:13px;font-weight:600;text-transform:capitalize;">${cat}</td>
          <td style="padding:6px 10px;font-size:13px;text-align:center;">${data.items.length}</td>
          <td style="padding:6px 10px;font-size:13px;text-align:right;font-weight:700;">${data.total.toLocaleString('en-US')} MRU</td>
          <td style="padding:6px 10px;font-size:12px;text-align:right;color:#64748b;">${total > 0 ? ((data.total / total) * 100).toFixed(1) : 0}%</td>
        </tr>
      `).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Masarifi Report ${dateStr}</title>
<style>
  @page { margin: 15mm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; padding: 20px; }
  .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #059669; }
  .header h1 { font-size: 28px; color: #059669; margin-bottom: 4px; }
  .header p { font-size: 13px; color: #64748b; }
  .stats { display: flex; gap: 12px; margin-bottom: 25px; }
  .stat-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
  .stat-card .value { font-size: 22px; font-weight: 800; color: #059669; }
  .stat-card .label { font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .section-title { font-size: 15px; font-weight: 700; color: #334155; margin: 25px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; }
  table { width: 100%; border-collapse: collapse; }
  thead th { padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #fff; background: #059669; text-align: left; }
  thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style></head><body>
  <div class="header">
    <h1>📊 Masarifi</h1>
    <p>Expense Report — ${dateStr}</p>
  </div>
  <div class="stats">
    <div class="stat-card"><div class="value">${allUserExpenses.length}</div><div class="label">Transactions</div></div>
    <div class="stat-card"><div class="value">${total.toLocaleString('en-US')}</div><div class="label">Total (MRU)</div></div>
    <div class="stat-card"><div class="value">${Object.keys(byCategory).length}</div><div class="label">Categories</div></div>
  </div>
  <div class="section-title">Summary by Category</div>
  <table>
    <thead><tr><th>Category</th><th style="text-align:center">Count</th><th style="text-align:right">Total</th><th style="text-align:right">%</th></tr></thead>
    <tbody>${summaryRows}</tbody>
  </table>
  <div class="section-title">All Transactions</div>
  <table>
    <thead><tr><th>Date</th><th>Title</th><th>Category</th><th style="text-align:right">Amount</th><th style="text-align:right">Notes</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">Generated by Masarifi App — ${new Date().toLocaleString()}</div>
  <script>window.onload = function() { window.print(); }</script>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // Fallback: download as HTML file that auto-prints
      const a = document.createElement('a');
      a.href = url;
      a.download = `masarifi_report_${dateStr}.html`;
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
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

    const channel = supabase
      .channel('realtime_reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        fetchPublicReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // ── Support Tickets & Admin Sync ────────────────────────────────────
  const [tickets, setTickets] = useState(() => load(KEYS.TICKETS, []));

  const fetchSupabaseTickets = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      let mapped = null;

      // 1. Try dedicated support_tickets table first
      const { data: dedicatedData, error: dedicatedErr } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!dedicatedErr && dedicatedData && dedicatedData.length > 0) {
        mapped = dedicatedData.map((d) => ({
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
      } else {
        // 2. Universal cloud sync fallback using expenses table
        const { data: expenseTickets, error: expErr } = await supabase
          .from('expenses')
          .select('*')
          .eq('category', '__support_ticket__')
          .order('created_at', { ascending: false });

        if (!expErr && expenseTickets) {
          mapped = expenseTickets.map((row) => {
            let parsed = {};
            try { parsed = JSON.parse(row.notes); } catch {}
            return {
              id: parsed.id || row.id.replace('tk_', ''),
              userId: parsed.userId || row.user_id,
              userName: parsed.userName || 'مستخدم',
              category: parsed.category || 'general',
              subject: parsed.subject || row.title.replace('[TICKET] ', ''),
              message: parsed.message || '',
              contact: parsed.contact || '',
              status: parsed.status || 'new',
              adminNotes: parsed.adminNotes || '',
              createdAt: parsed.createdAt || row.created_at,
              updatedAt: parsed.updatedAt || row.created_at,
            };
          });
        }
      }

      if (mapped) {
        // Cloud database is the single source of truth across all devices
        setTickets(mapped);
        save(KEYS.TICKETS, mapped);
      }
    } catch (err) {
      console.warn('Error fetching Supabase tickets:', err);
    }
  }, []);

  // Sync tickets on load and subscribe to realtime updates
  useEffect(() => {
    fetchSupabaseTickets();
    const timer = setInterval(fetchSupabaseTickets, 7000);

    let channel = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel('realtime_support_tickets')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: 'category=eq.__support_ticket__' }, () => {
          fetchSupabaseTickets();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
          fetchSupabaseTickets();
        })
        .subscribe();
    }

    return () => {
      clearInterval(timer);
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [fetchSupabaseTickets]);

  const addTicket = useCallback(async ({ category, subject, message, contact }) => {
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

    setTickets((prev) => {
      const updated = [newTicket, ...prev];
      save(KEYS.TICKETS, updated);
      return updated;
    });

    // Cloud Database Sync
    if (isSupabaseConfigured && supabase) {
      try {
        let inserted = false;
        // Attempt support_tickets table first
        const { error: dedicatedErr } = await supabase.from('support_tickets').insert([{
          id: newTicket.id,
          user_id: currentUser?.id || null,
          user_name: newTicket.userName,
          category: newTicket.category,
          subject: newTicket.subject,
          message: newTicket.message,
          contact: newTicket.contact,
          status: newTicket.status,
          admin_notes: newTicket.adminNotes,
          created_at: newTicket.createdAt,
        }]);

        if (!dedicatedErr) {
          inserted = true;
        }

        // If table does not exist or fails, securely sync via universal cloud expenses table
        if (!inserted) {
          let syncUserId = currentUser?.id;
          if (!syncUserId || syncUserId === 'anonymous') {
            const { data: p } = await supabase.from('public_profiles').select('id').limit(1);
            if (p?.[0]?.id) syncUserId = p[0].id;
          }

          if (syncUserId) {
            const ticketJson = JSON.stringify({
              __masarifi_type: 'support_ticket',
              ...newTicket,
            });
            await supabase.from('expenses').insert([{
              id: `tk_${newTicket.id}`,
              user_id: syncUserId,
              title: `[TICKET] ${newTicket.subject}`,
              amount: 0,
              category: '__support_ticket__',
              date: new Date().toISOString().slice(0, 10),
              notes: ticketJson,
              type: 'ticket',
              recurring: false,
            }]);
          }
        }
      } catch (err) {
        console.warn('Universal ticket sync error:', err);
      }
    }

    return { success: true };
  }, [currentUser]);

  const updateTicketStatus = useCallback(async (ticketId, status, adminNotes = null) => {
    const updatedTime = new Date().toISOString();
    let updatedTicket = null;

    setTickets((prev) => {
      const updated = prev.map((t) => {
        if (t.id === ticketId) {
          updatedTicket = {
            ...t,
            status,
            adminNotes: adminNotes !== null ? adminNotes : t.adminNotes,
            updatedAt: updatedTime,
          };
          return updatedTicket;
        }
        return t;
      });
      save(KEYS.TICKETS, updated);
      return updated;
    });

    if (isSupabaseConfigured && supabase && updatedTicket) {
      try {
        const updateData = { status, updated_at: updatedTime };
        if (adminNotes !== null) updateData.admin_notes = adminNotes;

        const { error: dedicatedErr } = await supabase
          .from('support_tickets')
          .update(updateData)
          .eq('id', ticketId);

        if (dedicatedErr) {
          const ticketJson = JSON.stringify({
            __masarifi_type: 'support_ticket',
            ...updatedTicket,
          });
          await supabase
            .from('expenses')
            .update({ notes: ticketJson })
            .eq('id', `tk_${ticketId}`);
        }
      } catch (err) {
        console.warn('Supabase update ticket error:', err);
      }
    }

    return { success: true };
  }, []);

  const deleteTicket = useCallback(async (ticketId) => {
    setTickets((prev) => {
      const updated = prev.filter((t) => t.id !== ticketId);
      save(KEYS.TICKETS, updated);
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('support_tickets').delete().eq('id', ticketId);
        await supabase.from('expenses').delete().eq('id', `tk_${ticketId}`);
        await supabase.from('expenses').delete().eq('id', ticketId);
      } catch (err) {
        console.warn('Supabase delete ticket error:', err);
      }
    }

    return { success: true };
  }, []);

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

  // Tickets submitted by current user (matched by user ID or username case-insensitive)
  const userTickets = useMemo(() => {
    if (!currentUser) return [];
    const currentName = (currentUser.name || '').trim().toLowerCase();
    return tickets.filter((t) => 
      (t.userId && t.userId === currentUser.id) ||
      (t.userName && t.userName.trim().toLowerCase() === currentName)
    );
  }, [tickets, currentUser]);

  // Resolved tickets that user hasn't dismissed yet
  const userResolvedTickets = useMemo(() => {
    if (!currentUser) return [];
    return userTickets.filter((t) => t.status === 'resolved' && !dismissedTicketIds.includes(t.id));
  }, [userTickets, currentUser, dismissedTicketIds]);

  const DEFAULT_ADMIN = { name: 'Admin', password: 'admin' };
  const [adminAccount, setAdminAccount] = useState(() => load(KEYS.ADMIN_ACCOUNT, DEFAULT_ADMIN));

  const verifyAdminCredentials = useCallback((nameInput, passwordInput) => {
    const currentAdmin = load(KEYS.ADMIN_ACCOUNT, DEFAULT_ADMIN);
    const cleanName = (nameInput || '').trim();
    const cleanPass = (passwordInput || '').trim();
    if (
      cleanName.toLowerCase() === (currentAdmin.name || 'admin').toLowerCase() &&
      cleanPass === (currentAdmin.password || 'admin')
    ) {
      setIsAdminLoggedIn(true);
      save(KEYS.ADMIN_LOGGED, true);
      return { success: true };
    }
    return { success: false, error: 'invalidCredentials' };
  }, []);

  const updateAdminProfile = useCallback(async (updates) => {
    if (isSupabaseConfigured && supabase && currentUser) {
      try {
        // 1. Verify current password against Supabase if provided
        if (updates.currentPassword) {
          const { data: prof } = await supabase.from('profiles').select('password').eq('id', currentUser.id).single();
          if (prof) {
            const currentHashed = await hashPassword(updates.currentPassword);
            let match = prof.password === currentHashed;
            if (!match && prof.password === updates.currentPassword) match = true;
            if (!match) return { success: false, error: 'wrongPassword' };
          }
        }

        const payload = {};
        if (updates.name) payload.name = updates.name;
        if (updates.password) {
          payload.password = await hashPassword(updates.password);
        }
        await supabase.from('profiles').update(payload).eq('id', currentUser.id);
        const updatedUser = { ...currentUser, ...updates };
        delete updatedUser.password;
        delete updatedUser.currentPassword;
        save(KEYS.CURRENT_USER, updatedUser);
        setCurrentUser(updatedUser);
      } catch (err) {
        console.warn('updateAdminProfile Supabase error:', err);
      }
    }
    const currentAdmin = load(KEYS.ADMIN_ACCOUNT, DEFAULT_ADMIN);
    const updated = { ...currentAdmin, ...updates };
    setAdminAccount(updated);
    save(KEYS.ADMIN_ACCOUNT, updated);
    return { success: true };
  }, [currentUser]);

  const logoutAdmin = useCallback(() => {
    setIsAdminLoggedIn(false);
    save(KEYS.ADMIN_LOGGED, false);
    save(KEYS.CURRENT_SCREEN, 'landing');
    setScreenState('landing');
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

  // Platform all users list (local + Supabase + expense count for activity tracking)
  const [allUsersList, setAllUsersList] = useState(() => load(KEYS.USERS, []));
  const [platformStats, setPlatformStats] = useState({ totalVolume: 0, totalTransactions: 0 });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    async function fetchAllProfiles() {
      try {
        // 1. If current user is admin, fetch rich user stats & platform volume via secure RPC
        if (currentUser?.role === 'admin' || currentUser?.name?.toLowerCase() === 'admin') {
          // Fetch users with transaction counts
          const { data: rpcUsers, error: rpcErr } = await supabase.rpc('admin_get_all_users', {
            p_admin_id: currentUser.id,
          });
          if (!rpcErr && rpcUsers && rpcUsers.length > 0) {
            setAllUsersList(
              rpcUsers.map((u) => ({
                id: u.id,
                name: u.name,
                role: u.role,
                createdAt: u.created_at,
                expenseCount: Number(u.expense_count) || 0,
                incomeCount: Number(u.income_count) || 0,
                expenseTotal: Number(u.expense_total) || 0,
                incomeTotal: Number(u.income_total) || 0,
              }))
            );
          }

          // Fetch global platform tracked volume
          const { data: statsData, error: statsErr } = await supabase.rpc('admin_get_platform_stats', {
            p_admin_id: currentUser.id,
          });
          if (!statsErr && statsData && statsData.length > 0) {
            setPlatformStats({
              totalVolume: Number(statsData[0].total_volume) || 0,
              totalTransactions: Number(statsData[0].total_transactions) || 0,
            });
          }
          return;
        }

        // 2. Query the hardened public_profiles view (excludes sensitive passwords)
        const { data, error } = await supabase.from('public_profiles').select('id, name, created_at');
        if (data && data.length > 0) {
          const mapped = data.map((p) => ({
            id: p.id,
            name: p.name,
            createdAt: p.created_at,
            expenseCount: 0,
          }));
          setAllUsersList(mapped);
        } else if (error) {
          // Fallback to profiles if public_profiles view not yet created
          const { data: fallbackData } = await supabase.from('profiles').select('id, name, created_at');
          if (fallbackData && fallbackData.length > 0) {
            setAllUsersList(fallbackData.map(p => ({ id: p.id, name: p.name, createdAt: p.created_at, expenseCount: 0 })));
          }
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
    platformStats,
    lastMonthTotal, lastMonthExpenses,
    // Month nav
    viewMonth, goToPrevMonth, goToNextMonth, isCurrentMonth,
    // Budgets
    budgets, saveBudget, saveAllBudgets, getBudget, budgetAlerts, dismissBudgetAlert, requestNotificationPermission,
    // Export
    exportToPDF,
    // Reviews
    reviews, featuredReviews, userReview, addReview, deleteReview,
    showReviewModal, setShowReviewModal,
    // Support & Admin
    showSupportModal, setShowSupportModal,
    tickets, userTickets, userResolvedTickets, dismissTicketNotification,
    addTicket, updateTicketStatus, deleteTicket,
    isAdminLoggedIn, verifyAdminCredentials, updateAdminProfile, adminAccount, logoutAdmin,
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
