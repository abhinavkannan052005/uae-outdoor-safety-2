import { useState, useEffect, type FormEvent, type RefObject } from 'react';
import { MapPin, Clock, Send, ThumbsUp, Timer } from 'lucide-react';
import { EMIRATES } from '../data/emirates';
import type {
  CommunitySighting,
  EmirateId,
  Language,
  SightingCategory,
} from '../types/weather';
import { SIGHTING_CATEGORIES } from '../utils/safetyScore';
import { TRANSLATIONS } from '../utils/i18n';
import { StatusBadge } from './StatusBadge';
import { SightingsMap } from './SightingsMap';

interface CommunitySightingsBarProps {
  selectedEmirate: EmirateId;
  sightings: CommunitySighting[];
  isLoading: boolean;
  onSubmitSighting: (payload: {
    emirateId: EmirateId;
    category: SightingCategory;
    locationNote: string;
    description: string;
  }) => Promise<void>;
  onConfirmSighting: (id: string) => Promise<void>;
  confirmedIds: Set<string>;
  locationInputRef: RefObject<HTMLInputElement | null>;
  language: Language;
}

const CATEGORY_KEYS: SightingCategory[] = [
  'dust_haze',
  'flooded_paths',
  'high_heat',
  'stray_animals',
];

function formatSightingTime(
  isoCreated: string,
  isoExpires: string,
  nowMs: number,
  language: Language
): { timeLabel: string; relativeLabel: string; expiryLabel: string } {
  const t = TRANSLATIONS[language].sightings;
  const created = new Date(isoCreated);
  const expires = new Date(isoExpires);

  const timeLabel = Number.isNaN(created.getTime())
    ? ''
    : `${new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dubai',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(created)} ${TRANSLATIONS[language].workspace.gst}`;

  const diffMins = Math.max(0, Math.floor((nowMs - created.getTime()) / 60000));
  let relativeLabel = t.justNow;
  if (diffMins >= 1 && diffMins < 60) {
    relativeLabel = t.minutesAgo(diffMins);
  } else if (diffMins >= 60 && diffMins < 1440) {
    relativeLabel = t.hoursAgo(Math.floor(diffMins / 60));
  }

  const remainingMs = Math.max(0, expires.getTime() - nowMs);
  const remainingMins = Math.ceil(remainingMs / 60000);
  let expiryLabel = t.expiringSoon;
  if (remainingMins >= 60) {
    const hrs = Math.floor(remainingMins / 60);
    const mins = remainingMins % 60;
    expiryLabel = t.expiresInHours(hrs, mins);
  } else if (remainingMins > 0) {
    expiryLabel = t.expiresInMinutes(remainingMins);
  }

  return { timeLabel, relativeLabel, expiryLabel };
}

export function CommunitySightingsBar({
  selectedEmirate,
  sightings,
  isLoading,
  onSubmitSighting,
  onConfirmSighting,
  confirmedIds,
  locationInputRef,
  language,
}: CommunitySightingsBarProps) {
  const t = TRANSLATIONS[language];
  const [formEmirate, setFormEmirate] = useState<EmirateId>(selectedEmirate);
  const [category, setCategory] = useState<SightingCategory>('dust_haze');
  const [locationNote, setLocationNote] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [scopeFilter, setScopeFilter] = useState<'emirate' | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<SightingCategory | 'all'>('all');
  const [activeSightingId, setActiveSightingId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setFormEmirate(selectedEmirate);
  }, [selectedEmirate]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitSuccess(null);

    if (!locationNote.trim()) {
      setFormError(t.sightings.locationError);
      locationInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitSighting({
        emirateId: formEmirate,
        category,
        locationNote: locationNote.trim(),
        description: description.trim(),
      });
      setLocationNote('');
      setDescription('');
      setSubmitSuccess(t.sightings.submitSuccess);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.sightings.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (id: string) => {
    if (confirmedIds.has(id) || confirmingId === id) return;
    setConfirmingId(id);
    try {
      await onConfirmSighting(id);
    } finally {
      setConfirmingId(null);
    }
  };

  const filteredSightings = sightings.filter((item) => {
    if (new Date(item.expiresAt).getTime() <= nowMs) return false;
    if (scopeFilter === 'emirate' && item.emirateId !== selectedEmirate) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    return true;
  });

  return (
    <section
      id="community-sightings"
      aria-label={t.sightings.title}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      <div className="p-6 sm:px-8 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {t.sightings.title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {t.sightings.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label={t.sightings.filterLabel}
            className="inline-flex items-center p-1 bg-slate-100 rounded-lg"
          >
            <button
              type="button"
              onClick={() => {
                setScopeFilter('all');
                setActiveSightingId(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                scopeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.sightings.allEmirates} ({sightings.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setScopeFilter('emirate');
                setActiveSightingId(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                scopeFilter === 'emirate'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.sightings.selectedEmirate}
            </button>
          </div>
        </div>
      </div>

      {/* Report Submission Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-6 sm:px-8 bg-slate-50/70 border-b border-slate-200"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-600 me-1">
              {t.sightings.conditionLabel}
            </span>
            {CATEGORY_KEYS.map((key) => {
              const active = category === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.sightings.categories[key]}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-3">
              <label htmlFor="sighting-emirate" className="sr-only">
                {t.sightings.selectedEmirate}
              </label>
              <select
                id="sighting-emirate"
                value={formEmirate}
                onChange={(e) => setFormEmirate(e.target.value as EmirateId)}
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {EMIRATES.map((em) => (
                  <option key={em.id} value={em.id}>
                    {t.emirates[em.id].name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4">
              <label htmlFor="sighting-location" className="sr-only">
                {t.sightings.areaPlaceholder}
              </label>
              <input
                ref={locationInputRef}
                id="sighting-location"
                type="text"
                maxLength={80}
                value={locationNote}
                onChange={(e) => setLocationNote(e.target.value)}
                placeholder={t.sightings.areaPlaceholder}
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="md:col-span-3">
              <label htmlFor="sighting-note" className="sr-only">
                {t.sightings.detailPlaceholder}
              </label>
              <input
                id="sighting-note"
                type="text"
                maxLength={220}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.sightings.detailPlaceholder}
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 inline-flex items-center justify-center gap-2 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isSubmitting ? t.sightings.posting : t.sightings.postReport}</span>
              </button>
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-red-700">
              {formError}
            </p>
          )}
          {submitSuccess && (
            <p role="status" className="text-xs font-medium text-emerald-700">
              {submitSuccess}
            </p>
          )}
        </div>
      </form>

      {/* Category Filter Row */}
      <div className="px-6 sm:px-8 py-3 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 me-1">{t.sightings.filterLabel}</span>
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
            categoryFilter === 'all'
              ? 'bg-slate-200 text-slate-900'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.sightings.allCategories}
        </button>
        {CATEGORY_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategoryFilter(key)}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              categoryFilter === key
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.sightings.categories[key]}
          </button>
        ))}
      </div>

      {/* Side-by-side Feed + Interactive UAE Leaflet Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-e border-slate-200">
          {isLoading && sightings.length === 0 ? (
            <div className="p-6 sm:px-8 space-y-3 animate-pulse">
              <div className="h-14 bg-slate-100 rounded-lg" />
              <div className="h-14 bg-slate-100 rounded-lg" />
              <div className="h-14 bg-slate-100 rounded-lg" />
            </div>
          ) : filteredSightings.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-800">
                {t.sightings.emptyTitle}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {t.sightings.emptyHint}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 max-h-[560px] overflow-y-auto">
              {filteredSightings.map((item) => {
                const catMeta = SIGHTING_CATEGORIES[item.category];
                const { timeLabel, relativeLabel, expiryLabel } = formatSightingTime(
                  item.createdAt,
                  item.expiresAt,
                  nowMs,
                  language
                );
                const isSelected = activeSightingId === item.id;
                const isConfirmed = confirmedIds.has(item.id);
                const localizedEmirate = t.emirates[item.emirateId]?.name ?? item.emirateName;

                return (
                  <li
                    key={item.id}
                    className={`px-6 sm:px-7 py-4 transition-colors ${
                      isSelected ? 'bg-slate-100/80' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveSightingId(item.id)}
                          className="text-start min-w-0 flex-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 rounded"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                              compact
                              tier={catMeta.severity}
                              label={t.sightings.categories[item.category]}
                            />
                            <span className="text-sm font-semibold text-slate-900">
                              {localizedEmirate}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-800">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                              <span>{item.locationNote}</span>
                            </span>
                          </div>
                          {item.description && (
                            <p className="mt-1.5 text-sm text-slate-600">
                              {item.description}
                            </p>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirm(item.id)}
                          disabled={isConfirmed || confirmingId === item.id}
                          aria-pressed={isConfirmed}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            {isConfirmed ? t.sightings.confirmed : t.sightings.confirmStillThere}
                          </span>
                          <span className="font-mono tabular-nums font-semibold ms-0.5">
                            {item.confirmations}
                          </span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono tabular-nums text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          <span>{relativeLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span>{timeLabel}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Timer className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          <span>{expiryLabel}</span>
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="lg:col-span-5">
          <SightingsMap
            sightings={filteredSightings}
            selectedEmirate={selectedEmirate}
            scopeFilter={scopeFilter}
            activeSightingId={activeSightingId}
            onSelectSighting={setActiveSightingId}
            language={language}
          />
        </div>
      </div>
    </section>
  );
}
