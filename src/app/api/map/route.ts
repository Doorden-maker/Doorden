import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [reps, businesses] = await Promise.all([
    prisma.repProfile.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, city: true, zip: true, serviceAreas: true, trainingLevel: true, availabilityStatus: true, avatarUrl: true, serviceCategories: true },
    }),
    prisma.businessProfile.findMany({
      where: { isActive: true },
      select: { id: true, businessName: true, serviceAreas: true, serviceCategory: true, minRepLevel: true, servicesOffered: true },
    }),
  ]);

  return NextResponse.json({ reps, businesses });
}
