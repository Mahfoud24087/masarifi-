import { Utensils, Car, ShoppingBag, Receipt, Heart, Film, BookOpen, MoreHorizontal, Briefcase, TrendingUp, Gift, Banknote } from 'lucide-react';

export const EXPENSE_CATEGORIES = [
  { id: 'food',          icon: Utensils,       color: '#10B981', bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  { id: 'transport',     icon: Car,            color: '#3B82F6', bg: 'bg-blue-100',    text: 'text-blue-600',    border: 'border-blue-200'    },
  { id: 'shopping',      icon: ShoppingBag,    color: '#8B5CF6', bg: 'bg-violet-100',  text: 'text-violet-600',  border: 'border-violet-200'  },
  { id: 'bills',         icon: Receipt,        color: '#F59E0B', bg: 'bg-amber-100',   text: 'text-amber-600',   border: 'border-amber-200'   },
  { id: 'health',        icon: Heart,          color: '#EF4444', bg: 'bg-red-100',     text: 'text-red-600',     border: 'border-red-200'     },
  { id: 'entertainment', icon: Film,           color: '#EC4899', bg: 'bg-pink-100',    text: 'text-pink-600',    border: 'border-pink-200'    },
  { id: 'education',     icon: BookOpen,       color: '#6366F1', bg: 'bg-indigo-100',  text: 'text-indigo-600',  border: 'border-indigo-200'  },
  { id: 'other',         icon: MoreHorizontal, color: '#6B7280', bg: 'bg-gray-100',    text: 'text-gray-600',    border: 'border-gray-200'    },
];

export const INCOME_CATEGORIES = [
  { id: 'salary',        icon: Banknote,    color: '#14B8A6', bg: 'bg-teal-100',    text: 'text-teal-600',    border: 'border-teal-200' },
  { id: 'freelance',     icon: Briefcase,   color: '#06B6D4', bg: 'bg-cyan-100',    text: 'text-cyan-600',    border: 'border-cyan-200'    },
  { id: 'investment',    icon: TrendingUp,  color: '#F97316', bg: 'bg-orange-100',  text: 'text-orange-600',  border: 'border-orange-200'  },
  { id: 'gift',          icon: Gift,        color: '#FB7185', bg: 'bg-rose-100',    text: 'text-rose-600',    border: 'border-rose-200'    },
{ id: 'other',         icon: MoreHorizontal, color: '#A78BFA', bg: 'bg-purple-100', text: 'text-purple-600',    border: 'border-purple-200'    },
];

export const CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES.filter(c => c.id !== 'other')];

export const getCategoryById = (id) =>
  CATEGORIES.find((c) => c.id === id) || {
    id: id || 'other',
    icon: MoreHorizontal,
    color: '#059669',
    bg: 'bg-emerald-100 dark:bg-emerald-950/50',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  };

export default EXPENSE_CATEGORIES;
