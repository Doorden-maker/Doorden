import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const {
      email, password, businessName, contactName, phone,
      businessCity, businessZip, workingCities,
      serviceAreas, servicesOffered, serviceCategory,
      pricingDescription, minRepLevel,
    } = await req.json();

    if (!email || !password || !businessName || !contactName || !phone ||
        !businessCity || !businessZip || !workingCities ||
        !servicesOffered || !serviceCategory || !pricingDescription) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "business",
        businessProfile: {
          create: {
            businessName,
            contactName,
            phone,
            businessCity,
            businessZip,
            workingCities,
            serviceAreas: workingCities, // compatibility
            servicesOffered,
            serviceCategory,
            pricingDescription,
            minRepLevel: parseInt(minRepLevel) || 1,
          },
        },
      },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({ data: { userId: user.id, token, expiresAt } });

    const res = NextResponse.json({ success: true });
    res.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
