import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const levelParam = searchParams.get("level");
  const level = levelParam ? parseInt(levelParam) : null;

  let maxLevel = 1;
  if (user.role === "rep") {
    maxLevel = user.repProfile?.trainingLevel || 1;
  } else if (user.role === "admin") {
    maxLevel = 4;
  }

  const content = await prisma.trainingContent.findMany({
    where: {
      ...(level ? { level } : { level: { lte: maxLevel } }),
    },
    orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json(content);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { level, title, contentType, content, sortOrder } = body;

  const item = await prisma.trainingContent.create({
    data: { level, title, contentType, content, sortOrder: sortOrder || 0 },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.trainingContent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
