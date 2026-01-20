import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import axios from 'axios';

/**
 * Programmatic login to Gorgias to get the Long JWT for Flows API access
 * 
 * Flow:
 * 1. GET /idp/login to get CSRF cookie
 * 2. POST /idp/login with credentials to get session cookies
 * 3. POST /gorgias-apps/auth with session cookies to get long JWT
 * 4. Store JWT in session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subdomain, email, password, twoFactorCode } = body;

    // Validate inputs
    if (!subdomain || !email || !password) {
      return NextResponse.json(
        { error: 'Subdomain, email, and password are required' },
        { status: 400 }
      );
    }

    const baseUrl = `https://${subdomain}.gorgias.com`;

    // Step 1: Get CSRF cookie from login page
    console.log('[FlowsLogin] Getting CSRF token...');
    const csrfResponse = await axios.get(`${baseUrl}/idp/login`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      withCredentials: true,
    });

    // Extract CSRF cookie from response
    const setCookieHeader = csrfResponse.headers['set-cookie'];
    let csrfToken = '';
    let cookieJar: string[] = [];

    if (setCookieHeader) {
      for (const cookie of setCookieHeader) {
        cookieJar.push(cookie.split(';')[0]);
        if (cookie.startsWith('csrf=')) {
          csrfToken = cookie.split(';')[0].split('=')[1];
        }
      }
    }

    if (!csrfToken) {
      return NextResponse.json(
        { error: 'Failed to get CSRF token from Gorgias' },
        { status: 500 }
      );
    }

    console.log('[FlowsLogin] Got CSRF token, attempting login...');

    // Step 2: POST login credentials (2FA is handled separately)
    const loginData: Record<string, string> = {
      email,
      password,
    };

    // Note: 2FA code is sent to /idp/2fa endpoint AFTER login, not as a parameter here

    let loginResponse;
    try {
      loginResponse = await axios.post(
        `${baseUrl}/idp/login`,
        new URLSearchParams(loginData).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-Token': csrfToken,
            'Cookie': cookieJar.join('; '),
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Origin': baseUrl,
            'Referer': `${baseUrl}/idp/login`,
          },
        }
      );
    } catch (loginError: any) {
      // Handle login errors
      console.log('[FlowsLogin] Login error status:', loginError.response?.status);
      console.log('[FlowsLogin] Login error data:', JSON.stringify(loginError.response?.data));
      console.log('[FlowsLogin] 2FA code provided:', !!twoFactorCode);

      // IMPORTANT: Extract cookies from error response - needed for 2FA
      const errorCookies = loginError.response?.headers?.['set-cookie'];
      if (errorCookies) {
        console.log('[FlowsLogin] Extracting cookies from error response:', errorCookies.length);
        for (const cookie of errorCookies) {
          const cookiePart = cookie.split(';')[0];
          const cookieName = cookiePart.split('=')[0];
          cookieJar = cookieJar.filter(c => !c.startsWith(cookieName + '='));
          cookieJar.push(cookiePart);
        }
      }

      if (loginError.response?.status === 400) {
        const errorData = loginError.response.data;

        // Handle 2FA requirement
        if (errorData.require_2fa_code) {
          if (!twoFactorCode) {
            // No code provided, ask user for it
            return NextResponse.json(
              {
                error: 'Two-factor authentication required',
                require_2fa: true,
                require_2fa_code: true,
                require_2fa_email: false,
              },
              { status: 401 }
            );
          }

          // User provided 2FA code, call the /idp/2fa endpoint
          console.log('[FlowsLogin] Submitting 2FA code to /idp/2fa...');
          try {
            const twoFaResponse = await axios.post(
              `${baseUrl}/idp/2fa`,
              new URLSearchParams({ code: twoFactorCode }).toString(),
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'X-CSRF-Token': csrfToken,
                  'Cookie': cookieJar.join('; '),
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                  'Origin': baseUrl,
                  'Referer': `${baseUrl}/idp/login`,
                },
              }
            );

            console.log('[FlowsLogin] 2FA verification successful!');

            // Extract cookies from 2FA response
            const twoFaCookies = twoFaResponse.headers['set-cookie'];
            if (twoFaCookies) {
              for (const cookie of twoFaCookies) {
                const cookiePart = cookie.split(';')[0];
                const cookieName = cookiePart.split('=')[0];
                cookieJar = cookieJar.filter(c => !c.startsWith(cookieName + '='));
                cookieJar.push(cookiePart);
              }
            }

            // Continue with the rest of the login flow (don't return, fall through)
            loginResponse = twoFaResponse;
          } catch (twoFaError: any) {
            console.error('[FlowsLogin] 2FA verification failed:', twoFaError.response?.data);
            return NextResponse.json(
              {
                error: twoFaError.response?.data?.detail || 'Invalid 2FA code',
                require_2fa: true,
                require_2fa_code: true,
              },
              { status: 401 }
            );
          }
        } else if (errorData.require_2fa_email) {
          // Email-based verification can't work with serverless
          return NextResponse.json(
            {
              error: 'Two-factor authentication required',
              require_2fa: true,
              require_2fa_code: false,
              require_2fa_email: true,
            },
            { status: 401 }
          );
        }

        if (errorData.show_recaptcha) {
          return NextResponse.json(
            {
              error: 'reCAPTCHA required. Please use the manual token method.',
              show_recaptcha: true,
            },
            { status: 401 }
          );
        }

        if (errorData.user_unactivated) {
          return NextResponse.json(
            { error: 'Account not activated. Please check your email.' },
            { status: 401 }
          );
        }

        // SSO-only accounts don't have a password
        if (errorData.detail?.includes('No password')) {
          return NextResponse.json(
            {
              error: 'This account uses SSO (Google/Microsoft) login. Please use the manual token method.',
              sso_only: true,
            },
            { status: 401 }
          );
        }

        // If we successfully handled 2FA, don't fall through to error handling
        if (loginResponse) {
          // 2FA was successful, continue with the login flow
        } else {
          // No successful response yet, return error
          return NextResponse.json(
            { error: errorData.detail || 'Invalid email or password' },
            { status: 401 }
          );
        }
      } else {
        throw loginError;
      }
    }

    // Log login response
    console.log('[FlowsLogin] Login response status:', loginResponse.status);
    console.log('[FlowsLogin] Login response body:', JSON.stringify(loginResponse.data));

    // Extract session cookies from login response
    const loginCookies = loginResponse.headers['set-cookie'];
    console.log('[FlowsLogin] Login cookies received:', loginCookies?.length || 0);

    if (loginCookies) {
      for (const cookie of loginCookies) {
        const cookiePart = cookie.split(';')[0];
        // Update or add cookie
        const cookieName = cookiePart.split('=')[0];
        cookieJar = cookieJar.filter(c => !c.startsWith(cookieName + '='));
        cookieJar.push(cookiePart);
        // Update CSRF if present
        if (cookiePart.startsWith('csrf=')) {
          csrfToken = cookiePart.split('=')[1];
        }
      }
    }

    console.log('[FlowsLogin] Cookie jar after login:', cookieJar.map(c => c.split('=')[0]));
    console.log('[FlowsLogin] Login successful, finalizing session...');

    // Step 3: Visit /login to finalize the IDP session
    // Handle redirects manually to capture cookies at each step
    console.log('[FlowsLogin] Visiting /login to finalize session...');

    let currentUrl = `${baseUrl}/login`;
    let redirectCount = 0;
    const maxRedirects = 10;

    while (redirectCount < maxRedirects) {
      const response = await axios.get(currentUrl, {
        headers: {
          'Cookie': cookieJar.join('; '),
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 400 || status === 302 || status === 301,
      });

      // Extract cookies from this response
      const responseCookies = response.headers['set-cookie'];
      if (responseCookies) {
        for (const cookie of responseCookies) {
          const cookiePart = cookie.split(';')[0];
          const cookieName = cookiePart.split('=')[0];
          cookieJar = cookieJar.filter(c => !c.startsWith(cookieName + '='));
          cookieJar.push(cookiePart);
        }
      }

      // Check if this is a redirect
      if (response.status === 301 || response.status === 302) {
        const location = response.headers['location'];
        if (location) {
          currentUrl = location.startsWith('http') ? location : `${baseUrl}${location}`;
          console.log(`[FlowsLogin] Following redirect to: ${currentUrl}`);
          redirectCount++;
          continue;
        }
      }

      // Not a redirect, we're done
      break;
    }

    console.log('[FlowsLogin] Session finalized, cookies:', cookieJar.map(c => c.split('=')[0]));
    console.log('[FlowsLogin] Fetching /app for CSRF token...');

    // Step 4: Fetch /app to get CSRF token from HTML
    const appResponse = await axios.get(`${baseUrl}/app`, {
      headers: {
        'Cookie': cookieJar.join('; '),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      maxRedirects: 0,
      validateStatus: (status) => status < 400 || status === 302,
    });

    // Handle /app redirect if needed
    if (appResponse.status === 302) {
      const location = appResponse.headers['location'];
      console.log('[FlowsLogin] /app redirected to:', location);

      // Extract cookies
      const appRedirectCookies = appResponse.headers['set-cookie'];
      if (appRedirectCookies) {
        for (const cookie of appRedirectCookies) {
          const cookiePart = cookie.split(';')[0];
          const cookieName = cookiePart.split('=')[0];
          cookieJar = cookieJar.filter(c => !c.startsWith(cookieName + '='));
          cookieJar.push(cookiePart);
        }
      }
    }

    // Fetch the actual /app page content
    const appContentResponse = await axios.get(`${baseUrl}/app`, {
      headers: {
        'Cookie': cookieJar.join('; '),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      maxRedirects: 10,
    });

    console.log('[FlowsLogin] App response status:', appContentResponse.status);

    // Extract cookies from /app response
    const appCookies = appContentResponse.headers['set-cookie'];
    if (appCookies) {
      for (const cookie of appCookies) {
        const cookiePart = cookie.split(';')[0];
        const cookieName = cookiePart.split('=')[0];
        cookieJar = cookieJar.filter(c => !c.startsWith(cookieName + '='));
        cookieJar.push(cookiePart);
      }
    }

    // Extract CSRF token from window.CSRF_TOKEN in the HTML
    const htmlContent = appContentResponse.data;
    const csrfMatch = htmlContent.match(/window\.CSRF_TOKEN\s*=\s*["']([^"']+)["']/);

    if (!csrfMatch || !csrfMatch[1]) {
      console.error('[FlowsLogin] Failed to extract CSRF token from page');
      console.error('[FlowsLogin] Looking for pattern: window.CSRF_TOKEN = "..."');
      console.error('[FlowsLogin] Page contains window.CSRF_TOKEN:', htmlContent.includes('window.CSRF_TOKEN'));
      return NextResponse.json(
        { error: 'Failed to extract CSRF token from Gorgias app page' },
        { status: 500 }
      );
    }

    const pageCsrfToken = csrfMatch[1];
    console.log('[FlowsLogin] Extracted CSRF token from page:', pageCsrfToken.substring(0, 20) + '...');

    // Step 4: Call /gorgias-apps/auth with the page CSRF token
    let authResponse;
    try {
      authResponse = await axios.post(
        `${baseUrl}/gorgias-apps/auth`,
        null,
        {
          headers: {
            'Cookie': cookieJar.join('; '),
            'X-CSRF-Token': pageCsrfToken,
            'X-Gorgias-User-Client': 'web',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Origin': baseUrl,
            'Referer': `${baseUrl}/app`,
          },
        }
      );
    } catch (authError: any) {
      console.error('[FlowsLogin] Auth request failed:', authError.response?.status, authError.response?.data);
      throw authError;
    }

    const longJWT = authResponse.data?.token;

    if (!longJWT) {
      return NextResponse.json(
        { error: 'Failed to get access token from Gorgias' },
        { status: 500 }
      );
    }

    console.log('[FlowsLogin] Got long JWT successfully!');

    // Step 4: Verify admin role
    // Decode JWT to check roles (JWT payload is base64 encoded)
    try {
      const payload = JSON.parse(
        Buffer.from(longJWT.split('.')[1], 'base64').toString()
      );

      const roles = payload.roles || [];
      if (!roles.includes('admin')) {
        console.log('[FlowsLogin] User role check failed. Roles:', roles);
        return NextResponse.json(
          {
            error: 'Access denied. Only administrators can use this tool.',
            roles: roles,
          },
          { status: 403 }
        );
      }

      console.log('[FlowsLogin] Admin role verified!');
    } catch (decodeError) {
      console.error('[FlowsLogin] Failed to decode JWT:', decodeError);
      // Continue anyway - the Flows API will enforce permissions
    }

    // Step 6: Store in session (only essential data for JWT refresh)
    const session = await getSession();
    session.longJWT = longJWT;
    session.subdomain = subdomain;

    // Store only the session cookie for JWT refresh (not all cookies to stay under size limit)
    // The session cookie allows us to GET /app and get a fresh CSRF token for JWT refresh
    const sessionCookie = cookieJar.find(c => c.startsWith('session='));
    if (sessionCookie) {
      session.gorgiasSession = sessionCookie;
    }

    await session.save();

    return NextResponse.json({
      success: true,
      subdomain,
      message: 'Successfully connected to Gorgias Flows',
    });

  } catch (error: any) {
    console.error('[FlowsLogin] Error:', error.message);

    if (error.response?.data) {
      console.error('[FlowsLogin] Response:', JSON.stringify(error.response.data, null, 2));
    }

    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
