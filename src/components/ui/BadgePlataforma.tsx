import React from 'react';
import { SlugPlataforma } from '../../types';

interface BadgePlataformaProps {
  slug?: SlugPlataforma | string;
  nome?: string;
}

export const BadgePlataforma: React.FC<BadgePlataformaProps> = ({ slug, nome }) => {
  const s = (slug || '').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = nome || slug || 'Geral';

  if (s.includes('shopee')) {
    styles = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/40';
    label = 'Shopee';
  } else if (s.includes('mercado') || s === 'ml') {
    styles = 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800/40';
    label = 'Mercado Livre';
  } else if (s.includes('magalu')) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40';
    label = 'Magalu';
  } else if (s.includes('ali')) {
    styles = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40';
    label = 'AliExpress';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${styles}`}
    >
      {label}
    </span>
  );
};
