"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS, formatDateTime } from "@/lib/utils";

interface Job {
  id: string;
  leadId: string;
  referenceNumber: string;
  homeownerName: string;
  homeownerPhone: string;
  homeownerEmail: string;
  homeownerAddress: string;
  homeownerToken: string;
  serviceType: string;
  description: string;
  estimatedPrice: number;
  depositAmount: number | null;
  status: string;
  visitCode: string | null;
  visitCodeExpiry: string | null;
  visitCodeVerified: boolean;
  businessDeadline: string | null;
  moreInfoRequest: string | null;
  declineReason: string | null;
  createdAt: string;
  business: { id: string; businessName: string; phone: string; contactName: string };
  photos: { url: string }[];
}

export default function RepJobDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [codeResult, setCodeResult] = useState<{ code: string; expiry: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchJob = async () => {
    const res = await fetch(`/api/jobs/${id}`);
    if (res.ok) setJob(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchJob(); }, [id]);

  async function generateCode() {
    setGeneratingCode(true);
    const res = await fetch(`/api/jobs/${id}/visit-code`, { method: "POST" });
    const data = await res.json();
    if (res.ok) { setCodeResult(data); fetchJob(); }
    else alert(data.error || "Failed to generate code");
    setGeneratingCode(false);
  }

  function copyCode() {
    const code = codeResult?.code || job?.visitCode;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-[#0f2044] border-t-transparent rounded-full" /></div>;
  if (!job) return <div className="text-center py-20 text-gray-500">Lead not found</div>;

  const statusLabel = JOB_STATUS_LABELS[job.status] || job.status;
  const statusColor = JOB_STATUS_COLORS[job.status] || "bg-gray-100 text-gray-700";
  const canEdit = ["lead_created", "code_sent", "more_info_requested"].includes(job.status);
  const canGenerateCode = ["lead_created", "code_sent"].includes(job.status) && !job.visitCodeVerified;
  const currentCode = codeResult?.code || job.visitCode;
  const codeExpiry = codeResult?.expiry || job.visitCodeExpiry;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => router.back()} className="text-[#0f2044] font-medium text-sm">← Back</button>
        <div className="flex-1" />
        {canEdit && (
          <Link href={`/rep/jobs/${id}/edit`} className="text-sm text-[#0f2044] font-semibold bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200">Edit</Link>
        )}
      </div>

      {/* Header */}
      <div className="bg-[#0f2044] text-white rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white/60 text-xs font-mono">{job.leadId}</div>
            <div className="font-bold text-xl mt-0.5">{job.homeownerName}</div>
            <div className="text-white/70 text-sm">{job.homeownerAddress}</div>
            <div className="text-white/70 text-sm mt-1">{job.business.businessName} · {job.serviceType}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
            <span className="text-2xl font-bold">${job.estimatedPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Status alerts */}
      {job.status === "more_info_requested" && job.moreInfoRequest && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm">
          <div className="font-bold text-orange-800 mb-1">Business Needs More Info</div>
          <p className="text-orange-700">{job.moreInfoRequest}</p>
          {canEdit && <Link href={`/rep/jobs/${id}/edit`} className="mt-2 inline-block text-sm font-semibold text-orange-800 underline">Edit & Resubmit →</Link>}
        </div>
      )}

      {job.status === "rejected" && job.declineReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          <div className="font-bold text-red-800 mb-1">Quote Rejected</div>
          <p className="text-red-700">{job.declineReason}</p>
        </div>
      )}

      {job.status === "awaiting_deposit" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm">
          <div className="font-bold text-emerald-800 mb-1">Quote Accepted!</div>
          <p className="text-emerald-700">The business accepted the quote. Waiting for the homeowner to pay the deposit.</p>
        </div>
      )}

      {/* Visit Code Section */}
      {(canGenerateCode || (job.visitCode && !job.visitCodeVerified)) && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-[#0f2044] mb-3">Homeowner Verification Code</h3>
          {!currentCode ? (
            <>
              <p className="text-sm text-gray-600 mb-4">Generate an 8-digit code, show it to the homeowner. They confirm the visit at <strong>doorden.com/verify</strong> and your quote goes to the business automatically.</p>
              <button
                onClick={generateCode}
                disabled={generatingCode}
                className="w-full bg-[#0f2044] text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-[#1a3360] transition"
              >
                {generatingCode ? "Generating..." : "Generate Verification Code"}
              </button>
            </>
          ) : (
            <div className="space-y-3">
              {!job.visitCodeVerified && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                  Show this code to the homeowner. Expires {codeExpiry ? new Date(codeExpiry).toLocaleTimeString() : "in 24 hours"}.
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[#0f2044] text-white rounded-2xl p-4 text-center">
                  <div className="text-xs text-white/60 mb-1">Verification Code</div>
                  <div className="text-4xl font-mono font-bold tracking-widest">{currentCode}</div>
                </div>
                <button onClick={copyCode} className="bg-slate-100 hover:bg-slate-200 text-[#0f2044] p-3 rounded-xl font-semibold text-sm transition min-w-[60px]">
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              {canGenerateCode && (
                <button onClick={generateCode} disabled={generatingCode} className="w-full text-sm text-[#0f2044] font-medium py-2 border border-slate-200 rounded-xl hover:bg-slate-50">
                  Regenerate Code
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {job.visitCodeVerified && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm">
          <div className="font-bold text-indigo-800 mb-1">✓ Homeowner Verified</div>
          <p className="text-indigo-700">The homeowner confirmed your visit. The quote has been sent to {job.business.businessName}.</p>
          {job.businessDeadline && <p className="text-indigo-600 text-xs mt-1">Business deadline: {new Date(job.businessDeadline).toLocaleString()}</p>}
        </div>
      )}

      {/* Lead Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-bold text-gray-700 mb-3">Lead Details</h3>
        <div className="space-y-2.5 text-sm">
          {[
            ["Lead ID", job.leadId],
            ["Reference", job.referenceNumber],
            ["Phone", job.homeownerPhone],
            ["Email", job.homeownerEmail || "—"],
            ["Deposit (18%)", `$${(job.depositAmount ?? job.estimatedPrice * 0.18).toFixed(2)}`],
            ["Created", formatDateTime(job.createdAt)],
          ].map(([label, value], i) => (
            <div key={i} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {job.description && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-gray-700 mb-2">Notes</h3>
          <p className="text-sm text-gray-700">{job.description}</p>
        </div>
      )}

      {/* Photos */}
      {job.photos.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-gray-700 mb-3">Photos ({job.photos.length})</h3>
          <div className="grid grid-cols-3 gap-2">
            {job.photos.map((p, i) => (
              <img key={i} src={p.url} className="rounded-xl aspect-square object-cover" alt="" />
            ))}
          </div>
        </div>
      )}

      {/* Homeowner link */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-sm">
        <h3 className="font-bold text-gray-700 mb-2">Homeowner Job Link</h3>
        <p className="text-gray-500 mb-2">Share this link with the homeowner to track their job and chat with the business.</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 truncate">/job/{job.homeownerToken}</code>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/job/${job.homeownerToken}`); }} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg font-medium">Copy</button>
        </div>
      </div>
    </div>
  );
}
