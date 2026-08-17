import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public pages that do not require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/features(.*)",
  "/how-it-works(.*)",
  "/pricing(.*)",
  "/about(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/cron(.*)",
]);

// Auth entry routes
const isAuthRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

// Protected application routes
const isAppRoute = createRouteMatcher([
  "/app(.*)",
]);

// API routes
const isApiRoute = createRouteMatcher([
  "/api/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // 1. If authenticated user attempts to visit sign-in or sign-up, redirect to /app
  if (userId && isAuthRoute(req)) {
    const appUrl = new URL("/app", req.url);
    return NextResponse.redirect(appUrl);
  }

  // 2. If unauthenticated user attempts to visit protected /app/* routes, redirect to /sign-in
  if (!userId && isAppRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // 3. For unauthenticated requests to non-public API routes, reject with 401
  if (!userId && isApiRoute(req) && !isPublicRoute(req)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required to access this endpoint.",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }

  // 4. Default: protect all other non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
