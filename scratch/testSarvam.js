const https = require('https');

const API_KEY = 'sk_wrzjjt9d_J1s3QstyunwCj0cufJbGJzA8';

// Sarvam updated their speakers list - test with new ones
// Best female voices for natural local tone
const LANG_SPEAKERS = {
  'ta-IN': 'anushka',   // Tamil female
  'ml-IN': 'vidya',     // Malayalam female  
  'te-IN': 'anushka',   // Telugu female
  'kn-IN': 'manisha',   // Kannada female
  'hi-IN': 'anushka',   // Hindi female (bulbul:v2 compatible)
  'bn-IN': 'anushka',   // Bengali female (bulbul:v2 compatible)
  'en-IN': 'arya',      // English female
};

async function testSarvam(text, langCode) {
  const speaker = LANG_SPEAKERS[langCode] || 'anushka';
  const body = JSON.stringify({
    inputs: [text],
    target_language_code: langCode,
    speaker: speaker,
    model: 'bulbul:v2',
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
        try {
          const parsed = JSON.parse(data);
          const hasAudio = Array.isArray(parsed.audios) && parsed.audios.length > 0 && parsed.audios[0].length > 100;
          resolve({ status: res.statusCode, hasAudio, error: parsed.error?.message || null, speaker });
        } catch(e) {
          resolve({ status: res.statusCode, hasAudio: false, error: data.substring(0, 200), speaker });
        }
      });
    });
    req.on('error', (e) => resolve({ status: 0, hasAudio: false, error: e.message, speaker }));
    req.write(body);
    req.end();
  });
}

async function runTests() {
  const tests = [
    { lang: 'ta-IN', text: 'வாய்ஸ் ஃபார் ஜஸ்டிஸ்-க்கு வரவேற்கிறோம்.', name: 'Tamil' },
    { lang: 'ml-IN', text: 'വോയ്സ് ഫോർ ജസ്റ്റിസിലേക്ക് സ്വാഗതം.', name: 'Malayalam' },
    { lang: 'te-IN', text: 'వాయిస్ ఫర్ జస్టిస్‌కు స్వాగతం.', name: 'Telugu' },
    { lang: 'kn-IN', text: 'ವಾಯ್ಸ್ ಫಾರ್ ಜಸ್ಟಿಸ್‌ಗೆ ಸ್ವಾಗತ.', name: 'Kannada' },
    { lang: 'hi-IN', text: 'वॉयस फॉर जस्टिस में आपका स्वागत है।', name: 'Hindi' },
    { lang: 'bn-IN', text: 'ভয়েস ফর জাস্টিসে স্বাগতম।', name: 'Bengali' },
  ];

  console.log('Testing Sarvam AI TTS with updated speakers...\n');

  let allPassed = true;
  for (const t of tests) {
    const result = await testSarvam(t.text, t.lang);
    const ok = result.status === 200 && result.hasAudio;
    if (!ok) allPassed = false;
    const icon = ok ? '✅' : '❌';
    const msg = ok ? `REAL audio received! (speaker: ${result.speaker})` : `FAILED - ${result.error}`;
    console.log(`${icon} ${t.name} (${t.lang}): ${msg}`);
  }

  console.log('\n' + (allPassed ? '🎉 API key works perfectly for ALL languages!' : '⚠️  Some issues found.'));
}

runTests().catch(console.error);
