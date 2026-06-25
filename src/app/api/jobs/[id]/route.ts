import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import Stripe from "stripe";

let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_your")) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-04-30.basil" });
  }
} catch {}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: { rep: true, business: true, photos: true, commission: true, verification: true, homeownerMessages: { orderBy: { createdAt: "asc" } } },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      rep: { include: { user: true } },
      business: { include: { user: true } },
    },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── Rep: edit lead (only before homeowner_verified) ──
  if (action === "rep_edit") {
    if (user.role !== "rep" || user.repProfile?.id !== job.repId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!["lead_created", "code_sent", "more_info_requested"].includes(job.status)) {
      return NextResponse.json({ error: "Lead can only be edited in early stages." }, { status: 400 });
    }
    const { homeownerName, homeownerPhone, homeownerEmail, homeownerAddress, serviceType, description, estimatedPrice } = body;
    const updated = await prisma.job.update({
      where: { id },
      data: {
        homeownerName: homeownerName || job.homeownerName,
        homeownerPhone: homeownerPhone || job.homeownerPhone,
        homeownerEmail: homeownerEmail !== undefined ? homeownerEmail : job.homeownerEmail,
        homeownerAddress: homeownerAddress || job.homeownerAddress,
        serviceType: serviceType || job.serviceType,
        description: description || job.description,
        estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : job.estimatedPrice,
      },
    });
    return NextResponse.json(updated);
  }

  // ── Business: accept quote ──
  if (action === "accept") {
    if (user.role !== "business" || user.businessProfile?.id !== job.businessId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const depositAmount = job.estimatedPrice * 0.18;
    let paymentUrl: string | null = null;
    let paymentId: string | null = null;

    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [{ price_data: { currency: "usd", product_data: { name: `Deposit – ${job.serviceType}` }, unit_amount: Math.round(depositAmount * 100) }, quantity: 1 }],
          mode: "payment",
          success_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/job/${job.homeownerToken}?payment=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/job/${job.homeownerToken}`,
        });
        paymentUrl = session.url;
        paymentId = session.id;
      } catch {}
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { status: "awaiting_deposit", depositAmount, stripePaymentUrl: paymentUrl, stripePaymentId: paymentId },
    });

    await createNotification(job.rep.userId, "job_accepted", "Quote Accepted!", `${job.business.businessName} accepted the quote for ${job.homeownerName}. The homeowner will now pay the deposit.`, `/rep/jobs/${id}`);

    return NextResponse.json(updated);
  }

  // ── Business: reject quote ──
  if (action === "reject") {
    if (user.role !== "business" || user.businessProfile?.id !== job.businessId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { reason } = body;
    await prisma.job.update({ where: { id }, data: { status: "rejected", declineReason: reason || "" } });
    await createNotification(job.rep.userId, "job_rejected", "Quote Rejected", `${job.business.businessName} rejected the quote for ${job.homeownerName}. Reason: ${reason || "None provided"}`, `/rep/jobs/${id}`);
    return NextResponse.json({ success: true });
  }

  // ── Business: request more info ──
  if (action === "request_more_info") {
    if (user.role !== "business" || user.businessProfile?.id !== job.businessId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { moreInfoRequest } = body;
    await prisma.job.update({ where: { id }, data: { status: "more_info_requested", moreInfoRequest: moreInfoRequest || "" } });
    await createNotification(job.rep.userId, "more_info", "More Info Requested", `${job.business.businessName} needs more info on the quote for ${job.homeownerName}: ${moreInfoRequest}`, `/rep/jobs/${id}`);
    return NextResponse.json({ success: true });
  }

  // ── Business: edit quote price ──
  if (action === "edit_quote") {
    if (user.role !== "business" || user.businessProfile?.id !== job.businessId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { estimatedPrice, note } = body;
    await prisma.job.update({ where: { id }, data: { estimatedPrice: parseFloat(estimatedPrice) } });
    await createNotification(job.rep.userId, "quote_edited", "Quote Price Adjusted", `${job.business.businessName} updated the quote price for ${job.homeownerName} to $${estimatedPrice}. ${note || ""}`, `/rep/jobs/${id}`);
    return NextResponse.json({ success: true });
  }

  // ── Business: schedule job ──
  if (action === "schedule") {
    if (user.role !== "business" || user.businessProfile?.id !== job.businessId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { scheduledDate } = body;
    await prisma.job.update({ where: { id }, data: { status: "scheduled", scheduledDate } });
    await createNotification(job.rep.userId, "job_scheduled", "Job Scheduled", `Job for ${job.homeownerName} has been scheduled for ${scheduledDate}.`, `/rep/jobs/${id}`);
    return NextResponse.json({ success: true });
  }

  // ── Business: mark in progress ──
  if (action === "in_progress") {
    if (user.role !== "business" || user.businessProfile?.id !== job.businessId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.job.update({ where: { id }, data: { status: "in_progress" } });
    return NextResponse.json({ success: true });
  }

  // ── Business: complete job ──
  if (action === "complete") {
    if (user.role !== "business" || user.businessProfile?.id !== job.businessId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const repAmount = job.estimatedPrice * 0.12;
    const platformFee = job.estimatedPrice * 0.06;
    const businessNet = job.estimatedPrice * 0.82;
    const depositPaid = job.depositAmount || job.estimatedPrice * 0.18;

    await prisma.job.update({ where: { id }, data: { status: "commission_payable" } });
    await prisma.commission.upsert({
      where: { jobId: id },
      create: { jobId: id, repId: job.repId, jobValue: job.estimatedPrice, repAmount, platformFee, businessNet, depositPaid },
      update: { jobValue: job.estimatedPrice, repAmount, platformFee, businessNet, depositPaid },
    });
    await createNotification(job.rep.userId, "job_completed", "Job Completed!", `Job for ${job.homeownerName} is complete. Your commission of $${repAmount.toFixed(2)} is payable.`, `/rep/jobs/${id}`);
    return NextResponse.json({ success: true });
  }

  // ── Admin: cancel / dispute / pay commission ──
  if (action === "cancel") {
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.job.update({ where: { id }, data: { status: "cancelled" } });
    return NextResponse.json({ success: true });
  }

  if (action === "dispute") {
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.job.update({ where: { id }, data: { status: "disputed" } });
    return NextResponse.json({ success: true });
  }

  if (action === "pay_commission") {
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.job.update({ where: { id }, data: { status: "commission_paid" } });
    if (job.commission) {
      await prisma.commission.update({ where: { jobId: id }, data: { isPaidOut: true, paidOutAt: new Date() } });
    }
    await createNotification(job.rep.userId, "commission_paid", "Commission Paid!", `Your commission for the ${job.homeownerName} job has been paid out.`, `/rep`);
    return NextResponse.json({ success: true });
  }

  // ── Demo: confirm deposit ──
  if (action === "confirm_deposit") {
    await prisma.job.update({ where: { id }, data: { status: "confirmed" } });
    await createNotification(job.rep.userId, "deposit_paid", "Deposit Paid!", `${job.homeownerName} paid the deposit. Job is confirmed.`, `/rep/jobs/${id}`);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
