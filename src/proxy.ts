import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";

const intlMiddleware = createMiddleware({
  locales: ["en", "es"],
  defaultLocale: "en",
  localeDetection: false,
});

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/supervisor(.*)",
  "/worker(.*)",
]);

const isClerkRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/__clerk(.*)",
  "/en/sign-in(.*)",
  "/es/sign-in(.*)",
  "/en/sign-up(.*)",
  "/es/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Skip intl middleware on Clerk auth routes to prevent locale stacking
  if (isClerkRoute(request)) {
    return;
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
