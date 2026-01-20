import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GorgiasAuth } from '@/lib/core/auth';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.gorgiasUsername || !session.gorgiasApiKey) {
      return NextResponse.json({ error: 'Credentials required' }, { status: 401 });
    }

    // Generate Bearer token
    const auth = new GorgiasAuth({
      gorgiasSubdomain: session.subdomain!,
      gorgiasApiKey: session.gorgiasApiKey,
      gorgiasUsername: session.gorgiasUsername,
      gorgiasClientId: process.env.GORGIAS_CLIENT_ID!,
      gorgiasClientSecret: process.env.GORGIAS_CLIENT_SECRET!,
      oauthRedirectUri: process.env.NEXT_PUBLIC_URL + '/api/auth/callback',
      logLevel: 'info',
      dryRun: false,
    });

    const bearerToken = await auth.getBearerToken();
    
    // Decode without verifying to see structure
    const decoded = jwt.decode(bearerToken, { complete: true });

    return NextResponse.json({
      tokenGenerated: true,
      algorithm: decoded?.header?.alg,
      payload: decoded?.payload,
      tokenPreview: bearerToken.substring(0, 50) + '...',
      note: 'Compare this algorithm with the one in browser Network tab. If browser shows HS256 but this shows RS256, we have the wrong token type.',
    });
  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

