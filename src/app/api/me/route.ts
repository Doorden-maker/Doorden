import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password, ...safeUser } = user as typeof user & { password: string };
  void password;
  return NextResponse.json(safeUser);
}
