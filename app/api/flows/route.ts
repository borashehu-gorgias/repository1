import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // Accept either OAuth accessToken or direct longJWT login
    if (!session.accessToken && !session.longJWT) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if we have a stored Long JWT and can fetch flows
    if (session.longJWT) {
      try {
        const response = await axios.get(
          'https://api.gorgias.work/configurations?is_draft[]=0&is_draft[]=1',
          {
            headers: {
              'Authorization': `Bearer ${session.longJWT}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return NextResponse.json({
          flows: response.data,
          subdomain: session.subdomain,
        });
      } catch (error: any) {
        console.error('Failed to fetch flows with stored Long JWT:', error.response?.status);

        // If 401, try to refresh the JWT using stored session cookie
        if (error.response?.status === 401 && session.gorgiasSession) {
          console.log('Attempting JWT refresh...');
          try {
            // Try to refresh the JWT
            const baseUrl = `https://${session.subdomain}.gorgias.com`;

            // Get fresh CSRF token
            const appResponse = await axios.get(`${baseUrl}/app`, {
              headers: {
                'Cookie': session.gorgiasSession,
                'User-Agent': 'Mozilla/5.0',
              },
              maxRedirects: 5,
              validateStatus: (status) => status < 500,
            });

            if (appResponse.status === 200) {
              const csrfMatch = appResponse.data.match(/window\.CSRF_TOKEN\s*=\s*["']([^"']+)["']/);

              if (csrfMatch?.[1]) {
                const authResponse = await axios.post(
                  `${baseUrl}/gorgias-apps/auth`,
                  {},
                  {
                    headers: {
                      'Cookie': session.gorgiasSession,
                      'X-CSRF-Token': csrfMatch[1],
                      'X-Gorgias-User-Client': 'web',
                    },
                  }
                );

                const newJWT = authResponse.data?.token;
                if (newJWT) {
                  console.log('JWT refreshed successfully!');
                  session.longJWT = newJWT;
                  await session.save();

                  // Retry with new JWT
                  const retryResponse = await axios.get(
                    'https://api.gorgias.work/configurations?is_draft[]=0&is_draft[]=1',
                    {
                      headers: {
                        'Authorization': `Bearer ${newJWT}`,
                        'Content-Type': 'application/json',
                      },
                    }
                  );

                  return NextResponse.json({
                    flows: retryResponse.data,
                    subdomain: session.subdomain,
                  });
                }
              }
            }
          } catch (refreshError) {
            console.error('JWT refresh failed:', refreshError);
          }
        }
        // Fall through to prompt for new token
      }
    }

    // Need Long JWT from user
    return NextResponse.json({
      subdomain: session.subdomain,
      userEmail: session.userEmail,
      message: 'Long JWT required',
    });
  } catch (error: any) {
    console.error('Error in GET /api/flows:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch flows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    // Accept either OAuth accessToken or direct longJWT login
    if (!session.accessToken && !session.longJWT) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { longJWT } = body;

    if (!longJWT) {
      return NextResponse.json({ error: 'Long JWT required' }, { status: 400 });
    }

    // Store Long JWT in session
    session.longJWT = longJWT;
    await session.save();

    // Fetch flows using Long JWT
    const response = await axios.get(
      'https://api.gorgias.work/configurations?is_draft[]=0&is_draft[]=1',
      {
        headers: {
          'Authorization': `Bearer ${longJWT}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json({
      flows: response.data,
      subdomain: session.subdomain,
    });
  } catch (error: any) {
    console.error('Error in POST /api/flows:', error.message);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid Long JWT token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch flows' },
      { status: 500 }
    );
  }
}
