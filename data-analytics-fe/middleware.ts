import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define paths that are public and don't require authentication
  const isPublicPath =
    path === "/signin" ||
    path === "/signup" ||
    path.startsWith("/api/auth") || // Allow auth API routes
    path.startsWith("/_next") || // Allow Next.js internals
    path.startsWith("/public") || // Allow public assets
    path === "/favicon.ico";

  // Check for the session token
  // better-auth typically uses this cookie name
  const sessionToken =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  // If the path is not public and there's no session token, redirect to signin
  if (!isPublicPath && !sessionToken) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // If the user is authenticated and tries to access signin or signup, redirect to dashboard
  if (sessionToken && (path === "/signin" || path === "/signup")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
