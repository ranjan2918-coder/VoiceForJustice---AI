const https = require('https');

const API_KEY = 'sk_wrzjjt9d_J1s3QstyunwCj0cufJbGJzA8';

async function testSarvam(text, langCode) {
  const body = JSON.stringify({
    inputs: [text],
    target_language_code: langCode,
    speaker: 'meera',
    model: 'bulbul:v1',
    pitch: 0,
    pace: 0.85,
    loudness: 1.5,
    speech_sample_rate: 22050,
    enable_preprocessing: true
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.sarvam.ai',
      path: '/text-to-speech',
      method: 'POST',
      headers: {
        'api-subscription-key': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Print the FULL raw response for debugging
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data.substring(0, 500)}`);
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    req.write(body);
    req.end();
  });
}

// Test just Tamil first to see the raw error
testSarvam('வாய்ஸ் ஃபார் ஜஸ்டிஸ்.', 'ta-IN').then(() => {
  console.log('\n--- Also testing with English to check if auth is the issue ---');
  return testSarvam('Hello, welcome to Voice for Justice.', 'en-IN');
}).catch(console.error);
