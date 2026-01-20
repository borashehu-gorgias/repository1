import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import axios from 'axios';
import { GorgiasAuth } from '@/lib/core/auth';

interface GuidanceToPublish {
    flowId: string | number;
    flowName: string;
    content: string;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        // Accept either OAuth accessToken or direct longJWT login
        if (!session.accessToken && !session.longJWT) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { guidances } = body as { guidances: GuidanceToPublish[] };

        if (!guidances || !Array.isArray(guidances) || guidances.length === 0) {
            return NextResponse.json(
                { error: 'No guidances to publish' },
                { status: 400 }
            );
        }

        // Check required credentials from session
        if (!session.longJWT) {
            return NextResponse.json(
                { error: 'Long JWT not found. Please refresh and reconnect.' },
                { status: 401 }
            );
        }

        if (!session.gorgiasUsername || !session.gorgiasApiKey) {
            return NextResponse.json(
                { error: 'Gorgias credentials not found. Please add your username and API key in the dashboard.' },
                { status: 400 }
            );
        }

        // Get Help Center Bearer token using Basic Auth from session
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

        const helpCenterToken = await auth.getBearerToken();

        // Create guidances client
        const guidancesClient = axios.create({
            baseURL: 'https://internal-help-center-api.gorgias.com',
            headers: {
                'Authorization': `Bearer ${helpCenterToken}`,
                'Content-Type': 'application/json',
            },
        });

        // Get help center ID dynamically from AI Agent config
        let helpCenterId: number;
        try {
            const aiAgentClient = axios.create({
                baseURL: 'https://aiagent.gorgias.help',
                headers: {
                    'Authorization': `Bearer ${session.longJWT}`,
                    'Content-Type': 'application/json',
                },
            });

            const configResponse = await aiAgentClient.get(
                `/api/config/accounts/${session.subdomain}/stores/configurations`
            );

            // Response format: { storeConfigurations: [{ guidanceHelpCenterId: 79935, ... }] }
            const { storeConfigurations } = configResponse.data;

            if (!storeConfigurations || storeConfigurations.length === 0) {
                throw new Error('No store configurations found for this account');
            }

            helpCenterId = storeConfigurations[0].guidanceHelpCenterId;

            if (!helpCenterId) {
                throw new Error('guidanceHelpCenterId not found in store configuration');
            }

            console.log(`Using dynamic helpCenterId: ${helpCenterId} for store: ${storeConfigurations[0].storeName}`);
        } catch (error: any) {
            console.error('Failed to fetch helpCenterId:', error.message);
            return NextResponse.json(
                { error: `Failed to fetch Help Center configuration: ${error.message}` },
                { status: 500 }
            );
        }

        // Create each guidance as an article with translation
        const createdGuidances = [];

        for (const guidance of guidances) {
            try {
                console.log(`Creating article for guidance: ${guidance.flowName}`);

                // Generate slug from title
                const slug = guidance.flowName
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');

                // Create article WITH translation in one request
                const articleResponse = await guidancesClient.post(
                    `/api/help-center/help-centers/${helpCenterId}/articles`,
                    {
                        category_id: null,
                        translation: {
                            locale: 'en-US',
                            title: guidance.flowName,
                            content: `<div>${guidance.content.replace(/\n/g, '</div><div>')}</div>`,
                            excerpt: guidance.content.substring(0, 200),
                            slug: slug,
                            seo_meta: {
                                title: null,
                                description: null,
                            },
                            visibility_status: 'UNLISTED',
                        }
                    }
                );

                const articleId = articleResponse.data.id;
                console.log(`✅ Article created with ID: ${articleId}`);

                createdGuidances.push({
                    flowId: guidance.flowId,
                    articleId,
                    title: guidance.flowName,
                    success: true,
                });
            } catch (error: any) {
                console.error(`Failed to create guidance ${guidance.flowName}:`, error.message);
                if (error.response?.data) {
                    console.error('Error details:', JSON.stringify(error.response.data, null, 2));
                }
                createdGuidances.push({
                    flowId: guidance.flowId,
                    title: guidance.flowName,
                    success: false,
                    error: error.message,
                });
            }
        }

        const succeeded = createdGuidances.filter(g => g.success).length;
        const failed = createdGuidances.filter(g => !g.success).length;

        return NextResponse.json({
            success: failed === 0,
            summary: {
                total: guidances.length,
                succeeded,
                failed,
            },
            guidances: createdGuidances,
        });
    } catch (error: any) {
        console.error('Push error:', error.message);

        if (error.response?.data) {
            console.error('Response data:', error.response.data);
        }

        return NextResponse.json(
            {
                error: error.message || 'Push failed',
                details: error.response?.data,
            },
            { status: 500 }
        );
    }
}
