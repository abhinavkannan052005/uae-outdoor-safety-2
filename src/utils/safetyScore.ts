import type {
  ActivityProfile,
  ConditionsResponse,
  HourlyMetric,
  SafetyEvaluation,
  SafetyTier,
  ScoreFactorBreakdown,
  SightingCategory,
  WalkingWindow,
} from '../types/weather';

export interface ConditionSnapshot {
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPct: number;
  uvIndex: number;
  usAqi: number;
  dustUgM3: number;
}

export const ACTIVITY_PROFILES: Record<
  ActivityProfile,
  { id: ActivityProfile; label: string; description: string }
> = {
  general: {
    id: 'general',
    label: 'General Walk',
    description: 'Standard outdoor comfort thresholds',
  },
  sensitive: {
    id: 'sensitive',
    label: 'Sensitive / Kids',
    description: 'Stricter heat, UV & air thresholds',
  },
  runner: {
    id: 'runner',
    label: 'Outdoor Runner',
    description: 'Stricter humidity & AQI exertion penalties',
  },
  pet: {
    id: 'pet',
    label: 'Pet Walk',
    description: 'Adds pavement heat warnings above 30°C or UV 7',
  },
  worker: {
    id: 'worker',
    label: 'Outdoor Worker',
    description: 'Strict heat-stress & UV penalties with shade & hydration break guidance',
  },
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function tierFromPenalty(penalty: number, warnAt: number, dangerAt: number): SafetyTier {
  if (penalty >= dangerAt) return 'poor';
  if (penalty >= warnAt) return 'moderate';
  return 'optimal';
}

interface ProfileThresholds {
  mildTempStart: number;
  hotThreshold: number;
  lowThreshold: number;
  mildTempSlope: number;
  hotTempSlope: number;
  humidityTempMin: number;
  humidityThreshold: number;
  humiditySlope: number;
  uvMildStart: number;
  uvHighThreshold: number;
  uvMildSlope: number;
  uvHighSlope: number;
  aqiMildStart: number;
  aqiHighThreshold: number;
  aqiMidSlope: number;
  aqiHighSlope: number;
  dustMildStart: number;
  dustHighThreshold: number;
  dustMildSlope: number;
  dustHighSlope: number;
}

const PROFILE_THRESHOLDS: Record<ActivityProfile, ProfileThresholds> = {
  general: {
    mildTempStart: 25,
    hotThreshold: 28,
    lowThreshold: 15,
    mildTempSlope: 2.5,
    hotTempSlope: 6.2,
    humidityTempMin: 23,
    humidityThreshold: 66,
    humiditySlope: 0.4,
    uvMildStart: 2.5,
    uvHighThreshold: 5.5,
    uvMildSlope: 3.6,
    uvHighSlope: 6.8,
    aqiMildStart: 50,
    aqiHighThreshold: 70,
    aqiMidSlope: 0.55,
    aqiHighSlope: 1.1,
    dustMildStart: 25,
    dustHighThreshold: 60,
    dustMildSlope: 0.35,
    dustHighSlope: 0.5,
  },
  sensitive: {
    mildTempStart: 24,
    hotThreshold: 26.5,
    lowThreshold: 18,
    mildTempSlope: 2.8,
    hotTempSlope: 7.2,
    humidityTempMin: 22,
    humidityThreshold: 58,
    humiditySlope: 0.55,
    uvMildStart: 1.8,
    uvHighThreshold: 4.2,
    uvMildSlope: 4.0,
    uvHighSlope: 7.8,
    aqiMildStart: 35,
    aqiHighThreshold: 60,
    aqiMidSlope: 0.7,
    aqiHighSlope: 1.25,
    dustMildStart: 15,
    dustHighThreshold: 45,
    dustMildSlope: 0.45,
    dustHighSlope: 0.65,
  },
  runner: {
    mildTempStart: 23,
    hotThreshold: 26.5,
    lowThreshold: 12,
    mildTempSlope: 2.9,
    hotTempSlope: 6.8,
    humidityTempMin: 21,
    humidityThreshold: 52,
    humiditySlope: 0.78,
    uvMildStart: 2.2,
    uvHighThreshold: 5.0,
    uvMildSlope: 3.6,
    uvHighSlope: 7.0,
    aqiMildStart: 30,
    aqiHighThreshold: 55,
    aqiMidSlope: 0.85,
    aqiHighSlope: 1.38,
    dustMildStart: 15,
    dustHighThreshold: 40,
    dustMildSlope: 0.5,
    dustHighSlope: 0.72,
  },
  pet: {
    mildTempStart: 24.5,
    hotThreshold: 27.5,
    lowThreshold: 14,
    mildTempSlope: 2.6,
    hotTempSlope: 6.5,
    humidityTempMin: 23,
    humidityThreshold: 64,
    humiditySlope: 0.45,
    uvMildStart: 2.2,
    uvHighThreshold: 5.0,
    uvMildSlope: 3.6,
    uvHighSlope: 7.2,
    aqiMildStart: 45,
    aqiHighThreshold: 65,
    aqiMidSlope: 0.6,
    aqiHighSlope: 1.15,
    dustMildStart: 20,
    dustHighThreshold: 50,
    dustMildSlope: 0.4,
    dustHighSlope: 0.55,
  },
  worker: {
    mildTempStart: 23.5,
    hotThreshold: 26.0,
    lowThreshold: 15,
    mildTempSlope: 3.1,
    hotTempSlope: 7.6,
    humidityTempMin: 22,
    humidityThreshold: 55,
    humiditySlope: 0.68,
    uvMildStart: 1.8,
    uvHighThreshold: 4.0,
    uvMildSlope: 4.2,
    uvHighSlope: 8.2,
    aqiMildStart: 40,
    aqiHighThreshold: 65,
    aqiMidSlope: 0.68,
    aqiHighSlope: 1.25,
    dustMildStart: 18,
    dustHighThreshold: 45,
    dustMildSlope: 0.45,
    dustHighSlope: 0.68,
  },
};

/**
 * Calibrated UAE Outdoor Walk Score (0-100) tailored by Activity Profile.
 */
export function evaluateOutdoorSafety(
  snapshot: ConditionSnapshot,
  profile: ActivityProfile = 'general'
): SafetyEvaluation {
  const cfg = PROFILE_THRESHOLDS[profile];
  const effectiveTemp = Math.max(snapshot.temperatureC, snapshot.apparentTemperatureC);

  // 1. Thermal & Pavement Comfort Penalty (max 52 pts)
  let thermalPenalty = 0;
  if (effectiveTemp > cfg.hotThreshold) {
    const baseRamp = (cfg.hotThreshold - cfg.mildTempStart) * cfg.mildTempSlope;
    const excess = effectiveTemp - cfg.hotThreshold;
    thermalPenalty = baseRamp + excess * cfg.hotTempSlope;
  } else if (effectiveTemp > cfg.mildTempStart) {
    thermalPenalty = (effectiveTemp - cfg.mildTempStart) * cfg.mildTempSlope;
  } else if (effectiveTemp < cfg.lowThreshold) {
    thermalPenalty = (cfg.lowThreshold - effectiveTemp) * 2.0;
  }

  if (
    snapshot.humidityPct > cfg.humidityThreshold &&
    snapshot.temperatureC >= cfg.humidityTempMin
  ) {
    thermalPenalty += (snapshot.humidityPct - cfg.humidityThreshold) * cfg.humiditySlope;
  }

  // Pet Walk hot pavement check (temp > 30°C or UV > 7)
  let pavementWarning: string | undefined;
  if (profile === 'pet' && (snapshot.temperatureC > 30 || snapshot.uvIndex > 7)) {
    const tempRisk = snapshot.temperatureC > 30 ? 14 + (snapshot.temperatureC - 30) * 2.5 : 0;
    const uvRisk = snapshot.uvIndex > 7 ? 10 + (snapshot.uvIndex - 7) * 3 : 0;
    thermalPenalty += Math.min(22, Math.max(tempRisk, uvRisk));

    const triggers: string[] = [];
    if (snapshot.temperatureC > 30) {
      triggers.push(`air temperature ${snapshot.temperatureC.toFixed(1)}°C`);
    }
    if (snapshot.uvIndex > 7) {
      triggers.push(`UV index ${snapshot.uvIndex.toFixed(1)}`);
    }
    pavementWarning = `Hot Pavement Warning (${triggers.join(' & ')}): Asphalt and stone walkways can burn pet paws. Use shaded grass or test the surface with the back of your hand for 5 seconds.`;
  }

  // Outdoor Worker mandatory shade & hydration break advisory (temp > 28°C or UV >= 6)
  let shadeBreakWarning: string | undefined;
  if (profile === 'worker' && (snapshot.temperatureC > 28 || snapshot.uvIndex >= 6)) {
    const triggers: string[] = [];
    if (snapshot.temperatureC > 28) {
      triggers.push(`air temperature ${snapshot.temperatureC.toFixed(1)}°C`);
    }
    if (snapshot.uvIndex >= 6) {
      triggers.push(`UV index ${snapshot.uvIndex.toFixed(1)}`);
    }
    shadeBreakWarning = `Shade & Hydration Break Protocol (${triggers.join(' & ')}): Rotate crew into shaded rest stations every 30–45 minutes and supply cool water with electrolytes every 15–20 minutes.`;
  }

  thermalPenalty = clamp(thermalPenalty, 0, 52);

  // 2. UV Index Penalty (max 34 pts)
  let uvPenalty = 0;
  if (snapshot.uvIndex > cfg.uvHighThreshold) {
    const mildPart = (cfg.uvHighThreshold - cfg.uvMildStart) * cfg.uvMildSlope;
    uvPenalty = mildPart + (snapshot.uvIndex - cfg.uvHighThreshold) * cfg.uvHighSlope;
  } else if (snapshot.uvIndex > cfg.uvMildStart) {
    uvPenalty = (snapshot.uvIndex - cfg.uvMildStart) * cfg.uvMildSlope;
  }
  uvPenalty = clamp(uvPenalty, 0, 34);

  // 3. US AQI Penalty (max 48 pts)
  let aqiPenalty = 0;
  if (snapshot.usAqi > 100) {
    const midPart = (100 - cfg.aqiHighThreshold) * cfg.aqiMidSlope;
    const basePart = (cfg.aqiHighThreshold - cfg.aqiMildStart) * 0.28;
    aqiPenalty = basePart + midPart + (snapshot.usAqi - 100) * cfg.aqiHighSlope;
  } else if (snapshot.usAqi > cfg.aqiHighThreshold) {
    const basePart = (cfg.aqiHighThreshold - cfg.aqiMildStart) * 0.28;
    aqiPenalty = basePart + (snapshot.usAqi - cfg.aqiHighThreshold) * cfg.aqiMidSlope;
  } else if (snapshot.usAqi > cfg.aqiMildStart) {
    aqiPenalty = (snapshot.usAqi - cfg.aqiMildStart) * 0.28;
  }
  aqiPenalty = clamp(aqiPenalty, 0, 48);

  // 4. Airborne Dust Penalty (max 42 pts)
  let dustPenalty = 0;
  if (snapshot.dustUgM3 > cfg.dustHighThreshold) {
    const mildPart = (cfg.dustHighThreshold - cfg.dustMildStart) * cfg.dustMildSlope;
    dustPenalty = mildPart + (snapshot.dustUgM3 - cfg.dustHighThreshold) * cfg.dustHighSlope;
  } else if (snapshot.dustUgM3 > cfg.dustMildStart) {
    dustPenalty = (snapshot.dustUgM3 - cfg.dustMildStart) * cfg.dustMildSlope;
  }
  dustPenalty = clamp(dustPenalty, 0, 42);

  const totalPenalty = Math.round(thermalPenalty + uvPenalty + aqiPenalty + dustPenalty);
  const score = clamp(100 - totalPenalty, 0, 100);

  let tier: SafetyTier = 'optimal';
  if (score < 45) tier = 'poor';
  else if (score < 75) tier = 'moderate';

  const factors: ScoreFactorBreakdown[] = [
    {
      key: 'thermal',
      label: 'Heat & Humidity',
      valueLabel: `${Math.round(snapshot.temperatureC)}°C · ${Math.round(snapshot.humidityPct)}% RH`,
      penalty: Math.round(thermalPenalty),
      tier: tierFromPenalty(thermalPenalty, 8, 22),
    },
    {
      key: 'uv',
      label: 'UV Radiation',
      valueLabel: `UV ${snapshot.uvIndex.toFixed(1)}`,
      penalty: Math.round(uvPenalty),
      tier: tierFromPenalty(uvPenalty, 6, 15),
    },
    {
      key: 'aqi',
      label: 'US Air Quality',
      valueLabel: `AQI ${Math.round(snapshot.usAqi)}`,
      penalty: Math.round(aqiPenalty),
      tier: tierFromPenalty(aqiPenalty, 9, 24),
    },
    {
      key: 'dust',
      label: 'Airborne Dust',
      valueLabel: `${Math.round(snapshot.dustUgM3)} µg/m³`,
      penalty: Math.round(dustPenalty),
      tier: tierFromPenalty(dustPenalty, 8, 20),
    },
  ];

  const sortedByPenalty = [...factors].sort((a, b) => b.penalty - a.penalty);
  const topLimiter = sortedByPenalty[0].penalty >= 6 ? sortedByPenalty[0].label : null;

  let statusLabel = 'Optimal for Activity';
  let guidance =
    'Favorable thermal, UV, and air-quality conditions for extended outdoor time.';

  if (profile === 'runner') {
    if (tier === 'optimal') {
      statusLabel = 'Optimal for Running';
      guidance =
        'Low humidity drag and clean air support sustained outdoor running pace.';
    } else if (tier === 'moderate') {
      statusLabel = 'Moderate — Pace Caution';
      guidance =
        'Elevated humidity or AQI increases exertion strain. Reduce pace, hydrate early, and shorten intervals.';
    } else {
      statusLabel = 'Poor — Move Run Indoors';
      guidance =
        'High heat, humidity, or particulate load creates heavy cardiovascular strain. Train indoors or wait for dawn.';
    }
  } else if (profile === 'pet') {
    if (tier === 'optimal') {
      statusLabel = 'Optimal for Pet Walk';
      guidance =
        'Safe air and ground warmth for dogs; still carry fresh water for longer loops.';
    } else if (tier === 'moderate') {
      statusLabel = 'Moderate — Shaded Loops';
      guidance = pavementWarning
        ? 'Limit walks to shaded grass or early/late hours and check ground temperature before stepping onto pavement.'
        : 'Keep pet walks short, choose shaded grass paths, and offer frequent water breaks.';
    } else {
      statusLabel = 'Poor — Avoid Pavement';
      guidance =
        'High thermal or air stress for pets. Postpone outdoor walks until cooler evening or early morning hours.';
    }
  } else if (profile === 'worker') {
    if (tier === 'optimal') {
      statusLabel = 'Safe Shift — Routine Hydration';
      guidance =
        'Thermal and UV load remain manageable for outdoor shifts. Drink water every 30 minutes and keep shaded rest areas accessible.';
    } else if (tier === 'moderate') {
      statusLabel = 'Caution — Scheduled Shade Breaks';
      guidance =
        'Elevated heat or UV exposure for sustained outdoor work. Mandate 10–15 minute shaded breaks every hour and hydrate with electrolytes every 20 minutes.';
    } else {
      statusLabel = 'High Heat Risk — Halt Direct Sun Work';
      guidance =
        'Severe heat-stress, UV, or dust strain for outdoor workers. Shift strenuous tasks to shaded zones or cooler hours and hydrate every 15 minutes.';
    }
  } else if (profile === 'sensitive') {
    if (tier === 'optimal') {
      statusLabel = 'Optimal for Walking';
      guidance =
        'Gentle temperatures, low UV, and clean air suitable for kids, seniors, and sensitive groups.';
    } else if (tier === 'moderate') {
      statusLabel = 'Moderate — Use Caution';
      guidance =
        'Sensitive groups should keep walks brief, choose shaded routes, and monitor breathing comfort.';
    } else {
      statusLabel = 'Poor — Limit Outdoor Activity';
      guidance =
        'High outdoor strain for heat- or air-sensitive individuals. Reschedule to an optimal window.';
    }
  } else {
    if (tier === 'optimal') {
      statusLabel = 'Optimal for Walking';
      guidance =
        'Favorable thermal, UV, and air-quality conditions for extended outdoor walks and park activity.';
    } else if (tier === 'moderate') {
      statusLabel = 'Moderate — Use Caution';
      guidance =
        'Walkable with precautions: prefer shaded paths, hydrate regularly, and avoid peak glare.';
    } else {
      statusLabel = 'Poor — Limit Outdoor Activity';
      guidance =
        'Strenuous outdoor walking is discouraged right now. Wait for cooler or cleaner walking hours.';
    }
  }

  return {
    score,
    tier,
    statusLabel,
    guidance,
    pavementWarning,
    shadeBreakWarning,
    primaryLimiter: topLimiter,
    factors,
  };
}

/**
 * Finds distinct 2–4 hour Top Walking Windows instead of lumping all 24 hours together.
 */
export function findOptimalWalkingWindows(
  hourly: HourlyMetric[],
  profile: ActivityProfile = 'general'
): WalkingWindow[] {
  if (!hourly.length) return [];

  const evaluated = hourly.map((h) => ({
    metric: h,
    evalResult: evaluateOutdoorSafety(h, profile),
  }));

  if (evaluated.length < 2) {
    const only = evaluated[0];
    return [
      {
        startTime: only.metric.time,
        endTime: only.metric.time,
        hoursCount: 1,
        avgScore: only.evalResult.score,
        peakScore: only.evalResult.score,
        minTempC: Math.round(only.metric.temperatureC),
        maxTempC: Math.round(only.metric.temperatureC),
        avgUsAqi: Math.round(only.metric.usAqi),
        tier: only.evalResult.tier,
      },
    ];
  }

  interface CandidateWindow {
    startIdx: number;
    endIdx: number;
    length: number;
    avgScore: number;
    rankScore: number;
    window: WalkingWindow;
  }

  const candidates: CandidateWindow[] = [];
  const lengths = [3, 4, 2];

  for (const len of lengths) {
    if (evaluated.length < len) continue;
    for (let start = 0; start <= evaluated.length - len; start++) {
      const slice = evaluated.slice(start, start + len);
      const scores = slice.map((s) => s.evalResult.score);
      const minInSlice = Math.min(...scores);
      const avgScore = scores.reduce((a, b) => a + b, 0) / len;

      const startHour = Number.parseInt(slice[0].metric.time.split('T')[1]?.slice(0, 2) ?? '12', 10);
      const endHour = Number.parseInt(
        slice[slice.length - 1].metric.time.split('T')[1]?.slice(0, 2) ?? '12',
        10
      );
      const practicalBonus =
        (startHour >= 5 && startHour <= 21) || (endHour >= 6 && endHour <= 22) ? 1.5 : 0;
      const durationBonus = len === 3 ? 1.2 : len === 4 ? 0.6 : 0;
      const consistencyBonus = minInSlice >= 75 ? 2.5 : 0;

      const temps = slice.map((s) => s.metric.temperatureC);
      const aqis = slice.map((s) => s.metric.usAqi);
      const roundedAvg = Math.round(avgScore);

      candidates.push({
        startIdx: start,
        endIdx: start + len - 1,
        length: len,
        avgScore: roundedAvg,
        rankScore: avgScore + practicalBonus + durationBonus + consistencyBonus,
        window: {
          startTime: slice[0].metric.time,
          endTime: slice[slice.length - 1].metric.time,
          hoursCount: len,
          avgScore: roundedAvg,
          peakScore: Math.max(...scores),
          minTempC: Math.round(Math.min(...temps)),
          maxTempC: Math.round(Math.max(...temps)),
          avgUsAqi: Math.round(aqis.reduce((a, b) => a + b, 0) / len),
          tier: roundedAvg >= 75 ? 'optimal' : roundedAvg >= 45 ? 'moderate' : 'poor',
        },
      });
    }
  }

  candidates.sort((a, b) => b.rankScore - a.rankScore);

  const selected: CandidateWindow[] = [];
  for (const cand of candidates) {
    const overlaps = selected.some(
      (picked) => !(cand.endIdx + 1 < picked.startIdx || cand.startIdx > picked.endIdx + 1)
    );
    if (!overlaps) {
      selected.push(cand);
      if (selected.length === 3) break;
    }
  }

  return selected
    .sort((a, b) => b.avgScore - a.avgScore)
    .map((item) => item.window);
}

export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Applies a realistic simulated severe dust spike for the Demo preview toggle
 * across current conditions and the first 5 hours, leaving recovery windows visible later.
 */
export function applySimulatedDustSpike(conditions: ConditionsResponse): ConditionsResponse {
  return {
    ...conditions,
    current: {
      ...conditions.current,
      usAqi: Math.max(conditions.current.usAqi, 178),
      dustUgM3: Math.max(conditions.current.dustUgM3, 265),
      pm10UgM3: Math.max(conditions.current.pm10UgM3, 285),
      pm25UgM3: Math.max(conditions.current.pm25UgM3, 74),
    },
    hourly: conditions.hourly.map((hour, idx) => {
      if (idx < 4) {
        const decay = 1 - idx * 0.14;
        return {
          ...hour,
          usAqi: Math.max(hour.usAqi, Math.round(178 * decay)),
          dustUgM3: Math.max(hour.dustUgM3, Math.round(265 * decay)),
          pm10UgM3: Math.max(hour.pm10UgM3, Math.round(285 * decay)),
          pm25UgM3: Math.max(hour.pm25UgM3, Math.round(74 * decay)),
        };
      }
      if (idx === 4 || idx === 5) {
        return {
          ...hour,
          usAqi: Math.max(hour.usAqi, 96),
          dustUgM3: Math.max(hour.dustUgM3, 75),
        };
      }
      return hour;
    }),
  };
}

export function formatHourLabel(isoLocalTime: string): string {
  const parts = isoLocalTime.split('T');
  if (parts.length === 2) {
    return parts[1].slice(0, 5);
  }
  return isoLocalTime;
}

export function formatEndHourLabel(isoLocalTime: string): string {
  const parts = isoLocalTime.split('T');
  if (parts.length !== 2) return isoLocalTime;
  const hour = Number.parseInt(parts[1].slice(0, 2), 10);
  if (Number.isNaN(hour)) return parts[1].slice(0, 5);
  const nextHour = (hour + 1) % 24;
  return `${String(nextHour).padStart(2, '0')}:00`;
}

export function getDayTag(isoLocalTime: string, referenceTime: string): string {
  const datePart = isoLocalTime.split('T')[0];
  const refDatePart = referenceTime.split('T')[0];
  return datePart === refDatePart ? 'Today' : 'Tomorrow';
}

export function describeUvLevel(uv: number): string {
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very High';
  return 'Extreme';
}

export function describeAqiLevel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Sensitive Caution';
  if (aqi <= 200) return 'Unhealthy';
  return 'Very Unhealthy';
}

export const SIGHTING_CATEGORIES: Record<
  SightingCategory,
  { label: string; severity: SafetyTier; shortHelp: string }
> = {
  dust_haze: {
    label: 'Dust Haze',
    severity: 'moderate',
    shortHelp: 'Reduced visibility or suspended sand',
  },
  flooded_paths: {
    label: 'Flooded Paths',
    severity: 'poor',
    shortHelp: 'Standing water on walkways or tracks',
  },
  high_heat: {
    label: 'High Heat',
    severity: 'poor',
    shortHelp: 'Intense surface glare or lack of shade',
  },
  stray_animals: {
    label: 'Stray Animals',
    severity: 'moderate',
    shortHelp: 'Animals active near pedestrian routes',
  },
};
