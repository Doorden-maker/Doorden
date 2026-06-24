import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json();

  const partnership = await prisma.repBusinessPartnership.findUnique({
    where: { id },
    include: {
      rep: { include: { user: true } },
      business: { include: { user: true } },
    },
  });
  if (!partnership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only the party being requested can accept/reject
  const canAct =
    (user.role === "business" && partnership.status === "pending_rep" && user.businessProfile?.id === partnership.businessId) ||
    (user.role === "rep" && partnership.status === "pending_business" && user.repProfile?.id === partnership.repId) ||
    user.role === "admin";

  if (!canAct) return NextResponse.json({ error: "Cannot act on this request" }, { status: 403 });

  if (action === "accept") {
    await prisma.repBusinessPartnership.update({ where: { id }, data: { status: "accepted" } });
    // Notify the requester
    if (partnership.requestedBy === "rep") {
      await createNotification(partnership.rep.userId, "partnership_accepted", "Partnership Accepted!",
        `${partnership.business.businessName} approved your request. You can now submit leads for them.`, "/rep");
    } else {
      await createNotification(partnership.business.userId, "partnership_accepted", "Rep Accepted Your Invite",
        `${partnership.rep.fullName} accepted your invitation.`, "/business");
    }
    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    await prisma.repBusinessPartnership.update({ where: { id }, data: { status: "rejected" } });
    if (partnership.requestedBy === "rep") {
      await createNotification(partnership.rep.userId, "partnership_rejected", "Partnership Request Declined",
        `${partnership.business.businessName} declined your request.`, "/rep");
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.repBusinessPartnership.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
