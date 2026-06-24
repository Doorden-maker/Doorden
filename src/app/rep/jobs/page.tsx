import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from "@/lib/utils";

export default async function RepJobsPage() {
  const user = await getSession();
  if (!user || user.role !== "rep") redirect("/login");

  const rep = user.repProfile!;
  const jobs = await prisma.job.findMany({
    where: { repId: rep.id },
    include: { business: true, photos: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Leads</h1>
          <p className="text-slate-500 text-sm">{jobs.length} total</p>
        </div>
        <Link href="/rep/jobs/new" className="bg-[#0f2044] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1a3360] transition">+ New Lead</Link>
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-semibold">No leads yet</p>
          <p className="text-sm mt-1">Create your first lead after knocking a door</p>
          <Link href="/rep/jobs/new" className="mt-4 inline-block bg-[#0f2044] text-white px-5 py-2.5 rounded-xl text-sm font-semibold">Create Lead</Link>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map((job) => {
          const statusLabel = JOB_STATUS_LABELS[job.status] || job.status;
          const statusColor = JOB_STATUS_COLORS[job.status] || "bg-gray-100 text-gray-700";
          const needsCode = ["lead_created", "code_sent"].includes(job.status);
          return (
            <Link key={job.id} href={`/rep/jobs/${job.id}`} className="block bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition active:scale-[0.98]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{job.homeownerName}</div>
                  <div className="text-sm text-slate-500 truncate">{job.homeownerAddress}</div>
                  <div className="text-sm text-slate-500">{job.business.businessName} · {job.serviceType}</div>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">{job.leadId}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                  <span className="text-sm font-bold text-[#0f2044]">${job.estimatedPrice.toLocaleString()}</span>
                  {needsCode && !job.visitCodeVerified && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Need code</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
