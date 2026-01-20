#!/usr/bin/env node
/**
 * Test the Flows API with the actual bearer token
 */

import axios from 'axios';

async function testFlowsLive() {
  console.log('🔍 Testing Flows API with your token...\n');

  const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkhGSkxZdE1vNnBaUnBXSVpWcFROSE1mcWRqSEgtc0p5VWhYcTFHVWE5cEEiLCJ0eXAiOiJKV1QifQ.eyJ1c2VyX2lkIjozMDk3NjY3MjQsImFjY291bnRfaWQiOjE1NTM2MCwicm9sZXMiOlsiYWRtaW4iXSwiZXhwIjoxNzY0MDIyMTM2fQ.ixiMLeiUfGc9QSP8ZBPm8aYjYnRF7gS9qFI9CAKhRJfkUNk7ZJ8RKepy0nE9PAuJYQkDGbOP_DuFsBBxcZhbVjzb_yDftHr1pn9vXI21yACAJBPDuBYKZeOv2ZtQKkTOlWu1p9nPVoN-KANkmDPV3AOzwVglVoTYnlNAkyUosRCF9qPryS-0lCbf5RrryzT_OoAOTxzygRg79ky2vqhMdAIF_AseEuZYc0l5OvJ0SWGYEQqJw0g2zoWN3JrRuynOwwb2MJwDP6lxoUE02vPZWQn6tpeEv7AMXNdxlPKSSmLKbQ2Y_-M0p8n2-UF7R3ePPYXu4YhnQaMfYN0ges295WzQ-ibLf1nELBZWlbuDSSEJlz_tz8oNdmPN9rvJnIfA3Ibv6cvUjKzYwvSfqTp2Snj1caMhO18YC1eUKcqsxf_BWN-PCTINSqUwuxr-3lmRDyoqFiZkhzOjBLdjvc31QmqIGFKEoAVChz6SA3GJh_h00FXNtEYYPIKm7pnRUeD_h5KdaRqzKqADXqwmo7AGYZbegGZAgyLLqUcRWtD3WAPcMG1-fL-xIynH67dcubgWqVPY2MPFgyqYa8sin5jskaFe_A9DEtUQmtkUNwjnTxoFO_g-sk-JACOJnpR4C5sIZ71lZMHlyhygUdRjwzj7j2k5qQZhjM7X0yKrRAbnD3g';

  try {
    const client = axios.create({
      baseURL: 'https://api.gorgias.work',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const response = await client.get('/configurations', {
      params: {
        'is_draft[]': [0, 1],
      },
    });

    console.log('✅ SUCCESS! Got flows data\n');
    console.log(`Total configurations: ${response.data.length || 0}\n`);

    if (response.data.length > 0) {
      const firstFlow = response.data[0];
      console.log('First flow sample:');
      console.log(JSON.stringify(firstFlow, null, 2).substring(0, 500));
      console.log('\n...(truncated)');

      console.log('\n📊 Flow Structure:');
      console.log('Keys:', Object.keys(firstFlow));
    }

  } catch (error: any) {
    console.error('❌ Error:', error.response?.status, error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

testFlowsLive();
