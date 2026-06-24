"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import Link from "next/link";

interface Business {
  id: string;
  businessName: string;
  serviceAreas: string;
  servicesOffered: string;
  pricingDescription: string;
  minRepLevel: number;
}

const LEVEL_NAMES: Record<number, string> = { 1: "Foundation", 2: "Intermediate", 3: "Advanced", 4: "Expert" };

export default function NewJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBizId = searchParams.get("businessId");
  const fileRef = useRef<HTMLInputElement>(null);

  const [acceptedBusinesses, setAcceptedBusinesses] = useState<Business[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [repLevel, setRepLevel] = useState(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<{ referenceNumber: string; leadId: string } | null>(null);

  useEffect(() => {
    // Load only accepted partnerships
    fetch("/api/partnerships").then(r => r.json()).then((data: { status: string; business: Business }[]) => {
      const accepted = data.filter((p) => p.status === "accepted").map((p) => p.business);
      setAcceptedBusinesses(accepted);
      if (preselectedBizId) {
        const match = accepted.find((b) => b.id === preselectedBizId);
        if (match) setSelectedBiz(match);
      }
    });
    fetch("/api/rep/profile").then(r => r.json()).then(d => setRepLevel(d?.trainingLevel || 1));
  }, [preselectedBizId]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => ["image/jpeg", "image/png"].includes(f.type) && f.size <= 5 * 1024 * 1024);
    const all = [...photos, ...valid].slice(0, 10);
    setPhotos(all);
    setPreviews(all.map(f => URL.createObjectURL(f)));
  }

  function removePhoto(index: number) {
    const next = photos.filter((_, i) => i !== index);
    setPhotos(next);
    setPreviews(next.map(f => URL.createObjectURL(f)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (photos.length < 3) { setError("Please upload at least 3 photos."); return; }
    if (!selectedBiz) { setError("Please select a business."); return; }
    if (repLevel < selectedBiz.minRepLevel) {
      setError(`This business requires Level ${selectedBiz.minRepLevel} training.`);
      return;
    }

    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    photos.forEach(p => data.append("photos", p));

    const res = await fetch("/api/jobs", { method: "POST", body: data });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) { setError(json.error || "Failed to submit"); return; }
    setSubmitted({ referenceNumber: json.referenceNumber, leadId: json.leadId });
  }

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="text-5xl">✅</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead Created!</h1>
            <p className="text-gray-500 mt-1 text-sm">Next step: generate a verification code for the homeowner</p>
          </div>
          <div className="bg-[#0f2044] text-white rounded-2xl p-5">
            <p className="text-xs text-white/60 uppercase font-bold tracking-widest mb-1">Lead ID</p>
            <p className="text-3xl font-mono font-bold tracking-wider">{submitted.leadId}</p>
            <p className="text-xs text-white/50 mt-2">Reference: {submitted.referenceNumber}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-left space-y-1">
            <p className="font-bold">What happens next:</p>
            <p>1. Go to your lead and tap <strong>Generate Verification Code</strong></p>
            <p>2. Show the 8-digit code to the homeowner</p>
            <p>3. They confirm at <strong>doorden.com/verify</strong></p>
            <p>4. Quote is automatically sent to the business</p>
          </div>
          <Link href="/rep/jobs" className="block w-full bg-[#0f2044] text-white font-semibold py-3 rounded-xl hover:bg-[#1a3360] transition text-center">
            View My Leads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-5">
        <button onClick={() => router.back()} className="text-sm text-[#0f2044] font-medium mb-3 flex items-center gap-1">← Back</button>
        <h1 className="text-xl font-bold text-slate-900">Create New Lead</h1>
        <p className="text-slate-500 text-sm mt-1">Fill out homeowner info, take photos, and generate a visit code</p>
      </div>

      {acceptedBusinesses.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
          <p className="font-bold mb-1">No Accepted Business Partnerships</p>
          <p>You need to be accepted by a business before you can submit leads. <Link href="/rep/businesses" className="underline font-semibold">Browse businesses</Link> and send a partnership request.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Business Selection — first */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-3"><CardTitle>Selling For</CardTitle></CardHeader>
          <CardContent className="pt-4">
            <Select
              name="businessId"
              required
              value={selectedBiz?.id || ""}
              onChange={e => setSelectedBiz(acceptedBusinesses.find(b => b.id === e.target.value) || null)}
            >
              <option value="">— Select an accepted business —</option>
              {acceptedBusinesses.map(b => (
                <option key={b.id} value={b.id}>{b.businessName}</option>
              ))}
            </Select>
            {selectedBiz && (
              <div className="mt-3 bg-slate-50 rounded-xl p-3 text-sm space-y-1 border border-slate-200">
                <div><span className="text-slate-500">Services:</span> <span className="text-slate-700 font-medium">{selectedBiz.servicesOffered}</span></div>
                <div><span className="text-slate-500">Min Level:</span> <span className={`font-semibold ${repLevel < selectedBiz.minRepLevel ? "text-red-600" : "text-emerald-600"}`}>Level {selectedBiz.minRepLevel}</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Homeowner Info */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-3"><CardTitle>Homeowner Information</CardTitle></CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input name="homeownerName" required placeholder="Jane Smith" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input name="homeownerPhone" type="tel" required placeholder="(555) 000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input name="homeownerEmail" type="email" placeholder="jane@email.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Full Address *</Label>
              <Input name="homeownerAddress" required placeholder="123 Main St, Phoenix AZ 85001" />
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-3"><CardTitle>Job Details</CardTitle></CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Service Type *</Label>
              <Input name="serviceType" required placeholder="e.g. Roof Replacement" />
            </div>
            <div className="space-y-1.5">
              <Label>Quoted Price *</Label>
              <Input name="estimatedPrice" type="number" inputMode="decimal" step="0.01" min="1" required placeholder="5000.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes / Description *</Label>
              <Textarea name="description" required rows={4} placeholder="Describe the job in detail..." />
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle>Job Photos</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Min 3 · max 10 · JPG/PNG · max 5MB each</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#0f2044] hover:bg-slate-50 transition active:scale-[0.98]"
            >
              <div className="text-3xl mb-2">📷</div>
              <p className="text-slate-600 font-medium text-sm">Tap to upload photos</p>
              <p className="text-xs text-slate-400 mt-1">{photos.length}/10 selected</p>
            </div>
            <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png" onChange={handlePhotoChange} className="hidden" />
            {previews.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-4">
                {previews.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}
            <p className={`text-xs mt-3 font-medium ${photos.length >= 3 ? "text-emerald-600" : "text-amber-600"}`}>
              {photos.length < 3 ? `Need ${3 - photos.length} more photo${3 - photos.length !== 1 ? "s" : ""}` : `✓ ${photos.length} photos ready`}
            </p>
          </CardContent>
        </Card>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>}

        <div className="flex gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => router.back()} className="shrink-0">Cancel</Button>
          <Button type="submit" disabled={loading || acceptedBusinesses.length === 0} className="flex-1" size="lg">
            {loading ? "Creating..." : "Create Lead"}
          </Button>
        </div>
      </form>
    </div>
  );
}
