const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/app/page.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add `statusMode` state
if (!code.includes('const [statusMode, setStatusMode]')) {
  code = code.replace(
    "const [screen, setScreen] = useState('language'); // language, greeting, hub, record, transcribing, transcript_preview, submitting, submitted, check_status, status_result, rights",
    "const [screen, setScreen] = useState('language'); // language, greeting, hub, record, transcribing, transcript_preview, submitting, submitted, status_options, status_record_known, status_record_unknown, status_result, rights\n  const [statusMode, setStatusMode] = useState(null);"
  );
}

// 2. Replace the handleCheckStatus logic and add playContextualHelp, playRightsSlowly, playStatusScript
const statusLogicStart = code.indexOf('  // ── Status check ────────────────────────────────────────────────────────');
const rightsLogicStart = code.indexOf('  // ── Rights info ─────────────────────────────────────────────────────────');

const newLogic = `  // ── Status check ────────────────────────────────────────────────────────
  const handleCheckStatus = async (type, text) => {
    if (!text) return;
    setLoading(true);
    stopSpeaking();
    setScreen('transcribing');
    try {
      const url = type === 'known' 
        ? \`/api/checkStatus?id=\${encodeURIComponent(text)}\` 
        : \`/api/checkStatus?query=\${encodeURIComponent(text)}\`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.found) {
        setActiveComplaint(data.complaint);
        setScreen('status_result');
        playStatusScript(data.complaint);
      } else {
        const msg = { ta:"புகார் கிடைக்கவில்லை", hi:"शिकायत नहीं मिली", te:"ఫిర్యాదు కనుగొనబడలేదు", kn:"ದೂರು ಕಂಡುಬಂದಿಲ್ಲ", ml:"പരാതി കണ്ടില്ല", bn:"অভিযোগ পাওয়া যায়নি", en:"Complaint not found. Please try again." };
        speakText(msg[language] ?? msg.en, language);
        setScreen('status_options');
      }
    } catch (e) { 
      console.error(e); 
      setScreen('status_options');
    } finally { 
      setLoading(false); 
    }
  };

  const playStatusScript = (c) => {
    const sl = c.status;
    const scripts = {
      ta: \`உங்கள் புகார் நிலை \${sl}. \${c.workerSummaryLocal}\`,
      hi: \`आपकी शिकायत स्थिति \${sl} है। \${c.workerSummaryLocal}\`,
      te: \`మీ ఫిర్యాదు స్థితి \${sl}. \${c.workerSummaryLocal}\`,
      kn: \`ನಿಮ್ಮ ದೂರು ಸ್ಥಿತಿ \${sl}. \${c.workerSummaryLocal}\`,
      ml: \`നിങ്ങളുടെ പരാതി നില \${sl}. \${c.workerSummaryLocal}\`,
      bn: \`আপনার অভিযোগের অবস্থা \${sl}। \${c.workerSummaryLocal}\`,
      en: \`Your complaint status is \${sl}. \${c.workerSummaryLocal}\`,
    };
    speakText(scripts[language] ?? scripts.en, language);
  };

  const startStatusRecording = (mode) => {
    setStatusMode(mode);
    setScreen(mode === 'known' ? 'status_record_known' : 'status_record_unknown');
    resetRecordingState();
    const prompts = {
      known: {
        ta: "உங்கள் புகார் எண்ணை சொல்லுங்கள்.", hi: "अपनी शिकायत संख्या बोलें।", te: "మీ ఫిర్యాదు నంబర్ చెప్పండి.", kn: "ನಿಮ್ಮ ದೂರು ಸಂಖ್ಯೆ ಹೇಳಿ.", ml: "നിങ്ങളുടെ പരാതി നമ്പർ പറയുക.", bn: "আপনার অভিযোগ নম্বর বলুন।", en: "Please speak your complaint number."
      },
      unknown: {
        ta: "உங்கள் பெயர், வேலை செய்யும் இடம், மற்றும் ஒப்பந்ததாரரின் பெயரைச் சொல்லுங்கள்.", hi: "अपना नाम, काम का स्थान और ठेकेदार का नाम बताएं।", te: "మీ పేరు, పని స్థలం మరియు కాంట్రాక్టర్ పేరు చెప్పండి.", kn: "ನಿಮ್ಮ ಹೆಸರು, ಕೆಲಸದ ಸ್ಥಳ ಮತ್ತು ಗುತ್ತಿಗೆದಾರರ ಹೆಸರನ್ನು ಹೇಳಿ.", ml: "നിങ്ങളുടെ പേര്, ജോലി സ്ഥലം, കരാറുകാരന്റെ പേര് എന്നിവ പറയുക.", bn: "আপনার নাম, কাজের জায়গা এবং ঠিকাদারের নাম বলুন।", en: "Please tell us your name, site location, and contractor name."
      }
    };
    speakText(prompts[mode][language] ?? prompts[mode].en, language);
  };

  const processStatusRecording = async () => {
    setScreen('transcribing');
    try {
      const audioBlob = await stopRecordingAction();
      const formData = new FormData();
      formData.append('audio', audioBlob, 'status.webm');
      formData.append('language', language);
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.transcript) {
        await handleCheckStatus(statusMode, data.english || data.transcript);
      } else {
        setScreen('status_options');
      }
    } catch (e) {
      console.error(e);
      setScreen('status_options');
    }
  };

  // ── Contextual Help ─────────────────────────────────────────────────────
  const playContextualHelp = () => {
    stopSpeaking();
    const helpTxt = {
      hub: { ta:"முதன்மை மெனு. புகார் அளிக்க, நிலையை அறிய, அல்லது உரிமைகளை அறிய பட்டன்களை அழுத்தவும்.", hi:"मुख्य मेनू। शिकायत दर्ज करने, स्थिति जाँचने, या अधिकार जानने के लिए बटन दबाएं।", en:"Home screen. Tap to file a complaint, check status, or know your rights." },
      status_options: { ta:"உங்கள் புகார் எண் தெரிந்தால் முதல் பட்டனை அழுத்தவும், தெரியாவிட்டால் இரண்டாவது பட்டனை அழுத்தவும்.", hi:"यदि आपको शिकायत संख्या पता है तो पहला बटन दबाएं, नहीं पता है तो दूसरा।", en:"Check status. Press the first button if you know your number, or the second if you forgot it." },
      record: { ta:"புகார் அளிக்க பெரிய மைக் பட்டனை அழுத்திப் பேசவும்.", hi:"शिकायत दर्ज करने के लिए बड़ा माइक बटन दबाएं और बोलें।", en:"Recording screen. Press the big mic button to speak your complaint." },
      rights: { ta:"உரிமைகள் பற்றிய தகவல்களை கேட்க ஒரு கார்டை அழுத்தவும், அல்லது அனைத்தையும் மெதுவாக கேட்க பட்டனை அழுத்தவும்.", hi:"अधिकारों के बारे में सुनने के लिए कार्ड दबाएं, या धीरे-धीरे सब कुछ सुनने के लिए बटन दबाएं।", en:"Rights info. Tap a card to listen, or tap the explain slowly button." },
    };
    const tMap = helpTxt[screen] ?? helpTxt.hub;
    speakText(tMap[language] ?? tMap.en, language);
  };

  const playRightsSlowly = () => {
    if (!rightsInfo.length) return;
    stopSpeaking();
    // Combine all audio prompts into one long text with pauses
    const combined = rightsInfo.map(r => r.audioPrompt).join(". ... ");
    speakText(combined, language);
  };

`;

code = code.substring(0, statusLogicStart) + newLogic + code.substring(rightsLogicStart);

// 3. Inject Help button into Header
const headerIndex = code.indexOf('<header className="kiosk-header">');
const headerEndIndex = code.indexOf('</header>', headerIndex);
const newHeader = `<header className="kiosk-header">
        <div className="kiosk-logo" onClick={goToHub} style={{ cursor: 'pointer' }}>
          <span>⚖️</span><span>VoiceJustice</span>
        </div>
        {screen !== 'language' && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="audio-narrator-btn" onClick={playContextualHelp} style={{ padding: '14px 18px', fontSize: '1.05rem', background: 'var(--color-info)', color: '#fff', border: 'none' }}>
              ❓ Help
            </button>
            <button className="audio-narrator-btn" onClick={replayNarration} style={{ padding: '14px 18px', fontSize: '1.05rem' }}>
              {t('repeatAudio')}
            </button>
          </div>
        )}
      </header>`;
code = code.substring(0, headerIndex) + newHeader + code.substring(headerEndIndex + 9);

// 4. Update the "Check Status" button on the Hub to go to 'status_options'
code = code.replace(
  "onClick={() => setScreen('check_status')}",
  "onClick={() => { setScreen('status_options'); speakText(({ ta:'உங்கள் புகார் எண் தெரிந்தால் முதல் பட்டனை அழுத்தவும். தெரியாவிட்டால் இரண்டாவது பட்டனை அழுத்தவும்.', hi:'यदि आपको शिकायत संख्या पता है तो पहला बटन दबाएं, नहीं पता है तो दूसरा बटन दबाएं।', te:'మీ ఫిర్యాదు నంబర్ తెలిస్తే మొదటి బటన్ నొక్కండి, తెలియకపోతే రెండవ బటన్ నొక్కండి.', kn:'ನಿಮ್ಮ ದೂರು ಸಂಖ್ಯೆ ತಿಳಿದಿದ್ದರೆ ಮೊದಲ ಬಟನ್ ಒತ್ತಿ, ತಿಳಿಯದಿದ್ದರೆ ಎರಡನೇ ಬಟನ್ ಒತ್ತಿ.', ml:'നിങ്ങളുടെ പരാതി നമ്പർ അറിയാമെങ്കിൽ ആദ്യ ബട്ടൺ അമർത്തുക, അറിയില്ലെങ്കിൽ രണ്ടാമത്തെ ബട്ടൺ അമർത്തുക.', bn:'আপনার অভিযোগ নম্বর জানা থাকলে প্রথম বোতাম টিপুন, না জানা থাকলে দ্বিতীয় বোতাম টিপুন।', en:'If you know your complaint number, press the first button. If you do not know it, press the second button.' })[language] ?? 'If you know your number, press the first button.'); }}"
);

// 5. Replace 'check_status' UI with 'status_options', 'status_record_known', 'status_record_unknown' UI
const checkStatusUIStart = code.indexOf("{/* ── SCREEN: Check Status keypad ── */}");
const checkStatusUIEnd = code.indexOf("{/* ── SCREEN: Status result ── */}");

const newStatusUI = `{/* ── SCREEN: Status Options ── */}
        {screen === 'status_options' && (
          <div className="flex-col gap-12 w-full">
            <h1 className="kiosk-title">{t('checkStatus')}</h1>
            <div className="flex-col" style={{ gap: 20, marginTop: 20 }}>
              <button className="kiosk-btn primary" style={{ minHeight: 120, fontSize: '1.6rem', justifyContent: 'center' }}
                onClick={() => startStatusRecording('known')}>
                🔢 {({ ta:'என் புகார் எண் தெரியும்', hi:'मुझे अपना नंबर पता है', en:'I know my complaint number' })[language] ?? 'I know my number'}
              </button>
              <button className="kiosk-btn" style={{ minHeight: 120, fontSize: '1.6rem', justifyContent: 'center', borderColor: 'var(--color-info)' }}
                onClick={() => startStatusRecording('unknown')}>
                🤷 {({ ta:'என் புகார் எண் மறந்துவிட்டது', hi:'मैं अपना नंबर भूल गया हूँ', en:'I forgot my complaint number' })[language] ?? 'I forgot my number'}
              </button>
            </div>
          </div>
        )}

        {/* ── SCREEN: Status Voice Record ── */}
        {(screen === 'status_record_known' || screen === 'status_record_unknown') && (
          <div className="recorder-container">
            <h1 className="kiosk-title">{screen === 'status_record_known' ? 'Speak Number / எண்ணை சொல்லவும்' : 'Speak Details / விவரங்களை சொல்லவும்'}</h1>
            
            <div className={\`waveform\${recording ? ' active' : ''}\`}>
              {[...Array(7)].map((_, i) => (
                <div key={i} className="waveform-bar" style={recording ? { animationDuration: \`\${[0.5,0.6,0.4,0.7,0.5,0.6,0.4][i]}s\`, animationPlayState: 'running' } : { height: 8, animationPlayState: 'paused' }} />
              ))}
            </div>
            
            <div className={\`record-timer\${recording ? ' running' : ''}\`}>
              {fmtTime(recordSeconds)}
            </div>

            {!recording ? (
              <button className="record-btn-large" onClick={startRecording}>🎙️</button>
            ) : (
              <button className="record-btn-large recording" onClick={processStatusRecording}>⏹️</button>
            )}

            <div className="recording-status">
              {recording ? <span className="text-danger">● {t('stopRec')}</span> : <span>{t('startRec')}</span>}
            </div>
            {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
          </div>
        )}

        `;

code = code.substring(0, checkStatusUIStart) + newStatusUI + code.substring(checkStatusUIEnd);

// 6. Add "Explain all slowly" button to Rights
const rightsUIEnd = code.indexOf('</main>');
const rightsUIStart = code.lastIndexOf("{/* ── SCREEN: Rights player ── */}");

let rightsBlock = code.substring(rightsUIStart, rightsUIEnd);
rightsBlock = rightsBlock.replace(
  "{loading ? <div style={{ textAlign:'center', padding:32 }}>Loading…</div>",
  `<button className="kiosk-btn w-full" style={{ minHeight: 80, fontSize: '1.3rem', borderColor: 'var(--color-info)', background: 'rgba(56, 189, 248, 0.1)' }} onClick={playRightsSlowly}>
              🗣️ {({ ta:'அனைத்தையும் மெதுவாக விளக்கவும்', hi:'सब कुछ धीरे-धीरे समझाएं', en:'Explain all slowly' })[language] ?? 'Explain all slowly'}
            </button>
            {loading ? <div style={{ textAlign:'center', padding:32 }}>Loading…</div>`
);
code = code.substring(0, rightsUIStart) + rightsBlock + code.substring(rightsUIEnd);

fs.writeFileSync(filePath, code, 'utf8');
console.log('page.js heavily patched for Voice Status, Contextual Help, and Rights iteration.');
