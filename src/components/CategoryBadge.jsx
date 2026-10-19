import React from 'react';
import { getCategoryById } from '../models/categories';

export default function CategoryBadge({ categoryId, size = 'md', customColor = null }) {
  const cat = getCategoryById(categoryId, customColor);
  const Icon = cat.icon;
  const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  const iconSize = { sm: 14, md: 18, lg: 22 };
  return (
    <div className={`${sizeClasses[size]} ${cat.bg} ${cat.text} rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-105`}>
      <Icon size={iconSize[size]} strokeWidth={2} />
    </div>
  );
}
