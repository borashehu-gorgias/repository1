import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import axios from 'axios';

// Refresh the long JWT using the stored Gorgias session cookie
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session.subdomain || !session.gorgiasSession) {
            return NextResponse.json(
                { error: 'No session data for refresh. Please login again.' },
                { status: 401 }
            );
        }

        const baseUrl = `https://${session.subdomain}.gorgias.com`;
        console.log('[JWTRefresh] Attempting to refresh JWT for', session.subdomain);

        // Step 1: Use stored session cookie to fetch /app and get fresh CSRF token
        const appResponse = await axios.get(`${baseUrl}/app`, {
            headers: {
                'Cookie': session.gorgiasSession,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            },
            maxRedirects: 5,
            validateStatus: (status) => status < 500,
        });

        if (appResponse.status !== 200) {
            console.log('[JWTRefresh] /app returned status:', appResponse.status);
            return NextResponse.json(
                { error: 'Session expired. Please login again.', requireReauth: true },
                { status: 401 }
            );
        }

        // Extract CSRF token from HTML
        const htmlContent = appResponse.data;
        const csrfMatch = htmlContent.match(/window\.CSRF_TOKEN\s*=\s*["']([^"']+)["']/);

        if (!csrfMatch || !csrfMatch[1]) {
            console.log('[JWTRefresh] Failed to extract CSRF from page');
            return NextResponse.json(
                { error: 'Session expired. Please login again.', requireReauth: true },
                { status: 401 }
            );
        }

        const pageCsrfToken = csrfMatch[1];
        console.log('[JWTRefresh] Got fresh CSRF token');

        // Step 2: Get new long JWT
        const authResponse = await axios.post(
            `${baseUrl}/gorgias-apps/auth`,
            {},
            {
                headers: {
                    'Cookie': session.gorgiasSession,
                    'X-CSRF-Token': pageCsrfToken,
                    'X-Gorgias-User-Client': 'web',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Origin': baseUrl,
                    'Referer': `${baseUrl}/app`,
                },
            }
        );

        const newJWT = authResponse.data?.token;

        if (!newJWT) {
            console.log('[JWTRefresh] No token in response');
            return NextResponse.json(
                { error: 'Failed to refresh token. Please login again.', requireReauth: true },
                { status: 401 }
            );
        }

        console.log('[JWTRefresh] Successfully refreshed JWT!');

        // Update session with new JWT
        session.longJWT = newJWT;
        await session.save();

        return NextResponse.json({
            success: true,
            message: 'JWT refreshed successfully',
        });

    } catch (error: any) {
        console.error('[JWTRefresh] Error:', error.message);

        if (error.response?.status === 401 || error.response?.status === 403) {
            return NextResponse.json(
                { error: 'Session expired. Please login again.', requireReauth: true },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to refresh JWT' },
            { status: 500 }
        );
    }
}
