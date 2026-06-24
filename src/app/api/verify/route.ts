import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// POST: verify a visit code (homeowner confirms rep visit)
export async function POST(req: NextRequest) {
  const { code, type } = await req.json();
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  // Handle visit verification code (8-digit numeric on Job.visitCode)
  if (type === "visit" || (code && code.match(/^\d{8}$/))) {
    const job = await prisma.job.findFirst({
      where: { visitCode: code, status: { in: ["code_sent"] } },
      include: { rep: { include: { user: true } }, business: true },
    });
    if (!job) return NextResponse.json({ error: "Invalid or expired code" }, { status: 404 });

    // Check expiry
    if (job.visitCodeExpiry && new Date() > job.visitCodeExpiry) {
      return NextResponse.json({ error: "This code has expired. Ask the rep to generate a new one." }, { status: 400 });
    }

    if (job.visitCodeVerified) return NextResponse.json({ error: "Code already used" }, { status: 400 });

    // Mark verified, advance status to homeowner_verified, then to awaiting_business
    const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await prisma.job.update({
      where: { id: job.id },
      data: {
        visitCodeVerified: true,
        status: "awaiting_business",
        businessDeadline: deadline,
      },
    });

    // Notify rep that homeowner verified
    await createNotification(job.rep.userId, "visit_verified", "Homeowner Verified Visit!",
      `${job.homeownerName} confirmed your visit at ${job.homeownerAddress}. The quote has been sent to ${job.business.businessName}.`, `/rep/jobs/${job.id}`);

    return NextResponse.json({
      success: true,
      repName: job.rep.fullName,
      businessName: job.business.businessName,
      service: job.serviceType,
      address: job.homeownerAddress,
      estimatedPrice: job.estimatedPrice,
      leadId: job.leadId,
    });
  }

  // Handle old completion verification codes
  const verification = await prisma.verificationCode.findUnique({
    where: { code: code.toUpperCase() },
    include: { job: { include: { rep: { include: { user: true } }, business: true } } },
  });

  if (!verification) return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  if (verification.isVerified) return NextResponse.json({ error: "Code already used" }, { status: 400 });

  await prisma.verificationCode.update({
    where: { id: verification.id },
    data: { isVerified: true, verifiedAt: new Date(), homeownerConfirmed: true },
  });

  await createNotification(verification.job.rep.userId, "verification", "Sale Verified!",
    `The homeowner at ${verification.job.homeownerAddress} confirmed your visit.`, `/rep`);

  return NextResponse.json({
    success: true,
    repName: verification.job.rep.fullName,
    businessName: verification.job.business.businessName,
    service: verification.job.serviceType,
    address: verification.job.homeownerAddress,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const ref = searchParams.get("ref");

  if (ref) {
    // Support both leadId (L-XXXXXX) and referenceNumber (8-digit)
    const job = await prisma.job.findFirst({
      where: ref.startsWith("L-") || ref.startsWith("l-")
        ? { leadId: ref.toUpperCase() }
        : { referenceNumber: ref },
      include: { rep: true, business: true, verification: true },
    });
    if (!job) return NextResponse.json({ error: "Job not found. Check your Lead ID or reference number." }, { status: 404 });
    return NextResponse.json({
      found: true,
      referenceNumber: job.referenceNumber,
      leadId: job.leadId,
      repName: job.rep.fullName,
      business: job.business.businessName,
      service: job.serviceType,
      address: job.homeownerAddress,
      status: job.status,
      estimatedPrice: job.estimatedPrice,
    });
  }

  if (!code) return NextResponse.json({ error: "Code or ref required" }, { status: 400 });

  // Check visit code
  if (code.match(/^\d{8}$/)) {
    const job = await prisma.job.findFirst({
      where: { visitCode: code },
      include: { rep: true, business: true },
    });
    if (!job) return NextResponse.json({ error: "Invalid code" }, { status: 404 });
    return NextResponse.json({
      valid: true,
      type: "visit",
      repName: job.rep.fullName,
      businessName: job.business.businessName,
      service: job.serviceType,
      address: job.homeownerAddress,
      estimatedPrice: job.estimatedPrice,
      alreadyVerified: job.visitCodeVerified,
      expired: job.visitCodeExpiry ? new Date() > job.visitCodeExpiry : false,
    });
  }

  const verification = await prisma.verificationCode.findUnique({
    where: { code: code.toUpperCase() },
    include: { job: { include: { rep: true, business: true } } },
  });

  if (!verification) return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  return NextResponse.json({ valid: true, type: "completion", job: verification.job, isVerified: verification.isVerified });
}
