import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const { isActive, trainingLevel, minRepLevel } = body;

  const targetUser = await prisma.user.findUnique({
    where: { id },
    include: { repProfile: true, businessProfile: true },
  });
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (targetUser.role === "rep" && targetUser.repProfile) {
    await prisma.repProfile.update({
      where: { id: targetUser.repProfile.id },
      data: {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(trainingLevel !== undefined ? { trainingLevel } : {}),
      },
    });
  } else if (targetUser.role === "business" && targetUser.businessProfile) {
    await prisma.businessProfile.update({
      where: { id: targetUser.businessProfile.id },
      data: {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(minRepLevel !== undefined ? { minRepLevel } : {}),
      },
    });
  }

  return NextResponse.json({ success: true });
}
