"use client";
import { useState } from "react";
import Link from "next/link";

export default function VerifyPage() {
  const [tab, setTab] = useState<"visit" | "lookup">("visit");

  const [visitCode, setVisitCode] = useState("");
  const [visitResult, setVisitResult] = useState<null | { success?: boolean; error?: string; repName?: string; businessName?: string; service?: string; address?: string; estimatedPrice?: number; leadId?: string }>(null);
  const [visitLoading, setVisitLoading] = useState(false);

  const [refNum, setRefNum] = useState("");
  const [lookupResult, setLookupResult] = useState<null | { error?: string; leadId?: string; repName?: string; business?: string; service?: string; address?: string; status?: string; estimatedPrice?: number }>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  async function handleVisitVerify() {
    if (!visitCode.trim()) return;
    setVisitLoading(true);
    setVisitResult(null);
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: visitCode.trim() }),
    });
    const data = await res.json();
    setVisitResult(res.ok ? { ...data, success: true } : { error: data.error || "Something went wrong." });
    setVisitLoading(false);
  }

  async function handleLookup() {
    if (!refNum.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    const res = await fetch(`/api/verify?ref=${refNum.trim()}`);
    const data = await res.json();
    setLookupResult(res.ok ? data : { error: data.error || "Not found." });
    setLookupLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-[#0f2044] text-white py-10 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold mx-auto mb-4">D</div>
          <h1 className="text-2xl font-bold mb-2">Homeowner Portal</h1>
          <p className="text-white/70 text-sm">Confirm a rep's visit or look up your job status.</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 mb-6">
          {[
            { key: "visit", label: "Confirm Rep Visit" },
            { key: "lookup", label: "Look Up Job" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as "visit" | "lookup")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${tab === t.key ? "bg-[#0f2044] text-white shadow" : "text-gray-500 hover:text-gray-800"}`}
            >{t.label}</button>
          ))}
        </div>

        {tab === "visit" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-[#0f2044] text-lg mb-1">Confirm Rep Visit</h2>
            <p className="text-gray-500 text-sm mb-5">Enter the 8-digit code your sales rep gave you.</p>

            {!visitResult?.success && (
              <>
                <input
                  value={visitCode}
                  onChange={(e) => setVisitCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="Enter 8-digit code"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0f2044]/20 mb-4"
                  maxLength={8}
                />
                <button
                  onClick={handleVisitVerify}
                  disabled={visitLoading || visitCode.length < 8}
                  className="w-full bg-[#0f2044] text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition hover:bg-[#1a3360]"
                >
                  {visitLoading ? "Verifying..." : "Confirm Visit"}
                </button>
                {visitResult?.error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">{visitResult.error}</div>
                )}
              </>
            )}

            {visitResult?.success && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="font-bold text-green-800 mb-1">✓ Visit Confirmed!</div>
                  <p className="text-green-700 text-sm">Your quote has been sent to the business. They have 48 hours to review.</p>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    ["Lead ID", visitResult.leadId, "font-mono font-bold text-[#0f2044]"],
                    ["Rep", visitResult.repName, "font-semibold"],
                    ["Business", visitResult.businessName, "font-semibold"],
                    ["Service", visitResult.service, "font-semibold"],
                    ["Address", visitResult.address, "font-semibold text-right max-w-[60%]"],
                    ["Quote", `$${visitResult.estimatedPrice?.toLocaleString()}`, "font-bold text-[#0f2044] text-lg"],
                  ].map(([label, value, cls], i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-gray-500">{label}</span>
                      <span className={cls as string}>{value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center">Save your Lead ID to look up your job status later.</p>
              </div>
            )}
          </div>
        )}

        {tab === "lookup" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-[#0f2044] text-lg mb-1">Look Up Your Job</h2>
            <p className="text-gray-500 text-sm mb-5">Enter your Lead ID (e.g. L-847392) or reference number.</p>

            <input
              value={refNum}
              onChange={(e) => setRefNum(e.target.value)}
              placeholder="L-847392 or 12345678"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0f2044]/20 mb-4"
            />
            <button
              onClick={handleLookup}
              disabled={lookupLoading || !refNum.trim()}
              className="w-full bg-[#0f2044] text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition hover:bg-[#1a3360]"
            >
              {lookupLoading ? "Looking up..." : "Find Job"}
            </button>

            {lookupResult?.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">{lookupResult.error}</div>
            )}

            {lookupResult && !lookupResult.error && (
              <div className="mt-4 space-y-0">
                {[
                  ["Lead ID", lookupResult.leadId, "font-mono font-bold"],
                  ["Status", lookupResult.status?.replace(/_/g, " "), "font-semibold capitalize"],
                  ["Rep", lookupResult.repName, "font-semibold"],
                  ["Business", lookupResult.business, "font-semibold"],
                  ["Service", lookupResult.service, "font-semibold"],
                  ["Quote", `$${lookupResult.estimatedPrice?.toLocaleString()}`, "font-bold text-[#0f2044] text-lg"],
                ].map(([label, value, cls], i) => (
                  <div key={i} className="flex justify-between py-2.5 border-b border-slate-100 last:border-0 text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className={cls as string}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link href="/" className="hover:text-gray-700">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
