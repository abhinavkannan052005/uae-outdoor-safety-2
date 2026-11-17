import type {
  ActivityProfile,
  EmirateId,
  Language,
  SafetyTier,
  ShadeLevel,
  SightingCategory,
} from '../types/weather';

export interface TranslationBundle {
  brandTitle: string;
  nav: {
    overview: string;
    walkingWindows: string;
    hourlyOutlook: string;
    communitySightings: string;
  };
  topActions: {
    simulateDust: string;
    dustActive: string;
    reportSighting: string;
  };
  workspace: {
    selectLocation: string;
    updatedPrefix: string;
    gst: string;
    refresh: string;
    useMyLocation: string;
    locating: string;
    activityProfile: string;
    geoUnsupported: string;
    geoDenied: string;
    geoTimeout: string;
    geoFailed: string;
  };
  emirates: Record<EmirateId, { name: string; coastalNote: string }>;
  profiles: Record<ActivityProfile, { label: string; description: string }>;
  hero: {
    yourGpsLocation: string;
    nearestPrefix: string;
    title: string;
    briefingTitle: string;
    briefingSourceGemini: string;
    briefingSourceLive: string;
    briefingLoading: string;
    profilePrefix: string;
    primaryFactorPrefix: string;
    allComfort: string;
    temperature: string;
    feels: string;
    wind: string;
    reading: string;
    humidity: string;
    uvIndex: string;
    aqiAndDust: string;
    dustLabel: string;
    simulatedHazardTitle: string;
    activeHazardTitle: string;
    hazardPrefix: string;
    hazardMiddle: string;
    hazardSuffix: string;
    shareWhatsApp: string;
    exitDemo: string;
    loadErrorTitle: string;
    tryAgain: string;
    humidityHighNote: string;
    humidityBalancedNote: string;
    uvHighNote: string;
    uvModerateNote: string;
    uvLowNote: string;
    tempStatus: Record<SafetyTier, string>;
    humidityStatus: Record<SafetyTier, string>;
  };
  walking: {
    title: string;
    subtitlePrefix: string;
    subtitleOptimalSuffix: string;
    legendOptimal: string;
    legendModerate: string;
    legendPoor: string;
    topWindow: string;
    windowLabel: string;
    optimalBadge: string;
    bestAvailableBadge: string;
    hrs: string;
    hr: string;
    avgAqi: string;
    timelinePrompt: string;
    localTimeGst: string;
    today: string;
    tomorrow: string;
    scoreLabel: string;
    suggestedSpotsTitle: string;
    shadedPriorityNote: string;
    shadeLabels: Record<ShadeLevel, string>;
  };
  table: {
    title: string;
    subtitle: string;
    allHours: string;
    optimalOnly: string;
    emptyTitle: string;
    emptyHint: string;
    showAll: string;
    colTime: string;
    colScore: string;
    colCondition: string;
    colTempFeels: string;
    colHumidity: string;
    colUv: string;
    colAqi: string;
    colDust: string;
    tierShort: Record<SafetyTier, string>;
  };
  sightings: {
    title: string;
    subtitle: string;
    allEmirates: string;
    selectedEmirate: string;
    conditionLabel: string;
    areaPlaceholder: string;
    detailPlaceholder: string;
    postReport: string;
    posting: string;
    locationError: string;
    submitError: string;
    submitSuccess: string;
    filterLabel: string;
    allCategories: string;
    emptyTitle: string;
    emptyHint: string;
    confirmStillThere: string;
    confirmed: string;
    justNow: string;
    minutesAgo: (m: number) => string;
    hoursAgo: (h: number) => string;
    expiringSoon: string;
    expiresInHours: (h: number, m: number) => string;
    expiresInMinutes: (m: number) => string;
    mapTitle: string;
    legendDust: string;
    legendHeat: string;
    legendFlooded: string;
    legendAnimals: string;
    categories: Record<SightingCategory, string>;
  };
  footer: {
    left: string;
    right: string;
    installApp: string;
    installIosTitle: string;
    installIosBody: string;
    close: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationBundle> = {
  en: {
    brandTitle: 'UAE Outdoor Safety',
    nav: {
      overview: 'Overview',
      walkingWindows: 'Walking Windows',
      hourlyOutlook: 'Hourly Outlook',
      communitySightings: 'Community Sightings',
    },
    topActions: {
      simulateDust: 'Demo: Simulate Dust Spike',
      dustActive: 'Demo: Dust Spike Active',
      reportSighting: 'Report Sighting',
    },
    workspace: {
      selectLocation: 'Select Emirate or GPS Location',
      updatedPrefix: 'Updated',
      gst: 'GST',
      refresh: 'Refresh',
      useMyLocation: 'Use My Location',
      locating: 'Locating...',
      activityProfile: 'Activity Profile',
      geoUnsupported: 'Browser geolocation is not supported on this device.',
      geoDenied: 'Location permission denied. Allow access or select an Emirate.',
      geoTimeout: 'Location request timed out. Please try again or select an Emirate.',
      geoFailed: 'Unable to determine your current location.',
    },
    emirates: {
      'abu-dhabi': { name: 'Abu Dhabi', coastalNote: 'Arabian Gulf Coast' },
      dubai: { name: 'Dubai', coastalNote: 'Arabian Gulf Coast' },
      sharjah: { name: 'Sharjah', coastalNote: 'Gulf & Lagoon Corridor' },
      ajman: { name: 'Ajman', coastalNote: 'Northern Gulf Coast' },
      'umm-al-quwain': { name: 'Umm Al Quwain', coastalNote: 'Khor Al Beidah Coast' },
      'ras-al-khaimah': { name: 'Ras Al Khaimah', coastalNote: 'Northern Coast & Foothills' },
      fujairah: { name: 'Fujairah', coastalNote: 'Gulf of Oman Coast' },
    },
    profiles: {
      general: {
        label: 'General Walk',
        description: 'Standard outdoor comfort thresholds',
      },
      sensitive: {
        label: 'Sensitive / Kids',
        description: 'Stricter heat, UV & air thresholds',
      },
      runner: {
        label: 'Outdoor Runner',
        description: 'Stricter humidity & AQI exertion penalties',
      },
      pet: {
        label: 'Pet Walk',
        description: 'Adds pavement heat warnings above 30°C or UV 7',
      },
      worker: {
        label: 'Outdoor Worker',
        description: 'Strict heat-stress & UV penalties with shade & hydration break guidance',
      },
    },
    hero: {
      yourGpsLocation: 'Your GPS Location',
      nearestPrefix: 'Nearest',
      title: 'Best Time to Go Outside',
      briefingTitle: 'Live Resident Briefing',
      briefingSourceGemini: 'AI Summary',
      briefingSourceLive: 'Live Advisory',
      briefingLoading: 'Generating current resident briefing...',
      profilePrefix: 'Profile',
      primaryFactorPrefix: 'Primary factor',
      allComfort: 'All factors within comfort range',
      temperature: 'Temperature',
      feels: 'Feels',
      wind: 'Wind',
      reading: 'Reading',
      humidity: 'Relative Humidity',
      uvIndex: 'UV Index',
      aqiAndDust: 'US AQI & Airborne Dust',
      dustLabel: 'Dust',
      simulatedHazardTitle: 'Simulated Dust Hazard Alert',
      activeHazardTitle: 'Active Air & Dust Hazard Alert',
      hazardPrefix: 'Airborne dust at',
      hazardMiddle: 'and US AQI',
      hazardSuffix:
        'Suspend outdoor walks and stay indoors with filtered air until recovery hours.',
      shareWhatsApp: 'Share on WhatsApp',
      exitDemo: 'Exit Demo',
      loadErrorTitle: 'Unable to load live Open-Meteo readings',
      tryAgain: 'Try Again',
      humidityHighNote: 'High moisture slows sweat cooling during outdoor exercise',
      humidityBalancedNote: 'Supports comfortable evaporative cooling',
      uvHighNote: 'Shade, hat, and SPF 30+ recommended outdoors',
      uvModerateNote: 'Moderate solar exposure; sunglasses advised',
      uvLowNote: 'Minimal UV exposure risk',
      tempStatus: {
        optimal: 'Comfortable',
        moderate: 'Warm',
        poor: 'Heat Stress',
      },
      humidityStatus: {
        optimal: 'Dry / Balanced',
        moderate: 'Humid',
        poor: 'Muggy',
      },
    },
    walking: {
      title: 'Optimal Walking Hours',
      subtitlePrefix: 'Next 24 hours scored across thermal comfort, UV exposure, US AQI, and airborne dust.',
      subtitleOptimalSuffix: 'upcoming hours rate Optimal (75+).',
      legendOptimal: 'Optimal (75–100)',
      legendModerate: 'Moderate (45–74)',
      legendPoor: 'Poor (0–44)',
      topWindow: 'Top Walking Window',
      windowLabel: 'Window',
      optimalBadge: 'Optimal',
      bestAvailableBadge: 'Best Available',
      hrs: 'hrs',
      hr: 'hr',
      avgAqi: 'Avg AQI',
      timelinePrompt: '24-Hour Safety Timeline (select any hour to inspect)',
      localTimeGst: 'Local Time (GST)',
      today: 'Today',
      tomorrow: 'Tomorrow',
      scoreLabel: 'Score',
      suggestedSpotsTitle: 'Suggested Local Walking Spots',
      shadedPriorityNote: 'High UV / Heat — Shaded spots highlighted',
      shadeLabels: {
        high_shade: 'High Shade',
        waterfront_breeze: 'Waterfront Breeze',
        open_track: 'Open Track',
      },
    },
    table: {
      title: 'Hourly Weather & Air Quality Outlook',
      subtitle: 'Live Open-Meteo hourly forecast aligned to Gulf Standard Time (UTC+4).',
      allHours: 'All 24 Hours',
      optimalOnly: 'Optimal Only',
      emptyTitle: 'No hours reach an Optimal (75+) score for this profile.',
      emptyHint: 'Switch to All 24 Hours to compare the highest-scoring moderate walking windows.',
      showAll: 'Show All 24 Hours',
      colTime: 'Time (GST)',
      colScore: 'Walk Score',
      colCondition: 'Condition',
      colTempFeels: 'Temp / Feels',
      colHumidity: 'Humidity',
      colUv: 'UV Index',
      colAqi: 'US AQI',
      colDust: 'Dust (µg/m³)',
      tierShort: {
        optimal: 'Optimal',
        moderate: 'Moderate',
        poor: 'Poor',
      },
    },
    sightings: {
      title: 'Community Sightings',
      subtitle:
        'Live resident ground reports with auto-expiry timers, confirmations, and interactive UAE pin locations.',
      allEmirates: 'All Emirates',
      selectedEmirate: 'Selected Emirate',
      conditionLabel: 'Condition:',
      areaPlaceholder: 'Area or path (e.g., Al Majaz, Kite Beach, Yas Bay)',
      detailPlaceholder: 'Brief detail (optional)',
      postReport: 'Post Report',
      posting: 'Posting...',
      locationError: 'Enter a specific walkway, corniche, park, or street name.',
      submitError: 'Unable to submit sighting.',
      submitSuccess: 'Report posted to the live community feed and map.',
      filterLabel: 'Filter reports:',
      allCategories: 'All Categories',
      emptyTitle: 'No active community sightings match this filter.',
      emptyHint: 'Switch to All Emirates or post a new ground report above.',
      confirmStillThere: 'Confirm Still There',
      confirmed: 'Confirmed',
      justNow: 'Just now',
      minutesAgo: (m) => `${m}m ago`,
      hoursAgo: (h) => `${h}h ago`,
      expiringSoon: 'Expiring soon',
      expiresInHours: (h, m) => (m > 0 ? `Expires in ${h}h ${m}m` : `Expires in ${h}h`),
      expiresInMinutes: (m) => `Expires in ${m}m`,
      mapTitle: 'Live UAE Sightings Map',
      legendDust: 'Dust',
      legendHeat: 'Heat',
      legendFlooded: 'Flooded',
      legendAnimals: 'Animals',
      categories: {
        dust_haze: 'Dust Haze',
        flooded_paths: 'Flooded Paths',
        high_heat: 'High Heat',
        stray_animals: 'Stray Animals',
      },
    },
    footer: {
      left: 'UAE Outdoor Safety · Live meteorological & air quality telemetry via Open-Meteo',
      right: 'Scores reflect current temperature, humidity, UV index, US AQI, and airborne dust',
      installApp: 'Install App',
      installIosTitle: 'Install on iPhone / iPad',
      installIosBody:
        'Tap the Share icon in Safari, then scroll down and select Add to Home Screen.',
      close: 'Close',
    },
  },
  ar: {
    brandTitle: 'سلامة الهواء والطقس بالإمارات',
    nav: {
      overview: 'نظرة عامة',
      walkingWindows: 'أفضل أوقات المشي',
      hourlyOutlook: 'التوقعات الساعية',
      communitySightings: 'بلاغات المجتمع',
    },
    topActions: {
      simulateDust: 'تجربة: محاكاة موجة غبار',
      dustActive: 'موجة الغبار التجريبية نشطة',
      reportSighting: 'إبلاغ ميداني',
    },
    workspace: {
      selectLocation: 'اختر الإمارة أو موقعك الجغرافي',
      updatedPrefix: 'آخر تحديث',
      gst: 'توقيت الإمارات',
      refresh: 'تحديث',
      useMyLocation: 'استخدام موقعي',
      locating: 'جاري التحديد...',
      activityProfile: 'نوع النشاط',
      geoUnsupported: 'تحديد الموقع الجغرافي غير مدعوم في هذا المتصفح.',
      geoDenied: 'تم رفض إذن الموقع. يرجى السماح بالوصول أو اختيار إمارة.',
      geoTimeout: 'انتهت مهلة تحديد الموقع. حاول مجدداً أو اختر إمارة.',
      geoFailed: 'تعذر تحديد موقعك الحالي.',
    },
    emirates: {
      'abu-dhabi': { name: 'أبوظبي', coastalNote: 'ساحل الخليج العربي' },
      dubai: { name: 'دبي', coastalNote: 'ساحل الخليج العربي' },
      sharjah: { name: 'الشارقة', coastalNote: 'الخليج وبحيرة خالد' },
      ajman: { name: 'عجمان', coastalNote: 'الساحل الشمالي' },
      'umm-al-quwain': { name: 'أم القيوين', coastalNote: 'ساحل خور البيضاء' },
      'ras-al-khaimah': { name: 'رأس الخيمة', coastalNote: 'الساحل الشمالي والسفوح' },
      fujairah: { name: 'الفجيرة', coastalNote: 'ساحل خليج عُمان' },
    },
    profiles: {
      general: {
        label: 'مشي عام',
        description: 'معايير الراحة الخارجية القياسية',
      },
      sensitive: {
        label: 'حساسون / أطفال',
        description: 'حدود أكثر صرامة للحرارة والأشعة وجودة الهواء',
      },
      runner: {
        label: 'الجري الخارجي',
        description: 'تشديد خصم الرطوبة وجودة الهواء أثناء المجهود',
      },
      pet: {
        label: 'نزهة الحيوانات الأليفة',
        description: 'تنبيه سخونة الأرصفة فوق 30°م أو مؤشر أشعة 7',
      },
      worker: {
        label: 'العمل الخارجي',
        description: 'تقييم صارم للإجهاد الحراري والأشعة مع إرشادات الظل والترطيب',
      },
    },
    hero: {
      yourGpsLocation: 'موقعك الجغرافي (GPS)',
      nearestPrefix: 'الأقرب',
      title: 'أفضل وقت للخروج',
      briefingTitle: 'الملخص الميداني المباشر',
      briefingSourceGemini: 'ملخص ذكي',
      briefingSourceLive: 'تنبيه مباشر',
      briefingLoading: 'جاري إعداد الملخص الميداني...',
      profilePrefix: 'النشاط',
      primaryFactorPrefix: 'العامل المؤثر',
      allComfort: 'جميع المؤشرات ضمن النطاق المريح',
      temperature: 'درجة الحرارة',
      feels: 'المحسوسة',
      wind: 'الرياح',
      reading: 'القراءة',
      humidity: 'الرطوبة النسبية',
      uvIndex: 'مؤشر الأشعة فوق البنفسجية',
      aqiAndDust: 'جودة الهواء والغبار العالق',
      dustLabel: 'الغبار',
      simulatedHazardTitle: 'تنبيه تجربة موجة غبار',
      activeHazardTitle: 'تنبيه نشط لجودة الهواء والغبار',
      hazardPrefix: 'تركيز الغبار العالق عند',
      hazardMiddle: 'ومؤشر جودة الهواء US AQI',
      hazardSuffix:
        'يُنصح بتعليق المشي الخارجي والبقاء في أماكن مغلقة حتى تحسن الأجواء.',
      shareWhatsApp: 'مشاركة عبر واتساب',
      exitDemo: 'إنهاء التجربة',
      loadErrorTitle: 'تعذر تحميل القراءات المباشرة من Open-Meteo',
      tryAgain: 'إعادة المحاولة',
      humidityHighNote: 'الرطوبة المرتفعة تبطئ تبريد الجسم أثناء النشاط الخارجي',
      humidityBalancedNote: 'رطوبة معتدلة تساعد على التبريد الطبيعي للجسم',
      uvHighNote: 'يُنصح بالمشي في الظل وارتداء قبعة وواقي شمس SPF 30+',
      uvModerateNote: 'تعرض شمسي متوسط؛ يُنصح بنظارات شمسية',
      uvLowNote: 'خطر الأشعة فوق البنفسجية منخفض',
      tempStatus: {
        optimal: 'مريح',
        moderate: 'دافئ',
        poor: 'إجهاد حراري',
      },
      humidityStatus: {
        optimal: 'جاف / متوازن',
        moderate: 'رطب',
        poor: 'رطوبة عالية',
      },
    },
    walking: {
      title: 'أفضل ساعات المشي',
      subtitlePrefix: 'تقييم الساعات الـ 24 القادمة حسب الحرارة والأشعة وجودة الهواء والغبار.',
      subtitleOptimalSuffix: 'ساعة قادمة مصنفة مثالية (75+).',
      legendOptimal: 'مثالي (75–100)',
      legendModerate: 'متوسط (45–74)',
      legendPoor: 'ضعيف (0–44)',
      topWindow: 'أفضل فترة للمشي',
      windowLabel: 'الفترة',
      optimalBadge: 'مثالي',
      bestAvailableBadge: 'الأفضل المتاح',
      hrs: 'ساعات',
      hr: 'ساعة',
      avgAqi: 'متوسط AQI',
      timelinePrompt: 'المخطط الزمني للسلامة خلال 24 ساعة (اضغط على أي ساعة للتفاصيل)',
      localTimeGst: 'التوقيت المحلي (GST)',
      today: 'اليوم',
      tomorrow: 'غداً',
      scoreLabel: 'المؤشر',
      suggestedSpotsTitle: 'أماكن مقترحة للمشي محلياً',
      shadedPriorityNote: 'أشعة أو حرارة مرتفعة — إبراز المسارات المظللة',
      shadeLabels: {
        high_shade: 'ظل كثيف',
        waterfront_breeze: 'نسيم الواجهة البحرية',
        open_track: 'مسار مفتوح',
      },
    },
    table: {
      title: 'التوقعات الساعية للطقس وجودة الهواء',
      subtitle: 'توقعات Open-Meteo الساعية المباشرة بتوقيت الخليج القياسي (UTC+4).',
      allHours: 'جميع الساعات (24)',
      optimalOnly: 'المثالية فقط',
      emptyTitle: 'لا توجد ساعات تصل إلى التصنيف المثالي (75+) لهذا النشاط.',
      emptyHint: 'اختر جميع الساعات للمقارنة بين أفضل الفترات المتاحة.',
      showAll: 'عرض جميع الساعات (24)',
      colTime: 'الوقت',
      colScore: 'مؤشر المشي',
      colCondition: 'الحالة',
      colTempFeels: 'الحرارة / المحسوسة',
      colHumidity: 'الرطوبة',
      colUv: 'الأشعة UV',
      colAqi: 'مؤشر AQI',
      colDust: 'الغبار (µg/m³)',
      tierShort: {
        optimal: 'مثالي',
        moderate: 'متوسط',
        poor: 'ضعيف',
      },
    },
    sightings: {
      title: 'بلاغات المجتمع',
      subtitle:
        'بلاغات ميدانية فورية من السكان مع عداد انتهاء تلقائي وتأكيدات وخريطة تفاعلية للإمارات.',
      allEmirates: 'كل الإمارات',
      selectedEmirate: 'الإمارة المختارة',
      conditionLabel: 'نوع الحالة:',
      areaPlaceholder: 'المنطقة أو الممشى (مثال: واجهة المجاز، كايت بيتش، ياس باي)',
      detailPlaceholder: 'وصف مختصر (اختياري)',
      postReport: 'إرسال البلاغ',
      posting: 'جاري الإرسال...',
      locationError: 'يرجى إدخال اسم الممشى أو الكورنيش أو الحديقة أو الشارع.',
      submitError: 'تعذر إرسال البلاغ.',
      submitSuccess: 'تم نشر البلاغ في القائمة المباشرة وعلى الخريطة.',
      filterLabel: 'تصفية البلاغات:',
      allCategories: 'كل الفئات',
      emptyTitle: 'لا توجد بلاغات نشطة مطابقة لهذه التصفية.',
      emptyHint: 'اعرض كل الإمارات أو أضف بلاغاً ميدانياً جديداً أعلاه.',
      confirmStillThere: 'تأكيد استمرار الحالة',
      confirmed: 'تم التأكيد',
      justNow: 'الآن',
      minutesAgo: (m) => `منذ ${m} د`,
      hoursAgo: (h) => `منذ ${h} س`,
      expiringSoon: 'ينتهي قريباً',
      expiresInHours: (h, m) => (m > 0 ? `ينتهي خلال ${h} س ${m} د` : `ينتهي خلال ${h} س`),
      expiresInMinutes: (m) => `ينتهي خلال ${m} د`,
      mapTitle: 'خريطة البلاغات المباشرة في الإمارات',
      legendDust: 'غبار',
      legendHeat: 'حرارة',
      legendFlooded: 'تجمعات مياه',
      legendAnimals: 'حيوانات',
      categories: {
        dust_haze: 'ضباب ترابي / غبار',
        flooded_paths: 'مسارات مغمورة بالمياه',
        high_heat: 'حرارة مرتفعة',
        stray_animals: 'حيوانات سائبة',
      },
    },
    footer: {
      left: 'سلامة الهواء والطقس بالإمارات · بيانات أرصاد وجودة هواء مباشرة عبر Open-Meteo',
      right: 'تعكس المؤشرات الحرارة والرطوبة والأشعة فوق البنفسجية وجودة الهواء والغبار العالق',
      installApp: 'تثبيت التطبيق',
      installIosTitle: 'التثبيت على iPhone / iPad',
      installIosBody:
        'اضغط على زر المشاركة في متصفح Safari ثم اختر الإضافة إلى الشاشة الرئيسية.',
      close: 'إغلاق',
    },
  },
};

export function translateEvaluationCopy(
  language: Language,
  profile: ActivityProfile,
  tier: SafetyTier,
  tempC: number,
  uvIndex: number,
  primaryLimiterKey?: 'thermal' | 'uv' | 'aqi' | 'dust'
): {
  statusLabel: string;
  guidance: string;
  pavementWarning?: string;
  shadeBreakWarning?: string;
  primaryLimiterLabel?: string;
} {
  if (language === 'en') {
    return { statusLabel: '', guidance: '' };
  }

  const limiterMap: Record<'thermal' | 'uv' | 'aqi' | 'dust', string> = {
    thermal: 'الحرارة والرطوبة',
    uv: 'الأشعة فوق البنفسجية',
    aqi: 'جودة الهواء',
    dust: 'الغبار العالق',
  };

  let pavementWarning: string | undefined;
  if (profile === 'pet' && (tempC > 30 || uvIndex > 7)) {
    pavementWarning = `تحذير سخونة الأرصفة (الحرارة ${tempC.toFixed(1)}°م · الأشعة ${uvIndex.toFixed(1)}): قد تسبب الأرصفة الحارة حروقاً لأقدام الحيوانات الأليفة. اختر المسارات العشبية المظللة أو اختبر السطح بظهر اليد لـ 5 ثوانٍ.`;
  }

  let shadeBreakWarning: string | undefined;
  if (profile === 'worker' && (tempC > 28 || uvIndex >= 6)) {
    shadeBreakWarning = `بروتوكول الظل والترطيب (الحرارة ${tempC.toFixed(1)}°م · الأشعة ${uvIndex.toFixed(1)}): يُنصح بالتناوب إلى محطات استراحة مظللة كل 30–45 دقيقة وشرب الماء البارد مع الأملاح كل 15–20 دقيقة.`;
  }

  let statusLabel = 'مثالي للمشي';
  let guidance = 'الأجواء مريحة ومناسبة للمشي والأنشطة الخارجية لفترات ممتدة.';

  if (profile === 'runner') {
    if (tier === 'optimal') {
      statusLabel = 'مثالي للجري';
      guidance = 'انخفاض الرطوبة ونقاء الهواء يدعمان الجري الخارجي بوتيرة مريحة.';
    } else if (tier === 'moderate') {
      statusLabel = 'متوسط — خفف الوتيرة';
      guidance = 'ارتفاع الرطوبة أو مؤشر الهواء يزيد الجهد. خفف السرعة واشرب الماء مبكراً.';
    } else {
      statusLabel = 'ضعيف — يُنصح بالجري داخلياً';
      guidance = 'الحرارة أو الجسيمات العالقة ترفع الإجهاد البدني. تمرن داخلياً أو انتظر الفجر.';
    }
  } else if (profile === 'pet') {
    if (tier === 'optimal') {
      statusLabel = 'مثالي لنزهة الحيوانات';
      guidance = 'هواء آمن وحرارة مناسبة لنزهة الحيوانات الأليفة؛ احمل ماءً للشرب.';
    } else if (tier === 'moderate') {
      statusLabel = 'متوسط — مسارات مظللة';
      guidance = pavementWarning
        ? 'اقتصر على العشب المظلل أو ساعات الصباح الباكر والمساء وتأكد من برودة الرصيف.'
        : 'اجعل النزهة قصيرة في مسارات مظللة مع فترات راحة وشرب ماء.';
    } else {
      statusLabel = 'ضعيف — تجنب الأرصفة';
      guidance = 'إجهاد حراري أو هوائي مرتفع على الحيوانات الأليفة. أجّل النزهة للمساء أو الفجر.';
    }
  } else if (profile === 'worker') {
    if (tier === 'optimal') {
      statusLabel = 'آمن للعمل — ترطيب منتظم';
      guidance = 'الأحمال الحرارية والأشعة معتدلة. اشرب الماء كل 30 دقيقة وحافظ على فترات راحة في الظل.';
    } else if (tier === 'moderate') {
      statusLabel = 'حذر — فترات راحة في الظل';
      guidance = 'ارتفاع الحرارة أو الأشعة يتطلب استراحة مظللة 10–15 دقيقة كل ساعة والترطيب بالأملاح كل 20 دقيقة.';
    } else {
      statusLabel = 'خطر إجهاد حراري — تجنب الشمس المباشرة';
      guidance = 'إجهاد حراري أو أشعة شديدة للعمل الخارجي. انقل المهام إلى مناطق مظللة ووفر فترات تبريد وترطيب كل 15 دقيقة.';
    }
  } else if (profile === 'sensitive') {
    if (tier === 'optimal') {
      statusLabel = 'مثالي للخروج';
      guidance = 'درجات حرارة معتدلة وهواء نقي مناسب للأطفال وكبار السن والفئات الحساسة.';
    } else if (tier === 'moderate') {
      statusLabel = 'متوسط — توخَّ الحذر';
      guidance = 'يُفضل تقليل مدة المشي للفئات الحساسة واختيار المسارات المظللة.';
    } else {
      statusLabel = 'ضعيف — قلل الخروج';
      guidance = 'إجهاد حراري أو هوائي مرتفع للفئات الحساسة. انتظر فترة مثالية لاحقاً.';
    }
  } else {
    if (tier === 'moderate') {
      statusLabel = 'متوسط — توخَّ الحذر';
      guidance = 'مناسب للمشي مع الحذر: التزم بالظل واشرب الماء بانتظام وتجنب الذروة الشمسية.';
    } else if (tier === 'poor') {
      statusLabel = 'ضعيف — قلل النشاط الخارجي';
      guidance = 'لا يُنصح بالمشي المجهد الآن. انتظر ساعات المساء أو الصباح الأكثر اعتدالاً.';
    }
  }

  return {
    statusLabel,
    guidance,
    pavementWarning,
    shadeBreakWarning,
    primaryLimiterLabel: primaryLimiterKey ? limiterMap[primaryLimiterKey] : undefined,
  };
}

export function translateUvLabel(uv: number, language: Language): string {
  if (language === 'en') {
    if (uv < 3) return 'Low';
    if (uv < 6) return 'Moderate';
    if (uv < 8) return 'High';
    if (uv < 11) return 'Very High';
    return 'Extreme';
  }
  if (uv < 3) return 'منخفض';
  if (uv < 6) return 'متوسط';
  if (uv < 8) return 'مرتفع';
  if (uv < 11) return 'مرتفع جداً';
  return 'شديد';
}

export function translateAqiLabel(aqi: number, language: Language): string {
  if (language === 'en') {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Sensitive Caution';
    if (aqi <= 200) return 'Unhealthy';
    return 'Very Unhealthy';
  }
  if (aqi <= 50) return 'جيد';
  if (aqi <= 100) return 'متوسط';
  if (aqi <= 150) return 'حذر للحساسين';
  if (aqi <= 200) return 'غير صحي';
  return 'غير صحي جداً';
}
