"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SERVICE_CATEGORIES } from "@/lib/constants";

export default function BusinessSignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/signup/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        password: data.get("password"),
        businessName: data.get("businessName"),
        contactName: data.get("contactName"),
        phone: data.get("phone"),
        businessCity: data.get("businessCity"),
        businessZip: data.get("businessZip"),
        workingCities: data.get("workingCities"),
        serviceAreas: data.get("workingCities"), // keep compat
        servicesOffered: data.get("servicesOffered"),
        serviceCategory: data.get("serviceCategory"),
        pricingDescription: data.get("pricingDescription"),
        minRepLevel: data.get("minRepLevel"),
      }),
    });

    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error); return; }
    router.push("/business");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create Business Account</CardTitle>
          <CardDescription>Join Doorden to receive qualified job leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
            <strong>Revenue structure:</strong> You keep <strong>82%</strong> of job value. Doorden takes 6%, rep earns 12%.
            Homeowner pays an <strong>18% deposit</strong> through the platform; remaining 82% paid directly to you.
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Business Identity */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Business Identity</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input id="businessName" name="businessName" required placeholder="ABC Pressure Washing LLC" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="serviceCategory">Service Category *</Label>
                  <Select id="serviceCategory" name="serviceCategory" required defaultValue="">
                    <option value="" disabled>— Select your trade —</option>
                    {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                  <p className="text-xs text-gray-400">Choose the primary service your business provides</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="servicesOffered">Services Offered *</Label>
                  <Input id="servicesOffered" name="servicesOffered" required placeholder="e.g. Driveway washing, roof cleaning, patio restoration" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Location</p>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="businessCity">Business City *</Label>
                    <Input id="businessCity" name="businessCity" required placeholder="Phoenix" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="businessZip">Zip Code *</Label>
                    <Input id="businessZip" name="businessZip" required placeholder="85001" maxLength={10} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="workingCities">Cities / Counties You Work In *</Label>
                  <Textarea
                    id="workingCities"
                    name="workingCities"
                    required
                    rows={2}
                    placeholder="Phoenix, Scottsdale, Tempe, Mesa, Maricopa County"
                  />
                  <p className="text-xs text-gray-400">List all cities or counties — comma separated. Reps use this to find you.</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact</p>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="contactName">Contact Name *</Label>
                    <Input id="contactName" name="contactName" required placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" name="phone" type="tel" required placeholder="(555) 000-0000" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" required placeholder="you@business.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" name="password" type="password" required minLength={8} placeholder="Minimum 8 characters" />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pricing Info for Reps</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pricingDescription">Pricing Description *</Label>
                  <Textarea
                    id="pricingDescription"
                    name="pricingDescription"
                    required
                    rows={3}
                    placeholder="e.g. $0.15/sq ft for driveway, $250 minimum. Roof cleaning starts at $350. We quote on-site."
                  />
                  <p className="text-xs text-gray-400">Shown to reps so they can estimate job value accurately</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="minRepLevel">Minimum Rep Training Level *</Label>
                  <Select id="minRepLevel" name="minRepLevel" defaultValue="1">
                    <option value="1">Level 1 — Foundation (Free)</option>
                    <option value="2">Level 2 — Intermediate ($15)</option>
                    <option value="3">Level 3 — Advanced ($30)</option>
                    <option value="4">Level 4 — Expert ($50)</option>
                  </Select>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating Account..." : "Create Business Account"}
            </Button>
          </form>
          <p className="text-sm text-center text-gray-500 mt-4">
            Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
