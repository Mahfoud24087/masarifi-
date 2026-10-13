import React from 'react';
import { useMasarifi } from '../context/MasarifiContext';

export default function EmptyState({ icon, title, description }) {
  const { isDark } = useMasarifi();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
        <span className="text-4xl">{icon}</span>
      </div>
      <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{title}</p>
      <p className={`text-sm max-w-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
    </div>
  );
}
