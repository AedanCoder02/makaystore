import { clerkMiddleware } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/config';

const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware((auth, request: NextRequest) => {
  try {
    // Run next-intl middleware for locale handling
    const intlResponse = intlMiddleware(request);

    // If intl wants to redirect (locale prefix), let it
    if (intlResponse && intlResponse.status !== 200) {
      return intlResponse;
    }

    // Return intl response (sets locale cookie/header) or continue
    return intlResponse ?? NextResponse.next();
  } catch (error) {
    // If middleware fails, just continue without auth
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
