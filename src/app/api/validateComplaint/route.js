import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const LLM_MODEL    = process.env.GROQ_LLM_MODEL || 'llama3-8b-8192';
const GROQ_BASE    = 'https://api.groq.com/openai/v1';

// Validation criteria messages per language
const FIELD_LABELS = {
  employer_identified: {
    en: 'Employer or contractor name / site identified',
    ta: 'முதலாளி அல்லது ஒப்பந்ததாரர் அடையாளம் காணப்பட்டது',
    hi: 'नियोक्ता या ठेकेदार की पहचान', te: 'యజమాని లేదా కాంట్రాక్టర్ గుర్తింపు',
    kn: 'ನೌಕರದಾತ ಅಥವಾ ಗುತ್ತಿಗೆದಾರರ ಗುರುತಿಸುವಿಕೆ',
    ml: 'തൊഴിലുടമ അല്ലെങ്കിൽ കോൺട്രാക്ടർ തിരിച്ചറിഞ്ഞു',
    bn: 'নিয়োগকর্তা বা ঠিকাদার চিহ্নিত',
  },
  work_described: {
    en: 'Type or duration of work described',
    ta: 'வேலையின் வகை அல்லது கால அளவு விவரிக்கப்பட்டது',
    hi: 'काम का प्रकार या अवधि बताई गई', te: 'పని రకం లేదా వ్యవధి వివరించబడింది',
    kn: 'ಕೆಲಸದ ಪ್ರಕಾರ ಅಥವಾ ಅವಧಿ ವಿವರಿಸಲಾಗಿದೆ',
    ml: 'ജോലിയുടെ തരം അല്ലെങ്കിൽ ദൈർഘ്യം വിവരിച്ചു',
    bn: 'কাজের ধরন বা সময়কাল বর্ণনা করা হয়েছে',
  },
  nonpayment_stated: {
    en: 'Non-payment or wage theft clearly stated',
    ta: 'சம்பளம் கொடுக்காதது தெளிவாக கூறப்பட்டது',
    hi: 'वेतन न मिलने की बात स्पष्ट रूप से कही गई', te: 'వేతనం చెల్లించలేదని స్పష్టంగా చెప్పారు',
    kn: 'ವೇತನ ತಡೆಹಿಡಿದ ವಿಷಯ ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಲಾಗಿದೆ',
    ml: 'വേതനം നൽകാത്തത് വ്യക്തമായി പ്രസ്താവിച്ചു',
    bn: 'মজুরি না পাওয়ার বিষয়টি স্পষ্টভাবে উল্লেখ করা হয়েছে',
  },
  timeframe_given: {
    en: 'Timeframe of work or non-payment mentioned',
    ta: 'வேலை அல்லது சம்பளம் கொடுக்காத காலம் குறிப்பிடப்பட்டது',
    hi: 'काम या वेतन न मिलने की समय-सीमा बताई गई', te: 'పని లేదా వేతనం చెల్లించని కాల వ్యవధి పేర్కొనబడింది',
    kn: 'ಕೆಲಸದ ಅಥವಾ ವೇತನ ಬಾಕಿ ಅವಧಿ ಉಲ್ಲೇಖಿಸಲಾಗಿದೆ',
    ml: 'ജോലി ചെയ്ത കാലം അല്ലെങ്കിൽ വേതനം ലഭിക്കാത്ത കാലം പറഞ്ഞു',
    bn: 'কাজ বা বেতন না পাওয়ার সময়কাল উল্লেখ করা হয়েছে',
  },
  wage_amount_mentioned: {
    en: 'Amount of wages owed or agreed rate mentioned',
    ta: 'நிலுவையில் உள்ள சம்பள தொகை அல்லது ஒப்பந்த கட்டணம் குறிப்பிடப்பட்டது',
    hi: 'बकाया वेतन राशि या सहमत दर का उल्लेख', te: 'బకాయి వేతనం లేదా అంగీకరించిన రేటు పేర్కొనబడింది',
    kn: 'ಬಾಕಿ ವೇತನ ಮೊತ್ತ ಅಥವಾ ಒಪ್ಪಂದ ದರ ಉಲ್ಲೇಖಿಸಲಾಗಿದೆ',
    ml: 'കുടിശ്ശിക വേതന തുക അല്ലെങ്കിൽ നിശ്ചയിച്ച നിരക്ക് പറഞ்ഞு',
    bn: 'বকেয়া মজুরির পরিমাণ বা সম্মত হার উল্লেখ করা হয়েছে',
  },
  legal_category: {
    en: 'Complaint falls under a recognized legal category (wage theft, non-payment, underpayment, etc.)',
    ta: 'புகார் அங்கீகரிக்கப்பட்ட சட்ட வகையில் (சம்பள திருட்டு, கொடுக்காதது, குறைத்து கொடுத்தது) அடங்குகிறது',
    hi: 'शिकायत मान्य कानूनी श्रेणी में आती है (वेतन चोरी, वेतन न मिलना आदि)', te: 'ఫిర్యాదు గుర్తింపు పొందిన చట్ట వర్గంలో ఉంది',
    kn: 'ದೂರು ಮಾನ್ಯ ಕಾನೂನು ವರ್ಗದಡಿ ಬರುತ್ತದೆ',
    ml: 'പരാതി അംഗീകൃത നിയമ വിഭാഗത്തിൽ ഉൾപ്പെടുന്നു',
    bn: 'অভিযোগ স্বীকৃত আইনি বিভাগে পড়ে',
  },
};

const MISSING_GUIDANCE = {
  employer_identified: {
    en: "Please mention the name of your contractor, supervisor, or the construction site where you worked.",
    ta: "உங்கள் ஒப்பந்ததாரர், மேற்பார்வையாளர் அல்லது நீங்கள் வேலை செய்த கட்டிட தளத்தின் பெயரை கூறுங்கள்.",
    hi: "कृपया अपने ठेकेदार, सुपरवाइज़र या निर्माण स्थल का नाम बताएं।",
    te: "దయచేసి మీ కాంట్రాక్టర్, సూపర్‌వైజర్ లేదా మీరు పని చేసిన సైట్ పేరు చెప్పండి.",
    kn: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಗುತ್ತಿಗೆದಾರ, ಮೇಲ್ವಿಚಾರಕ ಅಥವಾ ನೀವು ಕೆಲಸ ಮಾಡಿದ ತಾಣದ ಹೆಸರು ಹೇಳಿ.",
    ml: "ദയവായി നിങ്ങളുടെ കോൺട്രാക്ടർ, സൂപ്പർവൈസർ അല്ലെങ്കിൽ ജോലി ചെയ്ത സൈറ്റിന്റെ പേര് പറയുക.",
    bn: "অনুগ্রহ করে আপনার ঠিকাদার, সুপারভাইজার বা কাজের সাইটের নাম বলুন।",
  },
  work_described: {
    en: "Please describe what work you did — for example: construction, plastering, carrying bricks, welding, etc.",
    ta: "நீங்கள் என்ன வேலை செய்தீர்கள் என்பதை விவரிக்கவும் — எடுத்துக்காட்டாக: கட்டுமானம், சாந்து வேலை, செங்கல் எடுத்துச் செல்வது.",
    hi: "कृपया बताएं कि आपने क्या काम किया — जैसे: निर्माण, प्लास्टरिंग, ईंट ढोना, वेल्डिंग आदि।",
    te: "మీరు ఏ పని చేశారో వివరించండి — ఉదాహరణకు: నిర్మాణం, ప్లాస్టరింగ్, ఇటుకలు మోయడం.",
    kn: "ನೀವು ಯಾವ ಕೆಲಸ ಮಾಡಿದ್ದೀರಿ ಎಂದು ವಿವರಿಸಿ — ಉದಾಹರಣೆಗೆ: ನಿರ್ಮಾಣ, ಪ್ಲಾಸ್ಟರಿಂಗ್, ಇಟ್ಟಿಗೆ ಹೊರುವುದು.",
    ml: "നിങ്ങൾ ചെയ്ത ജോലി വിവരിക്കുക — ഉദാഹരണം: നിർമ്മാണം, പ്ലാസ്റ്ററിംഗ്, ഇഷ്ടിക ചുമക്കൽ.",
    bn: "আপনি কী কাজ করেছেন তা বর্ণনা করুন — যেমন: নির্মাণ, প্লাস্টারিং, ইট বহন।",
  },
  nonpayment_stated: {
    en: "Please clearly say that you were not paid, underpaid, or your wages were delayed.",
    ta: "உங்களுக்கு சம்பளம் கொடுக்கவில்லை, குறைவாக கொடுத்தார்கள், அல்லது தாமதமாக கொடுத்தார்கள் என்று தெளிவாக கூறுங்கள்.",
    hi: "कृपया स्पष्ट रूप से कहें कि आपको वेतन नहीं मिला, कम मिला, या देर से मिला।",
    te: "మీకు వేతనం చెల్లించలేదు, తక్కువ చెల్లించారు, లేదా ఆలస్యంగా చెల్లించారని స్పష్టంగా చెప్పండి.",
    kn: "ನಿಮಗೆ ವೇತನ ನೀಡಲಿಲ್ಲ, ಕಡಿಮೆ ನೀಡಲಾಯಿತು, ಅಥವಾ ತಡವಾಗಿ ನೀಡಲಾಯಿತು ಎಂದು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ.",
    ml: "നിങ്ങൾക്ക് വേതനം ലഭിച്ചില്ല, കുറഞ്ഞ തുക ലഭിച്ചു, അല്ലെങ്കിൽ വൈകി ലഭിച്ചു എന്ന് വ്യക്തമായി പറയുക.",
    bn: "স্পষ্টভাবে বলুন যে আপনি মজুরি পাননি, কম পেয়েছেন, বা দেরিতে পেয়েছেন।",
  },
  timeframe_given: {
    en: "Please say how many days or weeks you worked, or when the payment was due.",
    ta: "நீங்கள் எத்தனை நாட்கள் அல்லது வாரங்கள் வேலை செய்தீர்கள், அல்லது எப்போது சம்பளம் கொடுக்க வேண்டும் என்று சொல்லுங்கள்.",
    hi: "कृपया बताएं कि आपने कितने दिन या हफ्ते काम किया, या वेतन कब देना था।",
    te: "మీరు ఎన్ని రోజులు లేదా వారాలు పని చేశారు, లేదా వేతనం ఎప్పుడు ఇవ్వాలి అని చెప్పండి.",
    kn: "ನೀವು ಎಷ್ಟು ದಿನ ಅಥವಾ ವಾರ ಕೆಲಸ ಮಾಡಿದ್ದೀರಿ, ಅಥವಾ ವೇತನ ಯಾವಾಗ ನೀಡಬೇಕಿತ್ತು ಎಂದು ಹೇಳಿ.",
    ml: "നിങ്ങൾ എത്ര ദിവസം അല്ലെങ്കിൽ ആഴ്ച ജോലി ചെയ്തു, അല്ലെങ്കിൽ വേതനം എപ്പോൾ ലഭിക്കണം എന്ന് പറയുക.",
    bn: "আপনি কত দিন বা সপ্তাহ কাজ করেছেন, বা বেতন কখন দেওয়ার কথা ছিল তা বলুন।",
  },
};

export async function POST(request) {
  try {
    const { transcript, englishTranscript, typedComplaint, language } = await request.json();

    if (!transcript && !typedComplaint) {
      return NextResponse.json({ error: 'Either voice transcript or typed complaint is required.' }, { status: 400 });
    }

    const lang = (language || 'en').toLowerCase();
    
    const combinedOriginal = transcript ? (typedComplaint ? `${typedComplaint}\n\nVoice: ${transcript}` : transcript) : typedComplaint;
    const combinedEnglish = (englishTranscript || transcript) ? (typedComplaint ? `${typedComplaint}\n\nVoice: ${englishTranscript || transcript}` : (englishTranscript || transcript)) : typedComplaint;

    // ── LLM Validation ────────────────────────────────────────────────────
    let validation = null;

    if (GROQ_API_KEY) {
      try {
        validation = await validateWithLLM(combinedOriginal, combinedEnglish);
      } catch (err) {
        console.error('[validateComplaint] LLM failed:', err.message);
      }
    }

    // Fallback: basic keyword validation
    if (!validation) {
      validation = basicValidation(combinedEnglish);
    }

    // Score threshold: 4+ out of 6 = valid
    const isValid = validation.score >= 4;
    const missingFields = Object.entries(validation.fields)
      .filter(([, v]) => !v)
      .map(([key]) => ({
        key,
        label: FIELD_LABELS[key]?.[lang] || FIELD_LABELS[key]?.en || key,
        guidance: MISSING_GUIDANCE[key]?.[lang] || MISSING_GUIDANCE[key]?.en || '',
      }));

    const presentFields = Object.entries(validation.fields)
      .filter(([, v]) => v)
      .map(([key]) => FIELD_LABELS[key]?.[lang] || FIELD_LABELS[key]?.en || key);

    // Human-readable reason in worker's language
    const reason = buildReason(isValid, validation.score, missingFields, lang);

    return NextResponse.json({
      isValid,
      score: validation.score,
      maxScore: 6,
      fields: validation.fields,
      presentFields,
      missingFields,
      reason,
      llmSummary: validation.summary || null,
    });

  } catch (err) {
    console.error('[validateComplaint] Error:', err);
    return NextResponse.json({ error: 'Validation failed. Please try again.' }, { status: 500 });
  }
}

// ── LLM Validation ─────────────────────────────────────────────────────────

async function validateWithLLM(originalText, englishText) {
  const systemPrompt = `You are a senior Indian labour law expert evaluating whether a worker's spoken statement constitutes a legally filable wage complaint under the Payment of Wages Act 1936, Code on Wages 2019, or BOCW Act 1996.

Evaluate the statement and return a JSON object with EXACTLY this schema:
{
  "fields": {
    "employer_identified": true/false,
    "work_described": true/false,
    "nonpayment_stated": true/false,
    "timeframe_given": true/false,
    "wage_amount_mentioned": true/false,
    "legal_category": true/false
  },
  "score": <integer 0-6, sum of true fields>,
  "summary": "<one sentence English summary of the complaint>"
}

Field definitions:
- employer_identified: Any mention of contractor, supervisor, employer, company, or construction site
- work_described: Any mention of type of work (construction, labour, etc.) or duration
- nonpayment_stated: Explicit mention that wages/salary/payment was NOT given, delayed, or reduced
- timeframe_given: Any mention of number of days/weeks/months worked, or date payment was due
- wage_amount_mentioned: Any specific amount (₹, rupees) or rate mentioned
- legal_category: The complaint is about wage theft, underpayment, or non-payment (not a general grievance)

Output ONLY the JSON. No markdown, no explanation.`;

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Original: "${originalText}"\nEnglish: "${englishText}"` },
      ],
      temperature: 0.0,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content.trim());
}

// ── Basic keyword fallback ─────────────────────────────────────────────────

function basicValidation(text) {
  const t = text.toLowerCase();
  const fields = {
    employer_identified: /contractor|employer|supervisor|manager|sir|seth|boss|site|company|builder/i.test(t),
    work_described: /work|labour|labor|construction|build|bricks|cement|plaster|weld|paint|days|weeks|months/i.test(t),
    nonpayment_stated: /not paid|didn.t pay|no pay|wages|salary|money|payment|due|owe|unpaid|underpaid/i.test(t),
    timeframe_given: /\d+\s*(day|week|month|hour)|last week|this month|past|since|from|ago/i.test(t),
    wage_amount_mentioned: /₹|\brupe|\bamount|\brate|\bper day|\bsalary|\bwage/i.test(t),
    legal_category: /wage|salary|pay|payment|dues|labour|labor|worker|employment/i.test(t),
  };
  const score = Object.values(fields).filter(Boolean).length;
  return { fields, score, summary: null };
}

// ── Build human-readable reason ────────────────────────────────────────────

function buildReason(isValid, score, missingFields, lang) {
  const reasons = {
    valid: {
      en: `Great! Your complaint has ${score} out of 6 key details and qualifies for filing.`,
      ta: `நல்லது! உங்கள் புகாரில் 6 இல் ${score} முக்கிய விவரங்கள் உள்ளன. புகார் அளிக்கலாம்.`,
      hi: `बहुत अच्छा! आपकी शिकायत में ${score} में से 6 मुख्य जानकारियाँ हैं। यह दर्ज करने योग्य है।`,
      te: `బాగుంది! మీ ఫిర్యాదులో 6 లో ${score} ముఖ్యమైన వివరాలు ఉన్నాయి.`,
      kn: `ಉತ್ತಮ! ನಿಮ್ಮ ದೂರಿನಲ್ಲಿ 6 ರಲ್ಲಿ ${score} ಪ್ರಮುಖ ವಿವರಗಳಿವೆ.`,
      ml: `നല്ലത്! നിങ്ങളുടെ പരാതിയിൽ 6 ൽ ${score} പ്രധാന വിവരങ്ങൾ ഉണ്ട്.`,
      bn: `দারুণ! আপনার অভিযোগে ৬ এর মধ্যে ${score}টি মূল তথ্য রয়েছে।`,
    },
    invalid: {
      en: `Your complaint has ${score} out of 6 details. We need ${4 - score} more details to file it.`,
      ta: `உங்கள் புகாரில் 6 இல் ${score} விவரங்கள் மட்டுமே உள்ளன. புகார் அளிக்க இன்னும் ${4 - score} விவரங்கள் தேவை.`,
      hi: `आपकी शिकायत में ${score} में से ${score} जानकारियाँ हैं। दर्ज करने के लिए ${4 - score} और जानकारी चाहिए।`,
      te: `మీ ఫిర్యాదులో 6 లో ${score} వివరాలు మాత్రమే ఉన్నాయి. దాఖలు చేయడానికి ${4 - score} అదనపు వివరాలు అవసరం.`,
      kn: `ನಿಮ್ಮ ದೂರಿನಲ್ಲಿ 6 ರಲ್ಲಿ ${score} ವಿವರಗಳಿವೆ. ದಾಖಲಿಸಲು ${4 - score} ಹೆಚ್ಚಿನ ವಿವರಗಳು ಬೇಕು.`,
      ml: `നിങ്ങളുടെ പരാതിയിൽ 6 ൽ ${score} വിവരങ്ങൾ മാത്രമേ ഉള്ളൂ. ഫയൽ ചെയ്യാൻ ${4 - score} കൂടുതൽ വിവരങ്ങൾ വേണം.`,
      bn: `আপনার অভিযোগে ৬ এর মধ্যে ${score}টি তথ্য রয়েছে। দাখিল করতে আরও ${4 - score}টি তথ্য প্রয়োজন।`,
    },
  };

  return (isValid ? reasons.valid : reasons.invalid)[lang] ||
         (isValid ? reasons.valid : reasons.invalid).en;
}
