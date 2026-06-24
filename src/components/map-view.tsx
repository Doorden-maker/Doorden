"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapInner = dynamic(() => import("./map-inner"), { ssr: false, loading: () => <div className="h-[600px] bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">Loading map...</div> });

interface RepPin { id: string; fullName: string; city: string; zip: string; serviceAreas: string; trainingLevel: number; availabilityStatus: string; serviceCategories: string }
interface BizPin { id: string; businessName: string; serviceAreas: string; serviceCategory: string; minRepLevel: number; servicesOffered: string }

export function MapView({ userRole }: { userRole: string }) {
  const [data, setData] = useState<{ reps: RepPin[]; businesses: BizPin[] } | null>(null);
  const [filter, setFilter] = useState<"all" | "reps" | "businesses">("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/api/map").then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="h-[600px] bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 animate-pulse">Loading map data...</div>;

  const filteredReps = data.reps.filter(r => {
    if (filter === "businesses") return false;
    if (statusFilter !== "all" && r.availabilityStatus !== statusFilter) return false;
    return true;
  });

  const filteredBiz = data.businesses.filter(() => filter !== "reps");

  return (
    <div>
      {/* Controls */}
      <div className="bg-white border rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {(["all", "reps", "businesses"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {f === "all" ? "All" : f === "reps" ? "Reps" : "Businesses"}
            </button>
          ))}
        </div>
        {filter !== "businesses" && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="available">Available only</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>
        )}
        <div className="ml-auto flex items-center gap-4 text-sm text-gray-600">
          {filter !== "businesses" && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> {filteredReps.filter(r => r.availabilityStatus === "available").length} available reps</span>}
          {filter !== "reps" && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> {filteredBiz.length} businesses</span>}
        </div>
      </div>

      <MapInner reps={filteredReps} businesses={filteredBiz} />

      {/* List below map */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {filter !== "businesses" && filteredReps.slice(0, 12).map(r => (
          <div key={r.id} className="bg-white border rounded-lg p-4 flex items-start gap-3">
            <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${r.availabilityStatus === "available" ? "bg-green-500" : r.availabilityStatus === "busy" ? "bg-yellow-500" : "bg-gray-400"}`} />
            <div>
              <p className="font-medium text-gray-900">{r.fullName} <span className="text-xs text-blue-600 ml-1">Lvl {r.trainingLevel}</span></p>
              <p className="text-xs text-gray-500">{r.city ? `${r.city}${r.zip ? ` ${r.zip}` : ""}` : r.serviceAreas}</p>
              {r.serviceCategories && <p className="text-xs text-gray-400">{r.serviceCategories}</p>}
            </div>
          </div>
        ))}
        {filter !== "reps" && filteredBiz.slice(0, 12).map(b => (
          <div key={b.id} className="bg-white border rounded-lg p-4 flex items-start gap-3">
            <div className="w-3 h-3 rounded-full mt-1.5 bg-blue-500 shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{b.businessName}</p>
              <p className="text-xs text-gray-500">{b.serviceAreas}</p>
              <p className="text-xs text-gray-400">{b.servicesOffered}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
