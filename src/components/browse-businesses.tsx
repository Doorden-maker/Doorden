"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Business {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  serviceAreas: string;
  servicesOffered: string;
  pricingDescription: string;
  minRepLevel: number;
  jobs: { id: string }[];
  user: { id: string };
}

interface Partnership {
  businessId: string;
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
  businesses: Business[];
  repLevel: number;
  repAreas: string;
  partnerships: Partnership[];
}

export function BrowseBusinesses({ businesses, repLevel, repAreas, partnerships }: Props) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [localPartnerships, setLocalPartnerships] = useState<Partnership[]>(partnerships);

  const repAreaList = repAreas.toLowerCase().split(",").map(a => a.trim());

  const filtered = useMemo(() => {
    return businesses.filter(b => {
      const matchSearch = !search || b.businessName.toLowerCase().includes(search.toLowerCase()) || b.servicesOffered.toLowerCase().includes(search.toLowerCase()) || b.serviceAreas.toLowerCase().includes(search.toLowerCase());
      const matchLevel = levelFilter === "all" || b.minRepLevel === parseInt(levelFilter);
      const matchEligible = !eligibleOnly || repLevel >= b.minRepLevel;
      return matchSearch && matchLevel && matchEligible;
    });
  }, [businesses, search, levelFilter, eligibleOnly, repLevel]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aAreas = a.serviceAreas.toLowerCase().split(",").map(s => s.trim());
      const bAreas = b.serviceAreas.toLowerCase().split(",").map(s => s.trim());
      const aMatch = repAreaList.some(r => aAreas.some(a2 => a2.includes(r) || r.includes(a2)));
      const bMatch = repAreaList.some(r => bAreas.some(b2 => b2.includes(r) || r.includes(b2)));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return a.businessName.localeCompare(b.businessName);
    });
  }, [filtered, repAreaList]);

  async function requestPartnership(businessId: string) {
    setRequesting(businessId);
    const res = await fetch("/api/partnerships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: businessId }),
    });
    if (res.ok) {
      setLocalPartnerships(p => [...p, { businessId, status: "pending_rep" }]);
    }
    setRequesting(null);
  }

  function getPartnershipStatus(bizId: string) {
    return localPartnerships.find(p => p.businessId === bizId)?.status;
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search by name, service, or area..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-0"
        />
        <Select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="w-44">
          <option value="all">All min levels</option>
          <option value="1">Requires Level 1+</option>
          <option value="2">Requires Level 2+</option>
          <option value="3">Requires Level 3+</option>
          <option value="4">Requires Level 4</option>
        </Select>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={eligibleOnly} onChange={e => setEligibleOnly(e.target.checked)} className="rounded" />
          Eligible only
        </label>
        <span className="text-sm text-gray-400 ml-auto">{sorted.length} businesses</span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No businesses match your filters.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {sorted.map(b => {
            const bAreas = b.serviceAreas.toLowerCase().split(",").map(s => s.trim());
            const isNearby = repAreaList.some(r => bAreas.some(a => a.includes(r) || r.includes(a)));
            const isEligible = repLevel >= b.minRepLevel;
            const pStatus = getPartnershipStatus(b.id);

            return (
              <Card key={b.id} className={`hover:shadow-md transition ${!isEligible ? "opacity-70" : ""}`}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base leading-tight">{b.businessName}</h3>
                      <p className="text-sm text-gray-500">{b.contactName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[b.minRepLevel]}`}>Level {b.minRepLevel}+</span>
                      {isNearby && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">📍 Near you</span>}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div><span className="text-xs font-medium text-gray-400 uppercase">Services</span><p className="text-gray-700">{b.servicesOffered}</p></div>
                    <div><span className="text-xs font-medium text-gray-400 uppercase">Areas</span><p className="text-gray-700">{b.serviceAreas}</p></div>
                    <div><span className="text-xs font-medium text-gray-400 uppercase">Pricing</span><p className="text-gray-700">{b.pricingDescription}</p></div>
                  </div>

                  {/* Partnership action buttons */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {pStatus === "accepted" && (
                      <div className="flex gap-2">
                        <Link href={`/business/${b.id}/view`} className="flex-1 text-center text-sm bg-slate-100 text-slate-700 font-semibold py-2 rounded-lg hover:bg-slate-200 transition">View Profile</Link>
                        <Link href={`/messages?with=${b.user.id}`} className="flex-1 text-center text-sm bg-[#0f2044] text-white font-semibold py-2 rounded-lg hover:bg-[#1a3360] transition">💬 Message</Link>
                      </div>
                    )}
                    {pStatus === "pending_rep" && (
                      <div className="flex gap-2">
                        <span className="flex-1 text-center text-sm text-amber-700 font-semibold bg-amber-50 px-3 py-2 rounded-lg">Request Sent</span>
                        <Link href={`/business/${b.id}/view`} className="flex-1 text-center text-sm bg-slate-100 text-slate-700 font-semibold py-2 rounded-lg hover:bg-slate-200 transition">View Profile</Link>
                      </div>
                    )}
                    {pStatus === "pending_business" && (
                      <div className="flex gap-2">
                        <span className="flex-1 text-center text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">Invited You — Accept in Dashboard</span>
                        <Link href={`/business/${b.id}/view`} className="flex-1 text-center text-sm bg-slate-100 text-slate-700 font-semibold py-2 rounded-lg hover:bg-slate-200 transition">View</Link>
                      </div>
                    )}
                    {pStatus === "rejected" && (
                      <div className="flex gap-2">
                        <span className="flex-1 text-center text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">Declined</span>
                        <Link href={`/business/${b.id}/view`} className="flex-1 text-center text-sm bg-slate-100 text-slate-700 font-semibold py-2 rounded-lg hover:bg-slate-200 transition">View</Link>
                      </div>
                    )}
                    {!pStatus && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => requestPartnership(b.id)}
                          disabled={requesting === b.id || !isEligible}
                          className="flex-1 bg-[#0f2044] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#1a3360] transition disabled:opacity-50"
                        >
                          {requesting === b.id ? "Sending..." : !isEligible ? `Requires Level ${b.minRepLevel}` : "Request Partnership"}
                        </button>
                        <Link href={`/business/${b.id}/view`} className="flex-1 text-center text-sm bg-slate-100 text-slate-700 font-semibold py-2 rounded-lg hover:bg-slate-200 transition">View Profile</Link>
                      </div>
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
