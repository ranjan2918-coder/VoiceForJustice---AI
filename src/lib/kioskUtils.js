// Client-side utilities for Text-to-Speech (TTS) and Audio Recording
// TTS now uses Sarvam AI (bulbul:v2) for authentic Indian language voices
// Falls back to browser speechSynthesis if the API call fails

let _currentAudio = null; // tracks currently playing HTMLAudioElement

/**
 * Stop any active speech (Sarvam audio or browser TTS)
 */
export function stopSpeaking() {
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.currentTime = 0;
    _currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Decode a base64 WAV string and play it via Web Audio / HTMLAudioElement.
 * Resolves when audio finishes (or on error).
 * @param {string} base64wav
 * @returns {Promise<void>}
 */
function playBase64Audio(base64wav) {
  return new Promise((resolve) => {
    try {
      const src = `data:audio/wav;base64,${base64wav}`;
      const audio = new Audio(src);
      _currentAudio = audio;
      audio.onended = () => { _currentAudio = null; resolve(); };
      audio.onerror = () => { _currentAudio = null; resolve(); };
      audio.play().catch(() => { _currentAudio = null; resolve(); });
    } catch (e) {
      resolve();
    }
  });
}

/**
 * Speaks text using Sarvam AI TTS (natural Indian voices).
 * Falls back to browser speechSynthesis if Sarvam fails.
 *
 * @param {string} text              The text to speak
 * @param {string} langCode          Language code: ta | hi | te | kn | ml | bn | en
 * @param {function} [onEndCallback] Optional callback when speech ends
 */
export async function speakText(text, langCode = 'en', onEndCallback = null) {
  if (!text || !text.trim()) {
    if (onEndCallback) onEndCallback();
    return;
  }

  // Stop whatever is currently playing
  stopSpeaking();

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), language: langCode }),
    });

    if (!res.ok) throw new Error(`TTS API ${res.status}`);

    const data = await res.json();
    if (!data.audios || data.audios.length === 0) throw new Error('No audio returned');

    // Play each chunk sequentially
    for (const b64 of data.audios) {
      await playBase64Audio(b64);
    }

    if (onEndCallback) onEndCallback();
  } catch (err) {
    console.warn('[speakText] Sarvam TTS failed, falling back to browser TTS:', err.message);
    _browserSpeak(text, langCode, onEndCallback);
  }
}

/**
 * Browser speechSynthesis fallback (used if Sarvam API is unreachable)
 */
function _browserSpeak(text, langCode, onEndCallback) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEndCallback) setTimeout(onEndCallback, 1000);
    return;
  }

  window.speechSynthesis.cancel();

  const langLocales = {
    ta: ['ta-IN', 'ta'], hi: ['hi-IN', 'hi'], te: ['te-IN', 'te'],
    kn: ['kn-IN', 'kn'], ml: ['ml-IN', 'ml'], bn: ['bn-IN', 'bn', 'bn-BD'],
    en: ['en-US', 'en-GB', 'en']
  };

  const targets = langLocales[langCode] || ['en-US'];
  const utterance = new SpeechSynthesisUtterance(text);

  const trySpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    for (const locale of targets) {
      selectedVoice = voices.find(v =>
        v.lang.toLowerCase() === locale.toLowerCase() ||
        v.lang.toLowerCase().startsWith(locale.toLowerCase() + '-')
      );
      if (selectedVoice) break;
    }
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.lang = targets[0];
    utterance.rate = 0.88;
    if (onEndCallback) {
      utterance.onend = onEndCallback;
      utterance.onerror = () => onEndCallback();
    }
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', trySpeak, { once: true });
    setTimeout(trySpeak, 300);
  } else {
    trySpeak();
  }
}

/**
 * Records microphone audio and returns a Blob on stop.
 */
export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.mimeType = 'audio/webm';
  }

  async start() {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      throw new Error('Audio recording is not supported in this browser.');
    }

    this.audioChunks = [];

    const preferred = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];
    this.mimeType = preferred.find(m => MediaRecorder.isTypeSupported?.(m)) || 'audio/webm';

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      }
    });

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: this.mimeType });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.audioChunks.push(e.data);
    };

    this.mediaRecorder.start(250);
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('Recorder is not active.'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        if (this.stream) {
          this.stream.getTracks().forEach(t => t.stop());
          this.stream = null;
        }
        const blob = new Blob(this.audioChunks, { type: this.mimeType });
        resolve(blob);
      };

      this.mediaRecorder.onerror = (e) => reject(e.error ?? new Error('Recording error'));
      this.mediaRecorder.stop();
    });
  }

  cancel() {
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
  }
}
