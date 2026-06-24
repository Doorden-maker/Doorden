import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { metadata?: { jobId?: string; purchaseId?: string } };
    const { jobId, purchaseId } = session.metadata || {};

    if (jobId) {
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (job) {
        const depositPaid = job.depositAmount || job.estimatedPrice * 0.1;
        const platformFee = job.estimatedPrice * 0.06;
        const repAmount = job.estimatedPrice * 0.12;
        const businessNet = job.estimatedPrice * 0.82;

        await prisma.$transaction([
          prisma.job.update({
            where: { id: jobId },
            data: { status: "confirmed", stripePaymentId: (session as { id?: string }).id },
          }),
          prisma.commission.upsert({
            where: { jobId },
            create: { jobId, repId: job.repId, jobValue: job.estimatedPrice, repAmount, platformFee, businessNet, depositPaid },
            update: {},
          }),
        ]);
      }
    }

    if (purchaseId) {
      // Training purchase confirmed — admin still needs to manually confirm
      await prisma.trainingPurchase.update({
        where: { id: purchaseId },
        data: { stripePaymentId: (session as { id?: string }).id },
      });
    }
  }

  return NextResponse.json({ received: true });
}
