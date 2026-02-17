import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and API routes
  if (pathname === "/admin/login" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Protect all /admin/* routes
  const auth = request.cookies.get("admin_auth");
  if (!auth || auth.value !== "authenticated") {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
