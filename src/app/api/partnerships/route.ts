import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  if (user.role === "rep") {
    const rep = user.repProfile!;
    const partnerships = await prisma.repBusinessPartnership.findMany({
      where: { repId: rep.id, ...(businessId ? { businessId } : {}) },
      include: { business: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(partnerships);
  }

  if (user.role === "business") {
    const biz = user.businessProfile!;
    const partnerships = await prisma.repBusinessPartnership.findMany({
      where: { businessId: biz.id },
      include: { rep: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(partnerships);
  }

  if (user.role === "admin") {
    const partnerships = await prisma.repBusinessPartnership.findMany({
      include: { rep: true, business: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(partnerships);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || (user.role !== "rep" && user.role !== "business")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetId, message } = await req.json();

  if (user.role === "rep") {
    const rep = user.repProfile!;
    const existing = await prisma.repBusinessPartnership.findUnique({
      where: { repId_businessId: { repId: rep.id, businessId: targetId } },
    });
    if (existing) return NextResponse.json({ error: "Request already exists" }, { status: 400 });

    const business = await prisma.businessProfile.findUnique({ where: { id: targetId }, include: { user: true } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const partnership = await prisma.repBusinessPartnership.create({
      data: { repId: rep.id, businessId: targetId, status: "pending_rep", requestedBy: "rep", message: message || "" },
    });

    await createNotification(business.userId, "partnership_request", "New Partnership Request",
      `${rep.fullName} wants to sell for your business.`, "/business");
    return NextResponse.json(partnership, { status: 201 });
  }

  if (user.role === "business") {
    const biz = user.businessProfile!;
    const existing = await prisma.repBusinessPartnership.findUnique({
      where: { repId_businessId: { repId: targetId, businessId: biz.id } },
    });
    if (existing) return NextResponse.json({ error: "Request already exists" }, { status: 400 });

    const rep = await prisma.repProfile.findUnique({ where: { id: targetId }, include: { user: true } });
    if (!rep) return NextResponse.json({ error: "Rep not found" }, { status: 404 });

    const partnership = await prisma.repBusinessPartnership.create({
      data: { repId: targetId, businessId: biz.id, status: "pending_business", requestedBy: "business", message: message || "" },
    });

    await createNotification(rep.userId, "partnership_request", "Business Wants to Work With You",
      `${biz.businessName} invited you to sell for them.`, "/rep");
    return NextResponse.json(partnership, { status: 201 });
  }
}
