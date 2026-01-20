import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  
  return NextResponse.json({
    hasAccessToken: !!session.accessToken,
    accessTokenPreview: session.accessToken ? session.accessToken.substring(0, 50) + '...' : null,
    hasLongJWT: !!session.longJWT,
    subdomain: session.subdomain,
    hasGorgiasSession: !!session.gorgiasSession,
  });
}
