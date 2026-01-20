import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  if (error) {
    return NextResponse.redirect(
      new URL(`/error?message=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/error?message=No+authorization+code', request.url)
    );
  }

  try {
    // Exchange code for tokens
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      redirect_uri: process.env.NEXT_PUBLIC_URL + '/api/auth/callback',
      code,
    });

    // Extract subdomain from state parameter
    const stateData = state ? JSON.parse(Buffer.from(state, 'base64').toString()) : {};
    const subdomain = stateData.subdomain || 'anton-gorgias-demo-store';

    const response = await axios.post(
      `https://${subdomain}.gorgias.com/oauth/token`,
      params.toString(),
      {
        auth: {
          username: process.env.GORGIAS_CLIENT_ID!,
          password: process.env.GORGIAS_CLIENT_SECRET!,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Check if /oauth/token sets any cookies we can use
    console.log('[OAuth Callback] /oauth/token response headers:', {
      'set-cookie': response.headers['set-cookie'] || 'none',
    });

    const { access_token, id_token } = response.data;

    // Decode JWT to get user info
    let userId, accountId, userEmail;
    if (id_token) {
      try {
        const payload = JSON.parse(
          Buffer.from(id_token.split('.')[1], 'base64').toString()
        );
        userId = payload.sub;
        accountId = payload.account_id;
        userEmail = payload.email;
        console.log('[OAuth Callback] User:', userEmail);
      } catch (e) {
        console.error('Failed to decode ID token:', e);
      }
    }

    // Store basic info in session
    const session = await getSession();
    session.subdomain = subdomain;
    session.userId = userId;
    session.accountId = accountId;
    session.userEmail = userEmail;
    session.expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    // Try to get long JWT using OAuth token
    console.log('[OAuth Callback] Attempting to get long JWT...');
    let gotLongJWT = false;

    // Method 1: Try Bearer token directly with /gorgias-apps/auth
    try {
      const jwtResponse = await axios.post(
        `https://${subdomain}.gorgias.com/gorgias-apps/auth`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'X-Gorgias-User-Client': 'web',
          },
        }
      );

      if (jwtResponse.data?.token) {
        console.log('[OAuth Callback] SUCCESS via Method 1 (Bearer token)!');
        session.longJWT = jwtResponse.data.token;
        gotLongJWT = true;
      }
    } catch (err: any) {
      console.log('[OAuth Callback] Method 1 failed:', err.response?.status);
    }

    // Method 2: Try OAuth token → /app → get session cookies + CSRF → /gorgias-apps/auth
    if (!gotLongJWT) {
      console.log('[OAuth Callback] Trying Method 2: OAuth → /app → session → /gorgias-apps/auth');
      try {
        const appResponse = await axios.get(
          `https://${subdomain}.gorgias.com/app`,
          {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'User-Agent': 'Mozilla/5.0',
            },
            maxRedirects: 5,
            validateStatus: (status: number) => status < 500,
          }
        );

        console.log('[OAuth Callback] /app status:', appResponse.status);
        const setCookies = appResponse.headers['set-cookie'];
        console.log('[OAuth Callback] /app cookies:', setCookies?.length || 0);

        if (setCookies && appResponse.status === 200) {
          const cookies = setCookies.map((c: string) => c.split(';')[0]).join('; ');
          const csrfMatch = appResponse.data.match(/window\.CSRF_TOKEN\s*=\s*["']([^"']+)["']/);

          if (csrfMatch?.[1]) {
            console.log('[OAuth Callback] Found CSRF token!');

            const jwtResponse2 = await axios.post(
              `https://${subdomain}.gorgias.com/gorgias-apps/auth`,
              {},
              {
                headers: {
                  'Cookie': cookies,
                  'X-CSRF-Token': csrfMatch[1],
                  'X-Gorgias-User-Client': 'web',
                },
              }
            );

            if (jwtResponse2.data?.token) {
              console.log('[OAuth Callback] SUCCESS via Method 2!');
              session.longJWT = jwtResponse2.data.token;
              gotLongJWT = true;
            }
          } else {
            console.log('[OAuth Callback] No CSRF in /app response');
            console.log('[OAuth Callback] Preview:', appResponse.data?.substring(0, 300));
          }
        } else {
          console.log('[OAuth Callback] /app did not return expected content');
        }
      } catch (err: any) {
        console.log('[OAuth Callback] Method 2 failed:', err.message);
      }
    }

    // If we got the long JWT, save and redirect to dashboard
    if (gotLongJWT) {
      await session.save();
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If no long JWT, redirect to login page with prefilled info
    console.log('[OAuth Callback] Could not get long JWT - redirecting to login');
    return NextResponse.redirect(
      new URL(`/?subdomain=${subdomain}&email=${userEmail || ''}&oauth_failed=true`, request.url)
    );

  } catch (error: any) {
    console.error('OAuth error:', error.message);
    return NextResponse.redirect(
      new URL(
        `/error?message=${encodeURIComponent(error.message || 'Authentication failed')}`,
        request.url
      )
    );
  }
}
