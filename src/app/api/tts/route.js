import { NextResponse } from 'next/server';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const SARVAM_BASE = 'https://api.sarvam.ai';

// Best natural-sounding speaker per language for bulbul:v2
const LANG_CONFIG = {
  'ta': { code: 'ta-IN', speaker: 'anushka' }, // Tamil
  'ml': { code: 'ml-IN', speaker: 'vidya'   }, // Malayalam
  'te': { code: 'te-IN', speaker: 'anushka' }, // Telugu
  'kn': { code: 'kn-IN', speaker: 'manisha' }, // Kannada
  'hi': { code: 'hi-IN', speaker: 'anushka' }, // Hindi
  'bn': { code: 'bn-IN', speaker: 'anushka' }, // Bengali
  'en': { code: 'en-IN', speaker: 'arya'    }, // English
};

export async function POST(request) {
  try {
    const { text, language } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
    }

    const lang = (language || 'en').toLowerCase();
    const config = LANG_CONFIG[lang] || LANG_CONFIG['en'];

    if (!SARVAM_API_KEY) {
      return NextResponse.json({ error: 'TTS API not configured.' }, { status: 503 });
    }

    let textToSpeak = text.trim();
    // Auto-translate English fallbacks to the target language if needed
    if (lang !== 'en' && /^[a-zA-Z0-9\s.,?!'"()[\]{}-]+$/.test(textToSpeak)) {
      const GROQ_API_KEY = process.env.GROQ_API_KEY;
      if (GROQ_API_KEY) {
        try {
          const langNames = {
            'ta': 'Tamil', 'ml': 'Malayalam', 'te': 'Telugu',
            'kn': 'Kannada', 'hi': 'Hindi', 'bn': 'Bengali'
          };
          const targetLangName = langNames[lang];
          if (targetLangName) {
            const trRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: process.env.GROQ_LLM_MODEL || 'llama3-8b-8192',
                messages: [{
                  role: 'system',
                  content: `You are a helpful translator. Translate the following English text to ${targetLangName}. Respond ONLY with the translated text, no quotes or extra text.`
                }, {
                  role: 'user',
                  content: textToSpeak
                }],
                temperature: 0.1
              })
            });
            if (trRes.ok) {
              const trData = await trRes.json();
              if (trData.choices && trData.choices[0]) {
                textToSpeak = trData.choices[0].message.content.trim();
              }
            }
          }
        } catch (e) {
          console.error('[tts] Auto-translation failed:', e);
        }
      }
    }

    // Sarvam TTS supports max ~500 chars per request — split if needed
    const MAX_CHARS = 500;
    const chunks = [];
    let remaining = textToSpeak;
    while (remaining.length > 0) {
      if (remaining.length <= MAX_CHARS) {
        chunks.push(remaining);
        break;
      }
      // Find a sentence boundary to split on
      let splitAt = remaining.lastIndexOf('.', MAX_CHARS);
      if (splitAt < 100) splitAt = remaining.lastIndexOf(' ', MAX_CHARS);
      if (splitAt < 1) splitAt = MAX_CHARS;
      chunks.push(remaining.slice(0, splitAt + 1).trim());
      remaining = remaining.slice(splitAt + 1).trim();
    }

    // Call Sarvam TTS for all chunks
    const audioBuffers = [];
    for (const chunk of chunks) {
      const res = await fetch(`${SARVAM_BASE}/text-to-speech`, {
        method: 'POST',
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: [chunk],
          target_language_code: config.code,
          speaker: config.speaker,
          model: 'bulbul:v2',
          pitch: 0,
          pace: 0.85,
          loudness: 1.5,
          speech_sample_rate: 22050,
          enable_preprocessing: true,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('[tts] Sarvam error:', err);
        return NextResponse.json({ error: 'TTS generation failed.' }, { status: 502 });
      }

      const data = await res.json();
      if (!data.audios || !data.audios[0]) {
        return NextResponse.json({ error: 'No audio returned from TTS.' }, { status: 502 });
      }

      audioBuffers.push(data.audios[0]); // base64 WAV
    }

    // Return all audio chunks as base64 array (client concatenates)
    return NextResponse.json({
      success: true,
      audios: audioBuffers,   // array of base64 WAV strings
      language: config.code,
      speaker: config.speaker,
    });

  } catch (err) {
    console.error('[tts] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal TTS error.' }, { status: 500 });
  }
}
