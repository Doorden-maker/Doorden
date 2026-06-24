import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { getSession } from "@/lib/auth";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Doorden — Sales Rep Platform",
  description: "Connect trained sales reps with service businesses",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50">
        <Nav user={user ? { email: user.email, role: user.role, repProfile: user.repProfile, businessProfile: user.businessProfile } : null} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-[#0f2044] py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                <span className="text-[#0f2044] font-black text-xs">D</span>
              </div>
              <span className="text-white font-bold text-sm">Doorden</span>
            </div>
            <p className="text-sm text-blue-300">© {new Date().getFullYear()} Doorden. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="/verify" className="text-xs text-blue-300 hover:text-white transition">Homeowner Portal</a>
              <a href="/login" className="text-xs text-blue-300 hover:text-white transition">Log In</a>
              <a href="/signup/rep" className="text-xs text-blue-300 hover:text-white transition">Sign Up</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
