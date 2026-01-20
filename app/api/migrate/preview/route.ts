import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import axios from 'axios';

// LLM-powered Flow to Guidance converter
async function convertFlowToGuidanceWithLLM(flow: any): Promise<string> {
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!openrouterApiKey) {
        console.warn('OPENROUTER_API_KEY not set, falling back to basic conversion');
        return convertFlowToGuidanceContent(flow);
    }

    try {
        const systemPrompt = `You are an expert at converting Gorgias Flow configurations into AI Agent Guidance following best practices.

GUIDELINES FOR WRITING GUIDANCE:
- Use the "When, If, Then" framework
- Start with WHEN to set the scenario
- Add IF conditions when needed
- Use THEN for specific actions
- Keep language simple and scannable
- Use bullet points and numbered lists
- Format for readability
- Focus on "do's" rather than "don'ts"
- Explain what the customer should expect

EXAMPLE FORMAT:
WHEN a customer asks about [topic]:

IF [condition],

THEN
- [Action 1]
- [Action 2]
- [Action 3]

Your task: Convert the Flow JSON into clear, actionable Guidance that AI Agent can follow.`;

        const userPrompt = `Convert this Gorgias Flow into AI Agent Guidance:

Flow Name: ${flow.name}
Entrypoint Question: ${flow.entrypoint?.label || 'N/A'}

Flow Structure:
${JSON.stringify(flow, null, 2)}

Create well-formatted Guidance following the "When, If, Then" framework. Extract all messages, steps, and automated responses. Make it clear and actionable.`;

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'google/gemini-3-flash-preview',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
            },
            {
                headers: {
                    'Authorization': `Bearer ${openrouterApiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const content = response.data.choices[0].message.content;

        // Add metadata footer
        return `${content}\n\n---\nMigrated from Flow ID: ${flow.id}\nMigration Date: ${new Date().toISOString()}`;
    } catch (error: any) {
        console.error('LLM conversion failed:', error.message);
        console.log('Falling back to basic conversion');
        return convertFlowToGuidanceContent(flow);
    }
}

function convertFlowToGuidanceContent(flow: any): string {
    // Convert flow configuration to guidance text
    let content = `# ${flow.name}\n\n`;

    if (flow.description) {
        content += `${flow.description}\n\n`;
    }

    // Extract content from steps (the actual Flow nodes)
    if (flow.steps && flow.steps.length > 0) {
        content += `## Flow Content\n\n`;

        flow.steps.forEach((step: any) => {
            // Extract message content from automated answers
            if (step.actions) {
                step.actions.forEach((action: any) => {
                    if (action.type === 'send-message' && action.message) {
                        content += `${action.message}\n\n`;
                    }
                    if (action.type === 'add-comment' && action.comment) {
                        content += `**Internal Note:** ${action.comment}\n\n`;
                    }
                });
            }

            // Extract conditions or triggers
            if (step.label) {
                content += `**${step.label}**\n\n`;
            }
        });
    }

    // Extract inputs (START node questions)
    if (flow.inputs && flow.inputs.length > 0) {
        content += `## Questions Answered\n\n`;
        flow.inputs.forEach((input: any) => {
            if (input.label) {
                content += `- ${input.label}\n`;
            }
        });
        content += '\n';
    }

    // Add metadata
    content += `\n---\n`;
    content += `Migrated from Flow ID: ${flow.id}\n`;
    content += `Migration Date: ${new Date().toISOString()}\n`;

    return content;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        // Accept either OAuth accessToken or direct longJWT login
        if (!session.accessToken && !session.longJWT) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { flowIds } = body;

        if (!flowIds || !Array.isArray(flowIds) || flowIds.length === 0) {
            return NextResponse.json(
                { error: 'No flows selected' },
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

        // Fetch selected flows using Long JWT
        const flowsClient = axios.create({
            baseURL: 'https://api.gorgias.work',
            headers: {
                'Authorization': `Bearer ${session.longJWT}`,
                'Content-Type': 'application/json',
            },
        });

        const flowsPromises = flowIds.map((id) =>
            flowsClient.get(`/configurations/${id}`)
        );

        const flowsResponses = await Promise.all(flowsPromises);
        const flows = flowsResponses.map((r) => r.data);

        // Convert flows to guidances using LLM (preview only, no push)
        const guidancePromises = flows.map(flow => convertFlowToGuidanceWithLLM(flow));
        const guidanceContents = await Promise.all(guidancePromises);

        // Return preview data for editing
        const previews = flows.map((flow, index) => ({
            flowId: flow.id,
            flowName: flow.name || `Flow ${flow.id}`,
            content: guidanceContents[index],
        }));

        return NextResponse.json({
            success: true,
            previews,
        });
    } catch (error: any) {
        console.error('Preview generation error:', error.message);

        if (error.response?.data) {
            console.error('Response data:', error.response.data);
        }

        return NextResponse.json(
            {
                error: error.message || 'Preview generation failed',
                details: error.response?.data,
            },
            { status: 500 }
        );
    }
}
