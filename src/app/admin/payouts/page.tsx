import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPayoutActions } from "@/components/admin-payout-actions";

export default async function AdminPayoutsPage() {
  const user = await getSession();
  if (!user || user.role !== "admin") redirect("/login");

  const commissions = await prisma.commission.findMany({
    include: { rep: { include: { user: true } }, job: { include: { business: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalPending = commissions.filter(c => !c.isPaidOut).reduce((s, c) => s + c.repAmount, 0);
  const totalPaid = commissions.filter(c => c.isPaidOut).reduce((s, c) => s + c.repAmount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Rep Payouts</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
            <div className="text-sm text-gray-500">Pending Payout</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            <div className="text-sm text-gray-500">Total Paid Out</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-700">{commissions.length}</div>
            <div className="text-sm text-gray-500">Total Commissions</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Commission Records</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-gray-500 text-xs uppercase">
                  <th className="py-3 pr-4">Rep</th>
                  <th className="py-3 pr-4">Business</th>
                  <th className="py-3 pr-4">Job Value</th>
                  <th className="py-3 pr-4">Rep Commission (12%)</th>
                  <th className="py-3 pr-4">Platform Fee (6%)</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => (
                  <tr key={c.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{c.rep.fullName}</div>
                      <div className="text-xs text-gray-400">{c.rep.user.email}</div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{c.job.business.businessName}</td>
                    <td className="py-3 pr-4 font-medium">{formatCurrency(c.jobValue)}</td>
                    <td className="py-3 pr-4 text-green-600 font-medium">{formatCurrency(c.repAmount)}</td>
                    <td className="py-3 pr-4 text-purple-600">{formatCurrency(c.platformFee)}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={c.isPaidOut ? "success" : "warning"}>
                        {c.isPaidOut ? `Paid ${c.paidOutAt ? formatDate(c.paidOutAt) : ""}` : "Pending"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-400">{formatDate(c.createdAt)}</td>
                    <td className="py-3">
                      <AdminPayoutActions commissionId={c.id} isPaidOut={c.isPaidOut} />
                    </td>
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
