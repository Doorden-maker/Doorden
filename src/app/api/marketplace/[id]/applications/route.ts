import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || (user.role !== "business" && user.role !== "admin")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const apps = await prisma.jobApplication.findMany({
    where: { opportunityId: id },
    include: { rep: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(apps);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || (user.role !== "business" && user.role !== "admin")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { applicationId, status } = await req.json();

  const app = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status },
    include: { rep: { include: { user: true } }, opportunity: true },
  });

  if (status === "accepted") {
    await createNotification(
      app.rep.userId,
      "application_accepted",
      "Application Accepted!",
      `You were accepted for: ${app.opportunity.title}`,
      `/rep/marketplace`
    );
    await prisma.repProfile.update({
      where: { id: app.repId },
      data: { availabilityStatus: "busy" },
    });
  }

  return NextResponse.json(app);
}
