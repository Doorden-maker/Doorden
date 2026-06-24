"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTS = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "offline", label: "Offline" },
];

export function RepAvailabilityToggle({ currentStatus }: { currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function changeStatus(val: string) {
    setLoading(true);
    setStatus(val);
    await fetch("/api/rep/availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: val }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <select
      value={status}
      onChange={e => changeStatus(e.target.value)}
      disabled={loading}
      className="text-xs border border-white/30 rounded-lg px-2.5 py-1 focus:outline-none bg-white/10 text-white cursor-pointer"
    >
      {STATUS_OPTS.map(o => <option key={o.value} value={o.value} className="text-slate-900 bg-white">{o.label}</option>)}
    </select>
  );
}
