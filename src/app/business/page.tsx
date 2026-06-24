import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, JOB_STATUS_LABELS, JOB_STATUS_COLORS } from "@/lib/utils";
import { BusinessJobActions } from "@/components/business-job-actions";
import { PartnershipActions } from "@/components/partnership-actions";

const LEVEL_NAMES: Record<number, string> = { 1: "Foundation", 2: "Intermediate", 3: "Advanced", 4: "Expert" };

export default async function BusinessDashboard() {
  const user = await getSession();
  if (!user || user.role !== "business") redirect("/login");

  const biz = user.businessProfile!;

  const [allJobs, partnerships] = await Promise.all([
    prisma.job.findMany({
      where: {
        businessId: biz.id,
        status: { notIn: ["lead_created", "code_sent"] },
      },
      include: { rep: true, photos: true, commission: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.repBusinessPartnership.findMany({
      where: { businessId: biz.id },
      include: { rep: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pendingReview = allJobs.filter(j => j.status === "awaiting_business");
  const moreInfo = allJobs.filter(j => j.status === "more_info_requested");
  const awaitingDeposit = allJobs.filter(j => j.status === "awaiting_deposit");
  const confirmed = allJobs.filter(j => ["confirmed", "scheduled", "in_progress"].includes(j.status));
  const completed = allJobs.filter(j => ["commission_payable", "commission_paid", "completed"].includes(j.status));
  const rejected = allJobs.filter(j => j.status === "rejected");

  const pendingPartnerRequests = partnerships.filter(p => p.status === "pending_rep"); // rep requested, business hasn't responded
  const acceptedPartners = partnerships.filter(p => p.status === "accepted");

  const totalJobValue = completed.reduce((s, j) => s + j.estimatedPrice, 0);
  const netRevenue = totalJobValue * 0.82;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-[#0f2044] rounded-2xl p-5 mb-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{biz.businessName}</h1>
            <p className="text-blue-300 text-sm mt-0.5">
              {biz.serviceCategory && <span className="mr-2">{biz.serviceCategory}</span>}
              {biz.businessCity && <span className="mr-2">{biz.businessCity}</span>}
              Min Rep Level: {biz.minRepLevel}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/business/reps" className="border border-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition">Browse Reps</Link>
            <Link href="/messages" className="border border-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition">Messages</Link>
          </div>
        </div>
      </div>

      {/* Pending partner requests from reps */}
      {pendingPartnerRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <div className="font-bold text-amber-900 mb-2">Partnership Requests ({pendingPartnerRequests.length})</div>
          <div className="space-y-2">
            {pendingPartnerRequests.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
                <div>
                  <div className="font-semibold text-gray-800">{p.rep.fullName}</div>
                  <div className="text-xs text-gray-500">Level {p.rep.trainingLevel} · {p.rep.serviceAreas}</div>
                  {p.message && <div className="text-xs text-gray-400 mt-0.5">"{p.message}"</div>}
                </div>
                <PartnershipActions partnershipId={p.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { value: pendingReview.length + moreInfo.length, label: "Needs Review", color: "text-amber-600" },
          { value: confirmed.length + awaitingDeposit.length, label: "Active Jobs", color: "text-blue-600" },
          { value: formatCurrency(totalJobValue), label: "Completed Value", color: "text-emerald-600" },
          { value: acceptedPartners.length, label: "Active Reps", color: "text-indigo-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Awaiting business review */}
      {pendingReview.length > 0 && (
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Awaiting Your Review ({pendingReview.length})
          </h2>
          <div className="space-y-4">
            {pendingReview.map(job => (
              <Card key={job.id} className="border-amber-200">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900">{job.homeownerName}</h3>
                        <span className="text-xs font-mono text-[#0f2044] bg-blue-50 px-2 py-0.5 rounded">{job.leadId}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{job.homeownerAddress}</p>
                      <p className="text-sm text-slate-400">{job.homeownerPhone}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-black text-slate-900">{formatCurrency(job.estimatedPrice)}</div>
                      <div className="text-xs text-slate-400">{formatDate(job.createdAt)}</div>
                      {job.businessDeadline && (
                        <div className="text-xs text-amber-600 font-semibold mt-0.5">
                          Deadline: {new Date(job.businessDeadline).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Service</p>
                      <p className="font-semibold text-slate-900">{job.serviceType}</p>
                      <p className="text-sm text-slate-600 mt-1">{job.description}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-blue-400 uppercase mb-1">Sales Rep</p>
                      <p className="font-semibold text-slate-900">{job.rep.fullName} · Level {job.repTrainingLevel}</p>
                      {job.rep.repCode && <p className="text-xs text-slate-400 font-mono">{job.rep.repCode}</p>}
                    </div>
                  </div>

                  {job.photos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                      {job.photos.map(p => (
                        <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                          <img src={p.url} alt="" className="w-full aspect-square object-cover rounded-lg hover:opacity-90 transition" />
                        </a>
                      ))}
                    </div>
                  )}

                  <BusinessJobActions jobId={job.id} estimatedPrice={job.estimatedPrice} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* More info requested */}
      {moreInfo.length > 0 && (
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
            More Info Requested ({moreInfo.length})
          </h2>
          <div className="space-y-3">
            {moreInfo.map(job => (
              <Card key={job.id} className="border-orange-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-slate-900">{job.homeownerName}</span>
                      <p className="text-sm text-slate-500 truncate">{job.homeownerAddress}</p>
                      <p className="text-xs text-orange-600 mt-1">{job.moreInfoRequest}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold">{formatCurrency(job.estimatedPrice)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active jobs */}
      {(awaitingDeposit.length > 0 || confirmed.length > 0) && (
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Active Jobs ({awaitingDeposit.length + confirmed.length})
          </h2>
          <div className="space-y-3">
            {[...awaitingDeposit, ...confirmed].map(job => (
              <Card key={job.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-semibold text-slate-900">{job.homeownerName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${JOB_STATUS_COLORS[job.status] || ""}`}>
                          {JOB_STATUS_LABELS[job.status]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{job.homeownerAddress}</p>
                      <p className="text-xs text-slate-400">{job.serviceType} · {job.rep.fullName}</p>
                      {job.scheduledDate && <p className="text-xs text-cyan-600 font-medium">Scheduled: {job.scheduledDate}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold">{formatCurrency(job.estimatedPrice)}</div>
                      <BusinessJobActions jobId={job.id} estimatedPrice={job.estimatedPrice} mode="manage" status={job.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
            Completed ({completed.length})
          </h2>
          <div className="space-y-2">
            {completed.map(job => (
              <Card key={job.id}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-slate-900">{job.homeownerName}</span>
                      <p className="text-sm text-slate-500 truncate">{job.homeownerAddress}</p>
                      <p className="text-xs text-slate-400">{job.serviceType}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold">{formatCurrency(job.estimatedPrice)}</div>
                      <div className="text-xs text-emerald-600">Net: {formatCurrency(job.estimatedPrice * 0.82)}</div>
                      <div className="text-xs text-slate-400">{formatDate(job.createdAt)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {allJobs.length === 0 && pendingPartnerRequests.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold text-slate-700 mb-1">No leads yet</p>
            <p className="text-sm text-slate-400 mb-4">Accept rep partnerships so they can start submitting leads for you</p>
            <Link href="/business/reps" className="bg-[#0f2044] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1a3360] inline-block">Browse Reps</Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
