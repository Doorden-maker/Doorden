import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrowseReps } from "@/components/browse-reps";

export default async function BusinessBrowseRepsPage() {
  const user = await getSession();
  if (!user || user.role !== "business") redirect("/login");

  const biz = user.businessProfile!;

  const [reps, partnerships] = await Promise.all([
    prisma.repProfile.findMany({
      where: { isActive: true },
      include: {
        jobs: { where: { businessId: biz.id, status: "commission_paid" }, select: { id: true } },
        _count: { select: { jobs: true } },
        user: { select: { id: true } },
      },
      orderBy: { trainingLevel: "desc" },
    }),
    prisma.repBusinessPartnership.findMany({
      where: { businessId: biz.id },
      select: { repId: true, status: true },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Sales Reps</h1>
        <p className="text-gray-500">Invite reps to partner with your business. Min level: <strong>Level {biz.minRepLevel}</strong>.</p>
      </div>
      <BrowseReps reps={reps} bizAreas={biz.serviceAreas} minRepLevel={biz.minRepLevel} partnerships={partnerships} />
    </div>
  );
}
