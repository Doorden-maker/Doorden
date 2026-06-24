import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { isPaidOut, repAmount } = await req.json();

  const updated = await prisma.commission.update({
    where: { id },
    data: {
      ...(isPaidOut !== undefined ? { isPaidOut, paidOutAt: isPaidOut ? new Date() : null } : {}),
      ...(repAmount !== undefined ? { repAmount } : {}),
    },
  });

  return NextResponse.json(updated);
}
