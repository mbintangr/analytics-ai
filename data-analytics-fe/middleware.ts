import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublicPath =
    path === "/signin" ||
    path === "/signup" ||
    path.startsWith("/api/auth") ||
    path.startsWith("/_next") ||
    path.startsWith("/public") ||
    path === "/favicon.ico";

  const sessionToken =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  if (!isPublicPath && !sessionToken) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (sessionToken && (path === "/signin" || path === "/signup")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
