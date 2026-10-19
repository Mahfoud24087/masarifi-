import { 
  Utensils, Car, ShoppingBag, Receipt, Heart, Film, BookOpen, 
  MoreHorizontal, Briefcase, TrendingUp, Gift, Banknote, Tag 
} from 'lucide-react';

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

// Palette of distinct, vibrant colors for custom categories (Sport, Barber, Gym, Coffee, Tech, etc.)
export const CUSTOM_COLOR_PALETTE = [
  { id: 'fuchsia', color: '#D946EF', bg: 'bg-fuchsia-100 dark:bg-fuchsia-950/60', text: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'border-fuchsia-300' },
  { id: 'cyan',    color: '#06B6D4', bg: 'bg-cyan-100 dark:bg-cyan-950/60',       text: 'text-cyan-600 dark:text-cyan-400',       border: 'border-cyan-300' },
  { id: 'indigo',  color: '#4F46E5', bg: 'bg-indigo-100 dark:bg-indigo-950/60',   text: 'text-indigo-600 dark:text-indigo-400',   border: 'border-indigo-300' },
  { id: 'rose',    color: '#E11D48', bg: 'bg-rose-100 dark:bg-rose-950/60',       text: 'text-rose-600 dark:text-rose-400',       border: 'border-rose-300' },
  { id: 'amber',   color: '#D97706', bg: 'bg-amber-100 dark:bg-amber-950/60',     text: 'text-amber-600 dark:text-amber-400',     border: 'border-amber-300' },
  { id: 'purple',  color: '#9333EA', bg: 'bg-purple-100 dark:bg-purple-950/60',   text: 'text-purple-600 dark:text-purple-400',   border: 'border-purple-300' },
  { id: 'orange',  color: '#EA580C', bg: 'bg-orange-100 dark:bg-orange-950/60',   text: 'text-orange-600 dark:text-orange-400',   border: 'border-orange-300' },
  { id: 'teal',    color: '#0D9488', bg: 'bg-teal-100 dark:bg-teal-950/60',       text: 'text-teal-600 dark:text-teal-400',       border: 'border-teal-300' },
  { id: 'sky',     color: '#0284C7', bg: 'bg-sky-100 dark:bg-sky-950/60',         text: 'text-sky-600 dark:text-sky-400',         border: 'border-sky-300' },
  { id: 'lime',    color: '#65A30D', bg: 'bg-lime-100 dark:bg-lime-950/60',       text: 'text-lime-600 dark:text-lime-400',       border: 'border-lime-300' },
];

export const hashStringToColor = (str) => {
  if (!str) return CUSTOM_COLOR_PALETTE[0];
  let hash = 0;
  const s = String(str).toLowerCase().trim();
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CUSTOM_COLOR_PALETTE.length;
  return CUSTOM_COLOR_PALETTE[index];
};

export const getCategoryById = (id, customColor = null) => {
  // If it matches a predefined category and has no custom color override
  const existing = CATEGORIES.find((c) => c.id === id);
  if (existing && !customColor) return existing;

  // For custom categories (e.g. 'Sport', 'Barber', etc.):
  let styleInfo;
  if (customColor) {
    styleInfo = CUSTOM_COLOR_PALETTE.find((p) => p.color === customColor) || {
      color: customColor,
      bg: 'bg-indigo-100 dark:bg-indigo-950/50',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-300',
    };
  } else {
    styleInfo = hashStringToColor(id);
  }

  return {
    id: id || 'other',
    icon: existing ? existing.icon : Tag,
    color: styleInfo.color,
    bg: styleInfo.bg,
    text: styleInfo.text,
    border: styleInfo.border,
  };
};

export default EXPENSE_CATEGORIES;
