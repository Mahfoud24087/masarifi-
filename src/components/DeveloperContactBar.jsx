import React from 'react';
import { Mail } from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';

export default function DeveloperContactBar({ className = '', title = null }) {
  const { lang, isDark } = useMasarifi();

  const defaultTitle = lang === 'ar' 
    ? 'تواصل مباشر مع المطوّر' 
    : lang === 'fr' 
    ? 'Contact direct avec le développeur' 
    : 'Direct Contact with Developer';

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
      <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
        {title || defaultTitle}
      </span>
      <div className="flex items-center justify-center gap-3">
        {/* WhatsApp Logo Button */}
        <a
          href="https://wa.me/22237845024"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm group"
          id="masarifi-contact-whatsapp"
          title="WhatsApp"
          aria-label="WhatsApp"
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </div>
        </a>

        {/* Gmail Logo Button */}
        <a
          href="mailto:khayrilemin@gmail.com?subject=Masarifi%20Contact"
          className="w-10 h-10 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm group"
          id="masarifi-contact-gmail"
          title="Gmail"
          aria-label="Gmail"
        >
          <div className="w-7 h-7 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Mail size={16} strokeWidth={2.2} />
          </div>
        </a>
      </div>
    </div>
  );
}
