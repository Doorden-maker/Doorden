"use client";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Rep {
  id: string;
  repCode: string;
  fullName: string;
  phone: string;
  serviceAreas: string;
  description: string;
  trainingLevel: number;
  avatarUrl: string | null;
  jobs: { id: string }[];
  _count: { jobs: number };
}

interface Partnership {
  repId: string;
  status: string;
}

const LEVEL_NAMES: Record<number, string> = { 1: "Foundation", 2: "Intermediate", 3: "Advanced", 4: "Expert" };
const LEVEL_COLORS: Record<number, string> = {
  1: "bg-gray-100 text-gray-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-purple-100 text-purple-700",
  4: "bg-orange-100 text-orange-700",
};

interface Props {
  reps: Rep[];
  bizAreas: string;
  minRepLevel: number;
  partnerships: Partnership[];
}

export function BrowseReps({ reps, bizAreas, minRepLevel, partnerships }: Props) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [localPartnerships, setLocalPartnerships] = useState<Partnership[]>(partnerships);

  const bizAreaList = bizAreas.toLowerCase().split(",").map(a => a.trim());

  const filtered = useMemo(() => {
    return reps.filter(r => {
      const matchSearch = !search || r.fullName.toLowerCase().includes(search.toLowerCase()) || r.serviceAreas.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
      const matchLevel = levelFilter === "all" || r.trainingLevel === parseInt(levelFilter);
      const repAreaList = r.serviceAreas.toLowerCase().split(",").map(a => a.trim());
      const isNearby = bizAreaList.some(b => repAreaList.some(a => a.includes(b) || b.includes(a)));
      return matchSearch && matchLevel && (!nearbyOnly || isNearby);
    });
  }, [reps, search, levelFilter, nearbyOnly, bizAreaList]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aAreas = a.serviceAreas.toLowerCase().split(",").map(s => s.trim());
      const bAreas = b.serviceAreas.toLowerCase().split(",").map(s => s.trim());
      const aNearby = bizAreaList.some(z => aAreas.some(a2 => a2.includes(z) || z.includes(a2)));
      const bNearby = bizAreaList.some(z => bAreas.some(b2 => b2.includes(z) || z.includes(b2)));
      if (aNearby && !bNearby) return -1;
      if (!aNearby && bNearby) return 1;
      return b.trainingLevel - a.trainingLevel;
    });
  }, [filtered, bizAreaList]);

  async function requestPartnership(repId: string) {
    setRequesting(repId);
    const res = await fetch("/api/partnerships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: repId }),
    });
    if (res.ok) setLocalPartnerships(p => [...p, { repId, status: "pending_business" }]);
    setRequesting(null);
  }

  function getPartnershipStatus(repId: string) {
    return localPartnerships.find(p => p.repId === repId)?.status;
  }

  const qualifiedCount = sorted.filter(r => r.trainingLevel >= minRepLevel).length;

  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search by name, area, or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-0"
        />
        <Select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="w-36">
          <option value="all">All levels</option>
          <option value="1">Level 1</option>
          <option value="2">Level 2</option>
          <option value="3">Level 3</option>
          <option value="4">Level 4</option>
        </Select>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={nearbyOnly} onChange={e => setNearbyOnly(e.target.checked)} className="rounded" />
          Near me
        </label>
        <span className="text-sm text-gray-400 ml-auto">{qualifiedCount} qualified · {sorted.length} total</span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No reps match your filters.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {sorted.map(r => {
            const repAreaList = r.serviceAreas.toLowerCase().split(",").map(a => a.trim());
            const isNearby = bizAreaList.some(b => repAreaList.some(a => a.includes(b) || b.includes(a)));
            const isQualified = r.trainingLevel >= minRepLevel;
            const pStatus = getPartnershipStatus(r.id);

            return (
              <Card key={r.id} className={`hover:shadow-md transition ${!isQualified ? "opacity-70" : ""}`}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3 mb-3">
                    {r.avatarUrl ? (
                      <img src={r.avatarUrl} className="w-11 h-11 rounded-full object-cover shrink-0" alt="" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#0f2044]/10 flex items-center justify-center text-[#0f2044] font-bold shrink-0">{r.fullName[0]}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-base leading-tight">{r.fullName}</h3>
                          <p className="text-sm text-gray-500">{r.phone}</p>
                          {r.repCode && <p className="text-xs text-gray-400 font-mono">{r.repCode}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[r.trainingLevel]}`}>Level {r.trainingLevel}</span>
                          {isNearby && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">📍 Near you</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div><span className="text-xs font-medium text-gray-400 uppercase">About</span><p className="text-gray-700 line-clamp-2">{r.description}</p></div>
                    <div><span className="text-xs font-medium text-gray-400 uppercase">Areas</span><p className="text-gray-700">{r.serviceAreas}</p></div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    {pStatus === "accepted" && (
                      <span className="text-sm text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg w-full block text-center">✓ Accepted Partner</span>
                    )}
                    {pStatus === "pending_business" && (
                      <span className="text-sm text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-lg w-full block text-center">Invite Sent — Awaiting Rep</span>
                    )}
                    {pStatus === "pending_rep" && (
                      <span className="text-sm text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg w-full block text-center">Rep Requested — Review in Dashboard</span>
                    )}
                    {pStatus === "rejected" && (
                      <span className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg w-full block text-center">Request Declined</span>
                    )}
                    {!pStatus && (
                      <button
                        onClick={() => requestPartnership(r.id)}
                        disabled={requesting === r.id || !isQualified}
                        className="w-full bg-[#0f2044] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#1a3360] transition disabled:opacity-50"
                      >
                        {requesting === r.id ? "Sending..." : !isQualified ? `Below your min level` : "Invite to Partner"}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
