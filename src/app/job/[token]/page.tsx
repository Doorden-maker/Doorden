"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

interface Job {
  id: string;
  leadId: string;
  referenceNumber: string;
  homeownerName: string;
  homeownerPhone: string;
  homeownerAddress: string;
  serviceType: string;
  description: string;
  estimatedPrice: number;
  depositAmount: number | null;
  status: string;
  stripePaymentUrl: string | null;
  createdAt: string;
  rep: { fullName: string; phone: string; avatarUrl: string | null };
  business: { businessName: string; phone: string; contactName: string };
  photos: { url: string }[];
  homeownerMessages: Message[];
}

interface Message {
  id: string;
  fromType: string;
  senderName: string;
  content: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  lead_created: "Lead Created",
  code_sent: "Verification Pending",
  homeowner_verified: "Verified",
  awaiting_business: "Under Review",
  more_info_requested: "More Info Needed",
  accepted: "Accepted",
  rejected: "Rejected",
  awaiting_deposit: "Awaiting Deposit",
  confirmed: "Confirmed",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  commission_payable: "Completed",
  commission_paid: "Completed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  lead_created: "bg-slate-100 text-slate-700",
  awaiting_business: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  awaiting_deposit: "bg-blue-100 text-blue-800",
  confirmed: "bg-teal-100 text-teal-800",
  scheduled: "bg-cyan-100 text-cyan-800",
  in_progress: "bg-violet-100 text-violet-800",
  commission_payable: "bg-green-100 text-green-800",
  commission_paid: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function HomeownerJobPage() {
  const { token } = useParams() as { token: string };
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchJob = async () => {
    const res = await fetch(`/api/homeowner/${token}`);
    if (!res.ok) { setError("Job not found"); setLoading(false); return; }
    const data = await res.json();
    setJob(data);
    setLoading(false);
  };

  useEffect(() => { fetchJob(); }, [token]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [job?.homeownerMessages]);

  // Poll every 10s for new messages
  useEffect(() => {
    const interval = setInterval(fetchJob, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const sendMessage = async () => {
    if (!message.trim() || !job) return;
    setSending(true);
    await fetch(`/api/homeowner/${token}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message, fromType: "homeowner", senderName: job.homeownerName }),
    });
    setMessage("");
    setSending(false);
    fetchJob();
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-[#0f2044] border-t-transparent rounded-full" />
    </div>
  );
  if (error || !job) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Job Not Found</h1>
        <p className="text-gray-600">This link may be invalid or expired.</p>
      </div>
    </div>
  );

  const statusLabel = STATUS_LABELS[job.status] || job.status;
  const statusColor = STATUS_COLORS[job.status] || "bg-gray-100 text-gray-700";
  const deposit = job.depositAmount ?? job.estimatedPrice * 0.18;
  const showChat = ["awaiting_deposit", "confirmed", "scheduled", "in_progress", "commission_payable", "commission_paid", "completed"].includes(job.status);
  const showPayment = job.status === "awaiting_deposit";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#0f2044] text-white px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold">D</div>
            <div>
              <div className="text-sm text-white/70">Doorden</div>
              <div className="font-bold text-lg">Your Job Status</div>
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-white/70 text-sm">Lead ID</div>
              <div className="font-mono font-bold text-lg">{job.leadId}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor}`}>{statusLabel}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Quote Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-bold text-[#0f2044] text-lg mb-4">Quote Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Service</span>
              <span className="font-semibold">{job.serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Address</span>
              <span className="font-semibold text-right max-w-[60%]">{job.homeownerAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Quote Amount</span>
              <span className="font-bold text-lg text-[#0f2044]">${job.estimatedPrice.toLocaleString()}</span>
            </div>
            {showPayment && (
              <div className="flex justify-between">
                <span className="text-gray-500">Deposit (18%)</span>
                <span className="font-bold text-blue-700">${deposit.toFixed(2)}</span>
              </div>
            )}
            {job.description && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-gray-500 mb-1">Notes</div>
                <div className="text-gray-700">{job.description}</div>
              </div>
            )}
          </div>
        </div>

        {/* Rep & Business */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sales Rep</div>
            <div className="flex items-center gap-3">
              {job.rep.avatarUrl ? (
                <img src={job.rep.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#0f2044]/10 flex items-center justify-center text-[#0f2044] font-bold">{job.rep.fullName[0]}</div>
              )}
              <div>
                <div className="font-semibold text-gray-800">{job.rep.fullName}</div>
                <div className="text-sm text-gray-500">{job.rep.phone}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Business</div>
            <div className="font-semibold text-gray-800">{job.business.businessName}</div>
            <div className="text-sm text-gray-500">{job.business.contactName}</div>
            <div className="text-sm text-gray-500">{job.business.phone}</div>
          </div>
        </div>

        {/* Photos */}
        {job.photos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-gray-700 mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {job.photos.map((p, i) => (
                <img key={i} src={p.url} className="rounded-xl object-cover aspect-square" alt="" />
              ))}
            </div>
          </div>
        )}

        {/* Payment CTA */}
        {showPayment && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <div className="font-bold text-blue-900 mb-2">Deposit Required</div>
            <p className="text-blue-800 text-sm mb-4">
              {job.business.businessName} has accepted your quote. To confirm your job, please pay the 18% deposit of <strong>${deposit.toFixed(2)}</strong>.
            </p>
            {job.stripePaymentUrl ? (
              <a href={job.stripePaymentUrl} className="block w-full bg-blue-700 text-white text-center py-3 rounded-xl font-semibold hover:bg-blue-800 transition">Pay Deposit Now</a>
            ) : (
              <div className="text-blue-700 text-sm font-medium">Contact {job.business.businessName} to arrange payment.</div>
            )}
          </div>
        )}

        {/* Status progress */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-[#0f2044] mb-3">Job Progress</h3>
          {[
            { key: "awaiting_business", label: "Quote Submitted" },
            { key: "accepted", label: "Business Accepted" },
            { key: "awaiting_deposit", label: "Deposit Requested" },
            { key: "confirmed", label: "Deposit Paid" },
            { key: "scheduled", label: "Job Scheduled" },
            { key: "in_progress", label: "Work In Progress" },
            { key: "commission_payable", label: "Job Complete" },
          ].map((step, i) => {
            const order = ["awaiting_business", "accepted", "awaiting_deposit", "confirmed", "scheduled", "in_progress", "commission_payable", "commission_paid", "completed"];
            const currentIdx = order.indexOf(job.status);
            const stepIdx = order.indexOf(step.key);
            const done = currentIdx >= stepIdx && currentIdx >= 0;
            return (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? "bg-[#0f2044] text-white" : "bg-slate-100 text-slate-400"}`}>
                  {done ? "✓" : i + 1}
                </div>
                <span className={`text-sm ${done ? "text-[#0f2044] font-semibold" : "text-gray-400"}`}>{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Chat with business */}
        {showChat && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-[#0f2044]">Message {job.business.businessName}</h3>
            </div>
            <div className="h-64 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {job.homeownerMessages.length === 0 && (
                <p className="text-center text-gray-400 text-sm pt-8">No messages yet. Start the conversation!</p>
              )}
              {job.homeownerMessages.map((m) => (
                <div key={m.id} className={`flex ${m.fromType === "homeowner" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${m.fromType === "homeowner" ? "bg-[#0f2044] text-white" : "bg-white border border-slate-200 text-gray-800"}`}>
                    <div className="font-semibold text-xs mb-1 opacity-70">{m.senderName}</div>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2044]/20"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !message.trim()}
                className="bg-[#0f2044] text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              >Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
