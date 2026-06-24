import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "rep") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rep = user.repProfile!;
  const { id } = await params;
  const { message } = await req.json();

  const opportunity = await prisma.jobOpportunity.findUnique({
    where: { id },
    include: { business: { include: { user: true } } },
  });
  if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (rep.trainingLevel < opportunity.minRepLevel) {
    return NextResponse.json({ error: `This opportunity requires Level ${opportunity.minRepLevel} training.` }, { status: 403 });
  }

  const existing = await prisma.jobApplication.findUnique({ where: { opportunityId_repId: { opportunityId: id, repId: rep.id } } });
  if (existing) return NextResponse.json({ error: "Already applied" }, { status: 400 });

  const application = await prisma.jobApplication.create({
    data: { opportunityId: id, repId: rep.id, message },
  });

  await createNotification(
    opportunity.business.userId,
    "application",
    "New Application",
    `${rep.fullName} applied to your opportunity: ${opportunity.title}`,
    `/business/marketplace`
  );

  return NextResponse.json(application, { status: 201 });
}
