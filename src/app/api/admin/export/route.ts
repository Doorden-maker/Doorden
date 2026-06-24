import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "jobs";

  if (type === "jobs") {
    const jobs = await prisma.job.findMany({
      include: { rep: true, business: true, commission: true },
      orderBy: { createdAt: "desc" },
    });

    const rows = [
      ["ID", "Status", "Rep", "Business", "Homeowner", "Address", "Service", "Price", "Deposit", "Rep Commission", "Platform Fee", "Created"],
      ...jobs.map(j => [
        j.id, j.status, j.rep.fullName, j.business.businessName, j.homeownerName,
        j.homeownerAddress, j.serviceType, j.estimatedPrice,
        j.depositAmount || "", j.commission?.repAmount || "", j.commission?.platformFee || "",
        j.createdAt.toISOString(),
      ]),
    ];

    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=jobs.csv",
      },
    });
  }

  if (type === "reps") {
    const reps = await prisma.repProfile.findMany({
      include: { user: true, commissions: true },
    });

    const rows = [
      ["ID", "Name", "Email", "Phone", "Training Level", "Total Jobs", "Total Earned", "Active"],
      ...reps.map(r => [
        r.id, r.fullName, r.user.email, r.phone, r.trainingLevel,
        r.commissions.length,
        r.commissions.reduce((s, c) => s + c.repAmount, 0).toFixed(2),
        r.isActive,
      ]),
    ];

    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=reps.csv",
      },
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
