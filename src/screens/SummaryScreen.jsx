import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMasarifi } from '../context/MasarifiContext';
import { CATEGORIES, getCategoryById } from '../models/categories';
import EmptyState from '../components/EmptyState';

const PERIODS = ['day', 'week', 'month'];

// Helper to get ISO week number
const getWeek = (date) => {
  const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const weekYear = thursday.getFullYear();
  const firstJan = new Date(weekYear, 0, 1);
  return Math.ceil(((thursday - firstJan) / 86400000 + 1) / 7);
};

function isInPeriod(dateStr, period, viewMonth, reference) {
  const d = new Date(dateStr);
  if (period === 'day') {
    const sel = new Date(reference);
    return d.toDateString() === sel.toDateString();
  }
  if (period === 'week') {
    const refWeek = getWeek(new Date(reference));
    return getWeek(d) === refWeek && d.getFullYear() === new Date(reference).getFullYear();
  }
  // month – compare with viewMonth
  return d.getMonth() === viewMonth.month && d.getFullYear() === viewMonth.year;
}

export default function SummaryScreen() {
  const { t, isDark, isRTL, expenses, viewMonth } = useMasarifi();
  const [period, setPeriod] = useState('month');
  // reference date used for day/week filtering – defaults to today
  const [referenceDate, setReferenceDate] = useState(() => new Date().toISOString().slice(0, 10));

  const filtered = useMemo(
    () => expenses.filter((e) => isInPeriod(e.date, period, viewMonth, referenceDate)),
    [expenses, period, viewMonth, referenceDate]
  );
  const totalSpent = filtered.reduce((s, e) => s + e.amount, 0);

  // Pie data – by category
  const pieData = useMemo(() => {
    const map = {};
    const colorMap = {};
    filtered.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
      if (e.customColor) colorMap[e.category] = e.customColor;
    });
    return Object.entries(map)
      .map(([cat, value]) => {
        const trans = t(`categories.${cat}`);
        const name = trans !== `categories.${cat}` ? trans : cat;
        return { name, value, color: colorMap[cat] || getCategoryById(cat).color };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filtered, t]);

  // Bar data – totals per day (last 7 days of the filtered set)
  const barData = useMemo(() => {
    if (filtered.length === 0) return [];
    const map = {};
    filtered.forEach((e) => {
      const label = new Date(e.date).toLocaleDateString(isRTL ? 'ar-u-nu-latn' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
      });
      map[label] = (map[label] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => new Date(a.name) - new Date(b.name))
      .slice(-7);
  }, [filtered, isRTL]);

  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white shadow-sm border border-slate-100';

  return (
    <div className="px-4 pt-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className={`text-xl font-extrabold mb-5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{t('summary.title')}</h1>

      {/* Period selector */}
      <div className={`flex rounded-2xl p-1 mb-5 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              period === p ? 'bg-white text-emerald-700 shadow-sm' : isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
            id={`masarifi-period-${p}`}
          >
            {t(`summary.${p}`)}
          </button>
        ))}
      </div>

      {/* Reference date picker – shown for day & week */}
      {(period === 'day' || period === 'week') && (
        <div className={`mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} p-2 rounded-xl`}>
          <label className="block text-sm font-medium mb-1" htmlFor="reference-date">
            {period === 'day' ? t('summary.selectDay') : t('summary.selectWeek')}
          </label>
          <input
            type="date"
            id="reference-date"
            value={referenceDate}
            onChange={(e) => setReferenceDate(e.target.value)}
            className={`w-full px-3 py-2 rounded-md border ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900'} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon="📊" title={t('summary.noData')} description={t('summary.noDataDesc')} />
      ) : (
        <>
          {/* Total spent */}
          <div className={`rounded-3xl p-5 mb-4 ${cardBg}`}>
            <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('summary.totalSpent')}</p>
            <p className={`text-3xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`} dir="ltr">
              {totalSpent.toLocaleString('en-US', { maximumFractionDigits: 2 })}{' '}
              <span className="text-lg font-semibold text-emerald-600">{t('common.currency')}</span>
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{filtered.length} {t('summary.expenses')}</p>
          </div>

          {/* Pie chart */}
          <div className={`rounded-3xl p-5 mb-4 ${cardBg}`}>
            <p className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('summary.byCategory')}</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} innerRadius={45} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v.toLocaleString('en-US')} ${t('common.currency')}`, '']}
                  contentStyle={{ background: isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: textPrimary }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => <span style={{ fontSize: 11, color: textSecondary }}>{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart */}
          {barData.length > 0 && (
            <div className={`rounded-3xl p-5 mb-4 ${cardBg}`}>
              <p className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('summary.byTime')}</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} barSize={18}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: textSecondary }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: textSecondary }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    formatter={(v) => [`${v.toLocaleString('en-US')} ${t('common.currency')}`, '']}
                    contentStyle={{ background: isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category breakdown list */}
          <div className={`rounded-3xl p-5 mb-4 ${cardBg}`}>
            <p className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('summary.byCategory')}</p>
            {pieData.map((item) => {
              const pct = totalSpent > 0 ? ((item.value / totalSpent) * 100).toFixed(1) : 0;
              return (
                <div key={item.name} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{pct}%</span>
                      <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`} dir="ltr">
                        {item.value.toLocaleString('en-US')} {t('common.currency')}
                      </span>
                    </div>
                  </div>
                  <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="h-4" />
    </div>
  );
}
