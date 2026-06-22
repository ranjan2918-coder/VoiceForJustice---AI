const fs = require('fs');

const missingTop = `'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { speakText, stopSpeaking, startRecording as startRecordingAction, stopRecording as stopRecordingAction } from '@/lib/kioskUtils';

const LANGUAGES = [
  { code: 'ta', native: 'தமிழ்', label: 'Tamil', symbol: 'த', color: '#ec4899' },
  { code: 'hi', native: 'हिन्दी', label: 'Hindi', symbol: 'हि', color: '#f97316' },
  { code: 'te', native: 'తెలుగు', label: 'Telugu', symbol: 'తె', color: '#8b5cf6' },
  { code: 'kn', native: 'ಕನ್ನಡ', label: 'Kannada', symbol: 'ಕ', color: '#eab308' },
  { code: 'ml', native: 'മലയാളം', label: 'Malayalam', symbol: 'മ', color: '#14b8a6' },
  { code: 'bn', native: 'বাংলা', label: 'Bengali', symbol: 'বা', color: '#3b82f6' },
  { code: 'en', native: 'English', label: 'English', symbol: 'E', color: '#64748b' },
];

const PROMPTS = {
  greeting: {
    ta: "வாய்ஸ் ஃபார் ஜஸ்டிஸ்-க்கு வரவேற்கிறோம். இந்த இணையதளம் உங்கள் சம்பளப் பிரச்சினைகளுக்கு உதவி கேட்கப் பயன்படுகிறது.",
    hi: "वॉयस फॉर जस्टिस में आपका स्वागत है। यह वेबसाइट आपको वेतन समस्याओं के लिए मदद मांगने में सहायता करती है।",
    te: "వాయిస్ ఫర్ జస్టిస్‌కు స్వాగతం. మీ జీతాల సమస్యలకు సహాయం కోరడానికి ఈ వెబ్‌సైట్ ఉపయోగపడుతుంది.",
    kn: "ವಾಯ್ಸ್ ಫಾರ್ ಜಸ್ಟಿಸ್‌ಗೆ ಸ್ವಾಗತ. ನಿಮ್ಮ ವೇತನದ ಸಮಸ್ಯೆಗಳಿಗೆ ಸಹಾಯ ಕೇಳಲು ಈ ವೆಬ್‌ಸೈಟ್ ಬಳಸಬಹುದು.",
    ml: "വോയ്സ് ഫോർ ജസ്റ്റിസിലേക്ക് സ്വാഗതം. നിങ്ങളുടെ വേതന പ്രശ്നങ്ങൾക്ക് സഹായം തേടാൻ ഈ വെബ്സൈറ്റ് ഉപകരിക്കും.",
    bn: "ভয়েস ফর জাস্টিসে স্বাগতম। এই ওয়েবসাইট আপনার মজুরি সমস্যার জন্য সাহায্য চাইতে ব্যবহার করা হয়।",
    en: "Welcome to Voice for Justice. This website helps you ask for help with wage problems."
  },
  record: {
    ta: "புகார் அளிக்க பெரிய மைக் பட்டனை அழுத்திப் பேசவும். பேசி முடித்ததும் நிறுத்து பட்டனை அழுத்தவும்.",
    hi: "शिकायत दर्ज करने के लिए बड़ा माइक बटन दबाएं और बोलें। बोलने के बाद रोकें बटन दबाएं।",
    te: "ఫిర్యాదు చేయడానికి పెద్ద మైక్ బటన్ నొక్కి మాట్లాడండి. మాట్లాడిన తర్వాత ఆపు బటన్ నొక్కండి.",
    kn: "ದೂರು ನೀಡಲು ದೊಡ್ಡ ಮೈಕ್ ಬಟನ್ ಒತ್ತಿ ಮಾತನಾಡಿ. ಮಾತನಾಡಿದ ನಂತರ ನಿಲ್ಲಿಸು ಬಟನ್ ಒತ್ತಿ.",
    ml: "പരാതി നൽകാൻ വലിയ മൈക്ക് ബട്ടൺ അമർത്തി സംസാരിക്കുക. സംസാരിച്ച ശേഷം നിർത്തുക ബട്ടൺ അമർത്തുക.",
    bn: "অভিযোগ করতে বড় মাইক বোতাম টিপে কথা বলুন। কথা বলা শেষ হলে থামার বোতাম টিপুন।",
    en: "Press the big mic button to speak your complaint. Press stop when done."
  }
};

export default function KioskPage() {
  const [screen, setScreen] = useState('language');
  const [statusMode, setStatusMode] = useState(null);
  const [language, setLanguage] = useState('en');
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [error, setError] = useState('');
  const [transcriptResult, setTranscriptResult] = useState({ transcript: '', english: '' });
  const [loading, setLoading] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [complaintIdInput, setComplaintIdInput] = useState('');
  const [newComplaintId, setNewComplaintId] = useState(null);
  const [newComplaintSummary, setNewComplaintSummary] = useState('');
  const [rightsInfo, setRightsInfo] = useState([]);
  const [micDenied, setMicDenied] = useState(false);

  const timerRef = useRef(null);

  // t helper
  const t = (key) => {
    const dict = {
      micDenied: { en: 'Microphone Access Denied' },
      micDeniedBody: { en: 'Please allow microphone access in your browser settings to use voice features.' },
      repeatAudio: { en: 'Repeat Audio' },
      skip: { en: 'Skip' },
      fileComplaint: { en: 'File Wage Complaint' },
      checkStatus: { en: 'Check Complaint Status' },
      knowRights: { en: 'Know Your Rights' },
      startRec: { en: 'Press to Start' },
      stopRec: { en: 'Press to Stop' },
      processing: { en: 'Processing...' },
      yourTranscript: { en: 'Your Transcript' },
      englishVersion: { en: 'English Version' },
      submit: { en: 'Submit' },
      tryAgain: { en: 'Try Again' },
      submitted: { en: 'Submitted!' },
      writeDown: { en: 'Please write down this number:' },
      playSummary: { en: 'Play my complaint summary' },
      explainNextSteps: { en: 'Explain next steps' },
      goHome: { en: 'Return to Main Menu' },
      statusTitle: { en: 'Check Status' },
      clear: { en: 'Clear' },
      rightsTitle: { en: 'Know Your Rights' },
      playAudio: { en: 'Play Audio' },
      back: { en: 'Back' },
      changeLang: { en: 'Change Language' }
    };
    return dict[key]?.[language] ?? dict[key]?.en ?? key;
  };

  const fmtTime = (s) => \`\${Math.floor(s/60)}:\${(s%60).toString().padStart(2,'0')}\`;

  const selectLanguage = (code) => {
    setLanguage(code);
    setScreen('greeting');
    speakText(PROMPTS.greeting[code] || PROMPTS.greeting.en, code);
  };

  const changeLanguage = () => {
    stopSpeaking();
    setScreen('language');
  };

  const replayNarration = () => {
    if (screen === 'greeting') speakText(PROMPTS.greeting[language] ?? PROMPTS.greeting.en, language);
    else if (screen === 'record') speakText(PROMPTS.record[language] ?? PROMPTS.record.en, language);
    else playContextualHelp();
  };

  const resetRecordingState = () => {
    setRecording(false);
    setRecordSeconds(0);
    setError('');
    clearInterval(timerRef.current);
  };

  const startRecording = async () => {
    resetRecordingState();
    try {
      await startRecordingAction();
      setRecording(true);
      timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch (err) {
      if (err.name === 'NotAllowedError') setMicDenied(true);
      else setError('Mic error: ' + err.message);
    }
  };

  const stopRecording = async () => {
    clearInterval(timerRef.current);
    setRecording(false);
    setScreen('transcribing');
    try {
      const audioBlob = await stopRecordingAction();
      const formData = new FormData();
      formData.append('audio', audioBlob, 'complaint.webm');
      formData.append('language', language);

      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.transcript) {
        setTranscriptResult({ transcript: data.transcript, english: data.english });
        setScreen('transcript_preview');
      } else {
        setError(data.error || 'Transcription failed');
        setScreen('record');
      }
    } catch (e) {
      setError(e.message);
      setScreen('record');
    }
  };

  const submitComplaint = async () => {
    setLoading(true);
    setScreen('submitting');
    try {
      const res = await fetch('/api/createComplaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          originalTranscript: transcriptResult.transcript,
          englishTranscript: transcriptResult.english
        })
      });
      const data = await res.json();
      if (data.id) {
        setNewComplaintId(data.id);
        setNewComplaintSummary(data.workerSummaryLocal);
        setScreen('submitted');
        
        const spokenId = data.id.split('').join(' ');
        const tpl = {
          ta: \`உங்கள் புகார் பதிவானது. புகார் எண் \${spokenId}. சுருக்கம்: \${data.workerSummaryLocal}\`,
          hi: \`शिकायत दर्ज। नंबर है \${spokenId}। विवरण: \${data.workerSummaryLocal}\`,
          te: \`ఫిర్యాదు నమోదైంది. నంబర్ \${spokenId}. సారాంశం: \${data.workerSummaryLocal}\`,
          kn: \`ದೂರು ಸಲ್ಲಿಕೆಯಾಗಿದೆ. ಸಂಖ್ಯೆ \${spokenId}. ವಿವರ: \${data.workerSummaryLocal}\`,
          ml: \`പരാതി ഫയൽ ചെയ്തു. നമ്പർ \${spokenId}. ചുരുക്കം: \${data.workerSummaryLocal}\`,
          bn: \`অভিযোগ নথিভুক্ত হয়েছে। নম্বর \${spokenId}। সারাংশ: \${data.workerSummaryLocal}\`,
          en: \`Complaint submitted. Number is \${spokenId}. Summary: \${data.workerSummaryLocal}\`,
        };
        speakText(tpl[language] ?? tpl.en, language);
      } else {
        throw new Error("Missing ID in response");
      }
    } catch (e) {
      console.error(e);
      setScreen('transcript_preview');
      alert("Submission failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const playComplaintSummary = () => {
    if (!newComplaintSummary) return;
    speakText(newComplaintSummary, language);
  };

  const playNextSteps = () => {
    const scripts = {
      ta: "அடுத்தது: தொழிலாளர் அதிகாரி உங்கள் புகாரை ஆய்வு செய்வார். தேவைப்பட்டால் உங்களை தொடர்புகொள்வார்.",
      hi: "अगला कदम: अधिकारी आपकी शिकायत की समीक्षा करेंगे। आवश्यकता पड़ने पर संपर्क करेंगे।",
      te: "తదుపరి: అధికారి మీ ఫిర్యాదును పరిశీలిస్తారు. అవసరమైతే మిమ్మల్ని సంప్రదిస్తారు.",
      kn: "ಮುಂದಿನ ಹಂತ: ಅಧಿಕಾರಿ ನಿಮ್ಮ ದೂರನ್ನು ಪರಿಶೀಲಿಸುತ್ತಾರೆ. ಅಗತ್ಯವಿದ್ದರೆ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತಾರೆ.",
      ml: "അടുത്തത്: ഉദ്യോഗസ്ഥൻ പരാതി പരിശോധിക്കും. ആവശ്യമെങ്കിൽ ബന്ധപ്പെടും.",
      bn: "পরবর্তী পদক্ষেপ: কর্মকর্তা আপনার অভিযোগ পরীক্ষা করবেন। দরকার হলে যোগাযোগ করবেন।",
      en: "Next steps: A labor officer will review your complaint and contact you if needed."
    };
    speakText(scripts[language] ?? scripts.en, language);
  };
`;

const currentFile = fs.readFileSync('src/app/page.js', 'utf8');
fs.writeFileSync('src/app/page.js', missingTop + '\n' + currentFile, 'utf8');
console.log('Restored the missing top half of page.js!');
