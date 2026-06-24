import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const withUserId = searchParams.get("with");

  if (user.role === "admin" && !withUserId) {
    // Admin sees all conversations
    const messages = await prisma.message.findMany({
      include: { fromUser: { include: { repProfile: true, businessProfile: true } }, toUser: { include: { repProfile: true, businessProfile: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(messages);
  }

  if (!withUserId) return NextResponse.json({ error: "Missing 'with' param" }, { status: 400 });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { fromUserId: user.id, toUserId: withUserId },
        { fromUserId: withUserId, toUserId: user.id },
      ],
    },
    include: { fromUser: { select: { id: true, role: true, repProfile: { select: { fullName: true, avatarUrl: true } }, businessProfile: { select: { businessName: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  // Mark received messages as read
  await prisma.message.updateMany({
    where: { fromUserId: withUserId, toUserId: user.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toUserId, content } = await req.json();
  if (!toUserId || !content?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const message = await prisma.message.create({
    data: { fromUserId: user.id, toUserId, content: content.trim() },
    include: { fromUser: { select: { id: true, role: true, repProfile: { select: { fullName: true, avatarUrl: true } }, businessProfile: { select: { businessName: true } } } } },
  });

  const senderName = user.repProfile?.fullName || user.businessProfile?.businessName || user.email;
  await createNotification(toUserId, "message", `New message from ${senderName}`, content.trim().slice(0, 80), `/messages?with=${user.id}`);

  return NextResponse.json(message, { status: 201 });
}
