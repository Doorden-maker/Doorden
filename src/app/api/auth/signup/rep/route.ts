import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

function generateRepCode(fullName: string): string {
  const initials = fullName.split(" ").map(n => n[0]?.toUpperCase() || "X").join("").slice(0, 2).padEnd(2, "X");
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${initials}${num}`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phone, city, zip, serviceAreas, description } = await req.json();

    if (!email || !password || !fullName || !phone || !city || !zip || !serviceAreas || !description) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

    // Generate unique repCode
    let repCode = generateRepCode(fullName);
    for (let i = 0; i < 10; i++) {
      const ex = await prisma.repProfile.findUnique({ where: { repCode } });
      if (!ex) break;
      repCode = generateRepCode(fullName);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "rep",
        repProfile: {
          create: { fullName, phone, city, zip, serviceAreas, description, repCode },
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
