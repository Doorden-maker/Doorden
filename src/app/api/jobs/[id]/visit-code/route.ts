import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "rep") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.repId !== user.repProfile!.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (job.visitCodeVerified) return NextResponse.json({ error: "Already verified by homeowner" }, { status: 400 });
  if (!["lead_created", "code_sent"].includes(job.status)) {
    return NextResponse.json({ error: "Cannot generate code at this stage" }, { status: 400 });
  }

  // Generate 8-digit numeric code
  const code = String(Math.floor(10000000 + Math.random() * 90000000));
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const updated = await prisma.job.update({
    where: { id },
    data: { visitCode: code, visitCodeExpiry: expiry, status: "code_sent" },
  });

  return NextResponse.json({ code: updated.visitCode, expiry: updated.visitCodeExpiry });
}
