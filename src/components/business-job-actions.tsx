"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  jobId: string;
  estimatedPrice?: number;
  mode?: "review" | "manage" | "complete";
  status?: string;
}

export function BusinessJobActions({ jobId, estimatedPrice, mode = "review", status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [showDecline, setShowDecline] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [moreInfoText, setMoreInfoText] = useState("");
  const [showEditPrice, setShowEditPrice] = useState(false);
  const [newPrice, setNewPrice] = useState(String(estimatedPrice || ""));
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");

  async function doAction(action: string, extra?: object) {
    setLoading(action);
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    setLoading(null);
    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json();
      alert(json.error || "Error");
    }
  }

  if (mode === "complete") {
    return (
      <Button size="sm" variant="secondary"
        onClick={() => { if (confirm("Mark this job as completed?")) doAction("complete"); }}
        disabled={loading === "complete"}
      >
        {loading === "complete" ? "..." : "Mark Completed"}
      </Button>
    );
  }

  if (mode === "manage") {
    return (
      <div className="mt-2 flex flex-col gap-1.5">
        {status === "confirmed" && !showSchedule && (
          <button onClick={() => setShowSchedule(true)} className="text-xs bg-cyan-50 text-cyan-700 border border-cyan-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-cyan-100 transition">Schedule Job</button>
        )}
        {showSchedule && (
          <div className="space-y-1.5">
            <input type="text" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} placeholder="e.g. Mon June 30, 2:00 PM" className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-full" />
            <div className="flex gap-1.5">
              <button onClick={() => doAction("schedule", { scheduledDate })} disabled={!scheduledDate || !!loading} className="flex-1 text-xs bg-cyan-600 text-white px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50">Confirm</button>
              <button onClick={() => setShowSchedule(false)} className="text-xs border border-slate-200 px-3 py-1.5 rounded-lg">Cancel</button>
            </div>
          </div>
        )}
        {status === "scheduled" && (
          <button onClick={() => doAction("in_progress")} disabled={!!loading} className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-violet-100 transition">Start Job</button>
        )}
        {status === "in_progress" && (
          <button onClick={() => { if (confirm("Mark this job complete?")) doAction("complete"); }} disabled={!!loading} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-emerald-100 transition">Mark Complete</button>
        )}
      </div>
    );
  }

  // Review mode (awaiting_business)
  return (
    <div className="space-y-2">
      {/* Accept */}
      <Button className="w-full" onClick={() => doAction("accept")} disabled={!!loading}>
        {loading === "accept" ? "Accepting..." : "Accept Quote"}
      </Button>

      {/* Edit price */}
      {!showEditPrice ? (
        <button onClick={() => setShowEditPrice(true)} className="w-full text-sm border border-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-50 transition font-medium">
          Adjust Price
        </button>
      ) : (
        <div className="space-y-1.5">
          <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2044]/20" placeholder="New price" />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => doAction("edit_quote", { estimatedPrice: newPrice })} disabled={!newPrice || !!loading}>
              {loading === "edit_quote" ? "..." : "Save Price"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowEditPrice(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Request more info */}
      {!showMoreInfo ? (
        <button onClick={() => setShowMoreInfo(true)} className="w-full text-sm border border-orange-200 text-orange-700 py-2 rounded-lg hover:bg-orange-50 transition font-medium">
          Request More Info
        </button>
      ) : (
        <div className="space-y-1.5">
          <textarea className="w-full text-sm border rounded-lg p-2 h-16 resize-none focus:outline-none focus:ring-1 focus:ring-orange-400" placeholder="What info do you need from the rep?" value={moreInfoText} onChange={e => setMoreInfoText(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-orange-700 border-orange-200" onClick={() => doAction("request_more_info", { moreInfoRequest: moreInfoText })} disabled={!moreInfoText || !!loading}>
              {loading === "request_more_info" ? "..." : "Send Request"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowMoreInfo(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Decline */}
      {!showDecline ? (
        <button onClick={() => setShowDecline(true)} className="w-full text-sm border border-red-200 text-red-600 py-2 rounded-lg hover:bg-red-50 transition font-medium">
          Reject Quote
        </button>
      ) : (
        <div className="space-y-1.5">
          <textarea className="w-full text-sm border rounded-lg p-2 h-16 resize-none focus:outline-none focus:ring-1 focus:ring-red-400" placeholder="Reason for rejecting (optional)" value={declineReason} onChange={e => setDeclineReason(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" className="flex-1" onClick={() => doAction("reject", { reason: declineReason })} disabled={!!loading}>
              {loading === "reject" ? "..." : "Confirm Reject"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowDecline(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
