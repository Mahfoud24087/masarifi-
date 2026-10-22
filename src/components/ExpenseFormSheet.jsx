import React, { useState, useEffect } from 'react';
import { useMasarifi } from '../context/MasarifiContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CUSTOM_COLOR_PALETTE, hashStringToColor } from '../models/categories';
import { X, TrendingDown, TrendingUp, RefreshCw, Tag, Check } from 'lucide-react';

export default function ExpenseFormSheet() {
  const {
    showExpenseForm, setShowExpenseForm,
    editingExpense, setEditingExpense,
    addExpense, updateExpense, showToast,
    t, isDark, isRTL,
  } = useMasarifi();

  const [type, setType]           = useState('expense');
  const [title, setTitle]         = useState('');
  const [amount, setAmount]       = useState('');
  const [category, setCategory]   = useState('food');
  const [date, setDate]           = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes]         = useState('');
  const [recurring, setRecurring] = useState(false);
  const [customOther, setCustomOther] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [errors, setErrors]       = useState({});

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (editingExpense) {
      const t2 = editingExpense.type || 'expense';
      setType(t2);
      setTitle(editingExpense.title || '');
      setAmount(editingExpense.amount != null ? String(editingExpense.amount) : '');
      const cats = t2 === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      const isKnown = cats.some((c) => c.id === editingExpense.category && c.id !== 'other');
      if (!isKnown && editingExpense.category) {
        setCategory('other');
        setCustomOther(editingExpense.category !== 'other' ? editingExpense.category : (editingExpense.customCategory || ''));
        setSelectedColor(editingExpense.customColor || '');
      } else {
        setCategory(editingExpense.category || (t2 === 'income' ? 'salary' : 'food'));
        setCustomOther(editingExpense.customCategory || '');
        setSelectedColor(editingExpense.customColor || '');
      }
      setDate(editingExpense.date || new Date().toISOString().slice(0, 10));
      setNotes(editingExpense.notes || '');
      setRecurring(editingExpense.recurring || false);
    } else {
      // Check for pre-fill data from bank launcher (new expense, not editing)
      const prefillRaw = sessionStorage.getItem('masarifi_prefill_expense');
      if (prefillRaw) {
        try {
          const prefill = JSON.parse(prefillRaw);
          sessionStorage.removeItem('masarifi_prefill_expense'); // consume it
          setType(prefill.type || 'expense');
          setTitle(prefill.title || '');
          setAmount(prefill.amount != null ? String(prefill.amount) : '');
          setCategory(prefill.category || 'food');
          setDate(prefill.date || new Date().toISOString().slice(0, 10));
          setNotes(prefill.notes || '');
          setRecurring(false);
          setCustomOther('');
          setSelectedColor('');
        } catch {
          setType('expense'); setTitle(''); setAmount(''); setCategory('food');
          setDate(new Date().toISOString().slice(0, 10)); setNotes(''); setRecurring(false); setCustomOther('');
          setSelectedColor('');
        }
      } else {
        setType('expense'); setTitle(''); setAmount(''); setCategory('food');
        setDate(new Date().toISOString().slice(0, 10)); setNotes(''); setRecurring(false); setCustomOther('');
        setSelectedColor('');
      }
    }
    setErrors({});
  }, [editingExpense, showExpenseForm]);

  // When type changes, reset category to a sensible default
  useEffect(() => {
    if (type === 'income') setCategory('salary');
    else setCategory('food');
  }, [type]);

  if (!showExpenseForm) return null;

  const handleClose = () => { setShowExpenseForm(false); setEditingExpense(null); };

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = t('form.errors.titleRequired');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = t('form.errors.amountInvalid');
    if (!category) e.category = t('form.errors.categoryRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const finalCategory = (category === 'other' && customOther.trim()) ? customOther.trim() : category;
    const chosenColor = selectedColor || (customOther.trim() ? hashStringToColor(customOther.trim()).color : undefined);
    const payload = {
      title: title.trim(),
      amount: parseFloat(amount),
      category: finalCategory,
      date,
      notes: notes.trim(),
      type,
      recurring,
      customCategory: customOther.trim() || undefined,
      customColor: (category === 'other' || finalCategory !== category) ? chosenColor : undefined,
    };
    if (editingExpense) {
      updateExpense(editingExpense.id, payload);
    } else {
      addExpense(payload);
    }
    handleClose();
  };

  const base = `w-full px-4 py-3 rounded-2xl text-sm border outline-none transition-all focus:ring-2 focus:ring-emerald-400 ${
    isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
  }`;
  const label = `block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`;
  const isIncome = type === 'income';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-lg rounded-t-3xl p-5 shadow-2xl max-h-[95vh] overflow-y-auto ${
          isDark ? 'bg-slate-900 border-t border-slate-800' : 'bg-white'
        }`}
        style={{ animation: 'slideUp 0.3s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Drag handle */}
        <div className={`w-12 h-1 rounded-full mx-auto mb-4 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-lg font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
            {editingExpense ? t('form.editExpense') : t('form.addExpense')}
          </h2>
          <button onClick={handleClose} className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className={`flex rounded-2xl p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <button type="button" onClick={() => setType('expense')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                !isIncome ? 'bg-red-500 text-white shadow' : isDark ? 'text-slate-400' : 'text-slate-500'
              }`} id="masarifi-type-expense">
              <TrendingDown size={15} /> {t('form.expense')}
            </button>
            <button type="button" onClick={() => setType('income')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isIncome ? 'bg-emerald-500 text-white shadow' : isDark ? 'text-slate-400' : 'text-slate-500'
              }`} id="masarifi-type-income">
              <TrendingUp size={15} /> {t('form.income')}
            </button>
          </div>

          {/* Title */}
          <div>
            <label className={label}>{t('form.title')} <span className="text-red-500">*</span></label>
            <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors(p => ({...p, title: null})); }}
              placeholder={type === 'income' ? t('form.titleIncomePlaceholder') : t('form.titlePlaceholder')} className={`${base} ${errors.title ? 'border-red-400' : ''}`} id="masarifi-form-title" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className={label}>{t('form.amount')} ({t('common.currency')}) <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type="number" step="any" dir="ltr" value={amount}
                onChange={(e) => { setAmount(e.target.value); if (errors.amount) setErrors(p => ({...p, amount: null})); }}
                placeholder="0" className={`${base} font-bold text-lg ${errors.amount ? 'border-red-400' : ''} ${isRTL ? 'pl-16' : 'pr-16'}`}
                id="masarifi-form-amount" />
              <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-600 ${isRTL ? 'left-4' : 'right-4'}`}>
                {t('common.currency')}
              </span>
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Category grid */}
          <div>
            <label className={label}>{t('form.category')} <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const sel  = category === cat.id;
                return (
                  <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all ${
                      sel ? `border-current ${cat.bg} ${cat.text}` : isDark ? 'border-slate-700 bg-slate-800 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                    }`} style={sel ? { borderColor: cat.color } : {}} id={`masarifi-cat-${cat.id}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cat.bg} ${cat.text}`}>
                      <Icon size={15} />
                    </div>
                    <span className="text-[10px] font-semibold text-center leading-tight truncate w-full">{t(`categories.${cat.id}`)}</span>
                  </button>
                );
              })}
            </div>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>

          {/* Custom Category Input & Color Picker */}
          {category === 'other' && (
            <div className="space-y-3 p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
              <div>
                <label className={label}>
                  {t('form.otherLabel')} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={customOther} 
                  onChange={(e) => setCustomOther(e.target.value)}
                  placeholder={t('form.otherPlaceholder')} 
                  className={base} 
                  id="masarifi-form-other" 
                  autoFocus 
                />
              </div>

              {/* Distinct Color Picker */}
              <div>
                <label className="block text-[11px] font-bold mb-1.5 text-slate-500 dark:text-slate-400">
                  {isRTL ? 'اختر لوناً مميزاً لهذه الفئة:' : 'Choose a unique category color:'}
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                  {CUSTOM_COLOR_PALETTE.map((pal) => {
                    const activeColor = selectedColor || (customOther.trim() ? hashStringToColor(customOther.trim()).color : CUSTOM_COLOR_PALETTE[0].color);
                    const isChosen = activeColor === pal.color;
                    return (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => setSelectedColor(pal.color)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                          isChosen ? 'scale-110 ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-slate-900 shadow-md' : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: pal.color }}
                        title={pal.id}
                      >
                        {isChosen && <Check size={13} className="text-white drop-shadow" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Pill */}
              {customOther.trim() && (
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="text-slate-400 text-[11px]">{isRTL ? 'المعاينة:' : 'Preview:'}</span>
                  <span 
                    className="px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 shadow-sm text-white transition-all"
                    style={{ backgroundColor: selectedColor || hashStringToColor(customOther.trim()).color }}
                  >
                    <Tag size={12} />
                    <span>{customOther.trim()}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className={label}>{t('form.date')}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className={base} dir="ltr" id="masarifi-form-date" />
          </div>

          {/* Recurring toggle */}
          <div className={`flex items-center justify-between px-4 py-3 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="text-emerald-500" />
              <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('form.recurring')}</span>
            </div>
            <button type="button" onClick={() => setRecurring(!recurring)}
              className={`relative w-11 h-6 rounded-full transition-colors ${recurring ? 'bg-emerald-500' : isDark ? 'bg-slate-600' : 'bg-slate-200'}`} id="masarifi-form-recurring">
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${recurring ? (isRTL ? 'left-0.5' : 'right-0.5') : (isRTL ? 'right-0.5' : 'left-0.5')}`} />
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className={label}>{t('form.notes')}</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder={t('form.notesPlaceholder')} className={`${base} resize-none`} id="masarifi-form-notes" />
          </div>

          {/* Submit */}
          <button type="submit"
            className={`w-full py-4 rounded-2xl font-extrabold text-white text-base transition-all active:scale-95 shadow-lg`}
            style={{ background: isIncome ? 'linear-gradient(135deg,#059669,#10B981)' : 'linear-gradient(135deg,#DC2626,#EF4444)' }}
            id="masarifi-form-submit">
            {editingExpense ? t('form.update') : isIncome ? `+ ${t('form.income')}` : `- ${t('form.expense')}`}
          </button>
        </form>
      </div>
    </div>
  );
}
