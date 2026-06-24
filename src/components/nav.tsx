"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavProps {
  user?: {
    email: string;
    role: string;
    repProfile?: { fullName: string; avatarUrl?: string | null } | null;
    businessProfile?: { businessName: string } | null;
  } | null;
}

export function Nav({ user }: NavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<{ id: string; title: string; body: string; isRead: boolean; link?: string | null; createdAt: string }[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.repProfile?.fullName || user?.businessProfile?.businessName || user?.email;
  const avatarUrl = user?.repProfile?.avatarUrl;
  const dashboardHref = user?.role === "admin" ? "/admin" : user?.role === "rep" ? "/rep" : "/business";

  const navLinks: { href: string; label: string }[] = user?.role === "rep"
    ? [
        { href: "/rep", label: "Dashboard" },
        { href: "/rep/jobs", label: "My Leads" },
        { href: "/rep/businesses", label: "Browse" },
        { href: "/messages", label: "Messages" },
        { href: "/rep/training", label: "Training" },
        { href: "/rep/profile", label: "Profile" },
      ]
    : user?.role === "business"
    ? [
        { href: "/business", label: "Dashboard" },
        { href: "/business/marketplace", label: "Marketplace" },
        { href: "/business/reps", label: "Browse Reps" },
        { href: "/map", label: "Map" },
        { href: "/messages", label: "Messages" },
        { href: "/business/profile", label: "Profile" },
      ]
    : user?.role === "admin"
    ? [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/jobs", label: "Jobs" },
        { href: "/admin/training", label: "Training" },
        { href: "/admin/payouts", label: "Payouts" },
        { href: "/admin/messages", label: "Messages" },
      ]
    : [];

  useEffect(() => {
    if (!user) return;
    const load = () =>
      fetch("/api/notifications").then(r => r.json()).then(d => {
        setUnread(d.unread || 0);
        setNotifs(d.notifications || []);
      }).catch(() => {});
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  async function markRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setUnread(0);
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = (name: string) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-[#0f2044] sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:bg-blue-50 transition">
              <span className="text-[#0f2044] font-black text-sm">D</span>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Doorden</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1 flex-1 px-6">
            {navLinks.map(l => (
              <Link
                key={l.href} href={l.href}
                className={`text-sm px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isActive(l.href)
                    ? "bg-white/15 text-white"
                    : "text-blue-100 hover:text-white hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {!user && (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/verify" className="text-sm text-blue-200 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition">Verify Sale</Link>
                <Link href="/login" className="text-sm text-blue-100 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition">Log in</Link>
                <Link href="/signup/rep" className="text-sm bg-white text-[#0f2044] font-semibold rounded-lg px-4 py-2 hover:bg-blue-50 transition shadow-sm">Sign up</Link>
              </div>
            )}

            {user && (
              <>
                {/* Notifications bell */}
                <div className="relative">
                  <button
                    onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs && unread > 0) markRead(); }}
                    className="relative p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </button>
                  {showNotifs && (
                    <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden max-w-[calc(100vw-2rem)]">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <span className="font-semibold text-sm text-slate-900">Notifications</span>
                        <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifs.length === 0 && <p className="text-sm text-slate-400 p-5 text-center">You&apos;re all caught up</p>}
                        {notifs.map(n => (
                          <a key={n.id} href={n.link || dashboardHref} onClick={() => setShowNotifs(false)}
                            className={`block px-4 py-3 hover:bg-slate-50 transition ${!n.isRead ? "bg-blue-50" : ""}`}>
                            <p className={`text-sm font-semibold ${!n.isRead ? "text-blue-900" : "text-slate-800"}`}>{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar + name (desktop) */}
                <div className="hidden md:flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-white font-bold text-xs">{initials(displayName || "")}</span>}
                  </div>
                  <span className="text-sm text-blue-100 max-w-28 truncate">{displayName}</span>
                  <button onClick={handleLogout} className="text-xs text-blue-200 border border-white/20 rounded-lg px-3 py-1.5 hover:bg-white/10 hover:text-white transition">
                    Log out
                  </button>
                </div>
              </>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 pb-4 pt-2">
            <div className="space-y-0.5">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href}
                  className={`block px-4 py-3 text-sm font-medium rounded-lg mx-1 transition ${isActive(l.href) ? "bg-white/15 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white"}`}
                >
                  {l.label}
                </Link>
              ))}
              {!user && (
                <>
                  <Link href="/verify" className="block px-4 py-3 text-sm text-blue-100 hover:bg-white/10 hover:text-white rounded-lg mx-1 transition">Verify Sale</Link>
                  <Link href="/login" className="block px-4 py-3 text-sm text-blue-100 hover:bg-white/10 hover:text-white rounded-lg mx-1 transition">Log in</Link>
                  <div className="px-1 pt-1">
                    <Link href="/signup/rep" className="block px-4 py-3 text-sm bg-white text-[#0f2044] font-semibold rounded-lg text-center">Sign up</Link>
                  </div>
                </>
              )}
              {user && (
                <div className="px-4 pt-3 mt-2 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
                      {avatarUrl
                        ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white font-bold text-sm">{initials(displayName || "")}</span>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-36">{displayName}</p>
                      <p className="text-xs text-blue-300 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="text-xs text-blue-200 border border-white/20 rounded-lg px-3 py-1.5 hover:bg-white/10 hover:text-white transition">
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
