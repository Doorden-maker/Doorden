import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { MessagingUI } from "@/components/messaging-ui";

export default async function MessagesPage() {
  const user = await getSession();
  if (!user || user.role === "admin") redirect(user?.role === "admin" ? "/admin/messages" : "/login");

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-8" style={{ height: "calc(100dvh - 80px)" }}>
      <h1 className="text-lg sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-6">Messages</h1>
      <div className="h-[calc(100%-3rem)] sm:h-[calc(100%-4rem)]">
        <MessagingUI currentUserId={user.id} />
      </div>
    </div>
  );
}
