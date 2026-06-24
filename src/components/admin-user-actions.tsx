"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface Props {
  userId: string;
  role: "rep" | "business";
  isActive: boolean;
  trainingLevel?: number;
  minRepLevel?: number;
}

export function AdminUserActions({ userId, role, isActive, trainingLevel, minRepLevel }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(data: object) {
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {role === "rep" && (
        <Select
          className="h-7 text-xs py-0 pr-6 w-auto"
          value={trainingLevel}
          onChange={e => update({ trainingLevel: parseInt(e.target.value) })}
          disabled={loading}
        >
          <option value={1}>L1</option>
          <option value={2}>L2</option>
          <option value={3}>L3</option>
          <option value={4}>L4</option>
        </Select>
      )}
      {role === "business" && (
        <Select
          className="h-7 text-xs py-0 pr-6 w-auto"
          value={minRepLevel}
          onChange={e => update({ minRepLevel: parseInt(e.target.value) })}
          disabled={loading}
        >
          <option value={1}>Min L1</option>
          <option value={2}>Min L2</option>
          <option value={3}>Min L3</option>
          <option value={4}>Min L4</option>
        </Select>
      )}
      <Button
        size="sm"
        variant={isActive ? "destructive" : "secondary"}
        onClick={() => update({ isActive: !isActive })}
        disabled={loading}
      >
        {loading ? "..." : isActive ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}
