import { NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "cabinet2025";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
