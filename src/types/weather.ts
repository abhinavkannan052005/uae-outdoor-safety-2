export type EmirateId =
  | 'abu-dhabi'
  | 'dubai'
  | 'sharjah'
  | 'ajman'
  | 'umm-al-quwain'
  | 'ras-al-khaimah'
  | 'fujairah';

export interface EmirateConfig {
  id: EmirateId;
  name: string;
  shortName: string;
  latitude: number;
  longitude: number;
  coastalNote: string;
}

export interface CurrentConditions {
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
}

export interface HourlyMetric {
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

export interface ConditionsResponse {
  emirateId: EmirateId;
  emirateName: string;
  isCustomLocation?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  fetchedAt: string;
  current: CurrentConditions;
  hourly: HourlyMetric[];
}

export type SafetyTier = 'optimal' | 'moderate' | 'poor';

export type ActivityProfile = 'general' | 'sensitive' | 'runner' | 'pet' | 'worker';

export type ShadeLevel = 'high_shade' | 'waterfront_breeze' | 'open_track';

export interface WalkingSpot {
  id: string;
  nameEn: string;
  nameAr: string;
  areaEn: string;
  areaAr: string;
  shadeLevel: ShadeLevel;
}

export type Language = 'en' | 'ar';

export interface BriefingResponse {
  briefing: string;
  source: 'gemini' | 'fallback';
  generatedAt: string;
}

export interface ScoreFactorBreakdown {
  key: 'thermal' | 'uv' | 'aqi' | 'dust';
  label: string;
  valueLabel: string;
  penalty: number;
  tier: SafetyTier;
}

export interface SafetyEvaluation {
  score: number;
  tier: SafetyTier;
  statusLabel: string;
  guidance: string;
  pavementWarning?: string;
  shadeBreakWarning?: string;
  primaryLimiter: string | null;
  factors: ScoreFactorBreakdown[];
}

export interface WalkingWindow {
  startTime: string;
  endTime: string;
  hoursCount: number;
  avgScore: number;
  peakScore: number;
  minTempC: number;
  maxTempC: number;
  avgUsAqi: number;
  tier: SafetyTier;
}

export type SightingCategory =
  | 'dust_haze'
  | 'flooded_paths'
  | 'high_heat'
  | 'stray_animals';

export interface CommunitySighting {
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
