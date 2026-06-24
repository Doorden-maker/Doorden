"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function PartnershipActions({ partnershipId }: { partnershipId: string }) {
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const router = useRouter();

  async function act(action: "accept" | "reject") {
    setLoading(action);
    await fetch(`/api/partnerships/${partnershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => act("accept")}
        disabled={!!loading}
        className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
      >{loading === "accept" ? "..." : "Accept"}</button>
      <button
        onClick={() => act("reject")}
        disabled={!!loading}
        className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-100 transition border border-red-200 disabled:opacity-50"
      >{loading === "reject" ? "..." : "Decline"}</button>
    </div>
  );
}
