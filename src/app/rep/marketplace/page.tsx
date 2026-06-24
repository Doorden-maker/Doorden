"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Opportunity {
  id: string;
  title: string;
  description: string;
  serviceCategory: string;
  territory: string;
  commissionStructure: string;
  minRepLevel: number;
  createdAt: string;
  business: { businessName: string; serviceAreas: string; pricingDescription: string };
  applications: { id: string; status: string }[];
  _count: { applications: number };
}

const LEVEL_NAMES: Record<number, string> = { 1: "Foundation", 2: "Intermediate", 3: "Advanced", 4: "Expert" };

export default function RepMarketplacePage() {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [search, setSearch] = useState("");
  const [applying, setApplying] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/marketplace").then(r => r.json()).then(setOpps);
  }, []);

  async function apply(id: string) {
    setApplyingId(id);
    const res = await fetch(`/api/marketplace/${id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const json = await res.json();
    setApplyingId(null);
    setApplying(null);
    setMessage("");
    if (res.ok) {
      setOpps(prev => prev.map(o => o.id === id ? { ...o, applications: [{ id: json.id, status: "pending" }] } : o));
    } else {
      alert(json.error || "Failed to apply");
    }
  }

  const filtered = opps.filter(o =>
    !search ||
    o.title.toLowerCase().includes(search.toLowerCase()) ||
    o.serviceCategory.toLowerCase().includes(search.toLowerCase()) ||
    o.territory.toLowerCase().includes(search.toLowerCase()) ||
    o.business.businessName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Marketplace</h1>
          <p className="text-gray-500">Businesses looking for reps to knock doors</p>
        </div>
        <Link href="/map" className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">🗺 View Map</Link>
      </div>

      <Input placeholder="Search by title, category, territory..." value={search} onChange={e => setSearch(e.target.value)} className="mb-6" />

      <div className="space-y-4">
        {filtered.map(o => {
          const myApp = o.applications[0];
          return (
            <Card key={o.id}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{o.title}</h3>
                    <p className="text-sm text-gray-500">{o.business.businessName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="info">{o.serviceCategory}</Badge>
                    <span className="text-xs text-gray-400">Min Level {o.minRepLevel}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3">{o.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                  <div><span className="text-gray-400 text-xs uppercase">Territory</span><p className="text-gray-700">{o.territory}</p></div>
                  <div><span className="text-gray-400 text-xs uppercase">Commission</span><p className="text-gray-700">{o.commissionStructure}</p></div>
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-gray-400">{o._count.applications} applicant{o._count.applications !== 1 ? "s" : ""} · Posted {formatDate(o.createdAt)}</span>
                  {myApp ? (
                    <Badge variant={myApp.status === "accepted" ? "success" : myApp.status === "declined" ? "danger" : "warning"}>
                      {myApp.status === "accepted" ? "✓ Accepted" : myApp.status === "declined" ? "Declined" : "Applied"}
                    </Badge>
                  ) : applying === o.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        className="border rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="Short message (optional)"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                      />
                      <Button size="sm" onClick={() => apply(o.id)} disabled={applyingId === o.id}>
                        {applyingId === o.id ? "..." : "Submit"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setApplying(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setApplying(o.id)}>Apply</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-gray-400 py-12">No opportunities found.</p>}
      </div>
    </div>
  );
}
