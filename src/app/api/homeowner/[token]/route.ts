import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const job = await prisma.job.findUnique({
    where: { homeownerToken: token },
    include: {
      rep: true,
      business: true,
      photos: true,
      homeownerMessages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Strip internal/sensitive fields
  const { visitCode, visitCodeExpiry, visitCodeVerified, stripePaymentId, homeownerToken, ...safeJob } = job;
  return NextResponse.json(safeJob);
}
