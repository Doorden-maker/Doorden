import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getSession();
  if (user) {
    if (user.role === "admin") redirect("/admin");
    if (user.role === "rep") redirect("/rep");
    if (user.role === "business") redirect("/business");
  }

  return (
    <div className="flex flex-col">

      {/* Homeowner banner */}
      <div className="bg-emerald-600 text-white px-4 py-3 text-center text-sm">
        <span className="opacity-90">Did a sales rep just visit your home?</span>{" "}
        <Link href="/verify" className="font-bold underline underline-offset-2 hover:opacity-80 transition">
          Look up your job or verify your sale →
        </Link>
      </div>

      {/* Hero */}
      <section className="bg-[#0f2044] text-white py-20 px-4 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px"}} />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-block bg-white/10 text-blue-200 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase border border-white/20">
            The #1 Sales Rep Platform
          </div>
          <h1 className="text-4xl sm:text-6xl font-black mb-6 leading-tight">
            Trained Reps.<br />
            <span className="text-blue-300">Verified Results.</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Doorden connects certified door-to-door sales reps with service businesses. Every rep is trained, every job is tracked, every sale is verified.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/signup/rep" className="bg-white text-[#0f2044] font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition shadow-lg text-sm sm:text-base">
              Join as Sales Rep
            </Link>
            <Link href="/signup/business" className="border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition text-sm sm:text-base">
              Join as Business
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#1a3360] text-white py-6 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { num: "18%", label: "Homeowner Deposit" },
            { num: "12%", label: "Rep Commission" },
            { num: "82%", label: "Business Revenue" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl font-black text-white">{s.num}</div>
              <div className="text-xs sm:text-sm text-blue-300 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Homeowner section */}
      <section className="py-16 px-4 bg-emerald-50 border-y border-emerald-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
              For Homeowners
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">A rep just knocked on your door?</h2>
            <p className="text-slate-500 mt-2">Look up your job or confirm it was completed using the tools below.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl mb-4">🔍</div>
              <h3 className="font-bold text-slate-900 mb-2">Look Up Your Job</h3>
              <p className="text-sm text-slate-500">Your rep gave you an <strong>8-digit reference number</strong>. Enter it to see your job status — confirmed, pending, or completed.</p>
            </div>
            <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl mb-4">✅</div>
              <h3 className="font-bold text-slate-900 mb-2">Verify Your Sale</h3>
              <p className="text-sm text-slate-500">Once your job is <strong>complete</strong>, your rep gives you a short code. Enter it to confirm the work happened and protect yourself.</p>
            </div>
          </div>
          <div className="text-center">
            <Link href="/verify" className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold px-10 py-4 rounded-xl text-base shadow-md hover:bg-emerald-700 transition">
              Go to Homeowner Portal
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
              How It Works
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Simple. Transparent. Effective.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Rep Gets Certified", desc: "Sales reps complete Doorden training levels. Higher levels unlock access to premium business partners and higher-value jobs." },
              { step: "02", title: "Rep Submits a Job", desc: "The rep knocks doors, finds a homeowner who needs work, fills out the job form with photos, and submits it to the business." },
              { step: "03", title: "Business Closes the Deal", desc: "The business reviews and accepts the job. The homeowner pays an 18% deposit, the business schedules and completes the work." },
            ].map(item => (
              <div key={item.step} className="relative">
                <div className="text-5xl font-black text-slate-100 mb-4 leading-none">{item.step}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Everything you need in one platform</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🎓", title: "Structured Training", desc: "4-level certification program with real curriculum. Only trained reps can submit jobs." },
              { icon: "📋", title: "Job Marketplace", desc: "Businesses post opportunities. Reps apply. Both sides control who they work with." },
              { icon: "💬", title: "Direct Messaging", desc: "Built-in messaging between reps and businesses. No phone tag, everything tracked." },
              { icon: "🗺", title: "Territory Map", desc: "See active reps and businesses plotted on an interactive map by service area." },
              { icon: "✅", title: "Homeowner Verification", desc: "Every completed job gets a verification code. Homeowners confirm the work was done." },
              { icon: "💰", title: "Automatic Commissions", desc: "Transparent 12% rep commission, 6% platform fee. Tracked automatically per job." },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training levels */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
              Rep Training
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Four levels of certification</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { level: 1, name: "Foundation", price: "Free", color: "bg-slate-100 text-slate-700", topics: ["Platform basics", "Door-to-door fundamentals", "Compliance & ethics"] },
              { level: 2, name: "Intermediate", price: "$15", color: "bg-blue-100 text-blue-700", topics: ["Objection handling", "Basic quoting guidance", "Building rapport"] },
              { level: 3, name: "Advanced", price: "$30", color: "bg-indigo-100 text-indigo-700", topics: ["Professional communication", "Accurate job scoping", "Close techniques"] },
              { level: 4, name: "Expert", price: "$50", color: "bg-[#0f2044] text-white", topics: ["Advanced closing", "Premium job qualification", "Business partnership skills"] },
            ].map(lvl => (
              <div key={lvl.level} className="border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${lvl.color}`}>Level {lvl.level}</span>
                    <h3 className="font-bold text-slate-900 mt-2 text-lg">{lvl.name}</h3>
                  </div>
                  <span className="text-2xl font-black text-[#0f2044]">{lvl.price}</span>
                </div>
                <ul className="space-y-1.5">
                  {lvl.topics.map(t => (
                    <li key={t} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0f2044] shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[#0f2044] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Ready to get started?</h2>
          <p className="text-blue-200 mb-10 text-lg">Join hundreds of reps and businesses already on Doorden.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup/rep" className="bg-white text-[#0f2044] font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition shadow-lg text-base">
              Sign Up as Rep
            </Link>
            <Link href="/signup/business" className="border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition text-base">
              Sign Up as Business
            </Link>
          </div>
          <p className="mt-6">
            <Link href="/login" className="text-blue-300 hover:text-white text-sm transition">Already have an account? Log in →</Link>
          </p>
        </div>
      </section>

    </div>
  );
}
