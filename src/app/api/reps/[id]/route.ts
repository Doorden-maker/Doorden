import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const rep = await prisma.repProfile.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!rep) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check partnership status
  let partnershipStatus: string | null = null;
  if (user.role === "business" && user.businessProfile) {
    const p = await prisma.repBusinessPartnership.findUnique({
      where: { repId_businessId: { repId: id, businessId: user.businessProfile.id } },
    });
    partnershipStatus = p?.status ?? null;
  }

  return NextResponse.json({ ...rep, partnershipStatus });
}
