import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const job = await prisma.job.findUnique({ where: { homeownerToken: token } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.homeownerMessage.findMany({
    where: { jobId: job.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();
  const { content, fromType, senderName } = body;

  const job = await prisma.job.findUnique({ where: { homeownerToken: token }, include: { business: { include: { user: true } } } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // fromType = "homeowner" (no auth required) or "business" (auth required)
  if (fromType === "business") {
    const user = await getSession();
    if (!user || user.role !== "business" || user.businessProfile?.id !== job.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const msg = await prisma.homeownerMessage.create({
    data: {
      jobId: job.id,
      fromType: fromType || "homeowner",
      senderName: senderName || (fromType === "business" ? job.business.businessName : job.homeownerName),
      content,
    },
  });
  return NextResponse.json(msg, { status: 201 });
}
