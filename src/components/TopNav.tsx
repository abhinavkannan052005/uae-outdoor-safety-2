import type { Language } from '../types/weather';
import { TRANSLATIONS } from '../utils/i18n';

interface TopNavProps {
  language: Language;
  onToggleLanguage: () => void;
  onReportClick: () => void;
  simulateDustSpike: boolean;
  onToggleDustSpike: () => void;
}

export function TopNav({
  language,
  onToggleLanguage,
  onReportClick,
  simulateDustSpike,
  onToggleDustSpike,
}: TopNavProps) {
  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-6">
        <a
          href="#overview"
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          {t.brandTitle}
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#overview"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            {t.nav.overview}
          </a>
          <a
            href="#walking-windows"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            {t.nav.walkingWindows}
          </a>
          <a
            href="#hourly-outlook"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            {t.nav.hourlyOutlook}
          </a>
          <a
            href="#community-sightings"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            {t.nav.communitySightings}
          </a>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleLanguage}
            aria-label={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <span className={language === 'en' ? 'text-slate-900' : 'text-slate-400'}>EN</span>
            <span aria-hidden="true" className="mx-1 text-slate-300">/</span>
            <span className={language === 'ar' ? 'text-slate-900' : 'text-slate-400'}>عربي</span>
          </button>

          <button
            type="button"
            aria-pressed={simulateDustSpike}
            onClick={onToggleDustSpike}
            className={`hidden sm:inline-flex px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
              simulateDustSpike
                ? 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {simulateDustSpike ? t.topActions.dustActive : t.topActions.simulateDust}
          </button>

          <button
            type="button"
            onClick={onReportClick}
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.topActions.reportSighting}
          </button>
        </div>
      </div>
    </header>
  );
}
