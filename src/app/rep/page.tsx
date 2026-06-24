import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, JOB_STATUS_LABELS, JOB_STATUS_COLORS } from "@/lib/utils";
import { RepAvailabilityToggle } from "@/components/rep-availability-toggle";
import { RepAvatarUpload } from "@/components/rep-avatar-upload";
import { PartnershipActions } from "@/components/partnership-actions";

export default async function RepDashboard() {
  const user = await getSession();
  if (!user || user.role !== "rep") redirect("/login");

  const rep = user.repProfile!;

  const [jobs, commissions, pendingPurchases, trainingProgress, totalContent, partnerships] = await Promise.all([
    prisma.job.findMany({
      where: { repId: rep.id },
      include: { business: true, commission: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.commission.findMany({ where: { repId: rep.id } }),
    prisma.trainingPurchase.findMany({ where: { repId: rep.id, isConfirmed: false }, orderBy: { createdAt: "desc" } }),
    prisma.trainingProgress.count({ where: { repId: rep.id } }),
    prisma.trainingContent.count({ where: { level: { lte: rep.trainingLevel } } }),
    prisma.repBusinessPartnership.findMany({
      where: { repId: rep.id },
      include: { business: { include: { user: { select: { id: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalEarned = commissions.filter(c => c.isPaidOut).reduce((s, c) => s + c.repAmount, 0);
  const pendingPayout = commissions.filter(c => !c.isPaidOut).reduce((s, c) => s + c.repAmount, 0);
  const acceptedPartnerships = partnerships.filter(p => p.status === "accepted");
  const pendingIncoming = partnerships.filter(p => p.status === "pending_business"); // business invited this rep

  const LEVEL_NAMES: Record<number, string> = { 1: "Foundation", 2: "Intermediate", 3: "Advanced", 4: "Expert" };
  const STATUS_DOT: Record<string, string> = { available: "bg-emerald-500", busy: "bg-amber-400", offline: "bg-slate-400" };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-[#0f2044] rounded-2xl p-5 mb-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <RepAvatarUpload currentAvatar={rep.avatarUrl} repName={rep.fullName} />
            <div>
              <h1 className="text-xl font-bold text-white">{rep.fullName}</h1>
              {rep.repCode && <div className="text-xs font-mono text-white/60 mt-0.5">Rep ID: {rep.repCode}</div>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT[rep.availabilityStatus] || "bg-slate-400"}`} />
                <RepAvailabilityToggle currentStatus={rep.availabilityStatus} />
                <span className="text-white/30">|</span>
                <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-semibold">
                  Level {rep.trainingLevel} — {LEVEL_NAMES[rep.trainingLevel]}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/rep/businesses" className="border border-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition">Browse Businesses</Link>
            <Link href="/rep/jobs/new" className="bg-white text-[#0f2044] px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition shadow-sm">+ New Lead</Link>
          </div>
        </div>
      </div>

      {/* Pending partnership invites from businesses */}
      {pendingIncoming.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
          <div className="font-bold text-blue-900 mb-2">Business Partnership Invites ({pendingIncoming.length})</div>
          <div className="space-y-2">
            {pendingIncoming.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
                <div>
                  <div className="font-semibold text-gray-800">{p.business.businessName}</div>
                  <div className="text-xs text-gray-500">{p.business.serviceCategory}</div>
                </div>
                <PartnershipActions partnershipId={p.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { value: jobs.length, label: "Total Leads", color: "text-[#0f2044]" },
          { value: formatCurrency(totalEarned), label: "Total Earned", color: "text-emerald-600" },
          { value: formatCurrency(pendingPayout), label: "Pending Payout", color: "text-amber-600" },
          { value: acceptedPartnerships.length, label: "Active Partners", color: "text-indigo-600" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5 font-medium">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Leads list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">My Leads</CardTitle>
                <Link href="/rep/jobs" className="text-xs text-[#0f2044] font-semibold hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {jobs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="font-medium text-slate-600 mb-1">No leads yet</p>
                  <p className="text-sm mb-4">First get accepted by a business, then create a lead</p>
                  <Link href="/rep/businesses" className="text-[#0f2044] font-semibold hover:underline text-sm">Browse businesses →</Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {jobs.slice(0, 10).map(job => (
                    <Link key={job.id} href={`/rep/jobs/${job.id}`} className="block py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50 -mx-5 px-5 rounded transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-semibold text-slate-900">{job.homeownerName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${JOB_STATUS_COLORS[job.status] || "bg-gray-100 text-gray-600"}`}>
                            {JOB_STATUS_LABELS[job.status] || job.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 truncate">{job.homeownerAddress}</p>
                        <p className="text-xs text-slate-400">{job.business.businessName} · {job.serviceType}</p>
                        <p className="text-xs font-mono text-slate-300 mt-0.5">{job.leadId}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-slate-900">{formatCurrency(job.estimatedPrice)}</div>
                        {job.commission && <div className="text-xs text-emerald-600 font-medium">+{formatCurrency(job.commission.repAmount)}</div>}
                        <div className="text-xs text-slate-400 mt-0.5">{formatDate(job.createdAt)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Partnerships */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">My Partnerships</CardTitle>
                <Link href="/rep/businesses" className="text-xs text-[#0f2044] font-semibold hover:underline">Find more</Link>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {acceptedPartnerships.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <p className="text-sm">No accepted partnerships yet.</p>
                  <Link href="/rep/businesses" className="text-[#0f2044] font-semibold text-sm hover:underline mt-1 inline-block">Browse businesses →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {acceptedPartnerships.slice(0, 5).map(p => (
                    <div key={p.id} className="bg-emerald-50 rounded-xl px-3 py-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <div className="font-semibold text-sm text-gray-800">{p.business.businessName}</div>
                          <div className="text-xs text-gray-500">{p.business.serviceCategory}</div>
                        </div>
                        <span className="text-xs text-emerald-700 font-semibold">Active</span>
                      </div>
                      <div className="flex gap-1.5">
                        <a href={`/business/${p.business.id}/view`} className="flex-1 text-center text-xs bg-white border border-slate-200 text-slate-600 font-medium py-1 rounded-lg hover:bg-slate-50 transition">View</a>
                        <a href={`/messages?with=${p.business.user.id}`} className="flex-1 text-center text-xs bg-[#0f2044] text-white font-medium py-1 rounded-lg hover:bg-[#1a3360] transition">Message</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Training */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base">Training</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="flex items-center gap-3 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-9 h-9 bg-[#0f2044] rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-white font-black">{rep.trainingLevel}</span>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Level {rep.trainingLevel} — {LEVEL_NAMES[rep.trainingLevel]}</div>
                  <div className="text-xs text-slate-500">{trainingProgress}/{totalContent} lessons</div>
                </div>
              </div>
              {totalContent > 0 && (
                <div className="mb-3">
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-[#0f2044] h-1.5 rounded-full transition-all" style={{ width: `${Math.round(trainingProgress / totalContent * 100)}%` }} />
                  </div>
                </div>
              )}
              <Link href="/rep/training" className="block text-sm text-[#0f2044] font-semibold hover:underline">View training →</Link>
            </CardContent>
          </Card>

          {pendingPurchases.length > 0 && (
            <Card>
              <CardHeader className="border-b border-slate-100 pb-3"><CardTitle className="text-base">Pending Training</CardTitle></CardHeader>
              <CardContent className="pt-3">
                {pendingPurchases.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-700 font-medium">Level {p.level} upgrade</span>
                    <Badge variant="warning">Awaiting admin</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
