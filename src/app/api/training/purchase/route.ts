import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, TRAINING_PRICES, TRAINING_NAMES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "rep") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rep = user.repProfile!;
  const { level } = await req.json();

  if (level <= 1 || level > 4) {
    return NextResponse.json({ error: "Invalid training level" }, { status: 400 });
  }

  if (level <= rep.trainingLevel) {
    return NextResponse.json({ error: "You already have this level or higher" }, { status: 400 });
  }

  const price = TRAINING_PRICES[level as keyof typeof TRAINING_PRICES];
  const name = TRAINING_NAMES[level as keyof typeof TRAINING_NAMES];

  // Create pending purchase record
  const purchase = await prisma.trainingPurchase.create({
    data: { repId: rep.id, level, amount: price / 100 },
  });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `Doorden Training — ${name}` },
          unit_amount: price,
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/rep/training/success?purchase=${purchase.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/rep/training`,
      metadata: { purchaseId: purchase.id, repId: rep.id, level: level.toString() },
    });

    await prisma.trainingPurchase.update({
      where: { id: purchase.id },
      data: { stripePaymentId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch {
    // Stripe not configured — return fallback
    return NextResponse.json({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/rep/training/success?purchase=${purchase.id}`,
      demo: true,
    });
  }
}
