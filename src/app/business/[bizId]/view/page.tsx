"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const LEVEL_NAMES: Record<number, string> = { 1: "Foundation", 2: "Intermediate", 3: "Advanced", 4: "Expert" };

interface Biz {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  businessCity: string;
  businessZip: string;
  workingCities: string;
  serviceAreas: string;
  servicesOffered: string;
  serviceCategory: string;
  pricingDescription: string;
  minRepLevel: number;
  createdAt: string;
  user: { id: string; email: string };
  partnershipStatus: string | null;
}

export default function BusinessViewPage() {
  const { bizId } = useParams() as { bizId: string };
  const router = useRouter();
  const [biz, setBiz] = useState<Biz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/businesses/${bizId}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setBiz(d); })
      .finally(() => setLoading(false));
  }, [bizId]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-12 text-center text-slate-400">Loading...</div>;
  if (error || !biz) return <div className="max-w-2xl mx-auto px-4 py-12 text-center text-red-500">{error || "Business not found"}</div>;

  const isPartner = biz.partnershipStatus === "accepted";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-4">
        ← Back
      </button>

      {/* Header */}
      <div className="bg-[#0f2044] rounded-2xl p-5 mb-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{biz.businessName}</h1>
            <p className="text-blue-300 text-sm mt-0.5">{biz.serviceCategory}</p>
            {(biz.businessCity || biz.businessZip) && (
              <p className="text-blue-200 text-sm">{biz.businessCity}{biz.businessZip ? ` ${biz.businessZip}` : ""}</p>
            )}
            <span className="inline-block mt-2 text-xs bg-white/10 px-2.5 py-1 rounded-full text-blue-200">
              Requires Level {biz.minRepLevel}+ — {LEVEL_NAMES[biz.minRepLevel]}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {isPartner && (
            <Link
              href={`/messages?with=${biz.user.id}`}
              className="flex-1 bg-white text-[#0f2044] font-semibold text-sm py-2.5 px-4 rounded-xl text-center hover:bg-blue-50 transition"
            >
              💬 Message
            </Link>
          )}
          {!isPartner && (
            <div className="text-blue-300 text-sm py-2">
              {biz.partnershipStatus === "pending_rep" && "Your partnership request is pending — awaiting business response"}
              {biz.partnershipStatus === "pending_business" && "This business invited you — accept in your dashboard"}
              {biz.partnershipStatus === "rejected" && "Partnership request was declined"}
              {!biz.partnershipStatus && "Request a partnership from Browse Businesses to message them"}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardContent className="pt-5 pb-5 space-y-4">
          <Section title="Services Offered">
            <p className="text-slate-700 text-sm leading-relaxed">{biz.servicesOffered}</p>
          </Section>

          <Section title="Pricing">
            <p className="text-slate-700 text-sm">{biz.pricingDescription}</p>
          </Section>

          <Section title="Service Areas">
            <p className="text-slate-700 text-sm">{biz.serviceAreas}</p>
          </Section>

          {biz.workingCities && (
            <Section title="Working Cities">
              <div className="flex flex-wrap gap-1.5">
                {biz.workingCities.split(",").map(c => (
                  <span key={c} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{c.trim()}</span>
                ))}
              </div>
            </Section>
          )}

          <Section title="Location">
            <p className="text-slate-700 text-sm">
              {biz.businessCity || biz.businessZip ? `${biz.businessCity}${biz.businessZip ? ` ${biz.businessZip}` : ""}` : "—"}
            </p>
          </Section>

          {isPartner && (
            <Section title="Contact">
              <p className="text-slate-700 text-sm font-medium">{biz.contactName}</p>
              <p className="text-slate-700 text-sm">{biz.phone}</p>
              <p className="text-slate-500 text-sm">{biz.user.email}</p>
            </Section>
          )}
        </CardContent>
      </Card>

      {isPartner && (
        <div className="mt-4">
          <Link
            href={`/messages?with=${biz.user.id}`}
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
