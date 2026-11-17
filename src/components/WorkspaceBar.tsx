import { useState } from 'react';
import { RefreshCw, LocateFixed } from 'lucide-react';
import { EMIRATES } from '../data/emirates';
import type { ActivityProfile, EmirateId, Language } from '../types/weather';
import { TRANSLATIONS } from '../utils/i18n';

interface WorkspaceBarProps {
  language: Language;
  selectedEmirate: EmirateId;
  customCoords: { latitude: number; longitude: number } | null;
  onSelectEmirate: (id: EmirateId) => void;
  onUseMyLocation: (coords: { latitude: number; longitude: number }) => void;
  activityProfile: ActivityProfile;
  onSelectActivityProfile: (profile: ActivityProfile) => void;
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdatedLabel: string | null;
}

const PROFILE_ORDER: ActivityProfile[] = ['general', 'sensitive', 'runner', 'pet', 'worker'];

export function WorkspaceBar({
  language,
  selectedEmirate,
  customCoords,
  onSelectEmirate,
  onUseMyLocation,
  activityProfile,
  onSelectActivityProfile,
  onRefresh,
  isLoading,
  lastUpdatedLabel,
}: WorkspaceBarProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const t = TRANSLATIONS[language];

  const handleGeolocate = () => {
    setGeoError(null);
    if (!('geolocation' in navigator)) {
      setGeoError(t.workspace.geoUnsupported);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        onUseMyLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(t.workspace.geoDenied);
        } else if (err.code === err.TIMEOUT) {
          setGeoError(t.workspace.geoTimeout);
        } else {
          setGeoError(t.workspace.geoFailed);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const activeProfileMeta = t.profiles[activityProfile];

  return (
    <section
      aria-label="Emirate and activity profile controls"
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4"
    >
      {/* Row 1: Emirate & GPS Location Selector */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <span className="text-xs font-medium text-slate-500">
            {t.workspace.selectLocation}
          </span>
          <div className="flex items-center gap-3">
            {lastUpdatedLabel && (
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {t.workspace.updatedPrefix} {lastUpdatedLabel} {t.workspace.gst}
              </span>
            )}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label={t.workspace.refresh}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{t.workspace.refresh}</span>
            </button>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="UAE Emirates and GPS location"
          className="flex flex-wrap gap-1.5"
        >
          {EMIRATES.map((emirate) => {
            const active = !customCoords && emirate.id === selectedEmirate;
            return (
              <button
                key={emirate.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setGeoError(null);
                  onSelectEmirate(emirate.id);
                }}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {t.emirates[emirate.id].name}
              </button>
            );
          })}

          <button
            type="button"
            role="tab"
            aria-selected={Boolean(customCoords)}
            onClick={handleGeolocate}
            disabled={isLocating}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
              customCoords
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <LocateFixed
              className={`w-4 h-4 shrink-0 ${isLocating ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isLocating ? t.workspace.locating : t.workspace.useMyLocation}</span>
          </button>
        </div>

        {geoError && (
          <p role="alert" className="mt-2 text-xs font-medium text-red-700">
            {geoError}
          </p>
        )}
      </div>

      {/* Row 2: 4 Activity Profiles */}
      <div className="pt-4 border-t border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 me-1 whitespace-nowrap">
            {t.workspace.activityProfile}
          </span>
          <div
            role="radiogroup"
            aria-label={t.workspace.activityProfile}
            className="flex flex-wrap gap-1.5"
          >
            {PROFILE_ORDER.map((profileKey) => {
              const meta = t.profiles[profileKey];
              const active = activityProfile === profileKey;
              return (
                <button
                  key={profileKey}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onSelectActivityProfile(profileKey)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-xs text-slate-600">
          {activeProfileMeta.description}
        </span>
      </div>
    </section>
  );
}
