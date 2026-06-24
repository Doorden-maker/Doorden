import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrowseBusinesses } from "@/components/browse-businesses";

export default async function RepBrowseBusinessesPage() {
  const user = await getSession();
  if (!user || user.role !== "rep") redirect("/login");

  const rep = user.repProfile!;

  const [businesses, partnerships] = await Promise.all([
    prisma.businessProfile.findMany({
      where: { isActive: true },
      include: {
        jobs: { where: { status: "commission_paid" }, select: { id: true } },
        user: { select: { id: true } },
      },
      orderBy: { businessName: "asc" },
    }),
    prisma.repBusinessPartnership.findMany({
      where: { repId: rep.id },
      select: { businessId: true, status: true },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Businesses</h1>
        <p className="text-gray-500">Request a partnership to start submitting leads. Your level: <strong>Level {rep.trainingLevel}</strong>.</p>
      </div>
      <BrowseBusinesses businesses={businesses} repLevel={rep.trainingLevel} repAreas={rep.serviceAreas} partnerships={partnerships} />
    </div>
  );
}
