import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EMIRATE_MAP } from '../data/emirates';
import type {
  CommunitySighting,
  EmirateId,
  Language,
  SightingCategory,
} from '../types/weather';
import { TRANSLATIONS } from '../utils/i18n';

interface SightingsMapProps {
  sightings: CommunitySighting[];
  selectedEmirate: EmirateId;
  scopeFilter: 'emirate' | 'all';
  activeSightingId: string | null;
  onSelectSighting: (id: string) => void;
  language: Language;
}

const PIN_COLOR: Record<SightingCategory, string> = {
  dust_haze: '#D97706',
  flooded_paths: '#2563EB',
  high_heat: '#DC2626',
  stray_animals: '#0F766E',
};

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function SightingsMap({
  sightings,
  selectedEmirate,
  scopeFilter,
  activeSightingId,
  onSelectSighting,
  language,
}: SightingsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [24.95, 55.15],
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
      markerMapRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    markerMapRef.current.clear();

    const dirAttr = language === 'ar' ? 'rtl' : 'ltr';

    sightings.forEach((item) => {
      const color = PIN_COLOR[item.category];
      const catLabel = t.sightings.categories[item.category];
      const emirateLabel = t.emirates[item.emirateId]?.name ?? item.emirateName;
      const isSelected = item.id === activeSightingId;

      const marker = L.circleMarker([item.latitude, item.longitude], {
        radius: isSelected ? 10 : 8,
        fillColor: color,
        color: '#FFFFFF',
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.92,
      });

      const popupHtml = `
        <div dir="${dirAttr}" style="font-family: 'Public Sans', 'IBM Plex Sans Arabic', system-ui, sans-serif; min-width: 180px;">
          <div style="font-size: 11px; font-weight: 600; color: ${color}; margin-bottom: 2px;">
            ${escapeHtml(catLabel)}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0F172A;">
            ${escapeHtml(item.locationNote)}
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">
            ${escapeHtml(emirateLabel)} · ${item.confirmations} ${escapeHtml(t.sightings.confirmed)}
          </div>
          ${
            item.description
              ? `<div style="font-size: 12px; color: #334155; margin-top: 6px; line-height: 1.4;">${escapeHtml(item.description)}</div>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectSighting(item.id);
      });

      marker.addTo(group);
      markerMapRef.current.set(item.id, marker);
    });
  }, [sightings, activeSightingId, onSelectSighting, language, t]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (activeSightingId) {
      const target = sightings.find((s) => s.id === activeSightingId);
      const marker = markerMapRef.current.get(activeSightingId);
      if (target && marker) {
        map.panTo([target.latitude, target.longitude], { animate: true });
        marker.openPopup();
        return;
      }
    }

    if (scopeFilter === 'emirate') {
      const em = EMIRATE_MAP[selectedEmirate];
      map.setView([em.latitude, em.longitude], 11, { animate: true });
    } else {
      map.setView([24.95, 55.15], 8, { animate: true });
    }
  }, [activeSightingId, scopeFilter, selectedEmirate, sightings]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">
          {t.sightings.mapTitle}
        </span>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" aria-hidden="true" />
            {t.sightings.legendDust}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" aria-hidden="true" />
            {t.sightings.legendHeat}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" aria-hidden="true" />
            {t.sightings.legendFlooded}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-700 inline-block" aria-hidden="true" />
            {t.sightings.legendAnimals}
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        aria-label={t.sightings.mapTitle}
        className="w-full h-[360px] lg:h-full lg:min-h-[460px] z-0 bg-slate-100"
      />
    </div>
  );
}
