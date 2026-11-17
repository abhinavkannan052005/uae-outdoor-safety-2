import { useState } from 'react';
import type { ActivityProfile, HourlyMetric, Language } from '../types/weather';
import {
  evaluateOutdoorSafety,
  formatHourLabel,
  getDayTag,
} from '../utils/safetyScore';
import { TRANSLATIONS } from '../utils/i18n';
import { StatusBadge } from './StatusBadge';

interface HourlyForecastTableProps {
  hourly: HourlyMetric[];
  referenceTime: string;
  activityProfile: ActivityProfile;
  language: Language;
}

export function HourlyForecastTable({
  hourly,
  referenceTime,
  activityProfile,
  language,
}: HourlyForecastTableProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'optimal'>('all');
  const t = TRANSLATIONS[language];

  if (!hourly.length) return null;

  const rows = hourly.map((item) => ({
    metric: item,
    evalResult: evaluateOutdoorSafety(item, activityProfile),
  }));

  const visibleRows =
    filterMode === 'optimal'
      ? rows.filter((r) => r.evalResult.score >= 75)
      : rows;

  return (
    <section
      id="hourly-outlook"
      aria-label={t.table.title}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      <div className="p-6 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {t.table.title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {t.table.subtitle}
          </p>
        </div>

        <div
          role="group"
          aria-label={t.table.title}
          className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start sm:self-auto"
        >
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.table.allHours} ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('optimal')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterMode === 'optimal'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.table.optimalOnly} ({rows.filter((r) => r.evalResult.score >= 75).length})
          </button>
        </div>
      </div>

      {visibleRows.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-slate-700 font-medium">
            {t.table.emptyTitle} ({t.profiles[activityProfile].label})
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {t.table.emptyHint}
          </p>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className="mt-4 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            {t.table.showAll}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-3 ps-6 pe-4 text-start whitespace-nowrap">{t.table.colTime}</th>
                <th className="py-3 px-4 text-start whitespace-nowrap">{t.table.colScore}</th>
                <th className="py-3 px-4 text-start whitespace-nowrap">{t.table.colCondition}</th>
                <th className="py-3 px-4 text-end whitespace-nowrap">{t.table.colTempFeels}</th>
                <th className="py-3 px-4 text-end whitespace-nowrap">{t.table.colHumidity}</th>
                <th className="py-3 px-4 text-end whitespace-nowrap">{t.table.colUv}</th>
                <th className="py-3 px-4 text-end whitespace-nowrap">{t.table.colAqi}</th>
                <th className="py-3 ps-4 pe-6 text-end whitespace-nowrap">{t.table.colDust}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {visibleRows.map(({ metric, evalResult }) => {
                const isOptimal = evalResult.tier === 'optimal';
                const dayTag =
                  getDayTag(metric.time, referenceTime) === 'Today'
                    ? t.walking.today
                    : t.walking.tomorrow;
                return (
                  <tr
                    key={metric.time}
                    className={`transition-colors ${
                      isOptimal
                        ? 'bg-emerald-50/35 hover:bg-emerald-50/60'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 ps-6 pe-4 whitespace-nowrap">
                      <span className="font-mono tabular-nums font-medium text-slate-900" dir="ltr">
                        {formatHourLabel(metric.time)}
                      </span>
                      <span className="ms-2 text-xs text-slate-500">{dayTag}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums font-semibold text-slate-900" dir="ltr">
                      {evalResult.score} / 100
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge
                        compact
                        tier={evalResult.tier}
                        label={t.table.tierShort[evalResult.tier]}
                      />
                    </td>
                    <td className="py-3 px-4 text-end whitespace-nowrap font-mono tabular-nums text-slate-800" dir="ltr">
                      {metric.temperatureC.toFixed(1)}°C{' '}
                      <span className="text-slate-400">
                        / {Math.round(metric.apparentTemperatureC)}°
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end whitespace-nowrap font-mono tabular-nums text-slate-700" dir="ltr">
                      {Math.round(metric.humidityPct)}%
                    </td>
                    <td className="py-3 px-4 text-end whitespace-nowrap font-mono tabular-nums text-slate-700" dir="ltr">
                      {metric.uvIndex.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-end whitespace-nowrap font-mono tabular-nums text-slate-800" dir="ltr">
                      {Math.round(metric.usAqi)}
                    </td>
                    <td className="py-3 ps-4 pe-6 text-end whitespace-nowrap font-mono tabular-nums text-slate-700" dir="ltr">
                      {Math.round(metric.dustUgM3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
