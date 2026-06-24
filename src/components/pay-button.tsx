"use client";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

export function PayButton({ jobId, amount }: { jobId: string; amount: number }) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    const res = await fetch(`/api/pay/${jobId}`, { method: "POST" });
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
    } else {
      alert("Payment could not be initiated. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="block w-full text-center bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
    >
      {loading ? "Processing..." : `Pay ${formatCurrency(amount)} Securely`}
    </button>
  );
}
