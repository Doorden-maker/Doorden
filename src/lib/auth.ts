import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          repProfile: true,
          businessProfile: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function requireAuth(role?: string) {
  const user = await getSession();
  if (!user) return null;
  if (role && user.role !== role && user.role !== "admin") return null;
  return user;
}
