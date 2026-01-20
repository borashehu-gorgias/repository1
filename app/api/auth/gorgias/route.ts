import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const account = searchParams.get('account');

  const clientId = process.env.GORGIAS_CLIENT_ID!;
  const redirectUri = process.env.NEXT_PUBLIC_URL + '/api/auth/callback';

  // Generate state with subdomain encoded
  const stateData = {
    subdomain: account,
    nonce: Math.random().toString(36).substring(2, 15),
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
  const nonce = stateData.nonce;

  const scopes = [
    'openid',
    'email',
    'profile',
    'offline',
    'write:all', // Temporarily use write:all to get full access
  ];

  // If subdomain not provided, redirect to subdomain input page
  if (!account) {
    return NextResponse.redirect(new URL('/subdomain', request.url));
  }

  const authUrl = new URL(`https://${account}.gorgias.com/oauth/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);

  return NextResponse.redirect(authUrl.toString());
}
