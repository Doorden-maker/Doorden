"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function RepSignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Photo must be an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5MB"); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!photoFile) {
      setError("A profile photo of your face is required");
      return;
    }

    setLoading(true);
    const data = new FormData(e.currentTarget);

    // First create account
    const res = await fetch("/api/auth/signup/rep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        password: data.get("password"),
        fullName: data.get("fullName"),
        phone: data.get("phone"),
        city: data.get("city"),
        zip: data.get("zip"),
        serviceAreas: data.get("serviceAreas"),
        description: data.get("description"),
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(json.error);
      return;
    }

    // Upload photo
    const form = new FormData();
    form.append("avatar", photoFile);
    await fetch("/api/rep/avatar", { method: "POST", body: form });

    setLoading(false);
    router.push("/rep");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create Rep Account</CardTitle>
          <CardDescription>Join Doorden as a trained sales representative</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Profile Photo — required */}
            <div className="space-y-1.5">
              <Label>Profile Photo <span className="text-red-500">*</span></Label>
              <p className="text-xs text-gray-400">A clear photo of your face — shown to businesses to build trust</p>
              <div className="flex items-center gap-4 mt-2">
                <div
                  onClick={() => photoRef.current?.click()}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 overflow-hidden bg-gray-50 shrink-0"
                >
                  {photoPreview
                    ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    : <span className="text-3xl">📷</span>}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => photoRef.current?.click()}
                    className="text-sm text-blue-600 border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-50 font-medium"
                  >
                    {photoPreview ? "Change Photo" : "Upload Photo"}
                  </button>
                  {photoPreview && <p className="text-xs text-green-600 mt-1.5 font-medium">✓ Photo uploaded</p>}
                </div>
              </div>
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </div>

            {/* Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" name="fullName" required placeholder="John Smith" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" name="phone" type="tel" required placeholder="(555) 000-0000" />
              </div>
            </div>

            {/* Email + Password */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" name="password" type="password" required minLength={8} placeholder="Minimum 8 characters" />
            </div>

            {/* City + Zip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">Your City *</Label>
                <Input id="city" name="city" required placeholder="Phoenix" />
                <p className="text-xs text-gray-400">City where you're based</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip">Zip Code *</Label>
                <Input id="zip" name="zip" required placeholder="85001" maxLength={10} />
                <p className="text-xs text-gray-400">Your home zip code</p>
              </div>
            </div>

            {/* Service Areas */}
            <div className="space-y-1.5">
              <Label htmlFor="serviceAreas">Service Areas *</Label>
              <Input id="serviceAreas" name="serviceAreas" required placeholder="Phoenix AZ, Scottsdale, Mesa" />
              <p className="text-xs text-gray-400">Cities or zip codes you door-knock in, comma-separated</p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">About You *</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={3}
                placeholder="Describe your background, experience, and why businesses should trust your leads..."
              />
              <p className="text-xs text-gray-400">Shown to businesses when reviewing your jobs</p>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <p className="text-sm text-center text-gray-500 mt-4">
            Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Log in</Link>
          </p>
          <p className="text-xs text-center text-gray-400 mt-2">
            Business? <Link href="/signup/business" className="text-blue-500 hover:underline">Sign up here</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
