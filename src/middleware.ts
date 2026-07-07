import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/config';

const intlMiddleware = createIntlMiddleware(routing);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/supervisor(.*)',
  '/admin(.*)',
  '/worker(.*)',
  '/es/dashboard(.*)',
  '/es/supervisor(.*)',
  '/es/admin(.*)',
  '/es/worker(.*)',
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Run next-intl middleware first to handle locale detection/redirect
  const intlResponse = intlMiddleware(request);

  // If intl wants to redirect (locale prefix), let it
  if (intlResponse && intlResponse.status !== 200) {
    return intlResponse;
  }

  // Protect auth-required routes
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Return intl response (sets locale cookie/header) or continue
  return intlResponse ?? NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
