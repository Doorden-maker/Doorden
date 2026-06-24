import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "rep") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rep = user.repProfile!;
  const { contentId } = await req.json();

  await prisma.trainingProgress.upsert({
    where: { repId_contentId: { repId: rep.id, contentId } },
    create: { repId: rep.id, contentId },
    update: {},
  });

  // Check if all content for current level is complete
  const allForLevel = await prisma.trainingContent.findMany({ where: { level: rep.trainingLevel } });
  const completed = await prisma.trainingProgress.findMany({ where: { repId: rep.id, contentId: { in: allForLevel.map(c => c.id) } } });

  if (completed.length === allForLevel.length && allForLevel.length > 0) {
    await createNotification(user.id, "training", "Level Complete!", `You completed all Level ${rep.trainingLevel} training content.`, `/rep/training`);
  }

  return NextResponse.json({ success: true });
}
