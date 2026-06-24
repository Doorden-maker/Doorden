import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { AdminUserActions } from "@/components/admin-user-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LEVEL_NAMES: Record<number, string> = { 1: "L1", 2: "L2", 3: "L3", 4: "L4" };

export default async function AdminUsersPage() {
  const user = await getSession();
  if (!user || user.role !== "admin") redirect("/login");

  const users = await prisma.user.findMany({
    include: { repProfile: true, businessProfile: true },
    orderBy: { createdAt: "desc" },
  });

  const reps = users.filter(u => u.role === "rep");
  const businesses = users.filter(u => u.role === "business");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">User Management</h1>

      {/* Reps */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Sales Reps ({reps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-gray-500">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Phone</th>
                  <th className="pb-2 pr-4">Level</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Joined</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reps.map(u => (
                  <tr key={u.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4 font-medium">{u.repProfile?.fullName}</td>
                    <td className="py-3 pr-4 text-gray-600">{u.email}</td>
                    <td className="py-3 pr-4 text-gray-600">{u.repProfile?.phone}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="info">Level {u.repProfile?.trainingLevel} {LEVEL_NAMES[u.repProfile?.trainingLevel || 1]}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={u.repProfile?.isActive ? "success" : "danger"}>
                        {u.repProfile?.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="py-3">
                      <AdminUserActions
                        userId={u.id}
                        role="rep"
                        isActive={u.repProfile?.isActive || false}
                        trainingLevel={u.repProfile?.trainingLevel || 1}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Businesses */}
      <Card>
        <CardHeader>
          <CardTitle>Businesses ({businesses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-gray-500">
                  <th className="pb-2 pr-4">Business</th>
                  <th className="pb-2 pr-4">Contact</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Min Level</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Joined</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map(u => (
                  <tr key={u.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4 font-medium">{u.businessProfile?.businessName}</td>
                    <td className="py-3 pr-4 text-gray-600">{u.businessProfile?.contactName}</td>
                    <td className="py-3 pr-4 text-gray-600">{u.email}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="default">Level {u.businessProfile?.minRepLevel}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={u.businessProfile?.isActive ? "success" : "danger"}>
                        {u.businessProfile?.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="py-3">
                      <AdminUserActions
                        userId={u.id}
                        role="business"
                        isActive={u.businessProfile?.isActive || false}
                        minRepLevel={u.businessProfile?.minRepLevel || 1}
                      />
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
