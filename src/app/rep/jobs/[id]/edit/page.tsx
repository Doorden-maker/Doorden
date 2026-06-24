"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Job {
  id: string;
  leadId: string;
  status: string;
  homeownerName: string;
  homeownerPhone: string;
  homeownerEmail: string;
  homeownerAddress: string;
  serviceType: string;
  description: string;
  estimatedPrice: number;
  business: { businessName: string };
}

export default function EditJobPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [form, setForm] = useState({ homeownerName: "", homeownerPhone: "", homeownerEmail: "", homeownerAddress: "", serviceType: "", description: "", estimatedPrice: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/jobs/${id}`).then(r => r.json()).then((j: Job) => {
      setJob(j);
      setForm({
        homeownerName: j.homeownerName,
        homeownerPhone: j.homeownerPhone,
        homeownerEmail: j.homeownerEmail || "",
        homeownerAddress: j.homeownerAddress,
        serviceType: j.serviceType,
        description: j.description,
        estimatedPrice: String(j.estimatedPrice),
      });
    });
  }, [id]);

  const editable = job && ["lead_created", "code_sent", "more_info_requested"].includes(job.status);

  async function handleSave() {
    setError("");
    setSaving(true);
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rep_edit", ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Save failed"); return; }
    router.push(`/rep/jobs/${id}`);
  }

  if (!job) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-[#0f2044] border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <button onClick={() => router.back()} className="text-[#0f2044] font-medium text-sm mb-4">← Back</button>
      <h1 className="text-xl font-bold text-slate-900 mb-1">Edit Lead</h1>
      <p className="text-slate-500 text-sm mb-5">{job.leadId} · {job.business?.businessName}</p>

      {!editable && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-5">
          This lead can no longer be edited (status: {job.status}).
        </div>
      )}

      <div className="space-y-4">
        <Card>
          <CardHeader className="border-b border-slate-100 pb-3"><CardTitle>Homeowner</CardTitle></CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={form.homeownerName} onChange={e => setForm(f => ({ ...f, homeownerName: e.target.value }))} disabled={!editable} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.homeownerPhone} onChange={e => setForm(f => ({ ...f, homeownerPhone: e.target.value }))} disabled={!editable} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.homeownerEmail} onChange={e => setForm(f => ({ ...f, homeownerEmail: e.target.value }))} disabled={!editable} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.homeownerAddress} onChange={e => setForm(f => ({ ...f, homeownerAddress: e.target.value }))} disabled={!editable} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-slate-100 pb-3"><CardTitle>Job Details</CardTitle></CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Service Type</Label>
              <Input value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} disabled={!editable} />
            </div>
            <div className="space-y-1.5">
              <Label>Quoted Price ($)</Label>
              <Input type="number" value={form.estimatedPrice} onChange={e => setForm(f => ({ ...f, estimatedPrice: e.target.value }))} disabled={!editable} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} disabled={!editable} />
            </div>
          </CardContent>
        </Card>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>}

        {editable && (
          <div className="flex gap-3 pb-8">
            <Button variant="outline" onClick={() => router.back()} className="shrink-0">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1" size="lg">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
