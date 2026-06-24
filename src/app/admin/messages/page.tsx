import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function AdminMessagesPage() {
  const user = await getSession();
  if (!user || user.role !== "admin") redirect("/login");

  const messages = await prisma.message.findMany({
    include: {
      fromUser: { include: { repProfile: { select: { fullName: true } }, businessProfile: { select: { businessName: true } } } },
      toUser: { include: { repProfile: { select: { fullName: true } }, businessProfile: { select: { businessName: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Group into conversations
  const convMap = new Map<string, typeof messages>();
  for (const m of messages) {
    const key = [m.fromUserId, m.toUserId].sort().join("|");
    if (!convMap.has(key)) convMap.set(key, []);
    convMap.get(key)!.push(m);
  }

  const getName = (u: typeof messages[0]["fromUser"]) =>
    u.repProfile?.fullName || u.businessProfile?.businessName || "Unknown";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">All Platform Messages</h1>
      <p className="text-sm text-gray-500 mb-6">{convMap.size} conversations · {messages.length} total messages</p>

      <div className="space-y-4">
        {Array.from(convMap.entries()).map(([key, msgs]) => {
          const latest = msgs[0];
          const participants = [getName(latest.fromUser), getName(latest.toUser)];
          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="text-base">
                  {participants[0]} ↔ {participants[1]}
                  <span className="text-xs font-normal text-gray-400 ml-2">({msgs.length} messages)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...msgs].reverse().map(m => (
                    <div key={m.id} className="flex gap-3 text-sm">
                      <span className="font-medium text-gray-700 w-40 shrink-0">{getName(m.fromUser)}:</span>
                      <span className="text-gray-600 flex-1">{m.content}</span>
                      <span className="text-xs text-gray-400 shrink-0">{formatDate(m.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {convMap.size === 0 && <p className="text-gray-400 text-center py-12">No messages yet on the platform.</p>}
      </div>
    </div>
  );
}
