import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const opportunities = await prisma.jobOpportunity.findMany({
    where: { isActive: true },
    include: {
      business: true,
      applications: user.role === "rep" && user.repProfile
        ? { where: { repId: user.repProfile.id } }
        : true,
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(opportunities);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "business") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const biz = user.businessProfile!;
  const { title, description, serviceCategory, territory, commissionStructure, minRepLevel } = await req.json();

  if (!title || !description || !serviceCategory || !territory || !commissionStructure) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const opportunity = await prisma.jobOpportunity.create({
    data: { businessId: biz.id, title, description, serviceCategory, territory, commissionStructure, minRepLevel: parseInt(minRepLevel) || 1 },
    include: { business: true, _count: { select: { applications: true } } },
  });

  return NextResponse.json(opportunity, { status: 201 });
}
