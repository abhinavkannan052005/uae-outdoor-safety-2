import { AlertTriangle, Share2, Sparkles } from 'lucide-react';
import type {
  ActivityProfile,
  BriefingResponse,
  ConditionsResponse,
  Language,
  SafetyEvaluation,
  SafetyTier,
} from '../types/weather';
import {
  buildWhatsAppShareUrl,
  formatHourLabel,
} from '../utils/safetyScore';
import {
  TRANSLATIONS,
  translateAqiLabel,
  translateEvaluationCopy,
  translateUvLabel,
} from '../utils/i18n';
import { StatusBadge } from './StatusBadge';

interface HeroSafetyOverviewProps {
  conditions: ConditionsResponse | null;
  evaluation: SafetyEvaluation | null;
  activityProfile: ActivityProfile;
  language: Language;
  briefing: BriefingResponse | null;
  briefingLoading: boolean;
  simulateDustSpike: boolean;
  onDismissDustSpike: () => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const SCORE_BAR_COLOR: Record<SafetyTier, string> = {
  optimal: 'bg-emerald-600',
  moderate: 'bg-amber-500',
  poor: 'bg-red-600',
};

const SCORE_TEXT_COLOR: Record<SafetyTier, string> = {
  optimal: 'text-emerald-700',
  moderate: 'text-amber-700',
  poor: 'text-red-700',
};

export function HeroSafetyOverview({
  conditions,
  evaluation,
  activityProfile,
  language,
  briefing,
  briefingLoading,
  simulateDustSpike,
  onDismissDustSpike,
  isLoading,
  error,
  onRetry,
}: HeroSafetyOverviewProps) {
  const t = TRANSLATIONS[language];

  if (error && !conditions) {
    return (
      <section
        id="overview"
        className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {t.hero.loadErrorTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.hero.tryAgain}
          </button>
        </div>
      </section>
    );
  }

  if (isLoading && !conditions) {
    return (
      <section
        id="overview"
        aria-busy="true"
        className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 animate-pulse"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-14 w-36 bg-slate-200 rounded" />
            <div className="h-3 w-full bg-slate-200 rounded" />
            <div className="h-10 w-5/6 bg-slate-100 rounded" />
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 gap-6">
            <div className="h-24 bg-slate-100 rounded-lg" />
            <div className="h-24 bg-slate-100 rounded-lg" />
            <div className="h-24 bg-slate-100 rounded-lg" />
            <div className="h-24 bg-slate-100 rounded-lg" />
          </div>
        </div>
      </section>
    );
  }

  if (!conditions || !evaluation) return null;

  const emirateMeta = t.emirates[conditions.emirateId];
  const { current } = conditions;
  const aqiLevel = translateAqiLabel(current.usAqi, language);
  const uvLevel = translateUvLabel(current.uvIndex, language);
  const showLiveHazardBanner =
    simulateDustSpike || current.usAqi >= 150 || current.dustUgM3 >= 150;

  const topLimiterFactor = [...evaluation.factors].sort((a, b) => b.penalty - a.penalty)[0];
  const primaryLimiterKey = topLimiterFactor?.penalty >= 6 ? topLimiterFactor.key : undefined;

  const localizedEval =
    language === 'ar'
      ? translateEvaluationCopy(
          language,
          activityProfile,
          evaluation.tier,
          current.temperatureC,
          current.uvIndex,
          primaryLimiterKey
        )
      : {
          statusLabel: evaluation.statusLabel,
          guidance: evaluation.guidance,
          pavementWarning: evaluation.pavementWarning,
          shadeBreakWarning: evaluation.shadeBreakWarning,
          primaryLimiterLabel: evaluation.primaryLimiter ?? undefined,
        };

  const locationLabel = conditions.isCustomLocation
    ? `${t.hero.yourGpsLocation} (${emirateMeta.name})`
    : emirateMeta.name;

  const profileLabel = t.profiles[activityProfile].label;

  const hazardShareUrl = buildWhatsAppShareUrl(
    language === 'ar'
      ? `تنبيه سلامة الهواء بالإمارات (${locationLabel}): تركيز الغبار ${Math.round(
          current.dustUgM3
        )} µg/m³ ومؤشر جودة الهواء US AQI ${Math.round(current.usAqi)} (التقييم ${
          evaluation.score
        }/100 لنشاط ${profileLabel}). يُنصح بتجنب المشي الخارجي حتى تحسن الأجواء.`
      : `UAE Outdoor Safety Hazard Alert (${locationLabel}): Airborne dust at ${Math.round(
          current.dustUgM3
        )} µg/m³ and US AQI ${Math.round(current.usAqi)} (Score ${
          evaluation.score
        }/100 for ${profileLabel}). Avoid strenuous outdoor walks until air clears.`
  );

  const humidityTier: SafetyTier =
    current.humidityPct >= 75 ? 'poor' : current.humidityPct >= 60 ? 'moderate' : 'optimal';

  return (
    <section
      id="overview"
      aria-label={t.hero.title}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {showLiveHazardBanner && (
        <div
          role="alert"
          className="px-6 sm:px-8 py-3.5 bg-red-50 border-b border-red-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
            <div className="text-sm text-red-900">
              <span className="font-semibold">
                {simulateDustSpike
                  ? t.hero.simulatedHazardTitle
                  : t.hero.activeHazardTitle}
              </span>
              <span className="mx-1.5 text-red-400" aria-hidden="true">·</span>
              <span>
                {t.hero.hazardPrefix}{' '}
                <span className="font-mono tabular-nums font-semibold" dir="ltr">
                  {Math.round(current.dustUgM3)} µg/m³
                </span>{' '}
                {t.hero.hazardMiddle}{' '}
                <span className="font-mono tabular-nums font-semibold" dir="ltr">
                  {Math.round(current.usAqi)}
                </span>
                . {t.hero.hazardSuffix}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <a
              href={hazardShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-900 bg-white border border-emerald-300 rounded-md hover:bg-emerald-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>{t.hero.shareWhatsApp}</span>
            </a>

            {simulateDustSpike && (
              <button
                type="button"
                onClick={onDismissDustSpike}
                className="px-3 py-1.5 text-xs font-medium text-red-800 bg-white border border-red-200 rounded-md hover:bg-red-100 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.hero.exitDemo}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Primary Focal Anchor: 0-100 Best Time to Go Outside Score */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-e border-slate-200">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-medium text-slate-500">
                {conditions.isCustomLocation && conditions.coordinates ? (
                  <>
                    <span>{t.hero.yourGpsLocation}</span>
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    <span className="font-mono tabular-nums" dir="ltr">
                      {conditions.coordinates.latitude.toFixed(3)}°,{' '}
                      {conditions.coordinates.longitude.toFixed(3)}°
                    </span>
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    <span>
                      {t.hero.nearestPrefix}: {emirateMeta.name}
                    </span>
                  </>
                ) : (
                  <>
                    <span>{emirateMeta.name}</span>
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    <span>{emirateMeta.coastalNote}</span>
                  </>
                )}
              </div>
              <StatusBadge tier={evaluation.tier} label={localizedEval.statusLabel} />
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              {t.hero.title}
            </h1>

            <div className="mt-5 flex items-baseline gap-3" dir="ltr">
              <span
                className={`text-5xl sm:text-6xl font-bold font-mono tabular-nums tracking-tight ${SCORE_TEXT_COLOR[evaluation.tier]}`}
              >
                {evaluation.score}
              </span>
              <span className="text-lg font-mono tabular-nums text-slate-400">
                / 100
              </span>
            </div>

            <div
              className="mt-4 h-2.5 w-full bg-slate-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={evaluation.score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t.hero.title}
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${SCORE_BAR_COLOR[evaluation.tier]}`}
                style={{ width: `${evaluation.score}%` }}
              />
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {localizedEval.guidance}
            </p>

            {/* Live Resident Briefing */}
            <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                  <span>{t.hero.briefingTitle}</span>
                </span>
                {briefing && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                    {briefing.source === 'gemini'
                      ? t.hero.briefingSourceGemini
                      : t.hero.briefingSourceLive}
                  </span>
                )}
              </div>
              {briefingLoading && !briefing ? (
                <div className="space-y-1.5 animate-pulse" aria-label={t.hero.briefingLoading}>
                  <div className="h-3 bg-slate-200 rounded w-full" />
                  <div className="h-3 bg-slate-200 rounded w-4/5" />
                </div>
              ) : (
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700">
                  {briefing?.briefing || t.hero.briefingLoading}
                </p>
              )}
            </div>

            {localizedEval.pavementWarning && (
              <div
                role="note"
                className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs leading-relaxed text-amber-950"
              >
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{localizedEval.pavementWarning}</span>
              </div>
            )}

            {localizedEval.shadeBreakWarning && (
              <div
                role="note"
                className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs leading-relaxed text-amber-950"
              >
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{localizedEval.shadeBreakWarning}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              {t.hero.profilePrefix}: {profileLabel}
            </span>
            <span>
              {localizedEval.primaryLimiterLabel
                ? `${t.hero.primaryFactorPrefix}: ${localizedEval.primaryLimiterLabel}`
                : t.hero.allComfort}
            </span>
          </div>
        </div>

        {/* Live Hourly / Current Readings Grid */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-b border-slate-200">
            {/* Temperature */}
            <div className="p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">
                  {t.hero.temperature}
                </span>
                <StatusBadge
                  compact
                  tier={evaluation.factors[0].tier}
                  label={t.hero.tempStatus[evaluation.factors[0].tier]}
                />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono tabular-nums text-slate-900" dir="ltr">
                  {current.temperatureC.toFixed(1)}°C
                </span>
                <span className="text-sm text-slate-500 font-mono tabular-nums">
                  {t.hero.feels} <span dir="ltr">{Math.round(current.apparentTemperatureC)}°C</span>
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 font-mono tabular-nums">
                {t.hero.wind} <span dir="ltr">{Math.round(current.windSpeedKmh)} km/h</span> · {t.hero.reading}{' '}
                <span dir="ltr">{formatHourLabel(current.time)}</span>
              </p>
            </div>

            {/* Humidity */}
            <div className="p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">
                  {t.hero.humidity}
                </span>
                <StatusBadge
                  compact
                  tier={humidityTier}
                  label={t.hero.humidityStatus[humidityTier]}
                />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono tabular-nums text-slate-900" dir="ltr">
                  {Math.round(current.humidityPct)}%
                </span>
                <span className="text-sm text-slate-500">RH</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {current.humidityPct >= 65
                  ? t.hero.humidityHighNote
                  : t.hero.humidityBalancedNote}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {/* UV Index */}
            <div className="p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">
                  {t.hero.uvIndex}
                </span>
                <StatusBadge
                  compact
                  tier={evaluation.factors[1].tier}
                  label={uvLevel}
                />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono tabular-nums text-slate-900" dir="ltr">
                  {current.uvIndex.toFixed(1)}
                </span>
                <span className="text-sm text-slate-500">UV</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {current.uvIndex >= 6
                  ? t.hero.uvHighNote
                  : current.uvIndex >= 3
                    ? t.hero.uvModerateNote
                    : t.hero.uvLowNote}
              </p>
            </div>

            {/* US AQI + Dust */}
            <div className="p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">
                  {t.hero.aqiAndDust}
                </span>
                <StatusBadge
                  compact
                  tier={
                    evaluation.factors[2].tier === 'poor' ||
                    evaluation.factors[3].tier === 'poor'
                      ? 'poor'
                      : evaluation.factors[2].tier === 'moderate' ||
                          evaluation.factors[3].tier === 'moderate'
                        ? 'moderate'
                        : 'optimal'
                  }
                  label={aqiLevel}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
                <span className="text-3xl font-bold font-mono tabular-nums text-slate-900" dir="ltr">
                  {Math.round(current.usAqi)}
                </span>
                <span className="text-sm text-slate-500">US AQI</span>
                <span className="text-sm font-mono tabular-nums text-slate-700">
                  · {t.hero.dustLabel}{' '}
                  <span dir="ltr">{Math.round(current.dustUgM3)} µg/m³</span>
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 font-mono tabular-nums" dir="ltr">
                PM2.5 {current.pm25UgM3.toFixed(1)} µg/m³ · PM10 {current.pm10UgM3.toFixed(1)} µg/m³
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
