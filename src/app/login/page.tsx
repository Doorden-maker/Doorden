"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) { setError(json.error); return; }

    if (json.role === "admin") router.push("/admin");
    else if (json.role === "rep") router.push("/rep");
    else router.push("/business");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0f2044] text-white flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-[#0f2044] font-black text-sm">D</span>
          </div>
          <span className="font-bold text-xl">Doorden</span>
        </Link>
        <div>
          <blockquote className="text-2xl font-semibold leading-snug text-blue-100 mb-6">
            &ldquo;The platform that made my door-to-door hustle actually pay off.&rdquo;
          </blockquote>
          <p className="text-blue-300 text-sm">— Doorden Sales Rep, Level 3</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { num: "12%", label: "Rep Commission" },
            { num: "4", label: "Training Levels" },
            { num: "18%", label: "Secure Deposit" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-black text-white">{s.num}</div>
              <div className="text-xs text-blue-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0f2044] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">D</span>
              </div>
              <span className="font-bold text-[#0f2044] text-xl">Doorden</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
              <p className="text-slate-500 text-sm mt-1">Log in to your Doorden account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" name="email" type="email" required placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required placeholder="••••••••" />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Logging in..." : "Log In"}
              </Button>
            </form>

            <p className="text-sm text-center text-slate-500 mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/signup/rep" className="text-[#0f2044] font-semibold hover:underline">Sign up as rep</Link>
              {" or "}
              <Link href="/signup/business" className="text-[#0f2044] font-semibold hover:underline">as business</Link>
            </p>
          </div>

          <p className="text-center mt-6">
            <Link href="/verify" className="text-sm text-slate-400 hover:text-slate-600 transition">Homeowner? Verify your sale →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
