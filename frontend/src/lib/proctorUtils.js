// Utilities for proctoring warnings (voice + popup) and speech-to-text.

// ---------- Text-to-Speech ----------

let _lastWarnAt = 0;
let _preferredVoice = null;

// Names of higher-quality natural voices across browsers/OSes, in priority order.
const _NATURAL_VOICE_HINTS = [
  'Google US English',
  'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Guy', 'Microsoft Michelle',
  'Samantha', 'Zira', 'Natural', 'Neural',
];

function pickPreferredVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || !voices.length) return null;

  // Prefer an English voice matching one of our natural-voice hints
  for (const hint of _NATURAL_VOICE_HINTS) {
    const match = voices.find(
      (v) => v.lang && v.lang.toLowerCase().startsWith('en') && v.name.includes(hint)
    );
    if (match) return match;
  }
  // Otherwise any en-US voice
  const enUS = voices.find((v) => v.lang === 'en-US');
  return enUS || voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en')) || voices[0];
}

// Voices load asynchronously — refresh our pick when they arrive.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  _preferredVoice = pickPreferredVoice();
  window.speechSynthesis.onvoiceschanged = () => {
    _preferredVoice = pickPreferredVoice();
  };
}

/**
 * Speak text aloud using the browser's Speech Synthesis API with a
 * natural-sounding voice and slightly slower, warmer delivery.
 * onEnd fires when speech finishes (useful to know when TTS releases the mic).
 */
export function speak(text, { rate = 0.95, pitch = 1.05, volume = 1.0, onEnd } = {}) {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = _preferredVoice || pickPreferredVoice();
    if (voice) utter.voice = voice;
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = volume;
    if (onEnd) {
      utter.onend = onEnd;
      utter.onerror = onEnd;
    }
    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.warn('speak failed:', e);
    if (onEnd) onEnd();
  }
}

/**
 * Speak a short warning. Gentle by design: rate-limited so it never nags.
 */
export function speakWarning(text, { minGapMs = 8000 } = {}) {
  const now = Date.now();
  if (now - _lastWarnAt < minGapMs) return;
  _lastWarnAt = now;
  speak(text, { volume: 0.9 });
}

// ---------- Anomaly flag -> human message mapping ----------

const FLAG_MESSAGES = {
  multiple_people_detected: {
    title: 'Multiple people detected',
    message: 'Please make sure you are alone in the frame.',
    voice: 'Warning. Please make sure you are alone during the interview.',
    severity: 'high',
    isViolation: true,
  },
  camera_blocked: {
    title: 'Camera blocked',
    message: 'Your camera appears to be covered. Please uncover it immediately.',
    voice: 'Warning. Your camera appears to be blocked. Please uncover it.',
    severity: 'high',
    isViolation: true,
  },
  tab_switch: {
    title: 'You left the interview tab',
    message: 'Switching tabs or windows during the interview is not allowed.',
    voice: 'Warning. Please do not switch tabs during the interview.',
    severity: 'high',
    isViolation: true,
  },
  no_face: {
    title: 'Face not detected',
    message: 'We can’t see you. Please stay in front of the camera.',
    voice: 'Please stay in front of the camera.',
    severity: 'medium',
    isViolation: true,
  },
  low_face_presence: {
    title: 'Please stay in view',
    message: 'Try to keep your face visible to the camera.',
    voice: 'Please keep your face visible to the camera.',
    severity: 'medium',
    isViolation: true,
  },
  offscreen_focus_drop: {
    title: 'Stay focused',
    message: 'Please keep your attention on the screen and avoid looking away.',
    voice: 'Please keep your focus on the screen.',
    severity: 'medium',
    isViolation: true,
  },
};

/**
 * Given a vision snapshot, pick the single most important warning (if any).
 * Returns null when everything looks fine.
 */
export function evaluateProctorWarning(snapshot) {
  if (!snapshot) return null;
  const flags = snapshot.anomaly_flags || [];
  if (!flags.length) return null;

  // Priority order: most serious first
  const priority = [
    'multiple_people_detected',
    'camera_blocked',
    'no_face',
    'low_face_presence',
    'offscreen_focus_drop',
  ];

  for (const flag of priority) {
    if (flags.includes(flag) && FLAG_MESSAGES[flag]) {
      return { flag, ...FLAG_MESSAGES[flag] };
    }
  }
  return null;
}

/** Look up the warning descriptor for a specific flag (e.g. 'tab_switch'). */
export function getWarningForFlag(flag) {
  const msg = FLAG_MESSAGES[flag];
  return msg ? { flag, ...msg } : null;
}

// ---------- Speech-to-Text (Web Speech API) ----------

/**
 * Create a speech recognizer that appends recognized text via onResult.
 * Returns null if the browser doesn't support it (e.g. Firefox).
 */
export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createSpeechRecognizer({ onResult, onError, onEnd, onStart, lang = 'en-US' } = {}) {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;
  recognition.maxAlternatives = 1;

  let finalTranscript = '';
  let manuallyStopped = false;
  let isRunning = false;

  recognition.onstart = () => {
    isRunning = true;
    console.log('[Speech] recognition started');
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interim += transcript;
      }
    }
    if (onResult) onResult({ finalTranscript: finalTranscript.trim(), interim });
  };

  recognition.onerror = (event) => {
    console.warn('[Speech] error:', event.error);
    // 'no-speech' and 'aborted' are normal/recoverable — keep going.
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
      manuallyStopped = true; // fatal errors — don't auto-restart
      if (onError) onError(event.error);
    } else if (onError) {
      onError(event.error);
    }
  };

  recognition.onend = () => {
    isRunning = false;
    console.log('[Speech] recognition ended (manuallyStopped=' + manuallyStopped + ')');
    // Auto-restart unless the user explicitly stopped it (recognition
    // stops on its own after silence or errors).
    if (!manuallyStopped) {
      setTimeout(() => {
        try {
          recognition.start();
        } catch (e) {
          console.warn('[Speech] restart failed:', e.message);
        }
      }, 250);
    } else if (onEnd) {
      onEnd();
    }
  };

  return {
    start() {
      manuallyStopped = false;
      finalTranscript = '';
      if (isRunning) return;
      try {
        recognition.start();
      } catch (e) {
        console.warn('[Speech] start failed:', e.message);
      }
    },
    stop() {
      manuallyStopped = true;
      try { recognition.stop(); } catch (e) { /* not running */ }
    },
    reset() {
      finalTranscript = '';
    },
    isSupported: true,
  };
}
