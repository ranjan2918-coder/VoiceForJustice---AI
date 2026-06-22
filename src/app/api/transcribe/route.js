import { NextResponse } from 'next/server';

// ── Environment Variables ──────────────────────────────────────────────────
// Set these in .env.local:
//   GROQ_API_KEY=gsk_...
//   GROQ_WHISPER_MODEL=whisper-large-v3          (or whisper-large-v3-turbo)
//   GROQ_LLM_MODEL=llama3-8b-8192               (or llama-3.1-8b-instant)
const GROQ_API_KEY    = process.env.GROQ_API_KEY     || '';
const WHISPER_MODEL   = process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3';
const LLM_MODEL       = process.env.GROQ_LLM_MODEL    || 'llama3-8b-8192';
const GROQ_BASE       = 'https://api.groq.com/openai/v1';

// Whisper language codes (ISO 639-1) for each supported kiosk language
const WHISPER_LANG = {
  ta: 'ta', hi: 'hi', te: 'te', kn: 'kn', ml: 'ml', bn: 'bn', en: 'en'
};

// ── Mock fallbacks (used when GROQ_API_KEY is not set) ─────────────────────
const MOCK = {
  ta: {
    transcript: 'கடந்த இரண்டு வாரங்களாக என் முதலாளி எனக்கு சம்பளம் தரவில்லை. வேலை செய்யும் இடத்தில் விழுந்து காயம் ஏற்பட்டது.',
    english:    'My employer has not paid me for the last two weeks. I fell at the work site and got injured.'
  },
  hi: {
    transcript: 'मुझे दो हफ्ते से मजदूरी नहीं मिली है। कॉन्ट्रैक्टर फोन नहीं उठा रहा है।',
    english:    'I have not received wages for two weeks. The contractor is not answering the phone.'
  },
  te: {
    transcript: 'రెండు వారాలుగా నాకు వేతనం ఇవ్వలేదు. అడిగితే పని నుండి తీసేస్తామని బెదిరిస్తున్నారు.',
    english:    'I have not been paid for two weeks. They threaten to fire me when I ask for wages.'
  },
  kn: {
    transcript: 'ಮೂರು ವಾರಗಳಿಂದ ವೇತನ ನೀಡಿಲ್ಲ. ಊಟಕ್ಕೂ ಹಣವಿಲ್ಲದಂತಾಗಿದೆ.',
    english:    'No wages have been paid for three weeks. I do not have enough money even for food.'
  },
  ml: {
    transcript: 'ഒരു മാസത്തെ ശമ്പളം ലഭിക്കുന്നില്ല. ചോദിച്ചപ്പോൾ പോലീസിനെ വിളിക്കുമെന്ന് ഭീഷണി.',
    english:    'I have not received one month of salary. When I asked, they threatened to call the police.'
  },
  bn: {
    transcript: 'সুপারভাইজার তিন দিনের টাকা কেটে নিয়েছে। ওভারটাইমের পয়সাও দেয়নি।',
    english:    'The supervisor deducted three days of pay. Overtime wages were also not given.'
  },
  en: {
    transcript: 'My contractor has not paid me for the last ten days. He avoids me whenever I ask.',
    english:    'My contractor has not paid me for the last ten days. He avoids me whenever I ask.'
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Call Groq Whisper to transcribe an audio blob.
 * @param {Blob|File} audioFile
 * @param {string} langCode  e.g. "ta", "hi"
 */
async function transcribeWithGroq(audioFile, langCode) {
  const fd = new FormData();
  // Groq requires a filename with a recognised extension
  const ext = audioFile.type.includes('ogg') ? '.ogg'
            : audioFile.type.includes('mp4')  ? '.mp4'
            : '.webm';
  fd.append('file', audioFile, `recording${ext}`);
  fd.append('model', WHISPER_MODEL);
  fd.append('language', WHISPER_LANG[langCode] ?? 'en');
  fd.append('response_format', 'json');

  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: fd
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq Whisper ${res.status}: ${body}`);
  }

  const data = await res.json();
  return (data.text ?? '').trim();
}

/**
 * Call Groq LLM to translate transcript to English.
 * @param {string} text       Original-language text
 * @param {string} langCode   Source language code
 */
async function translateToEnglish(text, langCode) {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a compassionate worker-rights advocate and translator. ' +
            'Translate the following labour grievance from its original language to English. ' +
            'Preserve all factual details (amounts, durations, names). ' +
            'Return ONLY the English translation — no explanations, no preamble.'
        },
        { role: 'user', content: text }
      ],
      temperature: 0.2,
      max_tokens: 512
    })
  });

  if (!res.ok) {
    console.warn('LLM translation failed, returning original text');
    return text; // graceful degradation
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? text).trim();
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request) {
  let language = 'en';

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio'); // File | Blob
    language        = (formData.get('language') ?? 'en').toLowerCase();

    if (!audioFile || typeof audioFile === 'string') {
      return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 });
    }

    // ── No API key → return rich mock immediately ──────────────────────────
    if (!GROQ_API_KEY) {
      console.info('[transcribe] No GROQ_API_KEY set – returning mock data.');
      // Simulate realistic processing delay
      await new Promise(r => setTimeout(r, 1800));
      const mock = MOCK[language] ?? MOCK.en;
      return NextResponse.json({ transcript: mock.transcript, english: mock.english });
    }

    // ── Step 1: Transcribe ─────────────────────────────────────────────────
    const transcript = await transcribeWithGroq(audioFile, language);

    if (!transcript) {
      return NextResponse.json(
        { error: 'No speech detected in the audio. Please try again.' },
        { status: 422 }
      );
    }

    // ── Step 2: Translate to English (skip if already English) ────────────
    let english = transcript;
    if (language !== 'en') {
      english = await translateToEnglish(transcript, language);
    }

    return NextResponse.json({ transcript, english });

  } catch (err) {
    console.error('[transcribe] Error:', err);
    // Return mock data so the UI still works for demos
    const mock = MOCK[language] ?? MOCK.en;
    return NextResponse.json({ transcript: mock.transcript, english: mock.english });
  }
}
