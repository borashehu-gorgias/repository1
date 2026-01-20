import { redirect } from 'next/navigation';
import { getSession, type SessionData } from '@/lib/session';

/**
 * Checks if the user is authenticated server-side.
 * Redirects to login page if not authenticated.
 * Returns the authenticated session data.
 */
export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();

  // Check if user has valid session (either with longJWT or accessToken)
  if (!session.longJWT && !session.accessToken) {
    redirect('/?error=authentication_required');
  }

  return session;
}

/**
 * Gets the authenticated session or throws an error.
 * Use this in API routes where you want to return an error instead of redirecting.
 */
export async function getAuthenticatedSession(): Promise<SessionData> {
  const session = await getSession();

  if (!session.longJWT && !session.accessToken) {
    throw new Error('Authentication required');
  }

  return session;
}
