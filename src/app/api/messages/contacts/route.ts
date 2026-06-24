import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all users this person has exchanged messages with
  const messages = await prisma.message.findMany({
    where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }] },
    include: {
      fromUser: { include: { repProfile: true, businessProfile: true } },
      toUser: { include: { repProfile: true, businessProfile: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const contactMap = new Map<string, { userId: string; name: string; role: string; avatarUrl?: string | null; lastMessage: string; unread: number; lastAt: Date }>();
  for (const m of messages) {
    const other = m.fromUserId === user.id ? m.toUser : m.fromUser;
    const otherId = other.id;
    if (!contactMap.has(otherId)) {
      const name = other.repProfile?.fullName || other.businessProfile?.businessName || other.email;
      const avatarUrl = other.repProfile?.avatarUrl;
      const unread = messages.filter(msg => msg.fromUserId === otherId && msg.toUserId === user.id && !msg.isRead).length;
      contactMap.set(otherId, { userId: otherId, name, role: other.role, avatarUrl, lastMessage: m.content, unread, lastAt: m.createdAt });
    }
  }

  // For reps: also include businesses from their jobs
  if (user.role === "rep" && user.repProfile) {
    const jobs = await prisma.job.findMany({
      where: { repId: user.repProfile.id },
      include: { business: { include: { user: true } } },
      distinct: ["businessId"],
    });
    for (const j of jobs) {
      if (!contactMap.has(j.business.userId)) {
        contactMap.set(j.business.userId, {
          userId: j.business.userId,
          name: j.business.businessName,
          role: "business",
          lastMessage: "",
          unread: 0,
          lastAt: new Date(0),
        });
      }
    }
  }

  // For businesses: also include reps from their jobs
  if (user.role === "business" && user.businessProfile) {
    const jobs = await prisma.job.findMany({
      where: { businessId: user.businessProfile.id },
      include: { rep: { include: { user: true } } },
      distinct: ["repId"],
    });
    for (const j of jobs) {
      if (!contactMap.has(j.rep.userId)) {
        contactMap.set(j.rep.userId, {
          userId: j.rep.userId,
          name: j.rep.fullName,
          role: "rep",
          avatarUrl: j.rep.avatarUrl,
          lastMessage: "",
          unread: 0,
          lastAt: new Date(0),
        });
      }
    }
  }

  return NextResponse.json(Array.from(contactMap.values()).sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime()));
}
