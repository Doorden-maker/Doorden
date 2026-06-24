import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

function generateLeadId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `L-${num}`;
}

function generateRefNumber(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

function generateToken(): string {
  return randomBytes(20).toString("hex");
}

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let jobs;
  if (user.role === "rep") {
    const rep = user.repProfile!;
    jobs = await prisma.job.findMany({
      where: { repId: rep.id, ...(status ? { status } : {}) },
      include: { business: true, photos: true, commission: true, verification: true },
      orderBy: { createdAt: "desc" },
    });
  } else if (user.role === "business") {
    const biz = user.businessProfile!;
    // Business only sees jobs that are homeowner_verified or beyond
    jobs = await prisma.job.findMany({
      where: {
        businessId: biz.id,
        status: { notIn: ["lead_created", "code_sent"] },
        ...(status ? { status } : {}),
      },
      include: { rep: true, photos: true, commission: true },
      orderBy: { createdAt: "desc" },
    });
  } else {
    jobs = await prisma.job.findMany({
      where: status ? { status } : {},
      include: { rep: true, business: true, photos: true, commission: true },
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "rep") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rep = user.repProfile!;
  const formData = await req.formData();

  const homeownerName = formData.get("homeownerName") as string;
  const homeownerPhone = formData.get("homeownerPhone") as string;
  const homeownerEmail = formData.get("homeownerEmail") as string || "";
  const homeownerAddress = formData.get("homeownerAddress") as string;
  const serviceType = formData.get("serviceType") as string;
  const description = formData.get("description") as string;
  const estimatedPrice = parseFloat(formData.get("estimatedPrice") as string);
  const businessId = formData.get("businessId") as string;
  const photos = formData.getAll("photos") as File[];

  if (!homeownerName || !homeownerPhone || !homeownerAddress || !serviceType || !description || !estimatedPrice || !businessId) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // Verify partnership is accepted
  const partnership = await prisma.repBusinessPartnership.findUnique({
    where: { repId_businessId: { repId: rep.id, businessId } },
  });
  if (!partnership || partnership.status !== "accepted") {
    return NextResponse.json({ error: "You must be an accepted partner of this business to submit leads." }, { status: 403 });
  }

  const business = await prisma.businessProfile.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  if (rep.trainingLevel < business.minRepLevel) {
    return NextResponse.json({ error: `This business requires Level ${business.minRepLevel} training.` }, { status: 403 });
  }

  // Save photos
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const photoRecords: { filename: string; url: string }[] = [];
  for (const photo of photos) {
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}-${photo.name}`;
    await writeFile(path.join(uploadDir, filename), buffer);
    photoRecords.push({ filename, url: `/uploads/${filename}` });
  }

  // Generate unique IDs
  let leadId = generateLeadId();
  let refNum = generateRefNumber();
  let token = generateToken();

  // Ensure uniqueness
  for (let i = 0; i < 10; i++) {
    const ex = await prisma.job.findUnique({ where: { leadId } });
    if (!ex) break;
    leadId = generateLeadId();
  }

  const job = await prisma.job.create({
    data: {
      leadId,
      referenceNumber: refNum,
      homeownerToken: token,
      repId: rep.id,
      businessId,
      homeownerName,
      homeownerPhone,
      homeownerEmail,
      homeownerAddress,
      serviceType,
      description,
      estimatedPrice,
      repTrainingLevel: rep.trainingLevel,
      status: "lead_created",
      photos: photoRecords.length > 0 ? { create: photoRecords } : undefined,
    },
    include: { photos: true },
  });

  return NextResponse.json(job, { status: 201 });
}
