import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, JOB_STATUS_LABELS, JOB_STATUS_COLORS } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminJobsPage() {
  const user = await getSession();
  if (!user || user.role !== "admin") redirect("/login");

  const jobs = await prisma.job.findMany({
    include: { rep: true, business: true, commission: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Jobs ({jobs.length})</h1>
        <a href="/api/admin/export?type=jobs" className="text-sm border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50">
          Export CSV
        </a>
      </div>

      <Card>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-gray-500 text-xs uppercase">
                  <th className="py-3 pr-4">Homeowner</th>
                  <th className="py-3 pr-4">Rep</th>
                  <th className="py-3 pr-4">Business</th>
                  <th className="py-3 pr-4">Service</th>
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Platform Fee</th>
                  <th className="py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-900">{job.homeownerName}</div>
                      <div className="text-xs text-gray-400">{job.homeownerAddress}</div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{job.rep.fullName}</td>
                    <td className="py-3 pr-4 text-gray-600">{job.business.businessName}</td>
                    <td className="py-3 pr-4 text-gray-600">{job.serviceType}</td>
                    <td className="py-3 pr-4 font-medium">{formatCurrency(job.estimatedPrice)}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${JOB_STATUS_COLORS[job.status]}`}>
                        {JOB_STATUS_LABELS[job.status]}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {job.commission ? formatCurrency(job.commission.platformFee) : "—"}
                    </td>
                    <td className="py-3 text-gray-400">{formatDate(job.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
