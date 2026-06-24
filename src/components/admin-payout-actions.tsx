"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdminPayoutActions({ commissionId, isPaidOut }: { commissionId: string; isPaidOut: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/admin/commissions/${commissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaidOut: !isPaidOut }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      size="sm"
      variant={isPaidOut ? "outline" : "default"}
      onClick={toggle}
      disabled={loading}
    >
      {loading ? "..." : isPaidOut ? "Mark Unpaid" : "Mark Paid"}
    </Button>
  );
}
