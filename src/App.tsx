import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TopNav } from './components/TopNav';
import { WorkspaceBar } from './components/WorkspaceBar';
import { HeroSafetyOverview } from './components/HeroSafetyOverview';
import { WalkingWindowsPanel } from './components/WalkingWindowsPanel';
import { HourlyForecastTable } from './components/HourlyForecastTable';
import { CommunitySightingsBar } from './components/CommunitySightingsBar';
import { PWAInstallButton } from './components/PWAInstallButton';
import type {
  ActivityProfile,
  BriefingResponse,
  CommunitySighting,
  ConditionsResponse,
  EmirateId,
  Language,
  SightingCategory,
} from './types/weather';
import {
  applySimulatedDustSpike,
  evaluateOutdoorSafety,
} from './utils/safetyScore';
import { TRANSLATIONS } from './utils/i18n';

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = window.localStorage.getItem('uae_safety_lang');
      return saved === 'ar' ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  });
  const [selectedEmirate, setSelectedEmirate] = useState<EmirateId>('dubai');
  const [customCoords, setCustomCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [activityProfile, setActivityProfile] = useState<ActivityProfile>('general');
  const [simulateDustSpike, setSimulateDustSpike] = useState<boolean>(false);

  const [conditions, setConditions] = useState<ConditionsResponse | null>(null);
  const [conditionsLoading, setConditionsLoading] = useState<boolean>(true);
  const [conditionsError, setConditionsError] = useState<string | null>(null);

  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [briefingLoading, setBriefingLoading] = useState<boolean>(true);

  const [sightings, setSightings] = useState<CommunitySighting[]>([]);
  const [sightingsLoading, setSightingsLoading] = useState<boolean>(true);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(() => {
    try {
      const saved = window.sessionStorage.getItem('uae_confirmed_sightings');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const locationInputRef = useRef<HTMLInputElement | null>(null);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    try {
      window.localStorage.setItem('uae_safety_lang', language);
    } catch {
      // Ignore storage errors
    }
  }, [language]);

  const fetchConditions = useCallback(
    async (
      emirateId: EmirateId,
      coords: { latitude: number; longitude: number } | null
    ) => {
      setConditionsLoading(true);
      setConditionsError(null);
      try {
        const url = coords
          ? `/api/conditions?lat=${encodeURIComponent(coords.latitude)}&lon=${encodeURIComponent(coords.longitude)}`
          : `/api/conditions?emirate=${encodeURIComponent(emirateId)}`;

        const response = await fetch(url);
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${response.status})`);
        }
        const data: ConditionsResponse = await response.json();
        setConditions(data);
        if (coords && data.emirateId) {
          setSelectedEmirate(data.emirateId);
        }
      } catch (err) {
        setConditionsError(
          err instanceof Error ? err.message : 'Unable to fetch live weather and air quality.'
        );
      } finally {
        setConditionsLoading(false);
      }
    },
    []
  );

  const fetchSightings = useCallback(async () => {
    try {
      const response = await fetch('/api/sightings');
      if (!response.ok) return;
      const data: CommunitySighting[] = await response.json();
      setSightings(data);
    } catch {
      // Keep existing feed on transient polling failure
    } finally {
      setSightingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConditions(selectedEmirate, customCoords);
  }, [selectedEmirate, customCoords, fetchConditions]);

  useEffect(() => {
    fetchSightings();
    const intervalId = window.setInterval(fetchSightings, 20000);
    return () => window.clearInterval(intervalId);
  }, [fetchSightings]);

  const sightingsKey = useMemo(() => {
    const local = sightings.filter((s) => s.emirateId === selectedEmirate);
    return `${local.length}:${local[0]?.id ?? 'none'}`;
  }, [sightings, selectedEmirate]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadBriefing() {
      setBriefingLoading(true);
      try {
        const params = new URLSearchParams({
          lang: language,
          profile: activityProfile,
        });
        if (customCoords) {
          params.set('lat', String(customCoords.latitude));
          params.set('lon', String(customCoords.longitude));
        } else {
          params.set('emirate', selectedEmirate);
        }

        const response = await fetch(`/api/briefing?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data: BriefingResponse = await response.json();
        if (!cancelled) {
          setBriefing(data);
        }
      } catch {
        // Retain prior briefing or graceful loading state
      } finally {
        if (!cancelled) {
          setBriefingLoading(false);
        }
      }
    }

    loadBriefing();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedEmirate, customCoords, language, activityProfile, sightingsKey]);

  const handleSubmitSighting = useCallback(
    async (payload: {
      emirateId: EmirateId;
      category: SightingCategory;
      locationNote: string;
      description: string;
    }) => {
      const response = await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || 'Could not post report.');
      }
      setSightings((prev) => [body as CommunitySighting, ...prev]);
    },
    []
  );

  const handleConfirmSighting = useCallback(async (id: string) => {
    const response = await fetch(`/api/sightings/${encodeURIComponent(id)}/confirm`, {
      method: 'POST',
    });
    if (!response.ok) return;
    const updated: CommunitySighting = await response.json();

    setSightings((prev) => prev.map((item) => (item.id === id ? updated : item)));
    setConfirmedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        window.sessionStorage.setItem(
          'uae_confirmed_sightings',
          JSON.stringify(Array.from(next))
        );
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const handleJumpToReport = useCallback(() => {
    const section = document.getElementById('community-sightings');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.setTimeout(() => {
      locationInputRef.current?.focus();
    }, 350);
  }, []);

  const displayConditions = useMemo(() => {
    if (!conditions) return null;
    return simulateDustSpike ? applySimulatedDustSpike(conditions) : conditions;
  }, [conditions, simulateDustSpike]);

  const currentEvaluation = useMemo(() => {
    if (!displayConditions) return null;
    return evaluateOutdoorSafety(displayConditions.current, activityProfile);
  }, [displayConditions, activityProfile]);

  const lastUpdatedLabel = useMemo(() => {
    if (!displayConditions?.fetchedAt) return null;
    const date = new Date(displayConditions.fetchedAt);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }, [displayConditions?.fetchedAt]);

  const localizedLocationName = useMemo(() => {
    if (!displayConditions) return t.emirates[selectedEmirate].name;
    const emName = t.emirates[displayConditions.emirateId].name;
    return displayConditions.isCustomLocation
      ? `${t.hero.yourGpsLocation} (${emName})`
      : emName;
  }, [displayConditions, selectedEmirate, t]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6] text-slate-900">
      <TopNav
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'))}
        onReportClick={handleJumpToReport}
        simulateDustSpike={simulateDustSpike}
        onToggleDustSpike={() => setSimulateDustSpike((prev) => !prev)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <WorkspaceBar
          language={language}
          selectedEmirate={selectedEmirate}
          customCoords={customCoords}
          onSelectEmirate={(id) => {
            setCustomCoords(null);
            setSelectedEmirate(id);
          }}
          onUseMyLocation={(coords) => {
            setCustomCoords(coords);
          }}
          activityProfile={activityProfile}
          onSelectActivityProfile={setActivityProfile}
          onRefresh={() => fetchConditions(selectedEmirate, customCoords)}
          isLoading={conditionsLoading}
          lastUpdatedLabel={lastUpdatedLabel}
        />

        <HeroSafetyOverview
          conditions={displayConditions}
          evaluation={currentEvaluation}
          activityProfile={activityProfile}
          language={language}
          briefing={briefing}
          briefingLoading={briefingLoading}
          simulateDustSpike={simulateDustSpike}
          onDismissDustSpike={() => setSimulateDustSpike(false)}
          isLoading={conditionsLoading}
          error={conditionsError}
          onRetry={() => fetchConditions(selectedEmirate, customCoords)}
        />

        {displayConditions && (
          <>
            <WalkingWindowsPanel
              hourly={displayConditions.hourly}
              referenceTime={displayConditions.current.time}
              selectedEmirate={displayConditions.emirateId}
              locationName={localizedLocationName}
              currentTemperatureC={displayConditions.current.temperatureC}
              currentUvIndex={displayConditions.current.uvIndex}
              activityProfile={activityProfile}
              language={language}
            />

            <HourlyForecastTable
              hourly={displayConditions.hourly}
              referenceTime={displayConditions.current.time}
              activityProfile={activityProfile}
              language={language}
            />
          </>
        )}

        <CommunitySightingsBar
          selectedEmirate={selectedEmirate}
          sightings={sightings}
          isLoading={sightingsLoading}
          onSubmitSighting={handleSubmitSighting}
          onConfirmSighting={handleConfirmSighting}
          confirmedIds={confirmedIds}
          locationInputRef={locationInputRef}
          language={language}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-slate-500">
          <span>{t.footer.left}</span>
          <div className="flex flex-wrap items-center gap-3">
            <span>{t.footer.right}</span>
            <PWAInstallButton language={language} />
          </div>
        </div>
      </footer>
    </div>
  );
}
