"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

const SERVICE_CATEGORIES = ["Solar", "Roofing", "Pest Control", "Lawn Care", "HVAC", "Windows", "Security", "Painting", "Gutters", "Siding", "Other"];

interface BizProfile {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  businessCity: string;
  businessZip: string;
  workingCities: string;
  serviceAreas: string;
  servicesOffered: string;
  serviceCategory: string;
  pricingDescription: string;
  minRepLevel: number;
  createdAt: string;
  user: { email: string };
}

export default function BusinessProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<BizProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    businessName: "", contactName: "", phone: "",
    businessCity: "", businessZip: "", workingCities: "",
    serviceAreas: "", servicesOffered: "", serviceCategory: "",
    pricingDescription: "", minRepLevel: "1",
  });

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => {
      if (!d.businessProfile) { router.push("/login"); return; }
      const biz = d.businessProfile;
      setProfile({ ...biz, user: { email: d.email } });
      setForm({
        businessName: biz.businessName || "",
        contactName: biz.contactName || "",
        phone: biz.phone || "",
        businessCity: biz.businessCity || "",
        businessZip: biz.businessZip || "",
        workingCities: biz.workingCities || "",
        serviceAreas: biz.serviceAreas || "",
        servicesOffered: biz.servicesOffered || "",
        serviceCategory: biz.serviceCategory || "",
        pricingDescription: biz.pricingDescription || "",
        minRepLevel: String(biz.minRepLevel || 1),
      });
    });
  }, [router]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setSuccess("Profile updated!");
      setEditing(false);
      fetch("/api/me").then(r => r.json()).then(d => {
        if (d.businessProfile) setProfile({ ...d.businessProfile, user: { email: d.email } });
      });
      router.refresh();
    } else {
      const j = await res.json();
      setError(j.error || "Failed to save");
    }
  }

  if (!profile) return <div className="max-w-2xl mx-auto px-4 py-12 text-center text-slate-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-[#0f2044] rounded-2xl p-5 mb-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{profile.businessName}</h1>
            <p className="text-blue-300 text-sm">{profile.user.email}</p>
            <p className="text-blue-200 text-sm mt-0.5">
              {profile.serviceCategory && <span className="mr-2">{profile.serviceCategory}</span>}
              {profile.businessCity && <span>{profile.businessCity}{profile.businessZip ? ` ${profile.businessZip}` : ""}</span>}
            </p>
          </div>
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}
              className="shrink-0 border-white/30 text-white hover:bg-white/10">
              Edit
            </Button>
          )}
        </div>
      </div>

      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl mb-4">{success}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editing ? "Edit Profile" : "Business Details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-1.5">
                <Label>Business Name</Label>
                <Input value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Contact Name</Label>
                  <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Business City</Label>
                  <Input value={form.businessCity} onChange={e => setForm(f => ({ ...f, businessCity: e.target.value }))} placeholder="Phoenix" />
                </div>
                <div className="space-y-1.5">
                  <Label>Zip Code</Label>
                  <Input value={form.businessZip} onChange={e => setForm(f => ({ ...f, businessZip: e.target.value }))} placeholder="85001" maxLength={10} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Cities / Counties You Work In</Label>
                <Textarea rows={2} value={form.workingCities} onChange={e => setForm(f => ({ ...f, workingCities: e.target.value }))} placeholder="Phoenix, Scottsdale, Tempe, Mesa" />
              </div>
              <div className="space-y-1.5">
                <Label>Service Areas</Label>
                <Input value={form.serviceAreas} onChange={e => setForm(f => ({ ...f, serviceAreas: e.target.value }))} placeholder="Phoenix Metro, East Valley" />
              </div>
              <div className="space-y-1.5">
                <Label>Service Category</Label>
                <Select value={form.serviceCategory} onChange={e => setForm(f => ({ ...f, serviceCategory: e.target.value }))}>
                  <option value="">Select category</option>
                  {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Services Offered</Label>
                <Textarea rows={2} value={form.servicesOffered} onChange={e => setForm(f => ({ ...f, servicesOffered: e.target.value }))} placeholder="Solar panel installation, battery storage..." />
              </div>
              <div className="space-y-1.5">
                <Label>Pricing Description</Label>
                <Textarea rows={2} value={form.pricingDescription} onChange={e => setForm(f => ({ ...f, pricingDescription: e.target.value }))} placeholder="Competitive pricing, free estimates..." />
              </div>
              <div className="space-y-1.5">
                <Label>Minimum Rep Level Required</Label>
                <Select value={form.minRepLevel} onChange={e => setForm(f => ({ ...f, minRepLevel: e.target.value }))}>
                  <option value="1">Level 1 — Foundation</option>
                  <option value="2">Level 2 — Intermediate</option>
                  <option value="3">Level 3 — Advanced</option>
                  <option value="4">Level 4 — Expert</option>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </>
          ) : (
            <div className="space-y-3 text-sm">
              <Row label="Business Name" value={profile.businessName} />
              <Row label="Contact" value={profile.contactName} />
              <Row label="Phone" value={profile.phone} />
              <Row label="City" value={profile.businessCity || "—"} />
              <Row label="Zip Code" value={profile.businessZip || "—"} />
              <Row label="Working Cities" value={profile.workingCities || "—"} />
              <Row label="Service Areas" value={profile.serviceAreas} />
              <Row label="Category" value={profile.serviceCategory || "—"} />
              <Row label="Services" value={profile.servicesOffered} />
              <Row label="Pricing" value={profile.pricingDescription} />
              <Row label="Min Rep Level" value={`Level ${profile.minRepLevel}`} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-slate-400 w-36 shrink-0">{label}</span>
      <span className="text-slate-800 flex-1">{value}</span>
    </div>
  );
}
