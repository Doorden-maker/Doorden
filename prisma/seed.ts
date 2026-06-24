import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const existing = await prisma.user.findUnique({ where: { email: "admin@doorden.com" } });
  if (!existing) {
    const password = await bcrypt.hash("admin123", 12);
    await prisma.user.create({
      data: { email: "admin@doorden.com", password, role: "admin" },
    });
    console.log("✅ Admin user created: admin@doorden.com / admin123");
  } else {
    console.log("ℹ Admin user already exists");
  }

  // Seed training content (skip if already exists)
  const contentCount = await prisma.trainingContent.count();
  if (contentCount === 0) {
    await prisma.trainingContent.createMany({
      data: [
        {
          level: 1, title: "Welcome to Doorden", contentType: "lesson", sortOrder: 1,
          content: "Welcome to the Doorden platform!\n\n**Platform Overview**\n- You submit job leads from homeowners\n- Businesses review and accept jobs\n- Homeowners pay a 10% deposit\n- You earn 12% commission when the job completes\n\n**Getting Started**\n1. Complete training\n2. Find homeowners who need services\n3. Submit jobs through your dashboard",
        },
        {
          level: 1, title: "Door-to-Door Fundamentals", contentType: "lesson", sortOrder: 2,
          content: "**Basic Door-to-Door Principles**\n\n1. **First Impressions Matter** — Dress professionally, smile, stand back from the door\n2. **Introduction** — State your name, company, and why you're there in 10 seconds\n3. **Listen First** — Ask open-ended questions to understand needs\n4. **Qualify the Lead** — Confirm homeownership and decision-making authority\n5. **Document Everything** — Accurate details lead to better outcomes\n\n**Golden Rule:** Never promise what a business hasn't agreed to. Your job is to connect, not to sell.",
        },
        {
          level: 2, title: "Handling Objections", contentType: "lesson", sortOrder: 1,
          content: "**Common Objections & Responses**\n\n\"I'm not interested\" → \"No problem. Is it timing, or have you already handled this?\"\n\n\"I need to talk to my spouse\" → \"Absolutely. When could I come back when you're both available?\"\n\n\"How much does it cost?\" → \"The business provides a free estimate — no obligation.\"\n\n\"I've already gotten quotes\" → \"We work with top-rated local businesses — getting another perspective costs nothing.\"",
        },
        {
          level: 2, title: "Basic Quoting Guidance", contentType: "lesson", sortOrder: 2,
          content: "**How to Estimate Job Value**\n\nYour estimated price needs to be reasonable and helpful for the business:\n\n- Ask the homeowner what they've been quoted before\n- Research average costs for the service type in your area\n- Document all relevant details (square footage, materials, condition)\n- It's better to estimate slightly higher than too low\n- The business will finalize the price — your estimate just sets expectations\n\n**Never promise a specific price to the homeowner.** Always say \"the business will provide the final quote.\"",
        },
        {
          level: 3, title: "Professional Communication", contentType: "lesson", sortOrder: 1,
          content: "**Communicating Professionally at the Door**\n\nYour professionalism directly affects job quality and your reputation with businesses.\n\n**Do:**\n- Introduce yourself fully (name, company, purpose)\n- Take notes during the conversation\n- Ask permission before taking photos\n- Confirm all details with the homeowner before submitting\n- Be honest about the process and timeline\n\n**Don't:**\n- Make promises you can't keep\n- Rush through the qualification\n- Submit incomplete or inaccurate job details\n- Pressure homeowners",
        },
        {
          level: 4, title: "Advanced Closing Strategies", contentType: "lesson", sortOrder: 1,
          content: "**Moving from Interest to Commitment**\n\nAt Level 4, your job is to get a firm verbal commitment from the homeowner before submitting.\n\n**The Commitment Close:**\nAfter explaining the process: \"Does this sound like something you want to move forward with? If the business accepts and you're happy with the quote, are you ready to pay the deposit and get started?\"\n\n**Handling Hesitation:**\n- \"What would make this a yes for you?\"\n- \"Is there anything holding you back?\"\n- \"What's your biggest concern?\"\n\nA Level 4 rep submits jobs where the homeowner is genuinely ready to proceed.",
        },
      ],
    });
    console.log("✅ Training content seeded");
  } else {
    console.log(`ℹ Training content already exists (${contentCount} items)`);
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
