"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface RepProfile {
  id: string;
  repCode: string;
  fullName: string;
  phone: string;
  city: string;
  zip: string;
  serviceAreas: string;
  description: string;
  serviceCategories: string;
  trainingLevel: number;
  availabilityStatus: string;
  rating: number;
  ratingCount: number;
  avatarUrl: string | null;
  createdAt: string;
  user: { email: string };
}

export default function RepProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<RepProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    fullName: "", phone: "", city: "", zip: "",
    serviceAreas: "", description: "", serviceCategories: "", availabilityStatus: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => {
      if (!d.repProfile) { router.push("/login"); return; }
      const rep = d.repProfile;
      setProfile({ ...rep, user: { email: d.email } });
      setForm({
        fullName: rep.fullName || "",
        phone: rep.phone || "",
        city: rep.city || "",
        zip: rep.zip || "",
        serviceAreas: rep.serviceAreas || "",
        description: rep.description || "",
        serviceCategories: rep.serviceCategories || "",
        availabilityStatus: rep.availabilityStatus || "offline",
      });
    });
  }, [router]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");

    if (avatarFile) {
      const fd = new FormData();
      fd.append("avatar", avatarFile);
      await fetch("/api/rep/avatar", { method: "POST", body: fd });
    }

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (res.ok) {
      setSuccess("Profile updated!");
      setEditing(false);
      setAvatarFile(null);
      // Refresh profile data
      fetch("/api/me").then(r => r.json()).then(d => {
        if (d.repProfile) setProfile({ ...d.repProfile, user: { email: d.email } });
      });
      router.refresh();
    } else {
      const j = await res.json();
      setError(j.error || "Failed to save");
    }
  }

  if (!profile) return <div className="max-w-2xl mx-auto px-4 py-12 text-center text-slate-400">Loading...</div>;

  const statusColors: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-700",
    busy: "bg-amber-100 text-amber-700",
    offline: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-[#0f2044] rounded-2xl p-5 mb-5 text-white">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center">
              {(avatarPreview || profile.avatarUrl)
                ? <img src={avatarPreview || profile.avatarUrl!} alt="" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-xl">{profile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</span>}
            </div>
            {editing && (
              <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center cursor-pointer shadow">
                <span className="text-[#0f2044] text-xs">✏️</span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{profile.fullName}</h1>
            <p className="text-blue-300 text-sm">{profile.user.email}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {profile.repCode && <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-blue-200">{profile.repCode}</span>}
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-blue-200">Level {profile.trainingLevel}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${statusColors[profile.availabilityStatus] || "bg-slate-100 text-slate-600"}`}>
                {profile.availabilityStatus}
              </span>
            </div>
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
          <CardTitle className="text-base">{editing ? "Edit Profile" : "Profile Details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Your City</Label>
                  <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Phoenix" />
                </div>
                <div className="space-y-1.5">
                  <Label>Zip Code</Label>
                  <Input value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} placeholder="85001" maxLength={10} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Service Areas</Label>
                <Input value={form.serviceAreas} onChange={e => setForm(f => ({ ...f, serviceAreas: e.target.value }))} placeholder="Phoenix AZ, Scottsdale, Mesa" />
                <p className="text-xs text-gray-400">Cities or zip codes you door-knock in, comma-separated</p>
              </div>
              <div className="space-y-1.5">
                <Label>Service Categories</Label>
                <Input value={form.serviceCategories} onChange={e => setForm(f => ({ ...f, serviceCategories: e.target.value }))} placeholder="Solar, Roofing, Pest Control" />
              </div>
              <div className="space-y-1.5">
                <Label>About You</Label>
                <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Availability Status</Label>
                <Select value={form.availabilityStatus} onChange={e => setForm(f => ({ ...f, availabilityStatus: e.target.value }))}>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => { setEditing(false); setAvatarFile(null); setAvatarPreview(null); }}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3 text-sm">
              <Row label="Full Name" value={profile.fullName} />
              <Row label="Phone" value={profile.phone} />
              <Row label="City" value={profile.city || "—"} />
              <Row label="Zip Code" value={profile.zip || "—"} />
              <Row label="Service Areas" value={profile.serviceAreas} />
              {profile.serviceCategories && <Row label="Categories" value={profile.serviceCategories} />}
              <Row label="About" value={profile.description} />
              <Row label="Rep Code" value={profile.repCode || "—"} />
              <Row label="Training Level" value={`Level ${profile.trainingLevel}`} />
              {profile.rating > 0 && <Row label="Rating" value={`${profile.rating.toFixed(1)} ⭐ (${profile.ratingCount} reviews)`} />}
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
      <span className="text-slate-400 w-32 shrink-0">{label}</span>
      <span className="text-slate-800 flex-1">{value}</span>
    </div>
  );
}
