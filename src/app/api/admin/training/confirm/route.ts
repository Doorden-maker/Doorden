import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { purchaseId } = await req.json();

  const purchase = await prisma.trainingPurchase.findUnique({
    where: { id: purchaseId },
    include: { rep: true },
  });

  if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  if (purchase.isConfirmed) return NextResponse.json({ error: "Already confirmed" }, { status: 400 });

  await prisma.$transaction([
    prisma.trainingPurchase.update({
      where: { id: purchaseId },
      data: { isConfirmed: true, confirmedAt: new Date(), confirmedBy: user.id },
    }),
    prisma.repProfile.update({
      where: { id: purchase.repId },
      data: { trainingLevel: Math.max(purchase.rep.trainingLevel, purchase.level) },
    }),
  ]);

  return NextResponse.json({ success: true });
}
