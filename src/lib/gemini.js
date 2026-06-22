// Helper to interact with Gemini API or fallback to mock responses for testing

const API_KEY = process.env.GEMINI_API_KEY || '';

// Mock complaints in various regional Indian languages to simulate speech-to-text
const MOCK_DATA = {
  ta: {
    transcript: "கடந்த இரண்டு வாரங்களாக என் முதலாளி எனக்கு சம்பளம் தரவில்லை. வேலை செய்யும்போது கீழே விழுந்து என் கையில் காயம் ஏற்பட்டது, அதற்கு மருத்துவ உதவி கூட செய்யவில்லை.",
    englishSummary: "Worker reports unpaid wages for the last two weeks. Also mentions falling down and injuring their hand while working, without receiving any medical assistance."
  },
  hi: {
    transcript: "मैं दो हफ़्ते से यहाँ काम कर रहा हूँ, लेकिन कॉन्ट्रैक्टर ने मुझे मेरी दैनिक मजदूरी नहीं दी है। वह बार-बार टाल रहा है।",
    englishSummary: "Worker has been working at the site for two weeks, but the contractor has not paid their daily wages and keeps stalling."
  },
  te: {
    transcript: "నేను బిల్డింగ్ నిర్మాణంలో నెల రోజులుగా పనిచేస్తున్నాను, కానీ సబ్ కాంట്രാక్టర్ నా జీతం ఇవ్వడం లేదు. అడిగితే ఇక్కడ నుండి వెళ్ళిపోమని బెదిరిస్తున్నాడు.",
    englishSummary: "Worker has been working in building construction for a month, but the subcontractor is refusing to pay wages and threatening them to leave when asked for payment."
  },
  kn: {
    transcript: "ಕಳೆದ ಮೂರು ವಾರಗಳಿಂದ ನಮಗೆ ಸಂಬಳ ಕೊಟ್ಟಿಲ್ಲ. ಗುತ್ತಿಗೆದಾರರು ಪ್ರತಿ ಬಾರಿ ಕೇಳಿದಾಗಲೂ ನಾಳೆ ಬನ್ನಿ ಎಂದು ಹೇಳುತ್ತಾರೆ. ನಮಗೆ ಊಟಕ್ಕೂ ಹಣವಿಲ್ಲದಂತಾಗಿದೆ.",
    englishSummary: "Worker reports not being paid for the last three weeks. Contractor tells them to come tomorrow every time they ask. Workers are facing difficulties buying food."
  },
  ml: {
    transcript: "കോൺട്രാക്ടർ കഴിഞ്ഞ ഒരു മാസത്തെ ശമ്പളം തരാതെ എന്നെ ഒഴിവാക്കാൻ നോക്കുന്നു. ചോദിച്ചപ്പോൾ പോലീസിനെ വിളിക്കുമെന്നാണ് ഭീഷണിപ്പെടുത്തുന്നത്.",
    englishSummary: "Worker reports the contractor is trying to lay them off without paying the last month's wages, and threatened to call the police when asked for payment."
  },
  bn: {
    transcript: "আমি কনস্ট্রাকশন সাইটে কাজ করেছি কিন্তু সুপারভাইজার আমার তিন দিনের টাকা কেটে নিয়েছে। আমার কোনো ওভারটাইম টাকাও দেওয়া হয়নি।",
    englishSummary: "Worker reports that the supervisor deducted three days of wages from their pay at the construction site, and overtime wages were not paid."
  },
  en: {
    transcript: "The site contractor did not pay me my daily wage of eight hundred rupees for the last ten days. He keeps avoiding me when I ask.",
    englishSummary: "Worker reports the site contractor has withheld their daily wage of 800 Rupees for the last ten days, and is actively avoiding contact."
  }
};

/**
 * Simulates transcribing audio. In a real integration, this could send the audio blob
 * to Gemini API or Whisper API.
 * @param {string} base64Audio - base64 encoded audio string
 * @param {string} language - language code (es, hi, ar, vi, en)
 */
export async function transcribeAudio(base64Audio, language = 'en') {
  if (!API_KEY) {
    // Return realistic mock based on language
    const mock = MOCK_DATA[language] || MOCK_DATA.en;
    // Add small delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    return mock.transcript;
  }

  try {
    // If API key is available, we could run actual Gemini audio analysis.
    // Note: Gemini 2.5 Flash can accept audio inline if sent in the prompt with mimeType.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/webm', // or audio/wav depending on what's uploaded
                  data: base64Audio
                }
              },
              {
                text: `You are an expert transcriber. Transcribe this audio exactly in its original language. Do not translate. Only output the transcription.`
              }
            ]
          }
        ]
      })
    });

    const result = await response.json();
    const transcriptText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (transcriptText) {
      return transcriptText.trim();
    }
    
    throw new Error('Could not extract transcription from Gemini response');
  } catch (error) {
    console.error('Gemini transcribe failed, falling back to mock:', error);
    const mock = MOCK_DATA[language] || MOCK_DATA.en;
    return mock.transcript;
  }
}

/**
 * Translates and summarizes a transcript into a concise English summary.
 * @param {string} transcript - raw transcript text
 * @param {string} sourceLanguage - original language code
 */
export async function generateEnglishSummary(transcript, sourceLanguage) {
  if (!API_KEY) {
    // If it matches our mock transcript exactly, return the pre-translated mock
    const mock = MOCK_DATA[sourceLanguage];
    if (mock && mock.transcript === transcript) {
      return mock.englishSummary;
    }
    // Otherwise, generate a mock translation representation
    return `[Mock Translation of ${sourceLanguage.toUpperCase()}] Worker reports: "${transcript}"`;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    
    const prompt = `You are a worker rights advocate assistant. Translate the following text from language code "${sourceLanguage}" into English, and write a concise, professional 2-3 sentence summary of the labor complaint described. Include key details like location, duration of unpaid work, and amounts if mentioned.

Text to translate and summarize:
"${transcript}"`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2
        }
      })
    });

    const result = await response.json();
    const summaryText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (summaryText) {
      return summaryText.trim();
    }
    
    throw new Error('Could not extract summary from Gemini response');
  } catch (error) {
    console.error('Gemini translation/summary failed, falling back to basic translator:', error);
    return `[Translated summary] Original: ${transcript}`;
  }
}
