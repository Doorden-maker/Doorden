import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminDashboard() {
  const user = await getSession();
  if (!user || user.role !== "admin") redirect("/login");

  const [totalUsers, totalJobs, totalReps, totalBusinesses, pendingTraining, recentJobs, totalRevenue, totalMessages, verifiedSales] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.repProfile.count(),
    prisma.businessProfile.count(),
    prisma.trainingPurchase.count({ where: { isConfirmed: false } }),
    prisma.job.findMany({ take: 10, orderBy: { createdAt: "desc" }, include: { rep: true, business: true } }),
    prisma.commission.aggregate({ _sum: { platformFee: true } }),
    prisma.message.count(),
    prisma.verificationCode.count({ where: { isVerified: true } }),
  ]);

  const stats = [
    { value: totalUsers, label: "Total Users", color: "text-[#0f2044]" },
    { value: totalReps, label: "Sales Reps", color: "text-indigo-600" },
    { value: totalBusinesses, label: "Businesses", color: "text-blue-600" },
    { value: totalJobs, label: "Total Jobs", color: "text-slate-700" },
    { value: formatCurrency(totalRevenue._sum.platformFee || 0), label: "Platform Revenue", color: "text-emerald-600" },
    { value: verifiedSales, label: "Verified Sales", color: "text-teal-600" },
    { value: totalMessages, label: "Messages Sent", color: "text-orange-600" },
  ];

  const navItems = [
    { href: "/admin/users", label: "Manage Users", icon: "👥", desc: "Reps, businesses, activation" },
    { href: "/admin/training", label: "Training", icon: "🎓", desc: "Confirm completions, manage content" },
    { href: "/admin/jobs", label: "All Jobs", icon: "📋", desc: "View and edit job records" },
    { href: "/admin/payouts", label: "Payouts", icon: "💰", desc: "Track rep commissions" },
    { href: "/admin/messages", label: "All Messages", icon: "💬", desc: "View all platform conversations" },
    { href: "/map", label: "Territory Map", icon: "🗺", desc: "See reps and businesses on map" },
    { href: "/verify", label: "Verify Portal", icon: "✓", desc: "Homeowner verification" },
  ];

  const STATUS_CHIP: Record<string, string> = {
    pending_review: "bg-amber-100 text-amber-800",
    completed: "bg-slate-100 text-slate-700",
    confirmed: "bg-emerald-100 text-emerald-800",
    awaiting_deposit: "bg-blue-100 text-blue-800",
    declined: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-[#0f2044] rounded-2xl p-6 mb-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-blue-300 text-sm mt-1">Full platform overview and management</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <a href="/api/admin/export?type=jobs" className="text-xs border border-white/30 text-white rounded-lg px-4 py-2 hover:bg-white/10 transition">
            Export Jobs CSV
          </a>
          <a href="/api/admin/export?type=reps" className="text-xs border border-white/30 text-white rounded-lg px-4 py-2 hover:bg-white/10 transition">
            Export Reps CSV
          </a>
        </div>
      </div>

      {/* Pending training alert */}
      {pendingTraining > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-amber-900">⏳ {pendingTraining} training purchase{pendingTraining > 1 ? "s" : ""} pending confirmation</p>
            <p className="text-sm text-amber-700 mt-0.5">Review and confirm rep training completions</p>
          </div>
          <Link href="/admin/training" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 transition shrink-0">
            Review
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium leading-tight">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-md hover:border-[#0f2044]/20 transition-all cursor-pointer group">
              <CardContent className="pt-6 pb-5">
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="font-semibold text-slate-900 group-hover:text-[#0f2044] transition-colors">{item.label}</div>
                <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent jobs */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle>Recent Jobs</CardTitle>
            <Link href="/admin/jobs" className="text-xs text-[#0f2044] font-semibold hover:underline">View all →</Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-slate-100">
            {recentJobs.map(job => (
              <div key={job.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 truncate">{job.homeownerName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_CHIP[job.status] || "bg-slate-100 text-slate-700"}`}>
                      {job.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5 truncate">{job.rep.fullName} → {job.business.businessName}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-slate-900">{formatCurrency(job.estimatedPrice)}</div>
                  <div className="text-xs text-slate-400">{formatDate(job.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
