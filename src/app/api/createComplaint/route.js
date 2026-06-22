import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generate65BCertificate } from '@/lib/certificate65B';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const LLM_MODEL     = process.env.GROQ_LLM_MODEL || 'llama3-8b-8192';
const GROQ_BASE     = 'https://api.groq.com/openai/v1';

// ── Fallback Templates for Mock mode ─────────────────────────────────────────
const MOCK_SCHEMAS = {
  ta: {
    englishSummary: "Worker reports unpaid wages for the last two weeks. Also mentions falling down and injuring their hand while working, without receiving any medical assistance.",
    workerSummaryLocal: "உங்கள் புகார் வெற்றிகரமாகப் பதிவானது. கடந்த இரண்டு வாரங்களாக உங்களுக்கு வழங்கப்படாத சம்பளம் மற்றும் வேலை செய்யும் போது ஏற்பட்ட காயம் குறித்து நாங்கள் புகார் அளித்துள்ளோம். நாங்கள் விரைவில் நடவடிக்கை எடுப்போம்.",
    structuredFields: {
      workerName: "Not mentioned",
      location: "Construction site",
      contractorName: "Contractor/Employer",
      wageAmount: "Not specified",
      duePeriod: "2 weeks",
      daysWorked: "Not specified",
      nonPaymentType: "not paid",
      threats: "None"
    }
  },
  hi: {
    englishSummary: "Worker has been working at the site for two weeks, but the contractor has not paid their daily wages and keeps stalling.",
    workerSummaryLocal: "आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है। पिछले दो हफ़्तों की मजदूरी भुगतान न होने के संबंध में आपकी शिकायत पर हम जल्द कार्रवाई करेंगे।",
    structuredFields: {
      workerName: "Not mentioned",
      location: "Work site",
      contractorName: "Contractor",
      wageAmount: "Not specified",
      duePeriod: "2 weeks",
      daysWorked: "14 days",
      nonPaymentType: "not paid",
      threats: "None"
    }
  },
  te: {
    englishSummary: "Worker has been working in building construction for a month, but the subcontractor is refusing to pay wages and threatening them to leave when asked for payment.",
    workerSummaryLocal: "మీ ఫిర్యాదు నమోదు చేయబడింది. నెల రోజులుగా సబ్ కాంట్రాక్టర్ వేతనాలు చెల్లించకపోవడం మరియు బెదిరింపులకు పాల్పడటం పై మేము చర్యలు చేపడతాము.",
    structuredFields: {
      workerName: "Not mentioned",
      location: "Building site",
      contractorName: "Subcontractor",
      wageAmount: "Not specified",
      duePeriod: "1 month",
      daysWorked: "30 days",
      nonPaymentType: "not paid",
      threats: "Threatened to leave"
    }
  },
  kn: {
    englishSummary: "Worker reports not being paid for the last three weeks. Contractor tells them to come tomorrow every time they ask. Workers are facing difficulties buying food.",
    workerSummaryLocal: "ನಿಮ್ಮ ದೂರು ದಾಖಲಾಗಿದೆ. ಕಳೆದ ಮೂರು ವಾರಗಳಿಂದ ವೇತನ ಸಿಗದಿರುವ ಬಗ್ಗೆ ಮತ್ತು ಗುತ್ತಿಗೆದಾರರು ನಾಳೆ ಬನ್ನಿ ಎಂದು ಹೇಳುತ್ತಿರುವ ಬಗ್ಗೆ ನಾವು ವಿಚಾರಣೆ ಮಾಡುತ್ತೇವೆ.",
    structuredFields: {
      workerName: "Not mentioned",
      location: "Not specified",
      contractorName: "Contractor",
      wageAmount: "Not specified",
      duePeriod: "3 weeks",
      daysWorked: "Not specified",
      nonPaymentType: "not paid",
      threats: "None"
    }
  },
  ml: {
    englishSummary: "Worker reports the contractor is trying to lay them off without paying the last month's wages, and threatened to call the police when asked for payment.",
    workerSummaryLocal: "പരാതി വിജയകരമായി ഫയൽ ചെയ്തു. കഴിഞ്ഞ ഒരു മാസത്തെ ശമ്പളം നൽകാത്തതിനെക്കുറിച്ചും പോലീസിനെ വിളിക്കുമെന്ന് ഭീഷണിപ്പെടുത്തിയതിനെക്കുറിച്ചും ഞങ്ങൾ അന്വേഷിക്കും.",
    structuredFields: {
      workerName: "Not mentioned",
      location: "Not specified",
      contractorName: "Contractor",
      wageAmount: "Not specified",
      duePeriod: "1 month",
      daysWorked: "30 days",
      nonPaymentType: "not paid",
      threats: "Threatened to call police"
    }
  },
  bn: {
    englishSummary: "Worker reports that the supervisor deducted three days of wages from their pay at the construction site, and overtime wages were not paid.",
    workerSummaryLocal: "আপনার অভিযোগ নথিভুক্ত করা হয়েছে। সুপারভাইজার কর্তৃক তিন দিনের টাকা কেটে নেওয়া এবং ওভারটাইম টাকা না দেওয়া নিয়ে তদন্ত শুরু হবে।",
    structuredFields: {
      workerName: "Not mentioned",
      location: "Construction site",
      contractorName: "Supervisor",
      wageAmount: "Not specified",
      duePeriod: "Not specified",
      daysWorked: "Not specified",
      nonPaymentType: "partial",
      threats: "None"
    }
  },
  en: {
    englishSummary: "Worker reports unpaid wages for the last ten days. Contractor avoids worker when asked for payment.",
    workerSummaryLocal: "Your complaint has been filed. We have recorded your issue regarding unpaid wages for the last ten days. We will contact you soon.",
    structuredFields: {
      workerName: "Not mentioned",
      location: "Not specified",
      contractorName: "Contractor",
      wageAmount: "Not specified",
      duePeriod: "10 days",
      daysWorked: "10 days",
      nonPaymentType: "not paid",
      threats: "None"
    }
  }
};

// ── Call Groq LLM to analyze the transcripts ─────────────────────────────────
async function analyzeComplaintWithGroq(originalText, englishText, langCode) {
  const systemPrompt = `You are a professional worker-rights advocate legal assistant.
Analyze the labor complaint described in the transcripts.
Extract the structured fields, compile a formal English legal summary suitable for labor authorities, and draft a short, reassuring worker-language summary.

Your output MUST be a valid JSON object matching exactly this schema:
{
  "workerName": "Name of the worker (or 'Not mentioned')",
  "location": "Site location or address (or 'Not specified')",
  "contractorName": "Name of contractor/supervisor/employer (or 'Not specified')",
  "wageAmount": "Wages owed or salary rate (or 'Not specified')",
  "duePeriod": "Duration of unpaid work, e.g. '2 weeks' (or 'Not specified')",
  "daysWorked": "Days worked (or 'Not specified')",
  "nonPaymentType": "one of: 'partial', 'not paid', 'delayed', or 'unknown'",
  "threats": "Any threats mentioned (e.g. calling police, firing, physical) or 'None'",
  "englishSummary": "A clean English legal-style complaint summary suitable for labour authorities.",
  "workerSummaryLocal": "A simple worker-language summary in 2-3 sentences explaining that their complaint has been registered and describing the issue. This MUST be translated and written in the requested language code."
}

Do not include any Markdown tags, backticks, or extra explanation text. Output ONLY the JSON object.`;

  const userPrompt = `Target language code for workerSummaryLocal: "${langCode}"

Original Transcript (original worker language):
"${originalText}"

English Translation of Transcript:
"${englishText}"`;

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 768,
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq LLM ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(rawContent.trim());
}

export async function POST(request) {
  try {
    const body = await request.json();
    const workerLanguage = (body.chosenLanguage || body.workerLanguage || body.language || 'en').toLowerCase();
    const originalTranscript = body.originalTranscript || body.transcript || '';
    const englishTranscript  = body.englishTranscript || body.englishTranslation || originalTranscript;
    const typedComplaint = body.typedComplaint || '';
    const phoneNumber        = body.phoneNumber || null;

    if (!originalTranscript && !typedComplaint) {
      return NextResponse.json(
        { error: 'Either voice transcript or typed complaint is required.' },
        { status: 400 }
      );
    }

    let combinedOriginal = '';
    let combinedEnglish = '';

    if (originalTranscript && typedComplaint) {
      if (GROQ_API_KEY) {
        try {
          const merged = await mergeInputsWithGroq(originalTranscript, typedComplaint, workerLanguage);
          combinedOriginal = merged.mergedLocal;
          combinedEnglish = merged.mergedEnglish;
        } catch (e) {
          console.error('[createComplaint] Merge failed, concatenating:', e);
          combinedOriginal = `${typedComplaint}\n\n[Voice]: ${originalTranscript}`;
          combinedEnglish = `${typedComplaint}\n\n[Voice]: ${englishTranscript}`;
        }
      } else {
        combinedOriginal = `${typedComplaint}\n\n[Voice]: ${originalTranscript}`;
        combinedEnglish = `${typedComplaint}\n\n[Voice]: ${englishTranscript}`;
      }
    } else if (typedComplaint) {
      combinedOriginal = typedComplaint;
      combinedEnglish = typedComplaint;
    } else {
      combinedOriginal = originalTranscript;
      combinedEnglish = englishTranscript;
    }

    let result = null;

    if (GROQ_API_KEY) {
      try {
        result = await analyzeComplaintWithGroq(combinedOriginal, combinedEnglish, workerLanguage);
      } catch (err) {
        console.error('[createComplaint] Groq analysis failed, falling back to mock:', err);
      }
    }

    // ── Fallback/Mock Mode if Groq fails or API key is missing ─────────────────
    if (!result) {
      console.info('[createComplaint] Running in mock/fallback mode.');
      // Find matches in pre-populated MOCK schemas
      const mockData = MOCK_SCHEMAS[workerLanguage] || MOCK_SCHEMAS.en;
      
      const isCustom = !Object.values(MOCK_SCHEMAS).some(
        m => m.englishSummary.toLowerCase() === combinedEnglish.toLowerCase()
      );

      if (isCustom) {
        result = {
          workerName: "Not mentioned",
          location: "Not specified",
          contractorName: "Employer",
          wageAmount: "Not specified",
          duePeriod: "Recent days",
          daysWorked: "Not specified",
          nonPaymentType: "not paid",
          threats: "None",
          englishSummary: `Worker reports: "${combinedEnglish}"`,
          workerSummaryLocal: (() => {
            const intros = {
              ta: "உங்கள் புகார் பதிவு செய்யப்பட்டது. உங்கள் சம்பளப் பிரச்சனை குறித்து நடவடிக்கை எடுக்கப்படும்.",
              hi: "आपकी शिकायत दर्ज कर ली गई है। आपकी मजदूरी समस्या पर जल्द कार्रवाई होगी.",
              en: "Your complaint was successfully filed. We will investigate your unpaid wage claim soon."
            };
            return intros[workerLanguage] || intros.en;
          })()
        };
      } else {
        result = { ...mockData };
      }
    }

    const {
      workerName = 'Not mentioned',
      location = 'Not specified',
      contractorName = 'Not specified',
      wageAmount = 'Not specified',
      duePeriod = 'Not specified',
      daysWorked = 'Not specified',
      nonPaymentType = 'unknown',
      threats = 'None',
      englishSummary,
      workerSummaryLocal
    } = result;

    const structuredFields = {
      workerName,
      location,
      contractorName,
      wageAmount,
      duePeriod,
      daysWorked,
      nonPaymentType,
      threats
    };

    // Save to local database
    const newComplaint = db.createComplaint({
      workerLanguage,
      originalTranscript: combinedOriginal,
      englishSummary,
      workerSummaryLocal,
      structuredFields,
      status: 'Filed',
      phoneNumber
    });

    // Generate 65B certificate for the complaint
    const cert = generate65BCertificate({
      content:    Buffer.from(combinedOriginal, 'utf-8'),
      recordId:   `COMPLAINT-${newComplaint.id}`,
      recordType: 'complaint_record',
      sessionId:  `SESSION-${newComplaint.id}`,
    });
    db.setCertificate(newComplaint.id, cert);

    return NextResponse.json({
      success: true,
      id: newComplaint.id,
      complaintId: newComplaint.id,
      workerSummaryLocal: newComplaint.workerSummaryLocal,
      certificate65B: { hash: cert.sha256Hash, timestamp: cert.timestamp },
      complaint: newComplaint
    });

  } catch (error) {
    console.error('[createComplaint] Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── Merge inputs LLM ────────────────────────────────────────────────────────
async function mergeInputsWithGroq(voiceText, typedText, langCode) {
  const systemPrompt = `You are a legal assistant. Merge the user's voice statement and typed notes into a single cohesive narrative.
DO NOT lose any details from either input.
Return ONLY JSON:
{
  "mergedLocal": "<the merged narrative in the language code: ${langCode}>",
  "mergedEnglish": "<the merged narrative in English>"
}`;

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Voice: "${voiceText}"\nTyped: "${typedText}"` }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) throw new Error('Groq Merge Failed');
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content.trim());
}
