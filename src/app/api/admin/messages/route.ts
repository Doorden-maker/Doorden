import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.message.findMany({
    include: {
      fromUser: { include: { repProfile: { select: { fullName: true, avatarUrl: true } }, businessProfile: { select: { businessName: true } } } },
      toUser: { include: { repProfile: { select: { fullName: true } }, businessProfile: { select: { businessName: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json(messages);
}
