import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businesses = await prisma.businessProfile.findMany({
    where: { isActive: true },
    select: {
      id: true,
      businessName: true,
      serviceAreas: true,
      servicesOffered: true,
      pricingDescription: true,
      minRepLevel: true,
    },
    orderBy: { businessName: "asc" },
  });

  return NextResponse.json(businesses);
}
