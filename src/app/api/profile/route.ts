import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (user.role === "rep") {
    const { fullName, phone, city, zip, serviceAreas, description, serviceCategories, availabilityStatus } = body;
    const rep = await prisma.repProfile.update({
      where: { userId: user.id },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(city !== undefined && { city }),
        ...(zip !== undefined && { zip }),
        ...(serviceAreas && { serviceAreas }),
        ...(description && { description }),
        ...(serviceCategories !== undefined && { serviceCategories }),
        ...(availabilityStatus && { availabilityStatus }),
      },
    });
    return NextResponse.json({ success: true, rep });
  }

  if (user.role === "business") {
    const { businessName, contactName, phone, businessCity, businessZip, workingCities, serviceAreas, servicesOffered, serviceCategory, pricingDescription, minRepLevel } = body;
    const biz = await prisma.businessProfile.update({
      where: { userId: user.id },
      data: {
        ...(businessName && { businessName }),
        ...(contactName && { contactName }),
        ...(phone && { phone }),
        ...(businessCity !== undefined && { businessCity }),
        ...(businessZip !== undefined && { businessZip }),
        ...(workingCities !== undefined && { workingCities }),
        ...(serviceAreas && { serviceAreas }),
        ...(servicesOffered && { servicesOffered }),
        ...(serviceCategory !== undefined && { serviceCategory }),
        ...(pricingDescription && { pricingDescription }),
        ...(minRepLevel !== undefined && { minRepLevel: parseInt(minRepLevel) }),
      },
    });
    return NextResponse.json({ success: true, biz });
  }

  return NextResponse.json({ error: "Not allowed" }, { status: 403 });
}
