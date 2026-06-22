'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { speakText, stopSpeaking, AudioRecorder } from '@/lib/kioskUtils';

const LANGUAGES = [
  { code: 'ta', native: 'தமிழ்',   label: 'Tamil',     symbol: 'த',  color: '#ec4899' },
  { code: 'hi', native: 'हिन्दी',  label: 'Hindi',     symbol: 'हि', color: '#f97316' },
  { code: 'te', native: 'తెలుగు',  label: 'Telugu',    symbol: 'తె', color: '#8b5cf6' },
  { code: 'kn', native: 'ಕನ್ನಡ',   label: 'Kannada',   symbol: 'ಕ',  color: '#eab308' },
  { code: 'ml', native: 'മലയാളം', label: 'Malayalam', symbol: 'മ',  color: '#14b8a6' },
  { code: 'bn', native: 'বাংলা',  label: 'Bengali',   symbol: 'বা', color: '#3b82f6' },
  { code: 'en', native: 'English', label: 'English',   symbol: 'E',  color: '#64748b' },
];

const UI = {
  mainMenu:       { ta:'முதன்மை மெனு',    hi:'मुख्य मेनू',     te:'ప్రధాన మెనూ',    kn:'ಮುಖ್ಯ ಮೆನು',     ml:'ഹോം',           bn:'প্রধান মেনু',   en:'Main Menu' },
  fileComplaint:  { ta:'சம்பள புகார் பதிவு', hi:'वेतन शिकायत दर्ज', te:'జీత ఫిర్యాదు',   kn:'ವೇತನ ದೂರು',     ml:'ശമ്പള പരാതി',   bn:'মজুরি অভিযোগ', en:'File Wage Complaint' },
  checkStatus:    { ta:'புகார் நிலை', hi:'शिकायत की स्थिति', te:'ఫిర్యాదు స్థితి', kn:'ದೂರಿನ ಸ್ಥಿತಿ', ml:'പരാതി നില',    bn:'অভিযোগের অবস্থা', en:'Check Status' },
  knowRights:     { ta:'உரிமைகள்',   hi:'आपके अधिकार',   te:'హక్కులు',        kn:'ಹಕ್ಕುಗಳು',       ml:'അവകാശങ്ങൾ',    bn:'আপনার অধিকার', en:'Know Your Rights' },
  evidenceHub:    { ta:'சான்று உருவாக்கு', hi:'साक्ष्य बनाएँ', te:'సాక్ష్యం సృష్టించు',    kn:'ಸಾಕ್ಷ್ಯ ರಚಿಸಿ', ml:'തെളിവ് ഉണ്ടാക്കുക', bn:'প্রমাণ তৈরি করুন', en:'Create Evidence' },
  addRecording:   { ta:'அழைப்பு பதிவு கோப்புகளைச் சேர்', hi:'कॉल रिकॉर्डिंग फ़ाइलें जोड़ें', te:'కాల్ రికార్డింగ్ ఫైల్‌లను జోడించండి', kn:'ಕರೆ ರೆಕಾರ್ಡಿಂಗ್ ಫೈಲ್‌ಗಳನ್ನು ಸೇರಿಸಿ', ml:'കോൾ റെക്കോർഡിംഗ് ഫയലുകൾ ചേർക്കുക', bn:'কল রেকর্ডিং ফাইল যোগ করুন', en:'Add Call Recording Files' },
  addWitness:     { ta:'சாட்சி பதிவு',  hi:'गवाह जोड़ें',   te:'సాక్షి నమోదు',    kn:'ಸಾಕ್ಷಿ ನೋಂದಣಿ', ml:'സാക്ഷി ചേർക്കുക', bn:'সাক্ষী যোগ করুন', en:'Add Witness' },
  addPhoto:       { ta:'புகைப்படம் எடு', hi:'फोटो लें', te:'ఫోటో తీయండి', kn:'ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ', ml:'ഫോട്ടോ എടുക്കുക', bn:'ছবি তুলুন', en:'Take Site Photo with Location' },
  back:           { ta:'திரும்பு',       hi:'वापस',           te:'వెనక్కి',         kn:'ಹಿಂದೆ',          ml:'തിരിച്ചു',      bn:'ফিরে যান',     en:'Back' },
  changeLang:     { ta:'மொழி மாற்று',   hi:'भाषा बदलें',    te:'భాష మార్చు',      kn:'ಭಾಷೆ ಬದಲಿಸಿ',   ml:'ഭാഷ മാറ്റുക',  bn:'ভাষা পরিবর্তন', en:'Change Language' },
  submit:         { ta:'சமர்ப்பி',      hi:'जमा करें',      te:'సమర్పించు',       kn:'ಸಲ್ಲಿಸು',        ml:'സമർപ്പിക്കുക', bn:'জমা দিন',      en:'Submit' },
  tryAgain:       { ta:'மீண்டும் முயற்சி', hi:'फिर कोशिश करें', te:'మళ్ళీ ప్రయత్నించు', kn:'ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ', ml:'വീണ്ടും ശ്രമിക്കുക', bn:'আবার চেষ্টা করুন', en:'Try Again' },
  processing:     { ta:'செயல்படுத்துகிறோம்…', hi:'प्रक्रिया हो रही है…', te:'ప్రాసెస్ అవుతోంది…', kn:'ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ…', ml:'പ്രോസസ്സ് ചെയ്യുന്നു…', bn:'প্রক্রিয়া চলছে…', en:'Processing…' },
  validating:     { ta:'புகார் சரிபார்க்கிறோம்…', hi:'शिकायत जाँची जा रही है…', te:'ఫిర్యాదు ధృవీకరిస్తున్నారు…', kn:'ದೂರು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…', ml:'പരാതി പരിശോധിക്കുന്നു…', bn:'অভিযোগ যাচাই করা হচ্ছে…', en:'Validating complaint…' },
  goHome:         { ta:'முகப்புக்கு திரும்பு', hi:'मुख्य पृष्ठ',  te:'హోమ్‌కు వెళ్ళు',  kn:'ಮನೆಗೆ ಹೋಗಿ',    ml:'ഹോമിലേക്ക്',   bn:'হোমে যান',    en:'Go Home' },
  repeatAudio:    { ta:'மீண்டும் கேளுங்கள்', hi:'दोबारा सुनें', te:'మళ్ళీ వినండి', kn:'ಮತ್ತೆ ಕೇಳಿ', ml:'വീണ്ടും കേൾക்குക', bn:'আবার শুনুন', en:'Repeat Audio' },
};

const t = (key, lang) => UI[key]?.[lang] ?? UI[key]?.en ?? key;

let globalRecorder = null;
const startRec = async () => { globalRecorder = new AudioRecorder(); await globalRecorder.start(); };
const stopRec  = async () => { if (!globalRecorder) return null; const b = await globalRecorder.stop(); globalRecorder = null; return b; };
const cancelRec = () => { if (globalRecorder) { globalRecorder.cancel(); globalRecorder = null; } };

const fmtTime = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

export default function KioskPage() {
  const [screen,            setScreen]            = useState('landing');
  const [language,          setLanguage]          = useState('en');
  const [recording,         setRecording]         = useState(false);
  const [recSecs,           setRecSecs]           = useState(0);
  const [error,             setError]             = useState('');
  const [loading,           setLoading]           = useState(false);
  const [micDenied,         setMicDenied]         = useState(false);

  // Complaint flow
  const [transcript,        setTranscript]        = useState({ original: '', english: '' });
  const [typedComplaint,    setTypedComplaint]    = useState('');
  const [validation,        setValidation]        = useState(null); // { isValid, score, reason, missingFields, presentFields }
  const [newComplaintId,    setNewComplaintId]     = useState(null);
  const [newSummary,        setNewSummary]        = useState('');

  // Evidence flow
  const [evidenceComplaintId, setEvidenceComplaintId] = useState('');
  const [audioFile,           setAudioFile]           = useState(null);
  const [recordingType,       setRecordingType]       = useState(null); // 'call_recording' or 'voice_recording'
  const [audioNote,           setAudioNote]           = useState('');
  const [witnessName,         setWitnessName]          = useState('');
  const [witnessPhone,        setWitnessPhone]         = useState('');
  const [witnessRelation,     setWitnessRelation]      = useState('co-worker on same site');
  const [witnessDuration,     setWitnessDuration]      = useState('3-12 months');
  const [witnessSameSite,     setWitnessSameSite]      = useState('Yes');
  const [complaintMode,       setComplaintMode]        = useState(null);
  const [validationStatus,    setValidationStatus]     = useState('Skipped');
  const [contractorName,      setContractorName]       = useState('');
  const [companyName,         setCompanyName]          = useState('');
  const [siteLocation,        setSiteLocation]         = useState('');
  const [witnessContractor,   setWitnessContractor]    = useState('');
  const [witnessDone,         setWitnessDone]          = useState(null);
  const [selectedWitness,     setSelectedWitness]      = useState(null);
  const [viewWitnessMode,     setViewWitnessMode]      = useState('details'); // 'details' | 'evidence'
  const [isCameraActive,      setIsCameraActive]       = useState(false);
  const [gpsCoords,           setGpsCoords]            = useState(null);
  const [photoBlob,           setPhotoBlob]            = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Status flow
  const [statusInputText,   setStatusInputText]   = useState('');
  const [activeComplaint,   setActiveComplaint]   = useState(null);

  // Rights flow
  const [rightsInfo,        setRightsInfo]        = useState([]);

  const timerRef = useRef(null);

  // ── Recording helpers ──────────────────────────────────────────────────────
  const beginRecording = async () => {
    clearInterval(timerRef.current);
    setRecSecs(0); setError('');
    try {
      await startRec();
      setRecording(true);
      timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000);
    } catch (err) {
      if (err.name === 'NotAllowedError') setMicDenied(true);
      else setError('Mic error: ' + err.message);
    }
  };

  const endRecording = async () => {
    clearInterval(timerRef.current);
    setRecording(false);
    return await stopRec();
  };

  // ── Language selection ─────────────────────────────────────────────────────
  const selectLanguage = lang => {
    setLanguage(lang);
    setScreen('hub');
    const greetings = {
      ta:"வாய்ஸ் ஃபார் ஜஸ்டிஸ்-க்கு வரவேற்கிறோம். சம்பளப் பிரச்சினைகளுக்கு உதவி கேட்கலாம்.",
      hi:"वॉयस फॉर जस्टिस में आपका स्वागत है। वेतन समस्याओं के लिए मदद लें।",
      te:"వాయిస్ ఫర్ జస్టిస్‌కు స్వాగతం. జీతాల సమస్యలకు సహాయం కోరండి.",
      kn:"ವಾಯ್ಸ್ ಫಾರ್ ಜಸ್ಟಿಸ್‌ಗೆ ಸ್ವಾಗತ. ವೇತನ ಸಮಸ್ಯೆಗಳಿಗೆ ಸಹಾಯ ಪಡೆಯಿರಿ.",
      ml:"വോയ്സ് ഫോർ ജസ്റ്റിസിലേക്ക് സ്വാഗതം. വേതന പ്രശ്നങ്ങൾക്ക് സഹായം ലഭിക്കും.",
      bn:"ভয়েস ফর জাস্টিসে স্বাগতম। মজুরি সমস্যার জন্য সাহায্য নিন।",
      en:"Welcome to Voice for Justice. Get help with wage problems."
    };
    speakText(greetings[lang] || greetings.en, lang);
  };

  const goToHub = () => {
    cancelRec(); clearInterval(timerRef.current);
    setRecording(false); setRecSecs(0); setError('');
    setTranscript({ original:'', english:'' }); setValidation(null);
    stopSpeaking(); setScreen('hub');
  };

  // ── COMPLAINT FLOW ─────────────────────────────────────────────────────────

  const startComplaintModeSelection = () => {
    setScreen('complaint_mode_choice');
    const msg = {
      ta: "உங்கள் புகாரை எவ்வாறு பதிவு செய்ய விரும்புகிறீர்கள் என்பதைத் தேர்வு செய்யவும். நீங்கள் பேசலாம் அல்லது தட்டச்சு செய்யலாம். ஏதேனும் ஒன்று மட்டுமே தேவை.",
      hi: "चुनें कि आप अपनी शिकायत कैसे दर्ज करना चाहते हैं। आप बोल सकते हैं या टाइप कर सकते हैं। केवल एक की आवश्यकता है।",
      en: "Choose how you want to file your complaint. You can speak or type. Only one is needed."
    };
    speakText(msg[language] || msg.en, language);
  };

  const startComplaintRecording = (mode) => {
    setComplaintMode(mode);
    setScreen('record');
    const prompts = {
      ta: mode === 'voice' ? "மைக் பட்டனை அழுத்திப் பேசுங்கள். உங்கள் ஒப்பந்ததாரர் பெயர், வேலை செய்த இடம், எத்தனை நாட்கள், எவ்வளவு சம்பளம் கொடுக்கவில்லை என்று சொல்லுங்கள்." : "உங்கள் புகாரை கீழே தட்டச்சு செய்யவும்.",
      hi: mode === 'voice' ? "माइक बटन दबाएं और बोलें। अपने ठेकेदार का नाम, काम की जगह, कितने दिन काम किया, कितना वेतन नहीं मिला — यह सब बताएं।" : "कृपया अपनी शिकायत नीचे टाइप करें।",
      en: mode === 'voice' ? "Press the mic button and speak. Tell us your contractor's name, work site, how many days you worked, and how much wages you were not paid." : "Please type your complaint below."
    };
    speakText(prompts[language] || prompts.en, language);
  };

  const validateSiteContractor = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/validateEmployerSite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractorName, companyName, siteLocation })
      });
      const data = await res.json();
      if (data.match) {
        setValidationStatus('Yes');
        const msg = {
          ta: "ஒப்பந்ததாரர் அல்லது தளம் பொருந்துகிறது.",
          hi: "ठेकेदार या साइट का मिलान हुआ।",
          en: "Contractor or site matched."
        };
        speakText(msg[language] || msg.en, language);
      } else {
        setValidationStatus('Not found');
        const msg = {
          ta: "சரிபார்க்க முடியவில்லை. நீங்கள் இன்னும் தொடரலாம்.",
          hi: "सत्यापित नहीं कर सका। आप अभी भी जारी रख सकते हैं।",
          en: "Could not verify. You can still continue."
        };
        speakText(msg[language] || msg.en, language);
      }
    } catch(err) {
      setValidationStatus('Not found');
    } finally {
      setLoading(false);
    }
  };

  const handleStopComplaintRecording = async () => {
    const audioBlob = await endRecording();
    
    if (!audioBlob && !typedComplaint.trim()) {
      const msg = {
        ta: "தயவுசெய்து உங்கள் புகாரை பேசவோ தட்டச்சு செய்யவோ வேண்டும். அவற்றில் ஒன்று போதுமானது.",
        hi: "कृपया या तो अपनी शिकायत बोलें या टाइप करें। उनमें से एक पर्याप्त है।",
        en: "Please either speak your complaint or type it. One of them is enough."
      };
      setError(msg[language] || msg.en);
      speakText(msg[language] || msg.en, language);
      return;
    }

    if (audioBlob) {
      setScreen('transcribing');
      try {
        const fd = new FormData();
        fd.append('audio', audioBlob, 'complaint.webm');
        fd.append('language', language);
        const res  = await fetch('/api/transcribe', { method:'POST', body:fd });
        const data = await res.json();
        if (!data.transcript && !typedComplaint.trim()) { setError(data.error || 'Could not hear you.'); setScreen('record'); return; }
        setTranscript({ original: data.transcript || '', english: data.english || '' });
        await validateComplaint(data.transcript || '', data.english || '', typedComplaint);
      } catch (e) { setError(e.message); setScreen('record'); }
    } else {
      setScreen('validating');
      setTranscript({ original: '', english: '' });
      await validateComplaint('', '', typedComplaint);
    }
  };

  const validateComplaint = async (orig, eng, typed) => {
    setScreen('validating');
    try {
      const res  = await fetch('/api/validateComplaint', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ transcript: orig, englishTranscript: eng, typedComplaint: typed, language }),
      });
      const data = await res.json();
      setValidation(data);
      if (data.isValid) {
        setScreen('validation_success');
        speakText(data.reason, language);
      } else {
        setScreen('validation_fail');
        speakText(data.reason, language);
      }
    } catch (e) {
      // On error, allow submission anyway
      setValidation({ isValid:true, score:6, reason:'', missingFields:[], presentFields:[] });
      setScreen('validation_success');
    }
  };

  const submitComplaint = async () => {
    setLoading(true); setScreen('submitting');
    try {
      const res  = await fetch('/api/createComplaint', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ language, originalTranscript: transcript.original, englishTranscript: transcript.english, typedComplaint }),
      });
      const data = await res.json();
      if (data.id) {
        setNewComplaintId(data.id);
        setNewSummary(data.workerSummaryLocal);
        setEvidenceComplaintId(data.id);
        setScreen('submitted');
        const spokenId = data.id.split('').join(' ');
        const msg = {
          ta:`புகார் பதிவானது. எண்: ${spokenId}. ${data.workerSummaryLocal}`,
          hi:`शिकायत दर्ज। नंबर: ${spokenId}। ${data.workerSummaryLocal}`,
          te:`ఫిర్యాదు నమోదైంది. నంబర్: ${spokenId}. ${data.workerSummaryLocal}`,
          kn:`ದೂರು ಸಲ್ಲಿಕೆ. ಸಂಖ್ಯೆ: ${spokenId}. ${data.workerSummaryLocal}`,
          ml:`പരാതി ഫയൽ ചെയ്തു. നമ്പർ: ${spokenId}. ${data.workerSummaryLocal}`,
          bn:`অভিযোগ নথিভুক্ত। নম্বর: ${spokenId}। ${data.workerSummaryLocal}`,
          en:`Complaint submitted. Number: ${spokenId}. ${data.workerSummaryLocal}`,
        };
        speakText(msg[language] || msg.en, language);
      } else throw new Error('No ID returned');
    } catch (e) { console.error(e); setScreen('validation_success'); alert('Submission failed. Try again.'); }
    finally { setLoading(false); }
  };

  const verifyComplaintForEvidence = async () => {
    if (!evidenceComplaintId.trim()) {
      setError('Please enter a complaint number.');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/checkStatus?id=${encodeURIComponent(evidenceComplaintId.trim())}`);
      const data = await res.json();
      if (data.error || !data.complaint) {
        const msg = {
          ta: "இந்த எண்ணில் எந்த புகாரும் இல்லை. எண்ணைச் சரிபார்க்கவும் அல்லது திரும்பிச் செல்லவும்.",
          hi: "इस नंबर से कोई शिकायत नहीं मिली। कृपया नंबर जांचें या वापस जाएं।",
          en: "No complaint found with this number. Please check the number or go back."
        };
        setError(msg[language] || msg.en);
        speakText(msg[language] || msg.en, language);
      } else {
        setActiveComplaint(data.complaint);
        const msg = {
          ta: "புகார் கண்டறியப்பட்டது. நீங்கள் இப்போது இந்த புகாருக்கான சான்றுகளை உருவாக்கலாம்.",
          hi: "शिकायत मिल गई। अब आप इस शिकायत के लिए सबूत बना सकते हैं।",
          en: "Complaint found. You can now create evidence for this complaint."
        };
        speakText(msg[language] || msg.en, language);
        setScreen('evidence_hub');
      }
    } catch(err) {
      setError('Network error checking complaint.');
    } finally {
      setLoading(false);
    }
  };

  // ── EVIDENCE FLOW ──────────────────────────────────────────────────────────



  const submitWitness = async () => {
    if (!witnessName.trim()) { setError('Please enter witness name.'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/witness', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ 
          complaintId: evidenceComplaintId, 
          witnessName, 
          witnessPhone, 
          relationship: witnessRelation,
          duration: witnessDuration,
          sameSite: witnessSameSite === 'Yes',
          contractorName: witnessContractor
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWitnessDone(data);
        setScreen('witness_done');
        const msg = {
          ta:`${witnessName} சாட்சியாக பதிவு செய்யப்பட்டார். மொத்தம் ${data.totalWitnesses} சாட்சிகள்.`,
          hi:`${witnessName} गवाह के रूप में दर्ज। कुल ${data.totalWitnesses} गवाह।`,
          en:`${witnessName} registered as witness. Total ${data.totalWitnesses} witnesses.`
        };
        speakText(msg[language] || msg.en, language);
      } else throw new Error('Witness registration failed');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // ── STATUS FLOW ────────────────────────────────────────────────────────────

  const handleStatusSubmit = async () => {
    if (!statusInputText.trim()) return;
    await checkStatus('known', statusInputText.trim());
  };

  const checkStatus = async (type, text) => {
    setLoading(true);
    try {
      const url = type === 'known'
        ? `/api/checkStatus?id=${encodeURIComponent(text)}`
        : `/api/checkStatus?query=${encodeURIComponent(text)}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.found) {
        setActiveComplaint(data.complaint);
        setEvidenceComplaintId(data.complaint.id);
        setScreen('status_result');
        const sl = data.complaint.status;
        const msg = {
          ta:`உங்கள் புகார் நிலை ${sl}. ${data.complaint.workerSummaryLocal}`,
          hi:`आपकी शिकायत स्थिति ${sl} है। ${data.complaint.workerSummaryLocal}`,
          en:`Status: ${sl}. ${data.complaint.workerSummaryLocal}`
        };
        speakText(msg[language] || msg.en, language);
      } else {
        const msg = { ta:"புகார் கிடைக்கவில்லை.", hi:"शिकायत नहीं मिली।", en:"Complaint not found." };
        speakText(msg[language] || msg.en, language);
        setScreen('status_input');
      }
    } catch (e) { setScreen('status_input'); }
    finally { setLoading(false); }
  };

  // ── RIGHTS FLOW ────────────────────────────────────────────────────────────

  const loadRights = async () => {
    setLoading(true); setScreen('rights');
    try {
      const res  = await fetch(`/api/rightsInfo?language=${language}`);
      const data = await res.json();
      setRightsInfo(data.rights ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── SHARED RECORDING UI ────────────────────────────────────────────────────
  const renderRecordingUI = (onStop, onStart) => (
    <div className="recorder-container">
      <div className={`waveform${recording ? ' active' : ''}`}>
        {[...Array(7)].map((_,i) => (
          <div key={i} className="waveform-bar"
            style={recording ? { animationDuration:`${[0.5,0.6,0.4,0.7,0.5,0.6,0.4][i]}s`, animationPlayState:'running' } : { height:8, animationPlayState:'paused' }} />
        ))}
      </div>
      <div className={`record-timer${recording ? ' running' : ''}`}>{fmtTime(recSecs)}</div>
      {!recording
        ? <button className="record-btn-large" onClick={async () => { await beginRecording(); if (onStart) onStart(); }}>🎙️</button>
        : <button className="record-btn-large recording" onClick={onStop}>⏹️</button>
      }
      <div className="recording-status">
        {recording ? <span className="text-danger">● Recording — press stop when done</span> : <span>Press mic to start</span>}
      </div>
      {error && <p style={{ color:'var(--color-danger)', marginTop:8 }}>{error}</p>}
    </div>
  );

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="kiosk-container">

      {/* Mic denied overlay */}
      {micDenied && (
        <div className="mic-overlay">
          <div className="mic-overlay-icon">🎙️</div>
          <div className="mic-overlay-title">Microphone Access Denied</div>
          <div className="mic-overlay-body">Please allow microphone access in browser settings.</div>
          <button className="kiosk-btn primary" style={{ minHeight:72 }} onClick={() => { setMicDenied(false); setScreen('hub'); }}>OK</button>
        </div>
      )}

      {/* Header */}
      <header className="kiosk-header">
        <div className="kiosk-logo" onClick={goToHub} style={{ cursor:'pointer' }}>
          <span>⚖️</span><span>VoiceForJustice - AI</span>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {(screen !== 'language' && screen !== 'landing') && (
            <>
              <button className="audio-narrator-btn" style={{ padding:'12px 16px', fontSize:'0.95rem', background:'var(--color-info)', color:'#ffffff', border:'none' }}
                onClick={() => { stopSpeaking(); }}>❓ Help</button>
              <button className="audio-narrator-btn" style={{ padding:'12px 16px', fontSize:'0.95rem' }}
                onClick={() => setScreen('language')}>{t('changeLang', language)}</button>
            </>
          )}
          <Link href="/admin" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '12px 16px', borderRadius: '50px',
            background: '#0d9488', color: '#ffffff',
            fontSize: '0.9rem', fontWeight: 700,
            textDecoration: 'none', whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(13,148,136,0.3)',
            transition: 'all 0.2s',
          }}>⚙️ Admin</Link>
        </div>
      </header>

      <main className="kiosk-content">
        
        {/* ── Landing Page ── */}
        {screen === 'landing' && (
          <div className="landing-hero">
            <div className="landing-illustration">⚖️</div>
            <h1 className="landing-title">VoiceForJustice - AI</h1>
            <p className="landing-subtitle">
              Empowering workers to speak up, file complaints, and ensure fair wages safely and securely.
            </p>
            
            <div className="value-props">
              <div className="value-prop-item">
                <div className="value-prop-icon">🎙️</div>
                <div className="value-prop-text">File voice complaints easily</div>
              </div>
              <div className="value-prop-item">
                <div className="value-prop-icon">🔏</div>
                <div className="value-prop-text">Secure evidence collection</div>
              </div>
              <div className="value-prop-item">
                <div className="value-prop-icon">🛡️</div>
                <div className="value-prop-text">Know your legal rights</div>
              </div>
            </div>

            <button className="kiosk-btn primary w-full" 
              style={{ minHeight: '80px', fontSize: '1.4rem', marginTop: '32px', borderRadius: '16px' }} 
              onClick={() => setScreen('language')}>
              Get Started →
            </button>
          </div>
        )}

        {/* ── Language ── */}
        {screen === 'language' && (
          <div className="flex-col gap-12 w-full">
            <h1 className="kiosk-title" style={{ fontSize:'1.8rem' }}>Choose Language / மொழி தேர்வு</h1>
            <div className="flag-grid" style={{ gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
              {LANGUAGES.map(lang => (
                <button key={lang.code} className="flag-card" onClick={() => selectLanguage(lang.code)}
                  style={{ border:`3px solid ${lang.color}`, minHeight:150 }}>
                  <div style={{ width:60, height:60, borderRadius:'50%', background:lang.color, color: '#ffffff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', fontWeight:800 }}>{lang.symbol}</div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <span style={{ fontSize:'1.4rem', fontWeight:800 }}>{lang.native}</span>
                    <span style={{ fontSize:'0.95rem', color:'var(--text-secondary)' }}>{lang.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Hub ── */}
        {screen === 'hub' && (
          <div className="flex-col gap-12 w-full">
            <h1 className="kiosk-title" style={{ fontSize:'2rem' }}>{t('mainMenu', language)}</h1>
            <div className="flex-col" style={{ gap:16 }}>
              {[
                { icon:'🎙️', key:'fileComplaint', color:'var(--color-danger)',  action: startComplaintModeSelection },
                { icon:'🔍', key:'checkStatus',   color:'var(--color-info)',    action: () => { 
                  setScreen('status_input');
                  const msg = {
                    ta:"இந்தத் திரையில், நீங்கள் உங்கள் புகார் எண்ணை உள்ளிட வேண்டும். உங்களுக்குத் தெரியாவிட்டால், உங்களுக்குத் தெரிந்த ஒருவரைத் தட்டச்சு செய்யச் சொல்லுங்கள்.",
                    hi:"इस स्क्रीन पर आपको अपना शिकायत नंबर डालना होगा। यदि आप नहीं जानते, तो किसी भरोसेमंद व्यक्ति से टाइप करने को कहें।",
                    en:"On this screen, you must enter your complaint number. If you don't know it, ask a trusted person to help you type it."
                  };
                  speakText(msg[language] || msg.en, language);
                }},
                { icon:'🦺', key:'knowRights',    color:'var(--color-success)', action: loadRights },
                { icon:'📋', key:'evidenceHub',   color:'var(--color-accent)',  action: () => setScreen('evidence_entry') },
              ].map(item => (
                <button key={item.key} className="kiosk-card" style={{ flexDirection:'row', justifyContent:'flex-start', gap:24, minHeight:120, padding:24 }}
                  onClick={item.action}>
                  <span style={{ fontSize:'3rem' }}>{item.icon}</span>
                  <span className="kiosk-card-label" style={{ color:item.color, fontSize:'1.5rem' }}>{t(item.key, language)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Complaint Mode Selection ── */}
        {screen === 'complaint_mode_choice' && (
          <div className="flex-col gap-12 w-full" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h1 className="kiosk-title" style={{ fontSize: '2.5rem' }}>
              {language === 'hi' ? "शिकायत कैसे करें?" : language === 'ta' ? "புகார் செய்வது எப்படி?" : "How to File"}
            </h1>
            <p style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {language === 'hi' ? "चुनें कि आप अपनी शिकायत कैसे दर्ज करना चाहते हैं। केवल एक की आवश्यकता है।" : language === 'ta' ? "உங்கள் புகாரை எவ்வாறு பதிவு செய்ய விரும்புகிறீர்கள் என்பதைத் தேர்வு செய்யவும். ஏதேனும் ஒன்று மட்டுமே தேவை." : "Choose how you want to file your complaint. Only one is needed."}
            </p>
            
            <button className="kiosk-card" style={{ flexDirection: 'column', padding: '32px', minHeight: '180px', background: 'var(--bg-secondary)', border: '2px solid var(--color-danger)' }}
              onClick={() => startComplaintRecording('voice')}>
              <span style={{ fontSize: '4rem', marginBottom: '16px' }}>🎙️</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-danger)' }}>
                {language === 'hi' ? "बोलकर शिकायत करें" : language === 'ta' ? "பேசி புகார் அளிக்கவும்" : "Speak Complaint"}
              </span>
            </button>

            <button className="kiosk-card" style={{ flexDirection: 'column', padding: '32px', minHeight: '180px', background: 'var(--bg-secondary)', border: '2px solid var(--color-info)' }}
              onClick={() => startComplaintRecording('type')}>
              <span style={{ fontSize: '4rem', marginBottom: '16px' }}>⌨️</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-info)' }}>
                {language === 'hi' ? "टाइप करके शिकायत करें" : language === 'ta' ? "தட்டச்சு செய்து புகார் அளிக்கவும்" : "Type Complaint"}
              </span>
            </button>

            <button className="kiosk-btn w-full" style={{ minHeight:72, marginTop: '16px' }} onClick={goToHub}>{t('back', language)}</button>
          </div>
        )}

        {/* ── Record Complaint ── */}
        {screen === 'record' && (
          <div className="flex-col gap-12 w-full" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="kiosk-title" style={{ fontSize: '2rem' }}>📝 {t('fileComplaint', language)}</h1>
            <p style={{ textAlign: 'center', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
              {complaintMode === 'voice'
                ? (language === 'hi' ? "कृपया बोलकर शिकायत करें" : language === 'ta' ? "தயவுசெய்து பேசி புகார் அளிக்கவும்" : "Please speak your complaint")
                : (language === 'hi' ? "कृपया टाइप करके शिकायत करें" : language === 'ta' ? "தயவுசெய்து தட்டச்சு செய்து புகார் அளிக்கவும்" : "Please type your complaint")}
            </p>

            <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>

              {/* ── VOICE MODE: checklist checkboxes + recorder only ── */}
              {complaintMode === 'voice' && (
                <>
                  <fieldset style={{ background: 'var(--surface-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', margin: 0 }}>
                    <legend style={{ fontSize: '1.2rem', fontWeight: 800, padding: '0 8px', color: 'var(--text-primary)' }}>
                      {language === 'hi' ? "शिकायत में ये बातें शामिल करें:" : language === 'ta' ? "புகாரில் இவற்றைச் சேர்க்கவும்:" : "Include these in your complaint:"}
                    </legend>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: '12px 0 0 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                      <li>👤 {language === 'hi' ? 'आपका नाम' : language === 'ta' ? 'உங்கள் பெயர்' : 'Your name'}</li>
                      <li>👷 {language === 'hi' ? 'ठेकेदार का नाम' : language === 'ta' ? 'ஒப்பந்ததாரர் பெயர்' : 'Contractor name'}</li>
                      <li>🏢 {language === 'hi' ? 'कंपनी का नाम' : language === 'ta' ? 'நிறுவனப் பெயர்' : 'Company name'}</li>
                      <li>📍 {language === 'hi' ? 'काम की जगह' : language === 'ta' ? 'வேலை இடம்' : 'Work site location'}</li>
                      <li>💰 {language === 'hi' ? 'तय पैसे' : language === 'ta' ? 'வாக்களிக்கப்பட்ட ஊதியம்' : 'Promised wage'}</li>
                      <li>💵 {language === 'hi' ? 'मिले पैसे' : language === 'ta' ? 'கிடைத்த பணம்' : 'Amount received'}</li>
                      <li>📅 {language === 'hi' ? 'काम के दिन' : language === 'ta' ? 'வேலை நாட்கள்' : 'Days worked'}</li>
                      <li>⚠️ {language === 'hi' ? 'मुख्य समस्या' : language === 'ta' ? 'என்ன பிரச்சனை' : 'What problem happened'}</li>
                    </ul>
                  </fieldset>

                  <div style={{ background: 'var(--surface-color)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    {/* eslint-disable-next-line react-hooks/refs */}
                    {renderRecordingUI(handleStopComplaintRecording)}
                  </div>
                </>
              )}

              {/* ── TYPE MODE: contractor validation fieldset + textarea ── */}
              {complaintMode === 'type' && (
                <>
                  <fieldset style={{ background: 'var(--surface-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', margin: 0 }}>
                    <legend style={{ fontSize: '1.2rem', fontWeight: 800, padding: '0 8px', color: 'var(--text-primary)' }}>
                      {language === 'hi' ? "ठेकेदार / साइट सत्यापन" : language === 'ta' ? "ஒப்பந்ததாரர் / தளம் சரிபார்ப்பு" : "Contractor / Site Validation"}
                    </legend>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                      <input type="text" placeholder={language==='hi'?'ठेकेदार का नाम':language==='ta'?'ஒப்பந்ததாரர் பெயர்':language==='te'?'కాంట్రాక్టర్ పేరు':language==='kn'?'ಗುತ್ತಿಗೆದಾರ ಹೆಸರು':language==='ml'?'കോൺട്രാക്ടർ പേര്':language==='bn'?'ঠিকাদারের নাম':'Contractor name'} value={contractorName} onChange={e => setContractorName(e.target.value)}
                        style={{ padding: '16px', fontSize: '1.1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                      <input type="text" placeholder={language==='hi'?'कंपनी का नाम (अज्ञात हो तो छोड़ें)':language==='ta'?'நிறுவனப் பெயர் (தெரியாவிட்டால் விடவும்)':language==='te'?'కంపెనీ పేరు (తెలియకపోతే వదిలేయండి)':language==='kn'?'ಕಂಪನಿ ಹೆಸರು (ಗೊತ್ತಿಲ್ಲದಿದ್ದರೆ ಬಿಡಿ)':language==='ml'?'കമ്പനി പേര് (അറിയില്ലെങ്കിൽ ഒഴിവാക്കുക)':language==='bn'?'কোম্পানির নাম (অজানা হলে ছেড়ে দিন)':'Company name (optional if unknown)'} value={companyName} onChange={e => setCompanyName(e.target.value)}
                        style={{ padding: '16px', fontSize: '1.1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                      <input type="text" placeholder={language==='hi'?'काम की जगह':language==='ta'?'வேலை இடம்':language==='te'?'పని చేసిన స్థలం':language==='kn'?'ಕೆಲಸದ ಸ್ಥಳ':language==='ml'?'ജോലി സ്ഥലം':language==='bn'?'কাজের জায়গা':'Work site location'} value={siteLocation} onChange={e => setSiteLocation(e.target.value)}
                        style={{ padding: '16px', fontSize: '1.1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                      <button className="kiosk-btn" style={{ minHeight: '60px', background: 'var(--color-info)', color: 'var(--text-primary)', fontSize: '1.2rem' }} onClick={validateSiteContractor} disabled={loading}>
                        {loading ? '...' : (language === 'hi' ? "साइट / ठेकेदार सत्यापित करें" : language === 'ta' ? "தளம் / ஒப்பந்ததாரரை சரிபார்க்கவும்" : "Validate Site / Contractor")}
                      </button>
                      <p style={{ margin: 0, fontSize: '1rem', color: validationStatus === 'Yes' ? 'var(--color-success)' : validationStatus === 'Not found' ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                        {language==='hi'?'ठेकेदार/साइट जाँच:':language==='ta'?'ஒப்பந்ததாரர்/தளம் சரிபார்ப்பு:':language==='te'?'కాంట్రాక్టర్/సైట్ తనిఖీ:':language==='kn'?'ಗುತ್ತಿಗೆದಾರ/ಸೈಟ್ ಪರಿಶೀಲನೆ:':language==='ml'?'കോൺട്രാക്ടർ/സൈറ്റ് പരിശോധന:':language==='bn'?'ঠিকাদার/সাইট যাচাই:':'Contractor/site checked:'} <strong>{validationStatus === 'Yes' ? (language==='hi'?'मिलान हुआ':language==='ta'?'பொருந்துகிறது':language==='te'?'సరిపోలింది':language==='kn'?'ಹೊಂದಾಣಿಕೆ':language==='ml'?'പൊരുത്തപ്പെട്ടു':language==='bn'?'মিলেছে':'Yes') : validationStatus === 'Not found' ? (language==='hi'?'नहीं मिला':language==='ta'?'கிடைக்கவில்லை':language==='te'?'కనుగొనబడలేదు':language==='kn'?'ಸಿಗಲಿಲ್ಲ':language==='ml'?'കണ്ടെത്തിയില്ല':language==='bn'?'পাওয়া যায়নি':'Not found') : (language==='hi'?'छोड़ा गया':language==='ta'?'தவிர்க்கப்பட்டது':language==='te'?'దాటవేయబడింది':language==='kn'?'ಬಿಟ್ಟುಬಿಡಲಾಗಿದೆ':language==='ml'?'ഒഴിവാക്കി':language==='bn'?'এড়ানো হয়েছে':'Skipped')}</strong>
                      </p>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1.1rem' }}>
                        {language === 'hi' ? "शिकायत में ये बातें शामिल करें:" : language === 'ta' ? "புகாரில் இவற்றைச் சேர்க்கவும்:" : "Include these in your complaint:"}
                      </h3>
                      <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                        <li>👤 {language==='hi'?'आपका नाम':language==='ta'?'உங்கள் பெயர்':'Your name'}</li>
                        <li>👷 {language==='hi'?'ठेकेदार का नाम':language==='ta'?'ஒப்பந்ததாரர் பெயர்':'Contractor name'}</li>
                        <li>🏢 {language==='hi'?'कंपनी का नाम':language==='ta'?'நிறுவனப் பெயர்':'Company name'}</li>
                        <li>📍 {language==='hi'?'काम की जगह':language==='ta'?'வேலை இடம்':'Work site location'}</li>
                        <li>💰 {language==='hi'?'तय पैसे':language==='ta'?'வாக்களிக்கப்பட்ட ஊதியம்':'Promised wage'}</li>
                        <li>💵 {language==='hi'?'मिले पैसे':language==='ta'?'கிடைத்த பணம்':'Amount received'}</li>
                        <li>📅 {language==='hi'?'काम के दिन':language==='ta'?'வேலை நாட்கள்':'Days worked'}</li>
                        <li>⚠️ {language==='hi'?'मुख्य समस्या':language==='ta'?'என்ன பிரச்சனை':'What problem happened'}</li>
                      </ul>
                    </div>
                  </fieldset>

                  <div style={{ background: 'var(--surface-color)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <textarea
                      value={typedComplaint}
                      onChange={e => setTypedComplaint(e.target.value)}
                      placeholder={language === 'hi' ? "यहाँ टाइप करें..." : language === 'ta' ? "இங்கே தட்டச்சு செய்யவும்..." : "Helper can type details here..."}
                      style={{ width: '100%', height: '160px', padding: '16px', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'none' }}
                    />
                  </div>
                </>
              )}

            </div>

            <button className="kiosk-btn primary w-full" style={{ minHeight: 72, fontSize: '1.5rem', marginTop: '16px' }} onClick={handleStopComplaintRecording}>
              {t('submit', language)}
            </button>
            <button className="kiosk-btn w-full" style={{ minHeight: 72 }} onClick={goToHub}>{t('back', language)}</button>
          </div>
        )}

        {/* ── Transcribing / processing spinner ── */}
        {(screen === 'transcribing' || screen === 'submitting' || screen === 'checkin_processing') && (
          <div className="recorder-container">
            <h1 className="kiosk-title">{t('processing', language)}</h1>
            <div style={{ fontSize:'5rem', animation:'pulse 1s infinite' }}>
              {screen === 'submitting' ? '📤' : screen === 'checkin_processing' ? '📋' : '🎧'}
            </div>
          </div>
        )}

        {/* ── Validating ── */}
        {screen === 'validating' && (
          <div className="recorder-container">
            <h1 className="kiosk-title text-accent">{t('validating', language)}</h1>
            <div style={{ fontSize:'5rem', animation:'pulse 1s infinite' }}>🤖</div>
            <p className="kiosk-subtitle">AI is checking if your complaint can be filed…</p>
          </div>
        )}

        {/* ── Validation SUCCESS ── */}
        {screen === 'validation_success' && validation && (
          <div className="flex-col gap-12 w-full">
            <h1 className="kiosk-title text-success">✅ {language === 'ta' ? 'புகார் செல்லுபடியானது!' : language === 'hi' ? 'शिकायत मान्य है!' : 'Complaint Valid!'}</h1>

            {/* Score bar */}
            <div style={{ background:'var(--bg-secondary)', border:'2px solid var(--color-success)', borderRadius:16, padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{ fontWeight:800 }}>Complaint Strength</span>
                <span style={{ color:'var(--color-success)', fontWeight:800, fontSize:'1.3rem' }}>{validation.score}/6</span>
              </div>
              <div style={{ background:'var(--bg-tertiary)', borderRadius:8, height:16, overflow:'hidden' }}>
                <div style={{ width:`${(validation.score/6)*100}%`, background:'var(--color-success)', height:'100%', borderRadius:8, transition:'width 0.5s' }}/>
              </div>
            </div>

            {/* Present fields */}
            {validation.presentFields?.length > 0 && (
              <div style={{ background: 'var(--bg-primary)', border:'1px solid var(--color-success)', borderRadius:12, padding:16 }}>
                <p style={{ fontWeight:800, marginBottom:8, color:'var(--color-success)' }}>✓ Verified in your complaint:</p>
                {validation.presentFields.map((f,i) => <p key={i} style={{ margin:'4px 0', fontSize:'0.95rem' }}>• {f}</p>)}
              </div>
            )}

            {/* Transcript preview */}
            <div className="transcript-card">
              <div className="transcript-card-lang">Your Statement</div>
              <p className="transcript-card-text">{transcript.original}</p>
              {transcript.english !== transcript.original && <p className="transcript-card-english">{transcript.english}</p>}
            </div>

            <p style={{ color:'var(--color-success)', fontSize:'1.1rem', fontWeight:800, textAlign:'center' }}>{validation.reason}</p>

            <button className="kiosk-btn primary w-full" style={{ minHeight:100, fontSize:'1.5rem' }} onClick={submitComplaint} disabled={loading}>
              {loading ? '…' : `✅ ${t('submit', language)}`}
            </button>
            <button className="kiosk-btn w-full" style={{ minHeight:76 }} onClick={startComplaintRecording}>{t('tryAgain', language)}</button>
          </div>
        )}

        {/* ── Validation FAIL ── */}
        {screen === 'validation_fail' && validation && (
          <div className="flex-col gap-12 w-full">
            <h1 className="kiosk-title" style={{ color:'var(--color-accent)' }}>
              ⚠️ {language === 'ta' ? 'இன்னும் கொஞ்சம் விவரங்கள் தேவை' : language === 'hi' ? 'कुछ और जानकारी चाहिए' : 'A few more details needed'}
            </h1>

            {/* Score bar */}
            <div style={{ background:'var(--bg-secondary)', border:'2px solid var(--color-accent)', borderRadius:16, padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{ fontWeight:800 }}>Complaint Strength</span>
                <span style={{ color:'var(--color-accent)', fontWeight:800, fontSize:'1.3rem' }}>{validation.score}/6</span>
              </div>
              <div style={{ background:'var(--bg-tertiary)', borderRadius:8, height:16, overflow:'hidden' }}>
                <div style={{ width:`${(validation.score/6)*100}%`, background:'var(--color-accent)', height:'100%', borderRadius:8, transition:'width 0.5s' }}/>
              </div>
              <p style={{ marginTop:12, color:'var(--text-secondary)', fontSize:'0.9rem' }}>Need 4/6 to file. You have {validation.score}.</p>
            </div>

            {/* Missing fields with guidance */}
            {validation.missingFields?.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <p style={{ fontWeight:800, color:'var(--color-accent)' }}>Please add these details when you record again:</p>
                {validation.missingFields.map((f,i) => (
                  <div key={i} style={{ background: 'var(--bg-primary)', border:'1px solid rgba(251,191,36,0.3)', borderRadius:12, padding:14 }}>
                    <p style={{ margin:0, fontWeight:800, fontSize:'0.95rem' }}>❌ {f.label}</p>
                    <p style={{ margin:'6px 0 0 0', fontSize:'0.9rem', color:'var(--text-secondary)' }}>{f.guidance}</p>
                  </div>
                ))}
              </div>
            )}

            <button className="kiosk-btn primary w-full" style={{ minHeight:100, fontSize:'1.5rem', borderColor:'var(--color-danger)', color:'var(--color-danger)' }} onClick={startComplaintRecording}>
              🎙️ {t('tryAgain', language)}
            </button>

            {/* Allow submit anyway with lower confidence */}
            <button className="kiosk-btn w-full" style={{ minHeight:76, fontSize:'1.1rem', opacity:0.7 }} onClick={submitComplaint} disabled={loading}>
              {language === 'ta' ? 'இந்த புகாரையே சமர்ப்பி' : language === 'hi' ? 'इसी शिकायत को जमा करें' : 'Submit anyway (lower priority)'}
            </button>
            <button className="kiosk-btn w-full" style={{ minHeight:64 }} onClick={goToHub}>{t('back', language)}</button>
          </div>
        )}

        {/* ── Submitted ── */}
        {screen === 'submitted' && (
          <div className="flex-col gap-12 w-full" style={{ gap:20 }}>
            <div style={{ textAlign:'center', fontSize:'4.5rem', animation:'pulse 1.5s infinite' }}>🎉</div>
            <h1 className="kiosk-title text-success" style={{ fontSize:'2.2rem' }}>
              {language==='ta'?'புகார் பதிவானது!':language==='hi'?'शिकायत दर्ज हुई!':'Complaint Filed!'}
            </h1>
            <p className="kiosk-subtitle">
              {language==='ta'?'இந்த எண்ணை எழுதி வையுங்கள்':language==='hi'?'यह नंबर लिख लें':'Please write down this number:'}
            </p>
            <div className="large-input text-accent" style={{ background: 'var(--bg-tertiary)', border:'4px solid var(--color-success)', fontSize:'3.2rem', letterSpacing:'0.15em', padding:'20px', borderRadius:'24px', boxShadow:'0 0 20px rgba(16,185,129,0.2)', textAlign:'center' }}>
              {newComplaintId}
            </div>
            <div className="transcript-card" style={{ marginTop:8, padding:20 }}>
              <div className="transcript-card-lang" style={{ color:'var(--color-success)' }}>
                {LANGUAGES.find(l => l.code===language)?.native} {language==='hi'?'सारांश':language==='ta'?'சுருக்கம்':language==='te'?'సారాంశం':language==='kn'?'ಸಾರಾಂಶ':language==='ml'?'സംഗ്രഹം':language==='bn'?'সারাংশ':'SUMMARY'}
              </div>
              <p className="transcript-card-text" style={{ fontSize:'1.2rem', lineHeight:1.6, fontWeight:'bold' }}>{newSummary}</p>
            </div>

            {/* 65B cert badge */}
            <div style={{ background: 'var(--bg-primary)', border:'1px solid var(--color-info)', borderRadius:12, padding:14, display:'flex', gap:12, alignItems:'center' }}>
              <span style={{ fontSize:'2rem' }}>🔏</span>
              <div>
                <p style={{ margin:0, fontWeight:800, fontSize:'0.9rem', color:'var(--color-info)' }}>{language==='hi'?'धारा 65B प्रमाणपत्र बना':language==='ta'?'பிரிவு 65B சான்றிதழ் உருவாக்கப்பட்டது':language==='te'?'సెక్షన్ 65B సర్టిఫికేట్ సృష్టించబడింది':language==='kn'?'ಸೆಕ್ಷನ್ 65B ಪ್ರಮಾಣಪತ್ರ ರಚಿಸಲಾಗಿದೆ':language==='ml'?'സെക്ഷൻ 65B സർട്ടിഫിക്കറ്റ് സൃഷ്ടിച്ചു':language==='bn'?'ধারা 65B সার্টিফিকেট তৈরি হয়েছে':'Section 65B Certificate Generated'}</p>
                <p style={{ margin:0, fontSize:'0.8rem', color:'var(--text-secondary)' }}>{language==='hi'?'आपकी रिकॉर्डिंग कानूनी रूप से इलेक्ट्रॉनिक साक्ष्य के रूप में प्रमाणित है':language==='ta'?'உங்கள் பதிவு சட்டப்படி மின்னணு ஆதாரமாக சான்றளிக்கப்பட்டது':language==='te'?'మీ రికార్డింగ్ చట్టబద్ధంగా ఎలక్ట్రానిక్ సాక్ష్యంగా ధృవీకరించబడింది':language==='kn'?'ನಿಮ್ಮ ರೆಕಾರ್ಡಿಂಗ್ ಕಾನೂನುಬದ್ಧವಾಗಿ ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಾಕ್ಷ್ಯವಾಗಿ ಪ್ರಮಾಣೀಕರಿಸಲಾಗಿದೆ':language==='ml'?'നിങ്ങളുടെ റെക്കോർഡിംഗ് നിയമപരമായി ഇലക്ട്രോണിക് തെളിവായി സാക്ഷ്യപ്പെടുത്തി':language==='bn'?'আপনার রেকর্ডিং আইনগতভাবে ইলেকট্রনিক প্রমাণ হিসাবে প্রত্যয়িত':'Your recording is legally certified as electronic evidence'}</p>
              </div>
            </div>

            <div className="flex-col" style={{ gap:12, marginTop:8 }}>
              <button className="kiosk-btn primary w-full" style={{ minHeight:100, fontSize:'1.4rem', borderColor:'var(--color-accent)' }}
                onClick={() => speakText(newSummary, language)}>
                🔊 {language==='ta'?'புகார் சுருக்கம் கேளுங்கள்':language==='hi'?'शिकायत सुनें':'Play Complaint Summary'}
              </button>
              <button className="kiosk-btn w-full" style={{ minHeight:90, fontSize:'1.3rem', borderColor:'var(--color-success)', color:'var(--color-success)' }}
                onClick={() => { setEvidenceComplaintId(newComplaintId); setScreen('evidence_hub'); }}>
                📋 {t('evidenceHub', language)}
              </button>
              <button className="kiosk-btn w-full" style={{ minHeight:76 }} onClick={goToHub}>{t('goHome', language)}</button>
            </div>
          </div>
        )}

        {/* ── Evidence Entry (enter complaint ID) ── */}
        {screen === 'evidence_entry' && (
          <div className="flex-col gap-12 w-full">
            <h1 className="kiosk-title">📋 {t('evidenceHub', language)}</h1>
            <p className="kiosk-subtitle">
              {language==='ta'?'உங்கள் புகார் எண்ணை உள்ளிடவும்':language==='hi'?'अपनी शिकायत संख्या दर्ज करें':'Enter your complaint number to add evidence'}
            </p>
            <input type="text" value={evidenceComplaintId} onChange={e => setEvidenceComplaintId(e.target.value)}
              placeholder="e.g. 1001"
              style={{ background:'var(--bg-secondary)', border:'3px solid var(--bg-tertiary)', borderRadius:12, padding:'18px 20px', color: 'var(--text-primary)', fontSize:'2rem', textAlign:'center', letterSpacing:'0.2em', outline:'none', width:'100%' }} />
            {error && <p style={{ color:'var(--color-danger)' }}>{error}</p>}
            <button className="kiosk-btn primary w-full" style={{ minHeight:90, fontSize:'1.4rem' }}
              onClick={verifyComplaintForEvidence} disabled={loading}>
              {loading ? '...' : (language==='hi'?'शिकायत सत्यापित करें →':language==='ta'?'புகாரை சரிபார்க்கவும் →':language==='te'?'ఫిర్యాదు ధృవీకరించండి →':language==='kn'?'ದೂರು ಪರಿಶೀಲಿಸಿ →':language==='ml'?'പരാതി പരിശോധിക്കുക →':language==='bn'?'অভিযোগ যাচাই করুন →':'Verify Complaint →')}
            </button>
            <button className="kiosk-btn w-full" style={{ minHeight:72 }} onClick={goToHub}>{t('back', language)}</button>
          </div>
        )}

        {/* ── Evidence Hub ── */}
        {screen === 'evidence_hub' && (
          <div className="flex-col gap-12 w-full">
            <h1 className="kiosk-title">📋 {t('evidenceHub', language)}</h1>
            <div style={{ background:'var(--bg-secondary)', border:'2px solid var(--color-accent)', borderRadius:12, padding:16, textAlign:'center' }}>
              <p style={{ margin:0, fontSize:'0.85rem', color:'var(--text-secondary)' }}>{language==='hi'?'शिकायत संख्या':language==='ta'?'புகார் எண்':language==='te'?'ఫిర్యాదు సంఖ్య':language==='kn'?'ದೂರು ಸಂಖ್ಯೆ':language==='ml'?'പരാതി നമ്പർ':language==='bn'?'অভিযোগ নম্বর':'Complaint ID'}</p>
              <p style={{ margin:0, fontSize:'2rem', fontWeight:800, color:'var(--color-accent)', letterSpacing:'0.1em' }}>{evidenceComplaintId}</p>
              {activeComplaint && (
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 16 }}>
                  <div style={{ background: 'var(--surface-color)', padding: '4px 12px', borderRadius: 12 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{language==='hi'?'स्थिति: ':language==='ta'?'நிலை: ':language==='te'?'స్థితి: ':language==='kn'?'ಸ್ಥಿತಿ: ':language==='ml'?'നില: ':language==='bn'?'অবস্থা: ':'Status: '}</span>
                    <strong style={{ color: 'var(--color-success)' }}>{activeComplaint.status}</strong>
                  </div>
                  <div style={{ background: 'var(--surface-color)', padding: '4px 12px', borderRadius: 12 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{language==='hi'?'दर्ज: ':language==='ta'?'பதிவு: ':language==='te'?'దాఖలు: ':language==='kn'?'ಸಲ್ಲಿಸಿದ: ':language==='ml'?'ഫയൽ: ':language==='bn'?'দাখিল: ':'Filed: '}</span>
                    <strong>{new Date(activeComplaint.createdAt).toLocaleDateString()}</strong>
                  </div>
                </div>
              )}
            </div>

            <p className="kiosk-subtitle">
              {language==='ta'?'உங்கள் வழக்கை வலுப்படுத்த சான்றுகள் சேர்க்கவும்':language==='hi'?'अपना केस मजबूत करने के लिए सबूत जोड़ें':'Add evidence to strengthen your case'}
            </p>

            <div className="flex-col" style={{ gap:14 }}>
              <button className="kiosk-card" style={{ flexDirection:'row', justifyContent:'flex-start', gap:20, minHeight:110, padding:20 }}
                onClick={() => { setRecordingType(null); setAudioFile(null); setAudioNote(''); setError(''); setScreen('upload_recording'); }}>
                <span style={{ fontSize:'2.5rem' }}>📞</span>
                <div>
                  <div className="kiosk-card-label" style={{ color:'var(--color-success)', fontSize:'1.3rem' }}>{t('addRecording', language)}</div>
                  <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginTop:4 }}>
                    {language==='ta'?'அழைப்பு பதிவு அல்லது குரல் பதிவை சான்றாக பதிவேற்றவும்.':language==='hi'?'सबूत के रूप में कॉल रिकॉर्डिंग या वॉयस रिकॉर्डिंग अपलोड करें।':'Upload a call recording or voice recording as proof.'}
                  </div>
                </div>
              </button>

              <button className="kiosk-card" style={{ flexDirection:'row', justifyContent:'flex-start', gap:20, minHeight:110, padding:20 }}
                onClick={() => { setWitnessName(''); setWitnessPhone(''); setError(''); setScreen('witness_add'); }}>
                <span style={{ fontSize:'2.5rem' }}>👥</span>
                <div>
                  <div className="kiosk-card-label" style={{ color:'var(--color-info)', fontSize:'1.3rem' }}>{t('addWitness', language)}</div>
                  <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginTop:4 }}>
                    {language==='ta'?'உங்களுக்கு தெரிந்த சக தொழிலாளர் பெயர் சேர்க்கவும்':language==='hi'?'सहकर्मी का नाम जोड़ें':'Add a co-worker who can confirm your work'}
                  </div>
                </div>
              </button>

              <button className="kiosk-card" style={{ flexDirection:'row', justifyContent:'flex-start', gap:20, minHeight:110, padding:20 }}
                onClick={() => { setPhotoBlob(null); setError(''); setScreen('evidence_photo'); }}>
                <span style={{ fontSize:'2.5rem' }}>📷</span>
                <div>
                  <div className="kiosk-card-label" style={{ color:'#eab308', fontSize:'1.3rem' }}>{t('addPhoto', language)}</div>
                  <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginTop:4 }}>
                    {language==='ta'?'புகைப்படம் மற்றும் உங்கள் இருப்பிடத்தை சேமிக்க':language==='hi'?'फोटो और अपनी लोकेशन सेव करें':'Save a photo with your location'}
                  </div>
                </div>
              </button>
            </div>

            <div style={{ background: 'var(--bg-primary)', border:'1px solid rgba(56,189,248,0.2)', borderRadius:12, padding:14, marginTop:4 }}>
              <p style={{ margin:0, fontSize:'0.85rem', color:'var(--color-info)', fontWeight:800 }}>🔏 {language==='hi'?'हर रिकॉर्ड स्वचालित रूप से प्रमाणित होता है':language==='ta'?'ஒவ்வொரு பதிவும் தானாக சான்றளிக்கப்படுகிறது':language==='te'?'ప్రతి రికార్డు స్వయంచాలకంగా ధృవీకరించబడుతుంది':language==='kn'?'ಪ್ರತಿ ದಾಖಲೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಪ್ರಮಾಣೀಕರಿಸಲಾಗುತ್ತದೆ':language==='ml'?'ഓരോ രേഖയും സ്വയമേവ സാക്ഷ്യപ്പെടുത്തുന്നു':language==='bn'?'প্রতিটি রেকর্ড স্বয়ংক্রিয়ভাবে প্রত্যয়িত':'Every record is automatically certified'}</p>
              <p style={{ margin:0, fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:4 }}>{language==='hi'?'आपके जोड़े गए हर सबूत के लिए धारा 65B प्रमाणपत्र बनता है':language==='ta'?'நீங்கள் சேர்க்கும் ஒவ்வொரு ஆதாரத்திற்கும் பிரிவு 65B சான்றிதழ் உருவாக்கப்படுகிறது':language==='te'?'మీరు జోడించే ప్రతి సాక్ష్యానికి సెక్షన్ 65B సర్టిఫికేట్ రూపొందించబడుతుంది':language==='kn'?'ನೀವು ಸೇರಿಸುವ ಪ್ರತಿ ಸಾಕ್ಷ್ಯಕ್ಕೆ ಸೆಕ್ಷನ್ 65B ಪ್ರಮಾಣಪತ್ರ ರಚಿಸಲಾಗುತ್ತದೆ':language==='ml'?'നിങ്ങൾ ചേർക്കുന്ന ഓരോ തെളിവിനും സെക്ഷൻ 65B സർട്ടിഫിക്കറ്റ് സൃഷ്ടിക്കുന്നു':language==='bn'?'আপনার যোগ করা প্রতিটি প্রমাণের জন্য ধারা 65B সার্টিফিকেট তৈরি হয়':'Section 65B certificates are generated for each piece of evidence you add'}</p>
            </div>

            <button className="kiosk-btn w-full" style={{ minHeight:76 }} onClick={goToHub}>{t('goHome', language)}</button>
          </div>
        )}

        {/* ── Evidence Photo ── */}
        {screen === 'evidence_photo' && (
          <div className="flex-col gap-12 w-full">
            <h1 className="kiosk-title">📷 {t('addPhoto', language)}</h1>
            <p className="kiosk-subtitle" style={{ color:'#eab308' }}>{language==='hi'?'शिकायत':language==='ta'?'புகார்':language==='te'?'ఫిర్యాదు':language==='kn'?'ದೂರು':language==='ml'?'പരാതി':language==='bn'?'অভিযোগ':'Complaint'} #{evidenceComplaintId}</p>

            <div style={{ background:'var(--surface-color)', padding:16, borderRadius:12, border:'1px solid var(--border-color)', textAlign:'center' }}>
              {!photoBlob ? (
                <>
                  {!isCameraActive ? (
                    <>
                      <p style={{ fontSize:'1.2rem', marginBottom:16 }}>
                        {language === 'hi' ? "कैमरा चालू करने के लिए नीचे क्लिक करें:" : language === 'ta' ? "புகைப்படம் எடுக்க கீழே கிளிக் செய்யவும்:" : "Click below to open camera:"}
                      </p>
                      <button className="kiosk-btn primary" style={{ minHeight:90, fontSize:'1.5rem', width:'100%', background:'#eab308', color:'#000' }}
                        onClick={async () => {
                          try {
                            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                            if (videoRef.current) {
                              videoRef.current.srcObject = stream;
                            }
                            setIsCameraActive(true);
                          } catch (err) {
                            setError('Camera access denied or unavailable.');
                            console.error(err);
                          }
                        }}>
                        📸 {t('addPhoto', language)}
                      </button>

                      <div style={{ marginTop: 24 }}>
                        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                          {language === 'hi' ? 'या गैलरी से अपलोड करें:' : language === 'ta' ? 'அல்லது கேலரியில் இருந்து பதிவேற்றவும்:' : 'Or upload from gallery:'}
                        </p>
                        <input 
                          type="file" 
                          accept="image/*" 
                          id="gallery-upload"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setPhotoBlob(file);
                              
                              // Attempt to get location
                              if ('geolocation' in navigator) {
                                try {
                                  const pos = await new Promise((resolve, reject) => {
                                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                                  });
                                  setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                                } catch (err) {
                                  setGpsCoords({ error: true });
                                }
                              }
                            }
                          }}
                        />
                        <label htmlFor="gallery-upload" className="kiosk-btn w-full" style={{ minHeight:72, fontSize:'1.2rem', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center' }}>
                          📁 {language === 'hi' ? 'फोटो अपलोड करें' : language === 'ta' ? 'புகைப்படம் பதிவேற்று' : 'Upload Photo'}
                        </label>
                      </div>
                    </>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:16, alignItems:'center' }}>
                      <video ref={videoRef} autoPlay playsInline style={{ width:'100%', maxWidth:'400px', borderRadius:8, background:'#000' }} />
                      <button className="kiosk-btn primary w-full" style={{ minHeight:72, fontSize:'1.5rem', background:'#eab308', color:'#000' }}
                        onClick={async () => {
                          if (videoRef.current && canvasRef.current) {
                            setLoading(true);
                            
                            // Capture photo immediately
                            const canvas = canvasRef.current;
                            const video = videoRef.current;
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            canvas.getContext('2d').drawImage(video, 0, 0);
                            
                            // Stop camera instantly
                            const tracks = video.srcObject?.getTracks() || [];
                            tracks.forEach(track => track.stop());
                            setIsCameraActive(false);

                            // Now get GPS
                            let lat = null, lng = null;
                            if ('geolocation' in navigator) {
                              try {
                                const pos = await new Promise((resolve, reject) => {
                                  navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                                });
                                lat = pos.coords.latitude;
                                lng = pos.coords.longitude;
                                setGpsCoords({ lat, lng });
                              } catch (err) { 
                                console.warn('GPS failed:', err); 
                                setGpsCoords({ error: true });
                              }
                            }

                            canvas.toBlob((blob) => {
                              setPhotoBlob(blob);
                              setLoading(false);
                            }, 'image/jpeg');
                          }
                        }}>
                        {loading ? '...' : '🎯 Capture Photo'}
                      </button>
                    </div>
                  )}
                  <canvas ref={canvasRef} style={{ display:'none' }} />
                </>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:16, alignItems:'center' }}>
                  <img src={URL.createObjectURL(photoBlob)} alt="Captured preview" style={{ maxWidth:'100%', maxHeight:'300px', borderRadius:8 }} />
                  {gpsCoords && !gpsCoords.error && <p style={{ color:'var(--color-success)', fontSize:'1.2rem', fontWeight:'bold' }}>✅ Location captured</p>}
                  {gpsCoords && gpsCoords.error && <p style={{ color:'var(--color-danger)', fontSize:'1.2rem', fontWeight:'bold' }}>❌ Location not available</p>}
                  
                  <button className="kiosk-btn primary w-full" style={{ minHeight:72, fontSize:'1.4rem' }} onClick={async () => {
                    setLoading(true);
                    try {
                      const fd = new FormData();
                      fd.append('photo', photoBlob);
                      fd.append('complaintId', evidenceComplaintId);
                      if (gpsCoords) {
                        fd.append('lat', gpsCoords.lat);
                        fd.append('lng', gpsCoords.lng);
                      }

                      const res = await fetch('/api/evidence', { method: 'POST', body: fd });
                      const data = await res.json();
                      if (data.success) {
                        setScreen('evidence_photo_done');
                        const msg = {
                          ta:"புகைப்படம் மற்றும் இடம் சேமிக்கப்பட்டது.",
                          hi:"फोटो और लोकेशन सेव कर ली गई है।",
                          en:"Photo and location saved successfully."
                        };
                        speakText(msg[language] || msg.en, language);
                      } else throw new Error(data.error || 'Failed to save photo');
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setLoading(false);
                    }
                  }}>
                    {loading ? '...' : (language==='hi'?'फोटो अपलोड करें':language==='ta'?'புகைப்படம் பதிவேற்றவும்':language==='te'?'ఫోటో అప్‌లోడ్':language==='kn'?'ಫೋಟೋ ಅಪ್‌ಲೋಡ್':language==='ml'?'ഫോട്ടോ അപ്‌ലോഡ്':language==='bn'?'ছবি আপলোড':'Upload Photo')}
                  </button>
                  <button className="kiosk-btn" style={{ minHeight:72, fontSize:'1.4rem' }} onClick={() => { setPhotoBlob(null); setGpsCoords(null); setIsCameraActive(true); }}>{language==='hi'?'फिर से फोटो लें':language==='ta'?'மீண்டும் புகைப்படம் எடு':language==='te'?'మళ్ళీ ఫోటో తీయండి':language==='kn'?'ಮತ್ತೆ ಫೋಟೋ ತೆಗೆಯಿರಿ':language==='ml'?'വീണ്ടും ഫോട്ടോ എടുക്കുക':language==='bn'?'আবার ছবি তুলুন':'Retake Photo'}</button>
                </div>
              )}
            </div>

            {error && <p style={{ color:'var(--color-danger)', textAlign:'center' }}>{error}</p>}
            <button className="kiosk-btn w-full" style={{ minHeight:72 }} onClick={() => {
              // Stop camera if active
              if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(t => t.stop());
              }
              setIsCameraActive(false);
              setScreen('evidence_hub');
            }}>{t('back', language)}</button>
          </div>
        )}

        {/* ── Evidence Photo Done ── */}
        {screen === 'evidence_photo_done' && (
          <div className="flex-col gap-12 w-full" style={{ textAlign:'center', gap:20 }}>
            {photoBlob && <img src={URL.createObjectURL(photoBlob)} alt="Captured preview" style={{ maxWidth:'200px', margin:'0 auto', borderRadius:8 }} />}
            <h1 className="kiosk-title text-success" style={{ fontSize: '1.8rem' }}>
              ✅ {language==='ta'?'புகைப்படம் சேமிக்கப்பட்டது!':language==='hi'?'सबूत बन गया!':'Site evidence uploaded successfully'}
            </h1>
            <button className="kiosk-btn primary w-full" style={{ minHeight:90, fontSize:'1.5rem' }} onClick={() => { setPhotoBlob(null); setGpsCoords(null); setIsCameraActive(false); setScreen('evidence_hub'); }}>
              + {language==='hi'?'और सबूत बनाएं':language==='ta'?'மேலும் ஆதாரங்கள் உருவாக்கு':language==='te'?'మరిన్ని సాక్ష్యాలు సృష్టించండి':language==='kn'?'ಇನ್ನಷ್ಟು ಸಾಕ್ಷ್ಯ ರಚಿಸಿ':language==='ml'?'കൂടുതൽ തെളിവുകൾ സൃഷ്ടിക്കുക':language==='bn'?'আরো প্রমাণ তৈরি করুন':'Create more evidence'}
            </button>
            <button className="kiosk-btn w-full" style={{ minHeight:72 }} onClick={goToHub}>{t('goHome', language)}</button>
          </div>
        )}

        {/* ── Audio Upload Form ── */}
        {screen === 'upload_recording' && (
          <div className="flex-col gap-12 w-full">
            <h1 className="kiosk-title">📞 {t('addRecording', language)}</h1>
            <p className="kiosk-subtitle" style={{ color:'#10b981' }}>{language==='hi'?'शिकायत':language==='ta'?'புகார்':'Complaint'} #{evidenceComplaintId}</p>

            {!recordingType ? (
              <div className="flex-col gap-16">
                <button className="kiosk-btn primary w-full" style={{ minHeight:100, fontSize:'1.4rem' }} onClick={() => {
                  setRecordingType('call_recording');
                  speakText(language==='hi'?'यहाँ आप कॉल रिकॉर्डिंग या वॉयस रिकॉर्डिंग जोड़ सकते हैं।':language==='ta'?'இங்கு நீங்கள் அழைப்பு பதிவு அல்லது குரல் பதிவைச் சேர்க்கலாம்.':'Here you can add a call recording or voice recording.', language);
                }}>
                  {language==='ta'?'அழைப்பு பதிவை பதிவேற்றுக':language==='hi'?'कॉल रिकॉर्डिंग अपलोड करें':'Upload Call Recording'}
                </button>
                <button className="kiosk-btn primary w-full" style={{ minHeight:100, fontSize:'1.4rem' }} onClick={() => {
                  setRecordingType('voice_recording');
                  speakText(language==='hi'?'यहाँ आप कॉल रिकॉर्डिंग या वॉयस रिकॉर्डिंग जोड़ सकते हैं।':language==='ta'?'இங்கு நீங்கள் அழைப்பு பதிவு அல்லது குரல் பதிவைச் சேர்க்கலாம்.':'Here you can add a call recording or voice recording.', language);
                }}>
                  {language==='ta'?'குரல் பதிவை பதிவேற்றுக':language==='hi'?'वॉयस रिकॉर्डिंग अपलोड करें':'Upload Voice Recording'}
                </button>
              </div>
            ) : (
              <div style={{ background:'var(--surface-color)', padding:20, borderRadius:12, border:'1px solid var(--border-color)', textAlign:'center' }}>
                <h2 style={{ margin:'0 0 16px 0', color:'var(--text-primary)' }}>
                  {recordingType === 'call_recording' 
                    ? (language==='ta'?'அழைப்பு பதிவு':language==='hi'?'कॉल रिकॉर्डिंग':'Call Recording') 
                    : (language==='ta'?'குரல் பதிவு':language==='hi'?'वॉयस रिकॉर्डिंग':'Voice Recording')}
                </h2>

                {!audioFile ? (
                  <div className="flex-col gap-12">
                    <label className="kiosk-btn primary" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:80, fontSize:'1.3rem', cursor:'pointer' }}>
                      <input type="file" accept="audio/*" style={{ display:'none' }} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!file.type.startsWith('audio/')) {
                            alert(language==='ta'?'ஆடியோ கோப்பை மட்டும் பதிவேற்றவும்.':language==='hi'?'कृपया केवल एक ऑडियो फ़ाइल अपलोड करें।':'Please upload an audio file only.');
                            return;
                          }
                          setAudioFile(file);
                        }
                      }} />
                      {language==='ta'?'கோப்பை தேர்ந்தெடுக்கவும்':language==='hi'?'फ़ाइल चुनें':'Select File'}
                    </label>
                    <p style={{ margin:0, fontSize:'0.9rem', color:'var(--text-secondary)' }}>
                      {language==='ta'?'அனுமதிக்கப்பட்டவை: MP3, WAV, M4A, AAC':language==='hi'?'अनुमत: MP3, WAV, M4A, AAC':'Allowed: MP3, WAV, M4A, AAC'}
                    </p>
                  </div>
                ) : (
                  <div className="flex-col gap-16" style={{ textAlign:'left' }}>
                    <div style={{ background:'var(--bg-secondary)', padding:16, borderRadius:8, border:'1px solid var(--border-color)' }}>
                      <p style={{ margin:'0 0 8px 0', fontWeight:'bold' }}>{audioFile.name}</p>
                      <p style={{ margin:'0 0 16px 0', fontSize:'0.85rem', color:'var(--text-secondary)' }}>{(audioFile.size / 1024 / 1024).toFixed(2)} MB • {audioFile.type}</p>
                      <audio controls src={URL.createObjectURL(audioFile)} style={{ width:'100%' }} />
                    </div>

                    <div className="flex-col" style={{ gap:8 }}>
                      <label style={{ fontSize:'1rem', color:'var(--text-secondary)' }}>{language==='ta'?'இந்த பதிவு பற்றி':language==='hi'?'इस रिकॉर्डिंग के बारे में':'About this recording'}</label>
                      <textarea className="large-input" rows="2" placeholder={language==='ta'?'எடுத்துக்காட்டு: ஒப்பந்ததாரர் அழைப்பு':language==='hi'?'उदाहरण: ठेकेदार कॉल':'For example: contractor call, wage discussion'}
                        value={audioNote} onChange={e => setAudioNote(e.target.value)} />
                    </div>

                    {error && <p style={{ color:'var(--color-danger)' }}>{error}</p>}

                    <div style={{ display:'flex', gap:12, flexDirection:'column' }}>
                      <button className="kiosk-btn primary w-full" style={{ minHeight:72, fontSize:'1.3rem' }} onClick={uploadAudioEvidence} disabled={loading}>
                        {loading ? '...' : (language==='ta'?'பதிவேற்றுக':language==='hi'?'अपलोड करें':'Upload Recording')}
                      </button>
                      <button className="kiosk-btn w-full" style={{ minHeight:60, background:'var(--bg-secondary)' }} onClick={() => setAudioFile(null)}>
                        {language==='ta'?'அகற்று':language==='hi'?'हटाएं':'Remove Recording'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button className="kiosk-btn w-full" style={{ minHeight:72 }} onClick={() => setScreen('evidence_hub')}>{t('back', language)}</button>
          </div>
        )}

        {/* ── Add Witness ── */}
        {screen === 'witness_add' && (
          <div className="flex-col gap-12 w-full">
            <h1 className="kiosk-title">👥 {t('addWitness', language)}</h1>
            <p className="kiosk-subtitle" style={{ color:'var(--color-info)' }}>Complaint #{evidenceComplaintId}</p>

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <label style={{ fontWeight:800, fontSize:'1rem' }}>
                {language==='ta'?'சாட்சியின் பெயர்':language==='hi'?'गवाह का नाम':'Witness Name *'}
              </label>
              <input type="text" value={witnessName} onChange={e => setWitnessName(e.target.value)}
                placeholder={language==='ta'?'பெயர் உள்ளிடவும்':language==='hi'?'नाम लिखें':'Enter full name'}
                style={{ background:'var(--bg-secondary)', border:'2px solid var(--bg-tertiary)', borderRadius:10, padding:'16px 18px', color: 'var(--text-primary)', fontSize:'1.2rem', outline:'none' }} />

              <label style={{ fontWeight:800, fontSize:'1rem', marginTop:8 }}>
                {language==='ta'?'தொலைபேசி எண் (விருப்பமானால்)':language==='hi'?'फोन नंबर (वैकल्पिक)':'Phone Number (optional)'}
              </label>
              <input type="tel" value={witnessPhone} onChange={e => setWitnessPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                style={{ background:'var(--bg-secondary)', border:'2px solid var(--bg-tertiary)', borderRadius:10, padding:'16px 18px', color: 'var(--text-primary)', fontSize:'1.2rem', outline:'none' }} />

              <label style={{ fontWeight:800, fontSize:'1rem', marginTop:8 }}>
                {language==='ta'?'உறவுமுறை':language==='hi'?'रिश्ता':'Relationship to worker *'}
              </label>
              <select value={witnessRelation} onChange={e => setWitnessRelation(e.target.value)}
                style={{ background:'var(--bg-secondary)', border:'2px solid var(--bg-tertiary)', borderRadius:10, padding:'16px 18px', color: 'var(--text-primary)', fontSize:'1.2rem', outline:'none' }}>
                <option value="co-worker on same site">Co-worker on same site</option>
                <option value="co-worker on another site">Co-worker on another site</option>
                <option value="neighbour">Neighbour</option>
                <option value="family member">Family member</option>
                <option value="other">Other</option>
              </select>

              <label style={{ fontWeight:800, fontSize:'1rem', marginTop:8 }}>
                {language==='ta'?'எவ்வளவு காலமாக தெரியும்':language==='hi'?'कब से जानते हैं':'How long have they known the worker? *'}
              </label>
              <select value={witnessDuration} onChange={e => setWitnessDuration(e.target.value)}
                style={{ background:'var(--bg-secondary)', border:'2px solid var(--bg-tertiary)', borderRadius:10, padding:'16px 18px', color: 'var(--text-primary)', fontSize:'1.2rem', outline:'none' }}>
                <option value="Less than 3 months">Less than 3 months</option>
                <option value="3-12 months">3-12 months</option>
                <option value="More than 1 year">More than 1 year</option>
              </select>

              <label style={{ fontWeight:800, fontSize:'1rem', marginTop:8 }}>
                {language==='ta'?'ஒரே தளத்தில் வேலை செய்தாரா?':language==='hi'?'क्या एक ही साइट पर काम किया?':'Worked on same site? *'}
              </label>
              <div style={{ display:'flex', gap:12 }}>
                <button className={`kiosk-btn ${witnessSameSite === 'Yes' ? 'primary' : ''}`} onClick={() => setWitnessSameSite('Yes')} style={{ flex:1 }}>Yes</button>
                <button className={`kiosk-btn ${witnessSameSite === 'No' ? 'primary' : ''}`} onClick={() => setWitnessSameSite('No')} style={{ flex:1 }}>No</button>
              </div>

              {witnessSameSite === 'Yes' && (
                <>
                  <label style={{ fontWeight:800, fontSize:'1rem', marginTop:8 }}>
                    {language==='ta'?'அவர்களின் ஒப்பந்ததாரர் பெயர்':language==='hi'?'उनके ठेकेदार का नाम':'Their own contractor name (optional)'}
                  </label>
                  <input type="text" value={witnessContractor} onChange={e => setWitnessContractor(e.target.value)}
                    placeholder="Contractor name"
                    style={{ background:'var(--bg-secondary)', border:'2px solid var(--bg-tertiary)', borderRadius:10, padding:'16px 18px', color: 'var(--text-primary)', fontSize:'1.2rem', outline:'none' }} />
                </>
              )}
            </div>

            {error && <p style={{ color:'var(--color-danger)', fontWeight:800 }}>{error}</p>}

            <div style={{ background: 'var(--bg-primary)', border:'1px solid rgba(56,189,248,0.2)', borderRadius:12, padding:14 }}>
              <p style={{ margin:0, fontSize:'0.85rem', color:'var(--color-info)' }}>
                ℹ️ {language==='ta'?'சாட்சி பதிவு செய்வதன் மூலம் அவர் உங்கள் வழக்கை உறுதிப்படுத்த உதவுவார்':language==='hi'?'गवाह का नाम दर्ज करने से वे आपके मामले की पुष्टि करने में मदद कर सकते हैं':'Registering a witness helps confirm your work and supports your complaint'}
              </p>
            </div>

            <button className="kiosk-btn primary w-full" style={{ minHeight:100, fontSize:'1.4rem' }} onClick={submitWitness} disabled={loading}>
              {loading ? '…' : `👥 ${language==='ta'?'சாட்சி பதிவு செய்':language==='hi'?'गवाह दर्ज करें':'Register Witness'}`}
            </button>
            <button className="kiosk-btn w-full" style={{ minHeight:72 }} onClick={() => setScreen('evidence_hub')}>{t('back', language)}</button>
          </div>
        )}

        {/* ── Witness Done ── */}
        {screen === 'witness_done' && witnessDone && (
          <div className="flex-col gap-12 w-full" style={{ textAlign:'center', gap:20 }}>
            <div style={{ fontSize:'5rem', animation:'pulse 1.5s infinite' }}>👥</div>
            <h1 className="kiosk-title text-success">
              {language==='ta'?'சாட்சி பதிவானார்!':language==='hi'?'गवाह दर्ज!':'Witness Registered!'}
            </h1>
            <div style={{ background:'var(--bg-secondary)', border:'2px solid var(--color-info)', borderRadius:16, padding:20 }}>
              <p style={{ margin:0, fontSize:'1.3rem', fontWeight:800 }}>{witnessName}</p>
              <p style={{ margin:'4px 0 0 0', fontSize:'0.85rem', color:'var(--text-secondary)' }}>Total witnesses: {witnessDone.totalWitnesses}</p>
            </div>
            <button className="kiosk-btn primary w-full" style={{ minHeight:90, fontSize:'1.3rem' }} onClick={() => setScreen('evidence_hub')}>
              + {language==='ta'?'மேலும் சாட்சி சேர்':language==='hi'?'और गवाह जोड़ें':'Add Another Witness'}
            </button>
            <button className="kiosk-btn w-full" style={{ minHeight:72 }} onClick={goToHub}>{t('goHome', language)}</button>
          </div>
        )}

        {/* ── Status Input ── */}
        {screen === 'status_input' && (
          <div className="flex-col gap-12 w-full">
            <h1 className="kiosk-title" style={{ fontSize:'2.5rem' }}>🔍 {t('checkStatus', language)}</h1>
            <p style={{ fontSize:'1.5rem', textAlign:'center', marginBottom:12, color:'var(--text-secondary)' }}>
              {language === 'hi' ? "शिकायत संख्या दर्ज करें" : language === 'ta' ? "புகார் எண்ணை உள்ளிடவும்" : "Enter Complaint Number"}
            </p>
            <input 
              type="text" 
              value={statusInputText} 
              onChange={e => setStatusInputText(e.target.value)}
              placeholder="e.g. 1718..."
              style={{
                width: '100%', padding: '24px', fontSize: '2rem', textAlign: 'center',
                borderRadius: '16px', border: '3px solid var(--color-info)', 
                backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)',
                marginBottom: '24px'
              }}
            />
            <button className="kiosk-btn primary w-full" style={{ minHeight:80, fontSize:'2rem' }} onClick={handleStatusSubmit}>
              {t('checkStatus', language)}
            </button>
          </div>
        )}

        {/* ── Status Result ── */}
        {screen === 'status_result' && activeComplaint && (
          <div className="flex-col gap-12 w-full">
            <h1 className="kiosk-title">{t('checkStatus', language)}</h1>
            <p className="kiosk-subtitle">#{activeComplaint.id}</p>
            <div style={{ padding:20, borderRadius:'var(--border-radius)', border:'3px solid', textAlign:'center', fontWeight:800, fontSize:'1.6rem',
              backgroundColor: activeComplaint.status==='RESOLVED'?'rgba(16,185,129,.2)':activeComplaint.status==='UNDER_REVIEW'?'rgba(251,191,36,.2)':'rgba(239,68,68,.2)',
              borderColor: activeComplaint.status==='RESOLVED'?'var(--color-success)':activeComplaint.status==='UNDER_REVIEW'?'var(--color-accent)':'var(--color-danger)',
              color: activeComplaint.status==='RESOLVED'?'var(--color-success)':activeComplaint.status==='UNDER_REVIEW'?'var(--color-accent)':'#ff8888' }}>
              {activeComplaint.status==='RESOLVED'&&'✅ RESOLVED'}
              {activeComplaint.status==='UNDER_REVIEW'&&'⚠️ UNDER REVIEW'}
              {activeComplaint.status==='PENDING'&&'⏳ RECEIVED / PENDING'}
              {activeComplaint.status==='REJECTED'&&'❌ REJECTED'}
              {activeComplaint.status==='Filed'&&'📋 FILED'}
            </div>
            <div className="transcript-card">
              <div className="transcript-card-lang" style={{ color:'var(--color-info)' }}>Summary</div>
              <p className="transcript-card-text">{activeComplaint.englishSummary}</p>
            </div>

            <button className="kiosk-btn primary w-full" style={{ minHeight:72, fontSize:'1.5rem', background:'var(--color-info)' }} 
              onClick={() => {
                const sl = activeComplaint.status;
                const msg = {
                  ta:`உங்கள் புகார் நிலை ${sl}. ${activeComplaint.workerSummaryLocal}`,
                  hi:`आपकी शिकायत स्थिति ${sl} है। ${activeComplaint.workerSummaryLocal}`,
                  en:`Status: ${sl}. ${activeComplaint.workerSummaryLocal}`
                };
                speakText(msg[language] || msg.en, language);
              }}>
              🔊 {language==='hi'?'मेरी भाषा में स्थिति सुनें':language==='ta'?'என் மொழியில் நிலையை கேளுங்கள்':language==='te'?'నా భాషలో స్థితి వినండి':language==='kn'?'ನನ್ನ ಭಾಷೆಯಲ್ಲಿ ಸ್ಥಿತಿ ಕೇಳಿ':language==='ml'?'എന്റെ ഭാഷയിൽ നില കേൾക്കുക':language==='bn'?'আমার ভাষায় অবস্থা শুনুন':'Play Status in My Language'}
            </button>

            {/* Evidence summary */}
            {(activeComplaint.witnesses?.length > 0) && (
              <div style={{ background: 'var(--bg-primary)', border:'1px solid var(--color-info)', borderRadius:12, padding:14, display:'flex', gap:24, justifyContent:'center' }}>
                {activeComplaint.witnesses?.length > 0 && (
                  <div style={{ textAlign:'center' }}>
                    <p style={{ margin:0, fontSize:'2rem', fontWeight:800, color:'var(--color-info)' }}>{activeComplaint.witnesses.length}</p>
                    <p style={{ margin:0, fontSize:'0.8rem', color:'var(--text-secondary)' }}>{language==='hi'?'गवाह':language==='ta'?'சாட்சிகள்':language==='te'?'సాక్షులు':language==='kn'?'ಸಾಕ್ಷಿಗಳು':language==='ml'?'സാക്ഷികൾ':language==='bn'?'সাক্ষী':'Witnesses'}</p>
                  </div>
                )}
              </div>
            )}

            {/* Witness Evidence List */}
            {activeComplaint.witnesses?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h2 style={{ fontSize:'1.4rem', color:'var(--text-primary)', marginBottom: 12 }}>
                  {language==='ta'?'சாட்சி ஆதாரங்கள்':language==='hi'?'गवाह सबूत':'Witness Evidence'}
                </h2>
                <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
                  {activeComplaint.witnesses.map(w => (
                    <div key={w.id} style={{ background:'var(--surface-color)', border:'1px solid var(--border-color)', borderRadius:12, padding:16 }}>
                      <p style={{ margin:0, fontSize:'1.2rem', fontWeight:800 }}>{w.witnessName}</p>
                      <p style={{ margin:'4px 0 0 0', fontSize:'0.9rem', color:'var(--text-secondary)' }}>
                        {w.relationship} • {new Date(w.registeredAt).toLocaleDateString()}
                      </p>
                      <p style={{ margin:'4px 0 0 0', fontSize:'0.9rem', color:'var(--text-secondary)' }}>
                        {language==='hi'?'फोन:':language==='ta'?'தொலைபேசி:':language==='te'?'ఫోన్:':language==='kn'?'ಫೋನ್:':language==='ml'?'ഫോൺ:':language==='bn'?'ফোন:':'Phone:'} {w.witnessPhone || (language==='hi'?'उपलब्ध नहीं':language==='ta'?'கிடைக்கவில்லை':'N/A')} • {language==='hi'?'एक ही साइट:':language==='ta'?'அதே தளம்:':language==='te'?'అదే సైట్:':language==='kn'?'ಅದೇ ಸೈಟ್:':language==='ml'?'അതേ സൈറ്റ്:':language==='bn'?'একই সাইট:':'Same site:'} {w.sameSite === true ? (language==='hi'?'हाँ':language==='ta'?'ஆம்':'Yes') : w.sameSite === false ? (language==='hi'?'नहीं':language==='ta'?'இல்லை':'No') : (language==='hi'?'अज्ञात':language==='ta'?'தெரியாது':'Unknown')}
                      </p>
                      
                      <div style={{ display:'flex', gap: 8, marginTop: 12, flexDirection: 'column' }}>
                        <button className="kiosk-btn primary w-full" style={{ minHeight:60, fontSize:'1.1rem' }} onClick={() => {
                          setSelectedWitness(w);
                          setViewWitnessMode('details');
                          setScreen('witness_details_view');
                        }}>
                          {language==='ta'?'சாட்சி விவரங்களைக் காண்க':language==='hi'?'गवाह का विवरण देखें':'View Witness Details'}
                        </button>
                        <button className="kiosk-btn w-full" style={{ minHeight:60, fontSize:'1.1rem', background:'var(--bg-secondary)' }} onClick={() => {
                          setSelectedWitness(w);
                          setViewWitnessMode('evidence');
                          setScreen('witness_details_view');
                        }}>
                          {language==='ta'?'ஆதாரங்களை காண்க':language==='hi'?'सबूत देखें':'View Evidence'}
                        </button>
                        {w.ivrTranscript && (
                          <button className="kiosk-btn w-full" style={{ minHeight:60, fontSize:'1.1rem', background:'var(--bg-secondary)', color:'var(--color-info)' }} onClick={() => {
                            const msg = {
                              ta: `சாட்சி அறிக்கை: ${w.ivrTranscript}`,
                              hi: `गवाह का बयान: ${w.ivrTranscript}`,
                              en: `Witness statement: ${w.ivrTranscript}`
                            };
                            speakText(msg[language] || msg.en, language);
                          }}>
                            🔊 {language==='hi'?'बयान सुनें':language==='ta'?'அறிக்கையை கேளுங்கள்':language==='te'?'ప్రకటన వినండి':language==='kn'?'ಹೇಳಿಕೆ ಕೇಳಿ':language==='ml'?'പ്രസ്താവന കേൾക്കുക':language==='bn'?'বিবৃতি শুনুন':'Play Statement'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="kiosk-btn primary w-full" style={{ minHeight:90, marginTop:16 }}
              onClick={() => { setEvidenceComplaintId(activeComplaint.id); setScreen('evidence_hub'); }}>
              📋 {t('evidenceHub', language)}
            </button>
            <button className="kiosk-btn w-full" style={{ minHeight:72 }} onClick={goToHub}>{t('goHome', language)}</button>
          </div>
        )}

        {/* ── Rights ── */}
        {screen === 'rights' && (
          <div className="flex-col gap-12 w-full">
            <h1 className="kiosk-title">🦺 {t('knowRights', language)}</h1>
            <button className="kiosk-btn w-full" style={{ minHeight:80, fontSize:'1.3rem', borderColor:'var(--color-info)', background:'rgba(56,189,248,0.1)' }}
              onClick={() => { stopSpeaking(); if (rightsInfo.length) speakText(rightsInfo.map(r=>r.audioPrompt).join('. '), language); }}>
              🗣️ {language==='ta'?'அனைத்தையும் மெதுவாக விளக்கவும்':language==='hi'?'सब कुछ धीरे-धीरे समझाएं':'Explain all slowly'}
            </button>
            {loading
              ? <div style={{ textAlign:'center', padding:32 }}>Loading…</div>
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {rightsInfo.map(item => (
                    <button key={item.id} className="kiosk-card"
                      style={{ flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, minHeight:140, padding:16, textAlign:'center' }}
                      onClick={() => speakText(item.audioPrompt, language)}>
                      <span style={{ fontSize:'3rem' }}>{item.icon}</span>
                      <span className="kiosk-card-label" style={{ fontSize: '1.1rem', lineHeight: '1.2' }}>{item.title}</span>
                      <span style={{ fontSize:'0.9rem', color:'var(--color-accent)' }}>▶ Play</span>
                    </button>
                  ))}
                </div>
            }
          </div>
        )}

        {/* ── Witness Details View ── */}
        {screen === 'witness_details_view' && selectedWitness && (
          <div className="flex-col gap-12 w-full">
            <h1 className="kiosk-title">{viewWitnessMode === 'details' ? (language==='ta'?'சாட்சி விவரங்கள்':language==='hi'?'गवाह का विवरण':'Witness Details') : (language==='ta'?'ஆதாரங்கள்':language==='hi'?'सबूत':'Evidence')}</h1>
            
            <div style={{ background:'var(--surface-color)', padding:20, borderRadius:12, border:'2px solid var(--color-info)' }}>
              <p style={{ fontSize:'1.4rem', fontWeight:800, margin:0 }}>{selectedWitness.witnessName}</p>
              <p style={{ fontSize:'1rem', color:'var(--text-secondary)', margin:'4px 0 16px 0' }}>{selectedWitness.relationship}</p>
              
              {viewWitnessMode === 'details' ? (
                <>
                  <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '1.1rem' }}>
                    <li><strong>{language==='hi'?'फोन:':language==='ta'?'தொலைபேசி:':language==='te'?'ఫోన్:':language==='kn'?'ಫೋನ್:':language==='ml'?'ഫോൺ:':language==='bn'?'ফোন:':'Phone:'}</strong> {selectedWitness.witnessPhone || (language==='hi'?'उपलब्ध नहीं':language==='ta'?'வழங்கப்படவில்லை':'Not provided')}</li>
                    <li><strong>{language==='hi'?'कितने समय से जानते हैं:':language==='ta'?'எவ்வளவு காலமாக தெரியும்:':language==='te'?'ఎంతకాలంగా తెలుసు:':language==='kn'?'ಎಷ್ಟು ಕಾಲ ಗೊತ್ತು:':language==='ml'?'എത്ര കാലമായി അറിയാം:':language==='bn'?'কতদিন ধরে চেনেন:':'Known for:'}</strong> {selectedWitness.duration || (language==='hi'?'निर्दिष्ट नहीं':language==='ta'?'குறிப்பிடப்படவில்லை':'Not specified')}</li>
                    <li><strong>{language==='hi'?'एक ही साइट पर काम किया:':language==='ta'?'அதே தளத்தில் வேலை செய்தார்:':language==='te'?'అదే సైట్‌లో పనిచేశారు:':language==='kn'?'ಅದೇ ಸೈಟ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡಿದ:':language==='ml'?'ഒരേ സൈറ്റിൽ ജോലി ചെയ്തു:':language==='bn'?'একই সাইটে কাজ করেছেন:':'Worked on same site:'}</strong> {selectedWitness.sameSite === true ? (language==='hi'?'हाँ':language==='ta'?'ஆம்':'Yes') : selectedWitness.sameSite === false ? (language==='hi'?'नहीं':language==='ta'?'இல்லை':'No') : (language==='hi'?'अज्ञात':language==='ta'?'தெரியாது':'Unknown')}</li>
                    {selectedWitness.contractorName && <li><strong>{language==='hi'?'ठेकेदार:':language==='ta'?'ஒப்பந்ததாரர்:':language==='te'?'కాంట్రాక్టర్:':language==='kn'?'ಗುತ್ತಿಗೆದಾರ:':language==='ml'?'കോൺട്രാക്ടർ:':language==='bn'?'ঠিকাদার:':'Contractor:'}</strong> {selectedWitness.contractorName}</li>}
                    <li><strong>{language==='hi'?'पंजीकरण तिथि:':language==='ta'?'பதிவு தேதி:':language==='te'?'నమోదు తేదీ:':language==='kn'?'ನೋಂದಣಿ ದಿನಾಂಕ:':language==='ml'?'രജിസ്ട്രേഷൻ തീയതി:':language==='bn'?'নিবন্ধন তারিখ:':'Registered Date:'}</strong> {new Date(selectedWitness.registeredAt).toLocaleString()}</li>
                  </ul>
                </>
              ) : (
                <>
                  <div className="transcript-card" style={{ marginBottom: 16 }}>
                    <div className="transcript-card-lang" style={{ color:'var(--color-success)' }}>{language==='hi'?'बयान सारांश':language==='ta'?'அறிக்கை சுருக்கம்':language==='te'?'ప్రకటన సారాంశం':language==='kn'?'ಹೇಳಿಕೆ ಸಾರಾಂಶ':language==='ml'?'പ്രസ്താവന സംഗ്രഹം':language==='bn'?'বিবৃতি সারাংশ':'Statement Summary'}</div>
                    <p className="transcript-card-text">
                      {selectedWitness.ivrTranscript ? selectedWitness.ivrTranscript : (language==='hi'?'पंजीकृत है और बयान इकट्ठा होने की प्रतीक्षा में है। जल्द ही IVR के माध्यम से कॉल किया जाएगा।':language==='ta'?'பதிவு செய்யப்பட்டது மற்றும் அறிக்கை சேகரிக்கப்படுவதற்கு காத்திருக்கிறது. IVR வழியாக விரைவில் அழைக்கப்படுவார்.':"Registered and awaiting statement collection. They will be called shortly via IVR.")}
                    </p>
                  </div>
                  <p style={{ fontSize:'0.9rem', color:'var(--text-secondary)' }}>
                    {language==='hi'?'सबूत प्रकार: ऑडियो बयान':language==='ta'?'ஆதாரம் வகை: ஒலிப்பதிவு அறிக்கை':language==='te'?'సాక్ష్య రకం: ఆడియో ప్రకటన':language==='kn'?'ಸಾಕ್ಷ್ಯ ಪ್ರಕಾರ: ಆಡಿಯೋ ಹೇಳಿಕೆ':language==='ml'?'തെളിവ് തരം: ഓഡിയോ പ്രസ്താവന':language==='bn'?'প্রমাণ ধরন: অডিও বিবৃতি':'Evidence Type: Audio Statement'}<br/>
                    {language==='hi'?'शिकायत संख्या:':language==='ta'?'புகார் எண்:':language==='te'?'ఫిర్యాదు సంఖ్య:':language==='kn'?'ದೂರು ಸಂಖ್ಯೆ:':language==='ml'?'പരാതി നമ്പർ:':language==='bn'?'অভিযোগ নম্বর:':'Complaint ID:'} {selectedWitness.complaintId}
                  </p>
                </>
              )}
            </div>

            {selectedWitness.ivrTranscript && viewWitnessMode === 'evidence' && (
              <button className="kiosk-btn primary w-full" style={{ minHeight:80, fontSize:'1.4rem' }}>
                🔊 {language==='hi'?'गवाह का बयान सुनें':language==='ta'?'சாட்சி அறிக்கையை கேளுங்கள்':language==='te'?'సాక్షి ప్రకటన వినండి':language==='kn'?'ಸಾಕ್ಷಿ ಹೇಳಿಕೆ ಕೇಳಿ':language==='ml'?'സാക്ഷി പ്രസ്താവന കേൾക്കുക':language==='bn'?'সাক্ষীর বিবৃতি শুনুন':'Play Witness Statement'}
              </button>
            )}
            <button className="kiosk-btn w-full" style={{ minHeight:72 }} onClick={() => setScreen('status_result')}>{t('back', language)}</button>
          </div>
        )}

      </main>

      {/* Footer */}
      {screen !== 'language' && (
        <footer className="footer-nav" style={{ marginTop:24, gap:14 }}>
          {!['hub','greeting'].includes(screen) && (
            <button className="kiosk-btn" style={{ minHeight:76, fontSize:'1.2rem' }} onClick={goToHub}>{t('back', language)}</button>
          )}
          <button className="kiosk-btn danger" style={{ minHeight:76, fontSize:'1.2rem' }} onClick={() => { stopSpeaking(); setScreen('language'); }}>
            {t('changeLang', language)}
          </button>
        </footer>
      )}
    </div>
  );
}
