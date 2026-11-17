import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type EmirateId =
  | 'abu-dhabi'
  | 'dubai'
  | 'sharjah'
  | 'ajman'
  | 'umm-al-quwain'
  | 'ras-al-khaimah'
  | 'fujairah';

type SightingCategory =
  | 'dust_haze'
  | 'flooded_paths'
  | 'high_heat'
  | 'stray_animals';

interface EmirateLocation {
  id: EmirateId;
  name: string;
  latitude: number;
  longitude: number;
}

interface HourlyMetric {
  time: string;
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPct: number;
  uvIndex: number;
  windSpeedKmh: number;
  usAqi: number;
  dustUgM3: number;
  pm10UgM3: number;
  pm25UgM3: number;
}

interface ConditionsPayload {
  emirateId: EmirateId;
  emirateName: string;
  isCustomLocation?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  fetchedAt: string;
  current: {
    time: string;
    temperatureC: number;
    apparentTemperatureC: number;
    humidityPct: number;
    uvIndex: number;
    windSpeedKmh: number;
    isDay: boolean;
    usAqi: number;
    dustUgM3: number;
    pm10UgM3: number;
    pm25UgM3: number;
  };
  hourly: HourlyMetric[];
}

interface CommunitySighting {
  id: string;
  emirateId: EmirateId;
  emirateName: string;
  category: SightingCategory;
  locationNote: string;
  description: string;
  latitude: number;
  longitude: number;
  confirmations: number;
  createdAt: string;
  expiresAt: string;
}

const EMIRATE_COORDS: Record<EmirateId, EmirateLocation> = {
  'abu-dhabi': { id: 'abu-dhabi', name: 'Abu Dhabi', latitude: 24.4539, longitude: 54.3773 },
  dubai: { id: 'dubai', name: 'Dubai', latitude: 25.2048, longitude: 55.2708 },
  sharjah: { id: 'sharjah', name: 'Sharjah', latitude: 25.3463, longitude: 55.4209 },
  ajman: { id: 'ajman', name: 'Ajman', latitude: 25.4052, longitude: 55.5136 },
  'umm-al-quwain': {
    id: 'umm-al-quwain',
    name: 'Umm Al Quwain',
    latitude: 25.5647,
    longitude: 55.5552,
  },
  'ras-al-khaimah': {
    id: 'ras-al-khaimah',
    name: 'Ras Al Khaimah',
    latitude: 25.7895,
    longitude: 55.9432,
  },
  fujairah: { id: 'fujairah', name: 'Fujairah', latitude: 25.1288, longitude: 56.3265 },
};

const KNOWN_LANDMARKS: Array<{ keywords: string[]; latitude: number; longitude: number }> = [
  { keywords: ['majaz'], latitude: 25.3249, longitude: 55.3886 },
  { keywords: ['qasba'], latitude: 25.3222, longitude: 55.3765 },
  { keywords: ['kite beach', 'jumeirah'], latitude: 25.1583, longitude: 55.2072 },
  { keywords: ['creek harbour', 'creek'], latitude: 25.2054, longitude: 55.3442 },
  { keywords: ['marina', 'jbr'], latitude: 25.0772, longitude: 55.1338 },
  { keywords: ['yas bay', 'yas'], latitude: 24.4655, longitude: 54.6022 },
  { keywords: ['corniche'], latitude: 24.4764, longitude: 54.3401 },
];

const VALID_CATEGORIES = new Set<SightingCategory>([
  'dust_haze',
  'flooded_paths',
  'high_heat',
  'stray_animals',
]);

const CACHE_TTL_MS = 3 * 60 * 1000;
const BRIEFING_TTL_MS = 10 * 60 * 1000;
const SIGHTING_TTL_MS = 24 * 60 * 60 * 1000;
const conditionsCache = new Map<string, { expiresAt: number; data: ConditionsPayload }>();
const briefingCache = new Map<
  string,
  { expiresAt: number; data: { briefing: string; source: 'gemini' | 'fallback'; generatedAt: string } }
>();

const rawGeminiKey = process.env.GEMINI_API_KEY?.trim();
const aiClient =
  rawGeminiKey && rawGeminiKey !== 'MY_GEMINI_API_KEY'
    ? new GoogleGenAI({
        apiKey: rawGeminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

const DATA_DIR = path.resolve(__dirname, 'data');
const SIGHTINGS_FILE = path.join(DATA_DIR, 'sightings.json');

function buildInitialSightings(): CommunitySighting[] {
  const now = Date.now();
  const minsAgo = (m: number) => new Date(now - m * 60_000).toISOString();
  const minsLeft = (m: number) => new Date(now + m * 60_000).toISOString();

  return [
    {
      id: 'seed-sharjah-majaz',
      emirateId: 'sharjah',
      emirateName: 'Sharjah',
      category: 'dust_haze',
      locationNote: 'Al Majaz Waterfront',
      description: 'Suspended fine dust haze reducing visibility along the lagoon promenade.',
      latitude: 25.3249,
      longitude: 55.3886,
      confirmations: 4,
      createdAt: minsAgo(18),
      expiresAt: minsLeft(24 * 60 - 18),
    },
    {
      id: 'seed-dubai-kite',
      emirateId: 'dubai',
      emirateName: 'Dubai',
      category: 'high_heat',
      locationNote: 'Kite Beach Running Track',
      description: 'Strong afternoon surface glare and warm asphalt near the central boardwalk.',
      latitude: 25.1583,
      longitude: 55.2072,
      confirmations: 6,
      createdAt: minsAgo(32),
      expiresAt: minsLeft(24 * 60 - 32),
    },
    {
      id: 'seed-abudhabi-yas',
      emirateId: 'abu-dhabi',
      emirateName: 'Abu Dhabi',
      category: 'stray_animals',
      locationNote: 'Yas Bay Pier Walk',
      description: 'Several free-roaming cats gathered near shaded waterfront seating.',
      latitude: 24.4655,
      longitude: 54.6022,
      confirmations: 2,
      createdAt: minsAgo(47),
      expiresAt: minsLeft(24 * 60 - 47),
    },
    {
      id: 'seed-sharjah-qasba',
      emirateId: 'sharjah',
      emirateName: 'Sharjah',
      category: 'flooded_paths',
      locationNote: 'Al Qasba Canal Walkway',
      description: 'Standing landscape irrigation water pooling near the pedestrian footbridge.',
      latitude: 25.3222,
      longitude: 55.3765,
      confirmations: 5,
      createdAt: minsAgo(64),
      expiresAt: minsLeft(24 * 60 - 64),
    },
    {
      id: 'seed-dubai-creek',
      emirateId: 'dubai',
      emirateName: 'Dubai',
      category: 'dust_haze',
      locationNote: 'Dubai Creek Harbour Promenade',
      description: 'Light windblown sand drifting across the north viewing walkway.',
      latitude: 25.2054,
      longitude: 55.3442,
      confirmations: 3,
      createdAt: minsAgo(24),
      expiresAt: minsLeft(24 * 60 - 24),
    },
    {
      id: 'seed-abudhabi-corniche',
      emirateId: 'abu-dhabi',
      emirateName: 'Abu Dhabi',
      category: 'high_heat',
      locationNote: 'Corniche East Plaza',
      description: 'Limited midday tree cover along the cycling and pedestrian lane; bring water.',
      latitude: 24.4764,
      longitude: 54.3401,
      confirmations: 3,
      createdAt: minsAgo(39),
      expiresAt: minsLeft(24 * 60 - 39),
    },
  ];
}

interface OpenMeteoGeocodingResult {
  name?: string;
  latitude?: number;
  longitude?: number;
  country_code?: string;
}

function squaredDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat1 - lat2;
  const dLon = lon1 - lon2;
  return dLat * dLat + dLon * dLon;
}

function findNearestEmirate(latitude: number, longitude: number): EmirateLocation {
  let nearest = EMIRATE_COORDS.dubai;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const emirate of Object.values(EMIRATE_COORDS)) {
    const dist = squaredDistance(latitude, longitude, emirate.latitude, emirate.longitude);
    if (dist < bestDist) {
      bestDist = dist;
      nearest = emirate;
    }
  }
  return nearest;
}

async function queryOpenMeteoGeocode(
  query: string,
  biasEmirate: EmirateLocation
): Promise<{ latitude: number; longitude: number } | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;

  try {
    const params = new URLSearchParams({
      name: trimmed,
      count: '10',
      language: 'en',
      format: 'json',
    });
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
      { signal: AbortSignal.timeout(4500) }
    );
    if (!response.ok) return null;

    const json = await response.json();
    const results: OpenMeteoGeocodingResult[] = Array.isArray(json.results) ? json.results : [];
    const uaeResults = results.filter(
      (r) =>
        r.country_code === 'AE' &&
        typeof r.latitude === 'number' &&
        typeof r.longitude === 'number'
    );

    if (uaeResults.length === 0) return null;

    // Pick the UAE match closest to the selected Emirate center
    let best = uaeResults[0];
    let bestDist = squaredDistance(
      best.latitude!,
      best.longitude!,
      biasEmirate.latitude,
      biasEmirate.longitude
    );
    for (let i = 1; i < uaeResults.length; i++) {
      const candidate = uaeResults[i];
      const dist = squaredDistance(
        candidate.latitude!,
        candidate.longitude!,
        biasEmirate.latitude,
        biasEmirate.longitude
      );
      if (dist < bestDist) {
        bestDist = dist;
        best = candidate;
      }
    }

    return {
      latitude: Number(best.latitude!.toFixed(4)),
      longitude: Number(best.longitude!.toFixed(4)),
    };
  } catch {
    return null;
  }
}

async function resolveSightingCoords(
  emirate: EmirateLocation,
  locationNote: string
): Promise<{
  latitude: number;
  longitude: number;
}> {
  const lower = locationNote.toLowerCase();
  for (const landmark of KNOWN_LANDMARKS) {
    if (landmark.keywords.some((kw) => lower.includes(kw))) {
      return { latitude: landmark.latitude, longitude: landmark.longitude };
    }
  }

  // 1. Try full locationNote against Open-Meteo Geocoding API
  const directMatch = await queryOpenMeteoGeocode(locationNote, emirate);
  if (directMatch) return directMatch;

  // 2. Strip common pathway/park suffixes (e.g., "Mushrif Park" -> "Mushrif") and retry
  const stripped = locationNote
    .replace(
      /\b(park|walk|walkway|promenade|beach|corniche|street|road|st|rd|avenue|ave|mall|waterfront|canal|plaza|track|trail|bridge|garden|gardens)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  if (stripped && stripped.toLowerCase() !== lower) {
    const strippedMatch = await queryOpenMeteoGeocode(stripped, emirate);
    if (strippedMatch) return strippedMatch;
  }

  // 3. Fall back cleanly to the selected Emirate center when no geocoding match exists
  return {
    latitude: emirate.latitude,
    longitude: emirate.longitude,
  };
}

async function readActiveSightings(): Promise<CommunitySighting[]> {
  let list: CommunitySighting[] = [];
  let fileMissing = false;

  try {
    const raw = await fs.readFile(SIGHTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      list = parsed;
    }
  } catch {
    fileMissing = true;
  }

  const now = Date.now();
  const active = list.filter(
    (item) => item && item.expiresAt && new Date(item.expiresAt).getTime() > now
  );

  if (fileMissing || active.length === 0) {
    const seeded = buildInitialSightings();
    await writeSightings(seeded);
    return seeded;
  }

  if (active.length !== list.length) {
    await writeSightings(active);
  }

  return active;
}

async function writeSightings(sightings: CommunitySighting[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SIGHTINGS_FILE, JSON.stringify(sightings, null, 2), 'utf-8');
}

function getDubaiCurrentHourPrefix(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const hour = lookup.hour === '24' ? '00' : lookup.hour;
  return `${lookup.year}-${lookup.month}-${lookup.day}T${hour}:00`;
}

async function fetchOpenMeteoConditions(options: {
  cacheKey: string;
  emirate: EmirateLocation;
  latitude: number;
  longitude: number;
  isCustomLocation: boolean;
}): Promise<ConditionsPayload> {
  const { cacheKey, emirate, latitude, longitude, isCustomLocation } = options;
  const cached = conditionsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const weatherParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,uv_index,wind_speed_10m,is_day',
    hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,uv_index,wind_speed_10m',
    timezone: 'Asia/Dubai',
    forecast_days: '2',
  });

  const airParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'us_aqi,dust,pm10,pm2_5',
    hourly: 'us_aqi,dust,pm10,pm2_5',
    timezone: 'Asia/Dubai',
    forecast_days: '2',
  });

  const [weatherRes, airRes] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams.toString()}`),
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams.toString()}`),
  ]);

  if (!weatherRes.ok) {
    throw new Error(`Open-Meteo weather request failed (${weatherRes.status})`);
  }
  if (!airRes.ok) {
    throw new Error(`Open-Meteo air quality request failed (${airRes.status})`);
  }

  const weatherJson = await weatherRes.json();
  const airJson = await airRes.json();

  const wHourly = weatherJson.hourly ?? {};
  const aHourly = airJson.hourly ?? {};

  const airByTime = new Map<
    string,
    { usAqi: number; dust: number; pm10: number; pm25: number }
  >();

  const airTimes: string[] = Array.isArray(aHourly.time) ? aHourly.time : [];
  for (let i = 0; i < airTimes.length; i++) {
    airByTime.set(airTimes[i], {
      usAqi: Number(aHourly.us_aqi?.[i] ?? 0),
      dust: Number(aHourly.dust?.[i] ?? 0),
      pm10: Number(aHourly.pm10?.[i] ?? 0),
      pm25: Number(aHourly.pm2_5?.[i] ?? 0),
    });
  }

  const weatherTimes: string[] = Array.isArray(wHourly.time) ? wHourly.time : [];
  const dubaiHourPrefix = getDubaiCurrentHourPrefix();
  let startIndex = weatherTimes.findIndex((t) => t >= dubaiHourPrefix);
  if (startIndex < 0) startIndex = 0;

  const hourly: HourlyMetric[] = [];
  for (let i = startIndex; i < Math.min(startIndex + 24, weatherTimes.length); i++) {
    const time = weatherTimes[i];
    const airMatch = airByTime.get(time) ?? { usAqi: 0, dust: 0, pm10: 0, pm25: 0 };
    hourly.push({
      time,
      temperatureC: Number(wHourly.temperature_2m?.[i] ?? 0),
      apparentTemperatureC: Number(wHourly.apparent_temperature?.[i] ?? 0),
      humidityPct: Number(wHourly.relative_humidity_2m?.[i] ?? 0),
      uvIndex: Number(wHourly.uv_index?.[i] ?? 0),
      windSpeedKmh: Number(wHourly.wind_speed_10m?.[i] ?? 0),
      usAqi: airMatch.usAqi,
      dustUgM3: airMatch.dust,
      pm10UgM3: airMatch.pm10,
      pm25UgM3: airMatch.pm25,
    });
  }

  const wCurrent = weatherJson.current ?? {};
  const aCurrent = airJson.current ?? {};

  const payload: ConditionsPayload = {
    emirateId: emirate.id,
    emirateName: isCustomLocation ? 'Your Location' : emirate.name,
    isCustomLocation,
    coordinates: {
      latitude: Number(latitude.toFixed(4)),
      longitude: Number(longitude.toFixed(4)),
    },
    timezone: 'Asia/Dubai',
    fetchedAt: new Date().toISOString(),
    current: {
      time: String(wCurrent.time ?? hourly[0]?.time ?? dubaiHourPrefix),
      temperatureC: Number(wCurrent.temperature_2m ?? hourly[0]?.temperatureC ?? 0),
      apparentTemperatureC: Number(
        wCurrent.apparent_temperature ?? hourly[0]?.apparentTemperatureC ?? 0
      ),
      humidityPct: Number(wCurrent.relative_humidity_2m ?? hourly[0]?.humidityPct ?? 0),
      uvIndex: Number(wCurrent.uv_index ?? hourly[0]?.uvIndex ?? 0),
      windSpeedKmh: Number(wCurrent.wind_speed_10m ?? hourly[0]?.windSpeedKmh ?? 0),
      isDay: Boolean(wCurrent.is_day ?? 1),
      usAqi: Number(aCurrent.us_aqi ?? hourly[0]?.usAqi ?? 0),
      dustUgM3: Number(aCurrent.dust ?? hourly[0]?.dustUgM3 ?? 0),
      pm10UgM3: Number(aCurrent.pm10 ?? hourly[0]?.pm10UgM3 ?? 0),
      pm25UgM3: Number(aCurrent.pm2_5 ?? hourly[0]?.pm25UgM3 ?? 0),
    },
    hourly,
  };

  conditionsCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data: payload,
  });

  return payload;
}

const AR_EMIRATE_NAMES: Record<EmirateId, string> = {
  'abu-dhabi': 'أبوظبي',
  dubai: 'دبي',
  sharjah: 'الشارقة',
  ajman: 'عجمان',
  'umm-al-quwain': 'أم القيوين',
  'ras-al-khaimah': 'رأس الخيمة',
  fujairah: 'الفجيرة',
};

const CATEGORY_LABELS_EN: Record<SightingCategory, string> = {
  dust_haze: 'dust haze',
  flooded_paths: 'flooded paths',
  high_heat: 'high heat',
  stray_animals: 'stray animals',
};

const CATEGORY_LABELS_AR: Record<SightingCategory, string> = {
  dust_haze: 'ضباب ترابي',
  flooded_paths: 'مسارات مغمورة بالمياه',
  high_heat: 'حرارة مرتفعة',
  stray_animals: 'حيوانات سائبة',
};

function buildFallbackBriefing(
  conditions: ConditionsPayload,
  localSightings: CommunitySighting[],
  lang: 'en' | 'ar'
): string {
  const { current } = conditions;
  const temp = current.temperatureC.toFixed(1);
  const humidity = Math.round(current.humidityPct);
  const uv = current.uvIndex.toFixed(1);
  const aqi = Math.round(current.usAqi);
  const dust = Math.round(current.dustUgM3);

  if (lang === 'ar') {
    const place = conditions.isCustomLocation
      ? `موقعك الحالي قرب ${AR_EMIRATE_NAMES[conditions.emirateId]}`
      : AR_EMIRATE_NAMES[conditions.emirateId];
    const s1 = `تسجل ${place} الآن ${temp}°م مع رطوبة ${humidity}% ومؤشر أشعة ${uv} وجودة هواء US AQI ${aqi} وغبار ${dust} µg/m³.`;
    const s2 =
      localSightings.length > 0
        ? `توجد ${localSightings.length} بلاغات نشطة محلياً أبرزها ${CATEGORY_LABELS_AR[localSightings[0].category]} في ${localSightings[0].locationNote}، لذا يُنصح بأخذ الحيطة ومراقبة أفضل ساعات المشي.`
        : 'لا توجد بلاغات ميدانية طارئة مسجلة حالياً؛ يُفضل التخطيط للنشاط الخارجي خلال الساعات الأقل حرارة والأعلى جودة هواء.';
    return `${s1} ${s2}`;
  }

  const place = conditions.isCustomLocation
    ? `your GPS area near ${conditions.emirateName === 'Your Location' ? EMIRATE_COORDS[conditions.emirateId].name : conditions.emirateName}`
    : conditions.emirateName;

  const s1 = `Conditions in ${place} currently sit at ${temp}°C (${humidity}% humidity), UV ${uv}, US AQI ${aqi}, and ${dust} µg/m³ airborne dust.`;
  const s2 =
    localSightings.length > 0
      ? `Residents have ${localSightings.length} active report${localSightings.length > 1 ? 's' : ''} nearby, including ${CATEGORY_LABELS_EN[localSightings[0].category]} at ${localSightings[0].locationNote}; plan outdoor walks around cooler, clearer hours.`
      : 'No active local hazard sightings are logged for this area right now; aim for shaded routes or cooler morning and evening walking windows.';

  return `${s1} ${s2}`;
}

async function generateBriefing(options: {
  cacheKey: string;
  conditions: ConditionsPayload;
  localSightings: CommunitySighting[];
  lang: 'en' | 'ar';
  profile: string;
}): Promise<{ briefing: string; source: 'gemini' | 'fallback'; generatedAt: string }> {
  const { cacheKey, conditions, localSightings, lang, profile } = options;
  const cached = briefingCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const fallbackText = buildFallbackBriefing(conditions, localSightings, lang);

  if (!aiClient) {
    const result = {
      briefing: fallbackText,
      source: 'fallback' as const,
      generatedAt: new Date().toISOString(),
    };
    briefingCache.set(cacheKey, {
      expiresAt: Date.now() + BRIEFING_TTL_MS,
      data: result,
    });
    return result;
  }

  try {
    const sightingsSummary =
      localSightings.length > 0
        ? localSightings
            .slice(0, 4)
            .map(
              (s) =>
                `${CATEGORY_LABELS_EN[s.category]} at ${s.locationNote} (${s.confirmations} confirmed${s.description ? `: ${s.description}` : ''})`
            )
            .join('; ')
        : 'None active';

    const locationLabel = conditions.isCustomLocation
      ? `GPS coordinates (${conditions.coordinates?.latitude}, ${conditions.coordinates?.longitude}) near ${EMIRATE_COORDS[conditions.emirateId].name}`
      : conditions.emirateName;

    const targetLanguage = lang === 'ar' ? 'Arabic (Modern Standard, clear civic tone)' : 'English';
    const prompt = [
      `Location: ${locationLabel}`,
      `Activity Profile: ${profile}`,
      `Current Weather & Air: ${conditions.current.temperatureC.toFixed(1)}°C (feels ${Math.round(conditions.current.apparentTemperatureC)}°C), humidity ${Math.round(conditions.current.humidityPct)}%, UV ${conditions.current.uvIndex.toFixed(1)}, wind ${Math.round(conditions.current.windSpeedKmh)} km/h, US AQI ${Math.round(conditions.current.usAqi)}, airborne dust ${Math.round(conditions.current.dustUgM3)} µg/m³.`,
      `Active Local Community Sightings: ${sightingsSummary}.`,
      `Write exactly 2 concise, practical sentences in ${targetLanguage} advising UAE residents on outdoor walking/activity safety right now and referencing the local sightings if any exist.`,
    ].join('\n');

    const response = await aiClient.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a concise, high-trust UAE municipal outdoor safety advisor. Respond in exactly 2 plain sentences with zero markdown, zero bullet points, and zero emojis.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const text = response.text?.trim();
    const result = {
      briefing: text && text.length > 15 ? text : fallbackText,
      source: (text && text.length > 15 ? 'gemini' : 'fallback') as 'gemini' | 'fallback',
      generatedAt: new Date().toISOString(),
    };

    briefingCache.set(cacheKey, {
      expiresAt: Date.now() + BRIEFING_TTL_MS,
      data: result,
    });
    return result;
  } catch (err) {
    console.warn('Gemini briefing fallback used:', err instanceof Error ? err.message : err);
    const result = {
      briefing: fallbackText,
      source: 'fallback' as const,
      generatedAt: new Date().toISOString(),
    };
    briefingCache.set(cacheKey, {
      expiresAt: Date.now() + BRIEFING_TTL_MS,
      data: result,
    });
    return result;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/conditions', async (req, res) => {
    const hasLat = req.query.lat !== undefined && req.query.lat !== '';
    const hasLon = req.query.lon !== undefined && req.query.lon !== '';

    if (hasLat !== hasLon) {
      res.status(400).json({ error: 'Both lat and lon query parameters are required together.' });
      return;
    }

    if (hasLat && hasLon) {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
      ) {
        res.status(400).json({ error: 'Invalid lat or lon coordinates.' });
        return;
      }

      const nearestEmirate = findNearestEmirate(lat, lon);
      const cacheKey = `coords:${lat.toFixed(3)},${lon.toFixed(3)}`;

      try {
        const data = await fetchOpenMeteoConditions({
          cacheKey,
          emirate: nearestEmirate,
          latitude: lat,
          longitude: lon,
          isCustomLocation: true,
        });
        res.json(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load live weather data.';
        res.status(502).json({ error: message });
      }
      return;
    }

    const rawEmirate = String(req.query.emirate ?? 'dubai') as EmirateId;
    const emirate = EMIRATE_COORDS[rawEmirate];
    if (!emirate) {
      res.status(400).json({ error: 'Invalid Emirate identifier.' });
      return;
    }

    try {
      const data = await fetchOpenMeteoConditions({
        cacheKey: `emirate:${emirate.id}`,
        emirate,
        latitude: emirate.latitude,
        longitude: emirate.longitude,
        isCustomLocation: false,
      });
      res.json(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load live weather data.';
      res.status(502).json({ error: message });
    }
  });

  app.get('/api/briefing', async (req, res) => {
    const lang = req.query.lang === 'ar' ? 'ar' : 'en';
    const profile = String(req.query.profile ?? 'general').slice(0, 24);
    const hasLat = req.query.lat !== undefined && req.query.lat !== '';
    const hasLon = req.query.lon !== undefined && req.query.lon !== '';

    try {
      let conditions: ConditionsPayload;
      let locationCacheKey: string;

      if (hasLat && hasLon) {
        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);
        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          lat < -90 ||
          lat > 90 ||
          lon < -180 ||
          lon > 180
        ) {
          res.status(400).json({ error: 'Invalid lat or lon coordinates.' });
          return;
        }
        const nearestEmirate = findNearestEmirate(lat, lon);
        locationCacheKey = `coords:${lat.toFixed(2)},${lon.toFixed(2)}`;
        conditions = await fetchOpenMeteoConditions({
          cacheKey: `coords:${lat.toFixed(3)},${lon.toFixed(3)}`,
          emirate: nearestEmirate,
          latitude: lat,
          longitude: lon,
          isCustomLocation: true,
        });
      } else {
        const rawEmirate = String(req.query.emirate ?? 'dubai') as EmirateId;
        const emirate = EMIRATE_COORDS[rawEmirate];
        if (!emirate) {
          res.status(400).json({ error: 'Invalid Emirate identifier.' });
          return;
        }
        locationCacheKey = `emirate:${emirate.id}`;
        conditions = await fetchOpenMeteoConditions({
          cacheKey: locationCacheKey,
          emirate,
          latitude: emirate.latitude,
          longitude: emirate.longitude,
          isCustomLocation: false,
        });
      }

      const allSightings = await readActiveSightings();
      const localSightings = allSightings.filter((s) => s.emirateId === conditions.emirateId);
      const sightingSig = `${localSightings.length}-${localSightings[0]?.id ?? 'none'}`;
      const briefingCacheKey = `${locationCacheKey}:${lang}:${profile}:${sightingSig}`;

      const result = await generateBriefing({
        cacheKey: briefingCacheKey,
        conditions,
        localSightings,
        lang,
        profile,
      });

      res.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to generate safety briefing.';
      res.status(502).json({ error: message });
    }
  });

  app.get('/api/sightings', async (req, res) => {
    const emirateFilter = req.query.emirate ? String(req.query.emirate) : null;
    const sightings = await readActiveSightings();
    const sorted = [...sightings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (emirateFilter && emirateFilter !== 'all') {
      res.json(sorted.filter((item) => item.emirateId === emirateFilter));
      return;
    }
    res.json(sorted);
  });

  app.post('/api/sightings', async (req, res) => {
    const { emirateId, category, locationNote, description } = req.body ?? {};
    const emirate = EMIRATE_COORDS[emirateId as EmirateId];

    if (!emirate) {
      res.status(400).json({ error: 'Please select a valid UAE Emirate.' });
      return;
    }

    if (!VALID_CATEGORIES.has(category)) {
      res.status(400).json({ error: 'Please select a valid sighting category.' });
      return;
    }

    const cleanLocation = String(locationNote ?? '').trim().slice(0, 80);
    const cleanDesc = String(description ?? '').trim().slice(0, 220);

    if (!cleanLocation) {
      res.status(400).json({ error: 'Please include a brief local street, park, or area name.' });
      return;
    }

    const coords = await resolveSightingCoords(emirate, cleanLocation);
    const now = Date.now();

    const entry: CommunitySighting = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      emirateId: emirate.id,
      emirateName: emirate.name,
      category,
      locationNote: cleanLocation,
      description: cleanDesc,
      latitude: coords.latitude,
      longitude: coords.longitude,
      confirmations: 1,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SIGHTING_TTL_MS).toISOString(),
    };

    const existing = await readActiveSightings();
    const updated = [entry, ...existing].slice(0, 100);
    await writeSightings(updated);

    res.status(201).json(entry);
  });

  app.post('/api/sightings/:id/confirm', async (req, res) => {
    const targetId = String(req.params.id ?? '');
    const sightings = await readActiveSightings();
    const index = sightings.findIndex((item) => item.id === targetId);

    if (index === -1) {
      res.status(404).json({ error: 'Sighting not found or has expired.' });
      return;
    }

    const current = sightings[index];
    const currentExp = new Date(current.expiresAt).getTime();
    const extendedExp = Math.min(
      Date.now() + SIGHTING_TTL_MS,
      Math.max(currentExp, Date.now()) + 30 * 60_000
    );

    const updatedItem: CommunitySighting = {
      ...current,
      confirmations: (current.confirmations ?? 0) + 1,
      expiresAt: new Date(extendedExp).toISOString(),
    };

    const nextList = [...sightings];
    nextList[index] = updatedItem;
    await writeSightings(nextList);

    res.json(updatedItem);
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`UAE Outdoor Safety server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
