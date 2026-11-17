import { useState, useEffect } from 'react';
import { MapPin, Share2, Sun, Umbrella, Waves } from 'lucide-react';
import { RECOMMENDED_WALKING_SPOTS } from '../data/emirates';
import type {
  ActivityProfile,
  EmirateId,
  HourlyMetric,
  Language,
  SafetyTier,
  ShadeLevel,
  WalkingWindow,
} from '../types/weather';
import {
  buildWhatsAppShareUrl,
  evaluateOutdoorSafety,
  findOptimalWalkingWindows,
  formatEndHourLabel,
  formatHourLabel,
  getDayTag,
} from '../utils/safetyScore';
import { TRANSLATIONS, translateEvaluationCopy } from '../utils/i18n';
import { StatusBadge } from './StatusBadge';

interface WalkingWindowsPanelProps {
  hourly: HourlyMetric[];
  referenceTime: string;
  selectedEmirate: EmirateId;
  locationName: string;
  currentTemperatureC: number;
  currentUvIndex: number;
  activityProfile: ActivityProfile;
  language: Language;
}

const BAR_COLORS: Record<SafetyTier, string> = {
  optimal: 'bg-emerald-600 hover:bg-emerald-700',
  moderate: 'bg-amber-500 hover:bg-amber-600',
  poor: 'bg-red-600 hover:bg-red-700',
};

const BAR_SELECTED_RING: Record<SafetyTier, string> = {
  optimal: 'ring-2 ring-offset-2 ring-emerald-700',
  moderate: 'ring-2 ring-offset-2 ring-amber-700',
  poor: 'ring-2 ring-offset-2 ring-red-700',
};

function getShadeTagStyle(shadeLevel: ShadeLevel, isShadedPriority: boolean): string {
  if (shadeLevel === 'high_shade') {
    return isShadedPriority
      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
      : 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  if (shadeLevel === 'waterfront_breeze') {
    return 'bg-sky-50 text-sky-800 border-sky-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export function WalkingWindowsPanel({
  hourly,
  referenceTime,
  selectedEmirate,
  locationName,
  currentTemperatureC,
  currentUvIndex,
  activityProfile,
  language,
}: WalkingWindowsPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    setSelectedIndex(0);
  }, [hourly]);

  if (!hourly.length) return null;

  const evaluated = hourly.map((item) => ({
    metric: item,
    evalResult: evaluateOutdoorSafety(item, activityProfile),
  }));

  const windows: WalkingWindow[] = findOptimalWalkingWindows(hourly, activityProfile);
  const topWindows = windows.slice(0, 3);
  const optimalHoursCount = evaluated.filter((e) => e.evalResult.score >= 75).length;

  const safeIndex = Math.min(selectedIndex, evaluated.length - 1);
  const activeHour = evaluated[safeIndex];
  const profileLabel = t.profiles[activityProfile].label;

  const preferShade = currentTemperatureC > 30 || currentUvIndex >= 6;
  const localSpots = RECOMMENDED_WALKING_SPOTS[selectedEmirate] ?? [];
  const emirateDisplayName = t.emirates[selectedEmirate]?.name ?? locationName;

  const localizeDay = (isoTime: string) =>
    getDayTag(isoTime, referenceTime) === 'Today' ? t.walking.today : t.walking.tomorrow;

  const activeLocalizedEval =
    language === 'ar'
      ? translateEvaluationCopy(
          language,
          activityProfile,
          activeHour.evalResult.tier,
          activeHour.metric.temperatureC,
          activeHour.metric.uvIndex
        )
      : { statusLabel: activeHour.evalResult.statusLabel };

  return (
    <section
      id="walking-windows"
      aria-label={t.walking.title}
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {t.walking.title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {t.walking.subtitlePrefix} ({profileLabel}) ·{' '}
            <span className="font-mono tabular-nums font-medium text-slate-900" dir="ltr">
              {optimalHoursCount} / {hourly.length}
            </span>{' '}
            {t.walking.subtitleOptimalSuffix}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" aria-hidden="true" />
            <span>{t.walking.legendOptimal}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" aria-hidden="true" />
            <span>{t.walking.legendModerate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-red-600 inline-block" aria-hidden="true" />
            <span>{t.walking.legendPoor}</span>
          </div>
        </div>
      </div>

      {/* Recommended Walking Windows Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 border-b border-slate-200">
        {topWindows.map((win, idx) => {
          const dayTag = localizeDay(win.startTime);
          const startLabel = formatHourLabel(win.startTime);
          const endLabel = formatEndHourLabel(win.endTime);

          const topWindowShareUrl =
            idx === 0
              ? buildWhatsAppShareUrl(
                  language === 'ar'
                    ? `سلامة الهواء بالإمارات — أفضل فترة للمشي في ${locationName} (${profileLabel}): ${startLabel}–${endLabel} ${dayTag} (المؤشر ${win.avgScore}/100، الحرارة ${win.minTempC}–${win.maxTempC}°م، متوسط AQI ${win.avgUsAqi}).`
                    : `UAE Outdoor Safety — Top Window for ${locationName} (${profileLabel}): ${startLabel}–${endLabel} ${dayTag} (Score ${win.avgScore}/100, ${win.minTempC}–${win.maxTempC}°C, Avg US AQI ${win.avgUsAqi}).`
                )
              : null;

          return (
            <div
              key={`${win.startTime}-${idx}`}
              className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">
                  {idx === 0 ? t.walking.topWindow : `${t.walking.windowLabel} ${idx + 1}`} · {dayTag}
                </span>
                <StatusBadge
                  compact
                  tier={win.tier}
                  label={
                    win.tier === 'optimal'
                      ? `${t.walking.optimalBadge} · ${win.avgScore}`
                      : `${t.walking.bestAvailableBadge} · ${win.avgScore}`
                  }
                />
              </div>

              <div className="text-lg font-bold font-mono tabular-nums text-slate-900" dir="ltr">
                {startLabel} – {endLabel}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-600 font-mono tabular-nums">
                  {win.hoursCount} {win.hoursCount > 1 ? t.walking.hrs : t.walking.hr} ·{' '}
                  <span dir="ltr">{win.minTempC}–{win.maxTempC}°C</span> · {t.walking.avgAqi}{' '}
                  <span dir="ltr">{win.avgUsAqi}</span>
                </div>

                {topWindowShareUrl && (
                  <a
                    href={topWindowShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-900 bg-white border border-emerald-300 rounded-md hover:bg-emerald-50 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Share2 className="w-3 h-3 text-emerald-700" aria-hidden="true" />
                    <span>{t.hero.shareWhatsApp}</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compact Suggested Local Walking Spots Row */}
      {localSpots.length > 0 && (
        <div className="py-5 border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-700">
              {t.walking.suggestedSpotsTitle} · {emirateDisplayName}
            </span>
            {preferShade && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                <Umbrella className="w-3 h-3 text-amber-700" aria-hidden="true" />
                <span>{t.walking.shadedPriorityNote}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {localSpots.map((spot) => {
              const isHighlighted = preferShade && spot.shadeLevel === 'high_shade';
              const spotName = language === 'ar' ? spot.nameAr : spot.nameEn;
              const spotArea = language === 'ar' ? spot.areaAr : spot.areaEn;
              const ShadeIcon =
                spot.shadeLevel === 'high_shade'
                  ? Umbrella
                  : spot.shadeLevel === 'waterfront_breeze'
                    ? Waves
                    : Sun;

              return (
                <div
                  key={spot.id}
                  className={`px-3.5 py-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                    isHighlighted
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs sm:text-[13px] font-semibold text-slate-900 truncate">
                      {spotName}
                    </div>
                    <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                      <span className="truncate">{spotArea}</span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border whitespace-nowrap shrink-0 ${getShadeTagStyle(
                      spot.shadeLevel,
                      preferShade
                    )}`}
                  >
                    <ShadeIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>{t.walking.shadeLabels[spot.shadeLevel]}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive 24-Hour Score Bar Timeline */}
      <div className="pt-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-medium text-slate-500">
            {t.walking.timelinePrompt}
          </span>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {t.walking.localTimeGst}
          </span>
        </div>

        <div
          role="listbox"
          aria-label={t.walking.title}
          dir="ltr"
          className="grid grid-cols-12 sm:grid-cols-[repeat(24,minmax(0,1fr))] gap-1.5 sm:gap-2 items-end h-40 pt-4 pb-2"
        >
          {evaluated.map((item, idx) => {
            const isSelected = idx === safeIndex;
            const heightPct = Math.max(14, item.evalResult.score);
            const hourShort = formatHourLabel(item.metric.time).slice(0, 2);
            return (
              <button
                key={item.metric.time}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-label={`${formatHourLabel(item.metric.time)} ${item.evalResult.score}/100`}
                onClick={() => setSelectedIndex(idx)}
                className="group flex flex-col items-center justify-end h-full cursor-pointer focus-visible:outline-none"
              >
                <span className="text-[10px] font-mono tabular-nums text-slate-500 mb-1 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                  {item.evalResult.score}
                </span>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-sm transition-colors ${
                      BAR_COLORS[item.evalResult.tier]
                    } ${isSelected ? BAR_SELECTED_RING[item.evalResult.tier] : ''}`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span
                  className={`mt-1.5 text-[11px] font-mono tabular-nums ${
                    isSelected ? 'font-bold text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {idx % 3 === 0 || isSelected ? hourShort : ''}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Hour Detail Strip */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
              {localizeDay(activeHour.metric.time)} ·{' '}
              <span dir="ltr">
                {formatHourLabel(activeHour.metric.time)} – {formatEndHourLabel(activeHour.metric.time)}
              </span>
            </span>
            <StatusBadge
              compact
              tier={activeHour.evalResult.tier}
              label={`${t.walking.scoreLabel} ${activeHour.evalResult.score}/100 · ${activeLocalizedEval.statusLabel}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-mono tabular-nums text-slate-700">
            <span>
              {t.hero.temperature}: <span dir="ltr">{activeHour.metric.temperatureC.toFixed(1)}°C</span>
            </span>
            <span>
              {t.table.colHumidity}: <span dir="ltr">{Math.round(activeHour.metric.humidityPct)}%</span>
            </span>
            <span>
              UV <span dir="ltr">{activeHour.metric.uvIndex.toFixed(1)}</span>
            </span>
            <span>
              US AQI <span dir="ltr">{Math.round(activeHour.metric.usAqi)}</span>
            </span>
            <span>
              {t.hero.dustLabel}: <span dir="ltr">{Math.round(activeHour.metric.dustUgM3)} µg/m³</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
