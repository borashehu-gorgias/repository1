import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import axios from 'axios';

/**
 * Test endpoint to verify if the Flows API supports POST/PUT operations
 * This helps determine if cross-account migration is possible
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.longJWT) {
      return NextResponse.json(
        { error: 'Long JWT required. Please authenticate first.' },
        { status: 401 }
      );
    }

    const results: any = {
      tests: [],
      summary: '',
    };

    const client = axios.create({
      baseURL: 'https://api.gorgias.work',
      headers: {
        'Authorization': `Bearer ${session.longJWT}`,
        'Content-Type': 'application/json',
      },
      validateStatus: () => true, // Don't throw on any status
    });

    // Minimal valid flow payload based on network inspection
    const testFlow = {
      name: 'Test Flow - API Check',
      description: 'Testing if POST works',
      is_draft: true,
      enabled: false,
      available_languages: ['en-US'],
      entrypoint: {
        label: 'Test Entrypoint',
        label_tkey: 'test_tkey_label'
      },
      // Using dummy IDs in ULID format just in case validation is strict
      // 01H... is a valid ULID prefix
      initial_step_id: '01H00000000000000000000001',
      steps: [
        {
          id: '01H00000000000000000000001',
          kind: 'message',
          settings: {
            message: {
              content: {
                text: 'Test message content',
                html: '<p>Test message content</p>',
                text_tkey: 'test_tkey_text',
                html_tkey: 'test_tkey_html'
              }
            }
          }
        }
      ],
      transitions: []
    };

    // Test 1: POST /configurations
    const postRes1 = await client.post('/configurations', testFlow);
    results.tests.push({
      test: 'POST /configurations',
      status: postRes1.status,
      interpretation: interpretStatus(postRes1.status, 'POST'),
      data: postRes1.data,
    });

    // Test 2: POST /configuration (singular)
    const postRes2 = await client.post('/configuration', testFlow);
    results.tests.push({
      test: 'POST /configuration',
      status: postRes2.status,
      interpretation: interpretStatus(postRes2.status, 'POST'),
      data: postRes2.data,
    });

    // Test 3: POST /flows
    const postRes3 = await client.post('/flows', testFlow);
    results.tests.push({
      test: 'POST /flows',
      status: postRes3.status,
      interpretation: interpretStatus(postRes3.status, 'POST'),
      data: postRes3.data,
    });

    // Test 4: POST /flow
    const postRes4 = await client.post('/flow', testFlow);
    results.tests.push({
      test: 'POST /flow',
      status: postRes4.status,
      interpretation: interpretStatus(postRes4.status, 'POST'),
      data: postRes4.data,
    });

    // Test 5: PUT /configurations (without ID)
    const putRes1 = await client.put('/configurations', testFlow);
    results.tests.push({
      test: 'PUT /configurations',
      status: putRes1.status,
      interpretation: interpretStatus(putRes1.status, 'PUT'),
      data: putRes1.data,
    });

    // Test 6: Try fetching existing configs to get a real ID format
    const getRes = await client.get('/configurations');
    let sampleId = null;
    if (getRes.status === 200 && Array.isArray(getRes.data) && getRes.data.length > 0) {
      sampleId = getRes.data[0].id;
      results.tests.push({
        test: 'GET /configurations (sample)',
        status: getRes.status,
        sampleId: sampleId,
        sampleInternalId: getRes.data[0].internal_id,
        interpretation: 'Got sample flow ID for reference',
      });
    }

    // Test 7: PUT with real ID format (clone attempt)
    if (sampleId) {
      const putRes2 = await client.put(`/configurations/${sampleId}`, {
        ...testFlow,
        name: 'Cloned Flow Test',
      });
      results.tests.push({
        test: `PUT /configurations/${sampleId} (Existing ID)`,
        status: putRes2.status,
        interpretation: interpretStatus(putRes2.status, 'PUT'),
        data: putRes2.data,
      });
    }

    // Test 9: Try Creating via PUT with a NEW ID (Client-side ID generation?)
    // Generate a crude ULID-like string: timestamp (10 chars) + random (16 chars)
    const newId = '01' + Date.now().toString(36).toUpperCase().padStart(10, '0').slice(-8) + 'X' + Math.random().toString(36).slice(2, 10).toUpperCase();

    // Ensure payload has matching IDs
    const createViaPutFlow = {
      ...testFlow,
      id: newId,
      internal_id: newId, // Using same ID for internal_id for testing
      initial_step_id: newId + 'STEP',
      steps: [
        {
          ...testFlow.steps[0],
          id: newId + 'STEP'
        }
      ]
    };

    const putCreateRes = await client.put(`/configurations/${newId}`, createViaPutFlow);
    results.tests.push({
      test: `PUT /configurations/{new_id} (Creation attempt)`,
      newId: newId,
      status: putCreateRes.status,
      interpretation: putCreateRes.status === 200 || putCreateRes.status === 201
        ? 'Creation via PUT WORKS!'
        : interpretStatus(putCreateRes.status, 'PUT'),
      data: putCreateRes.data,
    });

    // Test 8: Check allowed methods via OPTIONS
    const optionsRes = await client.options('/configurations');
    results.tests.push({
      test: 'OPTIONS /configurations',
      status: optionsRes.status,
      allowHeader: optionsRes.headers['allow'],
      accessControlAllowMethods: optionsRes.headers['access-control-allow-methods'],
    });

    // Summary
    const successfulPost = results.tests.find((t: any) =>
      t.test.startsWith('POST') && (t.status === 200 || t.status === 201)
    );
    const successfulPut = results.tests.find((t: any) =>
      t.test.startsWith('PUT') && (t.status === 200 || t.status === 201)
    );

    results.summary = {
      postWorks: !!successfulPost,
      putWorks: !!successfulPut,
      workingEndpoint: successfulPost?.test || successfulPut?.test || 'None found',
      recommendation: successfulPost || successfulPut
        ? 'Write operations possible!'
        : 'API appears to be read-only. Consider JSON export instead.',
    };

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Test error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function interpretStatus(status: number, method: string): string {
  switch (status) {
    case 200:
    case 201:
      return `${method} WORKS!`;
    case 400:
    case 422:
      return `${method} accepted but validation failed (endpoint exists!)`;
    case 401:
      return 'Auth issue - token may be invalid';
    case 403:
      return 'Forbidden - no permission for this operation';
    case 404:
      return 'Endpoint not found';
    case 405:
      return 'Method not allowed';
    default:
      return `Status ${status} - needs investigation`;
  }
}
