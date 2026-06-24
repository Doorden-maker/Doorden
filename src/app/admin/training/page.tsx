import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminTrainingActions, RemoveTrainingContentButton } from "@/components/admin-training-actions";
import { AdminTrainingContentForm } from "@/components/admin-training-content-form";

const LEVEL_NAMES: Record<number, string> = { 1: "Foundation", 2: "Intermediate", 3: "Advanced", 4: "Expert" };

export default async function AdminTrainingPage() {
  const user = await getSession();
  if (!user || user.role !== "admin") redirect("/login");

  const purchases = await prisma.trainingPurchase.findMany({
    include: { rep: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  const content = await prisma.trainingContent.findMany({
    orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
  });

  const pending = purchases.filter(p => !p.isConfirmed);
  const confirmed = purchases.filter(p => p.isConfirmed);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Training Management</h1>

      {/* Pending confirmations */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pending Confirmations ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-gray-500 text-sm">No pending confirmations.</p>
          ) : (
            <div className="divide-y">
              {pending.map(p => (
                <div key={p.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{p.rep.fullName}</p>
                    <p className="text-sm text-gray-500">{p.rep.user.email}</p>
                    <p className="text-sm text-gray-600">
                      Purchased <strong>Level {p.level} — {LEVEL_NAMES[p.level]}</strong> for {formatCurrency(p.amount)}
                    </p>
                    <p className="text-xs text-gray-400">Purchased {formatDate(p.createdAt)}</p>
                  </div>
                  <AdminTrainingActions purchaseId={p.id} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training content management */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Training Content</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <AdminTrainingContentForm />

          <div className="mt-6 space-y-4">
            {[1, 2, 3, 4].map(level => {
              const items = content.filter(c => c.level === level);
              return (
                <div key={level}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Level {level} — {LEVEL_NAMES[level]}</h3>
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400 italic pl-2">No content yet</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-md p-3">
                          <div>
                            <span className="text-xs text-blue-600 capitalize">{item.contentType}</span>
                            <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          </div>
                          <RemoveTrainingContentButton contentId={item.id} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Purchase history */}
      <Card>
        <CardHeader><CardTitle>Purchase History ({confirmed.length} confirmed)</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y">
            {confirmed.slice(0, 20).map(p => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-4 text-sm">
                <div>
                  <span className="font-medium">{p.rep.fullName}</span>
                  <span className="text-gray-500 ml-2">Level {p.level} · {formatCurrency(p.amount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Confirmed</Badge>
                  <span className="text-xs text-gray-400">{p.confirmedAt ? formatDate(p.confirmedAt) : ""}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
