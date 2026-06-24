"use client";
import { useEffect, useRef } from "react";

interface RepPin { id: string; fullName: string; city: string; zip: string; serviceAreas: string; trainingLevel: number; availabilityStatus: string; serviceCategories: string }
interface BizPin { id: string; businessName: string; serviceAreas: string; serviceCategory: string; minRepLevel: number; servicesOffered: string }

// Geocode cities to rough lat/lng using a static lookup + fuzzy matching
const CITY_COORDS: Record<string, [number, number]> = {
  "phoenix": [33.44, -112.07], "scottsdale": [33.49, -111.92], "tempe": [33.42, -111.94],
  "mesa": [33.42, -111.83], "chandler": [33.30, -111.84], "gilbert": [33.35, -111.79],
  "glendale": [33.54, -112.19], "peoria": [33.58, -112.23], "surprise": [33.63, -112.37],
  "tucson": [32.22, -110.97], "flagstaff": [35.20, -111.65], "sedona": [34.87, -111.76],
  "las vegas": [36.17, -115.14], "henderson": [36.03, -114.98], "reno": [39.53, -119.81],
  "los angeles": [34.05, -118.24], "san diego": [32.72, -117.16], "san francisco": [37.77, -122.42],
  "denver": [39.74, -104.98], "salt lake city": [40.76, -111.89], "albuquerque": [35.08, -106.65],
  "dallas": [32.78, -96.80], "houston": [29.76, -95.37], "austin": [30.27, -97.74],
  "atlanta": [33.75, -84.39], "miami": [25.77, -80.19], "orlando": [28.54, -81.38],
  "chicago": [41.88, -87.63], "new york": [40.71, -74.01], "seattle": [47.61, -122.33],
  "portland": [45.52, -122.68], "nashville": [36.17, -86.78], "charlotte": [35.23, -80.84],
};

function getCoordsForArea(area: string): [number, number] | null {
  const lower = area.toLowerCase().trim();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) return coords;
  }
  // Try zip code — place roughly in US center with jitter
  if (/^\d{5}$/.test(area.trim())) {
    return [37.5 + Math.random() * 5 - 2.5, -95 + Math.random() * 10 - 5];
  }
  return null;
}

function getCoords(areas: string): [number, number] | null {
  const parts = areas.split(",");
  for (const p of parts) {
    const c = getCoordsForArea(p.trim());
    if (c) return c;
  }
  return null;
}

export default function MapInner({ reps, businesses }: { reps: RepPin[]; businesses: BizPin[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import("leaflet").then(L => {
      // Fix icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView([36, -98], 4);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Rep markers (green=available, yellow=busy, gray=offline)
      for (const rep of reps) {
        // Use home city/zip first for accurate placement, fall back to service areas
        const locationStr = [rep.city, rep.zip, rep.serviceAreas].filter(Boolean).join(", ");
        const coords = getCoords(locationStr);
        if (!coords) continue;
        const jitter: [number, number] = [coords[0] + (Math.random() - 0.5) * 0.3, coords[1] + (Math.random() - 0.5) * 0.3];
        const color = rep.availabilityStatus === "available" ? "#22c55e" : rep.availabilityStatus === "busy" ? "#eab308" : "#9ca3af";
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;color:white;">${rep.trainingLevel}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        L.marker(jitter, { icon })
          .bindPopup(`<b>${rep.fullName}</b><br>Level ${rep.trainingLevel}<br>${rep.city ? rep.city + (rep.zip ? " " + rep.zip : "") + "<br>" : ""}Status: ${rep.availabilityStatus}<br><small>${rep.serviceAreas}</small>`)
          .addTo(map);
      }

      // Business markers (blue)
      for (const biz of businesses) {
        const coords = getCoords(biz.serviceAreas);
        if (!coords) continue;
        const jitter: [number, number] = [coords[0] + (Math.random() - 0.5) * 0.4, coords[1] + (Math.random() - 0.5) * 0.4];
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:32px;height:32px;border-radius:6px;background:#2563eb;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;color:white;font-weight:bold;">B</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        L.marker(jitter, { icon })
          .bindPopup(`<b>${biz.businessName}</b><br>${biz.serviceCategory || biz.servicesOffered}<br>Min Level: ${biz.minRepLevel}<br><small>${biz.serviceAreas}</small>`)
          .addTo(map);
      }

      // Fit bounds if markers exist
      const allAreas = [...reps.map(r => r.serviceAreas), ...businesses.map(b => b.serviceAreas)];
      const allCoords = allAreas.map(a => getCoords(a)).filter(Boolean) as [number, number][];

      if (allCoords.length > 0) {
        map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40], maxZoom: 10 });
      }
    });

    return () => {
      if (mapInstance.current) {
        (mapInstance.current as { remove: () => void }).remove();
        mapInstance.current = null;
      }
    };
  }, [reps, businesses]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="h-[360px] sm:h-[520px] rounded-xl border border-slate-200 overflow-hidden z-0 shadow-sm" />
      <div className="flex flex-wrap gap-3 mt-3 text-xs sm:text-sm text-slate-600">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>Available rep</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>Busy rep</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-400 inline-block"></span>Offline rep</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#0f2044] inline-block"></span>Business</span>
      </div>
    </>
  );
}
