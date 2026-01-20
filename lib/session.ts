import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  subdomain?: string;
  userId?: number;
  accountId?: number;
  userEmail?: string;
  expiresAt?: number;
  longJWT?: string;
  gorgiasUsername?: string;
  gorgiasApiKey?: string;
  // For programmatic login JWT refresh (just the session cookie, not all cookies)
  gorgiasSession?: string;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'gorgias_migration_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
