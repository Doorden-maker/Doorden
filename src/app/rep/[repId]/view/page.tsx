"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const LEVEL_NAMES: Record<number, string> = { 1: "Foundation", 2: "Intermediate", 3: "Advanced", 4: "Expert" };
const LEVEL_COLORS: Record<number, string> = {
  1: "bg-gray-100 text-gray-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-purple-100 text-purple-700",
  4: "bg-orange-100 text-orange-700",
};
const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  busy: "bg-amber-100 text-amber-700",
  offline: "bg-slate-100 text-slate-500",
};

interface Rep {
  id: string;
  repCode: string;
  fullName: string;
  phone: string;
  city: string;
  zip: string;
  serviceAreas: string;
  description: string;
  serviceCategories: string;
  trainingLevel: number;
  availabilityStatus: string;
  rating: number;
  ratingCount: number;
  avatarUrl: string | null;
  createdAt: string;
  user: { id: string; email: string };
  partnershipStatus: string | null;
}

export default function RepViewPage() {
  const { repId } = useParams() as { repId: string };
  const router = useRouter();
  const [rep, setRep] = useState<Rep | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/reps/${repId}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setRep(d); })
      .finally(() => setLoading(false));
  }, [repId]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-12 text-center text-slate-400">Loading...</div>;
  if (error || !rep) return <div className="max-w-2xl mx-auto px-4 py-12 text-center text-red-500">{error || "Rep not found"}</div>;

  const isPartner = rep.partnershipStatus === "accepted";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-4">
        ← Back
      </button>

      {/* Header card */}
      <div className="bg-[#0f2044] rounded-2xl p-5 mb-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 overflow-hidden shrink-0 flex items-center justify-center">
            {rep.avatarUrl
              ? <img src={rep.avatarUrl} alt="" className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-2xl">{rep.fullName[0]}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{rep.fullName}</h1>
            <div className="flex flex-wrap gap-2 mt-1">
              {rep.repCode && <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-blue-200">{rep.repCode}</span>}
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${LEVEL_COLORS[rep.trainingLevel]}`}>
                Level {rep.trainingLevel} — {LEVEL_NAMES[rep.trainingLevel]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${STATUS_COLORS[rep.availabilityStatus] || "bg-slate-100 text-slate-500"}`}>
                {rep.availabilityStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {isPartner && (
            <Link
              href={`/messages?with=${rep.user.id}`}
              className="flex-1 bg-white text-[#0f2044] font-semibold text-sm py-2.5 px-4 rounded-xl text-center hover:bg-blue-50 transition"
            >
              💬 Message
            </Link>
          )}
          {!isPartner && (
            <div className="text-blue-300 text-sm py-2">
              {rep.partnershipStatus === "pending_rep" && "Partnership request sent — awaiting your response in dashboard"}
              {rep.partnershipStatus === "pending_business" && "You've been invited — accept in your dashboard"}
              {rep.partnershipStatus === "rejected" && "Partnership request was declined"}
              {!rep.partnershipStatus && "Browse Reps to send a partnership invite"}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardContent className="pt-5 pb-5 space-y-4">
          <Section title="About">
            <p className="text-slate-700 text-sm leading-relaxed">{rep.description}</p>
          </Section>

          <Section title="Location">
            <p className="text-slate-700 text-sm">
              {rep.city || rep.zip ? `${rep.city}${rep.zip ? ` ${rep.zip}` : ""}` : "—"}
            </p>
          </Section>

          <Section title="Service Areas">
            <p className="text-slate-700 text-sm">{rep.serviceAreas}</p>
          </Section>

          {rep.serviceCategories && (
            <Section title="Categories">
              <div className="flex flex-wrap gap-2">
                {rep.serviceCategories.split(",").map(c => (
                  <span key={c} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{c.trim()}</span>
                ))}
              </div>
            </Section>
          )}

          {isPartner && (
            <Section title="Contact">
              <p className="text-slate-700 text-sm">{rep.phone}</p>
              <p className="text-slate-500 text-sm">{rep.user.email}</p>
            </Section>
          )}

          {rep.rating > 0 && (
            <Section title="Rating">
              <p className="text-slate-700 text-sm">{rep.rating.toFixed(1)} ⭐ ({rep.ratingCount} reviews)</p>
            </Section>
          )}
        </CardContent>
      </Card>

      {isPartner && (
        <div className="mt-4">
          <Link
            href={`/messages?with=${rep.user.id}`}
            className="block w-full bg-[#0f2044] text-white font-semibold text-sm py-3 px-4 rounded-xl text-center hover:bg-[#1a3360] transition"
          >
            💬 Send Message
          </Link>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{title}</p>
      {children}
    </div>
  );
}
