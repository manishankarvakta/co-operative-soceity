import { auth } from "./lib/auth.config";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isHealthRoute = nextUrl.pathname === "/api/health";
  const isCronRoute = nextUrl.pathname.startsWith("/api/cron");

  // Handle API routes
  if (isApiRoute) {
    if (!isAuthRoute && !isHealthRoute && !isCronRoute && !isLoggedIn) {
      return NextResponse.json(
        { success: false, code: "UNAUTHORIZED", message: "অনুমতি নেই। অনুগ্রহ করে লগইন করুন।" },
        { status: 401 }
      );
    }
  } else {
    // Handle Page routes
    const isPublicPage =
      nextUrl.pathname === "/login" ||
      nextUrl.pathname === "/signup" ||
      nextUrl.pathname === "/reset-password" ||
      nextUrl.pathname === "/super-admin";
    console.log("MIDDLEWARE PAGE ROUTE:", nextUrl.pathname, "isLoggedIn:", isLoggedIn, "isPublicPage:", isPublicPage);
    if (!isLoggedIn && !isPublicPage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/signup")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
