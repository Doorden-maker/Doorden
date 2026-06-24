import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { MapView } from "@/components/map-view";

export default async function MapPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Territory Map</h1>
        <p className="text-slate-500 text-sm mt-1">
          {user.role === "rep" ? "Find businesses hiring in your area." : "See available reps near your service areas."}
        </p>
      </div>
      <MapView userRole={user.role} />
    </div>
  );
}
