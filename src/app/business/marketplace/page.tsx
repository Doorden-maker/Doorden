"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { SERVICE_CATEGORIES } from "@/lib/constants";

interface Application { id: string; status: string; message?: string; createdAt: string; rep: { id: string; fullName: string; phone: string; trainingLevel: number; description: string; availabilityStatus: string; avatarUrl?: string | null; _count?: { jobs: number } } }
interface Opportunity { id: string; title: string; serviceCategory: string; territory: string; commissionStructure: string; minRepLevel: number; isActive: boolean; createdAt: string; _count: { applications: number } }

export default function BusinessMarketplacePage() {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ title: "", description: "", serviceCategory: "", territory: "", commissionStructure: "", minRepLevel: "1" });

  useEffect(() => {
    fetch("/api/marketplace").then(r => r.json()).then(setOpps);
  }, []);

  async function createOpp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/marketplace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setLoading(false);
    if (res.ok) {
      setOpps(prev => [json, ...prev]);
      setShowForm(false);
      setForm({ title: "", description: "", serviceCategory: "", territory: "", commissionStructure: "", minRepLevel: "1" });
    } else {
      alert(json.error || "Failed to post");
    }
  }

  async function viewApplications(id: string) {
    setSelectedOpp(id);
    const res = await fetch(`/api/marketplace/${id}/applications`);
    setApplications(await res.json());
  }

  async function updateApp(oppId: string, applicationId: string, status: string) {
    const res = await fetch(`/api/marketplace/${oppId}/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status }),
    });
    if (res.ok) {
      setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status } : a));
    }
  }

  const LEVEL_NAMES: Record<number, string> = { 1: "Foundation", 2: "Intermediate", 3: "Advanced", 4: "Expert" };
  const STATUS_COLORS: Record<string, string> = { available: "bg-green-500", busy: "bg-yellow-400", offline: "bg-gray-400" };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Marketplace</h1>
          <p className="text-gray-500">Post opportunities for reps to apply</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Post Opportunity"}</Button>
      </div>

      {showForm && (
        <Card className="mb-8 border-blue-200">
          <CardHeader><CardTitle>New Job Opportunity</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createOpp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Job Title</Label>
                  <Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Solar Door Knockers Needed" />
                </div>
                <div className="space-y-1.5">
                  <Label>Service Category</Label>
                  <Select required value={form.serviceCategory} onChange={e => setForm(f => ({ ...f, serviceCategory: e.target.value }))}>
                    <option value="">Select category</option>
                    {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What are you looking for? What does a typical day look like?" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Territory</Label>
                  <Input required value={form.territory} onChange={e => setForm(f => ({ ...f, territory: e.target.value }))} placeholder="e.g. Phoenix AZ, East Mesa" />
                </div>
                <div className="space-y-1.5">
                  <Label>Commission Structure</Label>
                  <Input required value={form.commissionStructure} onChange={e => setForm(f => ({ ...f, commissionStructure: e.target.value }))} placeholder="e.g. 12% per closed deal" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Minimum Rep Level</Label>
                <Select value={form.minRepLevel} onChange={e => setForm(f => ({ ...f, minRepLevel: e.target.value }))}>
                  <option value="1">Level 1 — Foundation</option>
                  <option value="2">Level 2 — Intermediate</option>
                  <option value="3">Level 3 — Advanced</option>
                  <option value="4">Level 4 — Expert</option>
                </Select>
              </div>
              <Button type="submit" disabled={loading}>{loading ? "Posting..." : "Post Opportunity"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* My opportunities */}
      <div className="space-y-4 mb-8">
        <h2 className="font-semibold text-gray-700">Your Posted Opportunities ({opps.length})</h2>
        {opps.length === 0 && <p className="text-gray-400 text-sm">No opportunities posted yet.</p>}
        {opps.map(o => (
          <Card key={o.id} className={selectedOpp === o.id ? "border-blue-400" : ""}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{o.title}</h3>
                  <p className="text-sm text-gray-500">{o.serviceCategory} · {o.territory} · Min Level {o.minRepLevel}</p>
                  <p className="text-xs text-gray-400">{o.commissionStructure} · Posted {formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={o._count.applications > 0 ? "info" : "default"}>
                    {o._count.applications} applicant{o._count.applications !== 1 ? "s" : ""}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => viewApplications(o.id)}>
                    {selectedOpp === o.id ? "Hide" : "View Applicants"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Applicants panel */}
      {selectedOpp && (
        <Card>
          <CardHeader><CardTitle>Applicants</CardTitle></CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="text-gray-400 text-sm">No applications yet.</p>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                          {app.rep.avatarUrl ? <img src={app.rep.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-blue-700 font-semibold text-sm">{app.rep.fullName[0]}</span>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{app.rep.fullName}</span>
                            <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[app.rep.availabilityStatus] || "bg-gray-400"}`} />
                            <span className="text-xs text-gray-500 capitalize">{app.rep.availabilityStatus}</span>
                          </div>
                          <p className="text-xs text-gray-500">Level {app.rep.trainingLevel} — {LEVEL_NAMES[app.rep.trainingLevel]} · {app.rep.phone}</p>
                          <p className="text-sm text-gray-700 mt-1">{app.rep.description}</p>
                          {app.message && <p className="text-sm text-blue-700 mt-1 italic">"{app.message}"</p>}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {app.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateApp(selectedOpp, app.id, "accepted")}>Accept</Button>
                            <Button size="sm" variant="outline" onClick={() => updateApp(selectedOpp, app.id, "declined")}>Decline</Button>
                          </div>
                        ) : (
                          <Badge variant={app.status === "accepted" ? "success" : "danger"}>
                            {app.status === "accepted" ? "✓ Accepted" : "Declined"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
