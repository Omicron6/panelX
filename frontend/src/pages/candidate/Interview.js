import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Activity, ArrowRight, X } from 'lucide-react';
import { createVisionIntelEngine } from '@/lib/visionIntelEngine';
import { createStreamVisionSession } from '@/lib/streamVisionSession';
import { createAudioIntelEngine } from '@/lib/audioIntelEngine';
import { speak, speakWarning, evaluateProctorWarning, getWarningForFlag, createSpeechRecognizer, isSpeechRecognitionSupported } from '@/lib/proctorUtils';

const MAX_VIOLATIONS = 3;

// Circular AI Orb Component - Siri Style
const AIOrb = ({ type, isActive, state, delay }) => {
  const orbConfig = {
    question: {
      colors: 'from-cyan-400 via-blue-500 to-purple-500',
      label: 'Question Generator'
    },
    interviewer: {
      colors: 'from-blue-400 via-purple-500 via-pink-500 to-orange-400',
      label: 'Main Interviewer'
    },
    evaluator: {
      colors: 'from-purple-500 via-pink-500 to-red-400',
      label: 'Evaluator'
    }
  };

  const config = orbConfig[type];

  return (
    <div className="flex flex-col items-center">
      <motion.div
        animate={{
          y: [0, -12, 0],
          scale: isActive && state === 'speaking' ? [1, 1.1, 1] : 1,
        }}
        transition={{
          y: { duration: 3.5, repeat: Infinity, delay },
          scale: isActive && state === 'speaking' ? { duration: 0.8, repeat: Infinity } : {}
        }}
        className="relative"
      >
        {/* Outer Glow */}
        {isActive && (
          <motion.div
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${config.colors} blur-3xl`}
          />
        )}

        {/* Main Orb - Smaller Size */}
        <div className="relative w-28 h-28">
          {/* Base Gradient with multi-colors */}
          <motion.div
            animate={{
              rotate: [0, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${config.colors}`}
          >
            {/* Glass Shine Overlay */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-white/10 to-transparent" />
            
            {/* Inner Glow Layer */}
            <motion.div
              animate={{
                opacity: isActive ? [0.6, 0.9, 0.6] : 0.4
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-3 rounded-full bg-gradient-to-br from-white/30 to-transparent backdrop-blur-sm"
            />

            {/* Animated Bars in Center - Siri Style */}
            {(state === 'speaking' || state === 'listening') && (
              <div className="absolute inset-0 flex items-center justify-center space-x-1.5">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scaleY: state === 'speaking' 
                        ? [0.3, 1.2, 0.5, 1, 0.3]
                        : state === 'listening'
                        ? [0.4, 0.8, 0.4]
                        : 0.4
                    }}
                    transition={{
                      duration: state === 'speaking' ? 1.2 : 2,
                      repeat: Infinity,
                      delay: i * 0.15
                    }}
                    className="w-1.5 h-8 bg-white rounded-full shadow-lg"
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Outer Ripple when Speaking */}
          {isActive && state === 'speaking' && (
            <>
              <motion.div
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`absolute inset-0 rounded-full border-2 bg-gradient-to-r ${config.colors} opacity-40`}
              />
              <motion.div
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
                className={`absolute inset-0 rounded-full border-2 bg-gradient-to-r ${config.colors} opacity-30`}
              />
            </>
          )}

          {/* Pulsing Ring when Listening */}
          {state === 'listening' && (
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-3 border-white/50"
            />
          )}
        </div>
      </motion.div>

      {/* Label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0.7 }}
        className="text-gray-200 text-sm mt-3 font-semibold"
      >
        {config.label}
      </motion.p>
    </div>
  );
};

// Voice Waveform
const WaveformBars = ({ isActive }) => {
  return (
    <div className="flex items-center justify-center space-x-1 h-8">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: isActive ? [8, Math.random() * 24 + 8, 8] : 8
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.05
          }}
          className="w-1 bg-gradient-to-t from-purple-500 to-blue-400 rounded-full"
        />
      ))}
    </div>
  );
};

// Pre-Interview Screen
const PreInterviewScreen = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/30 to-gray-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full text-center"
      >
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="inline-block mb-6"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 flex items-center justify-center shadow-2xl">
            <Activity className="w-12 h-12 text-white" />
          </div>
        </motion.div>
        <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg" style={{ fontFamily: 'Bebas Neue' }}>
          AI Interview Experience
        </h1>
        <p className="text-white/90 text-xl mb-6 font-medium">
          Powered by intelligent voice agents
        </p>

        <div className="text-left bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 space-y-2">
          <p className="text-gray-200 text-sm flex items-start space-x-2">
            <span>🎤</span>
            <span>Answer by <span className="font-semibold text-white">speaking</span> — tap "Speak Answer" and your words are transcribed automatically.</span>
          </p>
          <p className="text-gray-200 text-sm flex items-start space-x-2">
            <span>📹</span>
            <span>Keep your face visible and stay alone in frame. The interview is <span className="font-semibold text-white">proctored</span>.</span>
          </p>
          <p className="text-gray-200 text-sm flex items-start space-x-2">
            <span>💡</span>
            <span>You can also edit the transcribed text before submitting each answer.</span>
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="w-full py-6 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center justify-center space-x-3"
        >
          <span>START INTERVIEW</span>
          <ArrowRight className="w-6 h-6" />
        </motion.button>
      </motion.div>
    </div>
  );
};

const Interview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [interviewState, setInterviewState] = useState('speaking');
  const [timeLeft, setTimeLeft] = useState(1800);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const currentQuestionRef = useRef(1); // always-fresh copy for async callbacks
  const [stream, setStream] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const wsRef = useRef(null);
  const intelIntervalRef = useRef(null);
  const seqRef = useRef(0);
  const visionEngineRef = useRef(null);
  const streamVisionSessionRef = useRef(null);
  const audioEngineRef = useRef(null);
  const [visionReady, setVisionReady] = useState(false);
  
  // Agent integration states
  const [sessionId, setSessionId] = useState(null);
  const [agentContext, setAgentContext] = useState(null);
  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const [questionsList, setQuestionsList] = useState([]);
  const [answerText, setAnswerText] = useState('');
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);
  const [interviewStartTime, setInterviewStartTime] = useState(null);
  const [totalQuestionsFromAgent, setTotalQuestionsFromAgent] = useState(5);
  // Interview difficulty — defaults to easy for demos.
  const [sessionDifficulty, setSessionDifficulty] = useState('easy');

  // Speech-to-text state
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognizerRef = useRef(null);
  const answerBaseRef = useRef(''); // text captured before current listening session
  const silenceTimerRef = useRef(null); // auto-submit after silence
  const submittedRef = useRef(false); // guards against double-submit per question

  // Proctoring warning state
  const [proctorWarning, setProctorWarning] = useState(null);
  const proctorWarnCountRef = useRef({});

  // Violation / strike system
  const [violationCount, setViolationCount] = useState(0);
  const violationCountRef = useRef(0);
  const lastViolationAtRef = useRef(0);
  const interviewEndingRef = useRef(false);

  // Fallback questions if agent unavailable
  const questions = [
    "Tell me about your experience with React and modern frontend development.",
    "Explain REST APIs with a practical example from your work.",
    "How do you approach problem-solving in complex technical challenges?",
    "Describe your experience with state management in large-scale applications.",
    "Where do you see yourself growing professionally in the next few years?"
  ];

  // Agent API functions
  const getApiBase = () => {
    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:8001';
    const normalizedApiBase = apiBase.replace(/\/$/, '');
    return normalizedApiBase.endsWith('/api') ? normalizedApiBase : `${normalizedApiBase}/api`;
  };

  const initializeInterviewSession = async () => {
    try {
      const apiRoot = getApiBase();

      // 1) If the URL id is a real admin-created session, use it directly.
      if (id && id !== 'interview' && id !== 'local-session') {
        try {
          const existing = await fetch(`${apiRoot}/interview/session/${id}`);
          if (existing.ok) {
            const sessionDoc = await existing.json();
            setSessionId(sessionDoc.id);
            setAgentContext(sessionDoc.context || null);
            setInterviewStartTime(Date.now());
            console.log('[Agent] Using existing admin session:', sessionDoc.id);
            return sessionDoc.id;
          }
        } catch (e) {
          console.warn('[Agent] Could not load existing session, will create a new one.', e);
        }
      }

      // 2) Otherwise create a new session (demo / direct access fallback).
      const response = await fetch(`${apiRoot}/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: localStorage.getItem('user_email') || 'Candidate',
          job_description: 'Software Developer Role with focus on frontend and API development',
          required_skills: ['React', 'JavaScript', 'REST API', 'Problem Solving'],
          candidate_resume: 'Experienced software developer',
          interview_type: 'technical',
          company_type: 'startup'
        })
      });

      if (!response.ok) throw new Error('Failed to start interview');

      const data = await response.json();
      const realSessionId = data.session_id;
      setSessionId(realSessionId);
      setAgentContext(data.context);
      setInterviewStartTime(Date.now());

      console.log('[Agent] New interview session created:', realSessionId);
      return realSessionId;
    } catch (error) {
      console.error('[Agent] Failed to initialize interview:', error);
      throw error;
    }
  };

  const fetchNextQuestion = async (currentSessionId, questionNumber) => {
    try {
      const apiRoot = getApiBase();
      setIsLoadingQuestion(true);

      // Use the passed question number (fresh) or fall back to the ref.
      const qNum = questionNumber || currentQuestionRef.current;

      // Last question is a coding challenge; the first questions are theoretical.
      const isLast = qNum >= totalQuestionsFromAgent;
      const questionType = isLast ? 'coding' : 'theoretical';

      // Difficulty is driven by the session setting (easy for demos).
      const difficulty = sessionDifficulty;

      const response = await fetch(`${apiRoot}/interview/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId || sessionId,
          difficulty,
          question_type: questionType
        })
      });

      if (!response.ok) throw new Error('Failed to fetch question');
      
      const data = await response.json();
      setCurrentQuestionData(data.question);
      setQuestionsList((prev) => [...prev, data.question]);
      setAnswerText('');
      setCurrentEvaluation(null);
      
      console.log('[Agent] Question fetched:', data.question.id);
      setIsLoadingQuestion(false);
      return data.question;
    } catch (error) {
      console.error('[Agent] Failed to fetch question, using fallback:', error);
      // Build a local fallback question so the interview keeps working
      // (answer box, TTS, and submit all depend on currentQuestionData).
      const fallbackText = questions[(qNum - 1) % questions.length];
      const fallbackQuestion = {
        id: `fallback-${qNum}-${Date.now()}`,
        question: fallbackText,
        text: fallbackText,
        type: questionType,
        difficulty,
        generation_source: 'client_fallback',
      };
      setCurrentQuestionData(fallbackQuestion);
      setQuestionsList((prev) => [...prev, fallbackQuestion]);
      setAnswerText('');
      setCurrentEvaluation(null);
      setIsLoadingQuestion(false);
      return fallbackQuestion;
    }
  };

  // Silence-based auto-submit: after the candidate stops speaking for a few
  // seconds (and has said something), submit the answer automatically.
  const SILENCE_MS = 4500;
  const scheduleSilenceAutoSubmit = (currentAnswer) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      const finalAnswer = (currentAnswer || '').trim();
      // Only auto-submit if there's a meaningful answer and not already submitted
      if (finalAnswer.length >= 2 && !submittedRef.current) {
        console.log('[Interview] Silence detected — auto-submitting answer');
        stopListening();
        submitAnswerToAgent(finalAnswer);
      }
    }, SILENCE_MS);
  };

  // ---- Speech-to-text controls ----
  const startListening = () => {
    // Stop the AI from talking so the mic doesn't capture its voice
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    if (!recognizerRef.current) {
      const recognizer = createSpeechRecognizer({
        onResult: ({ finalTranscript, interim }) => {
          // Combine any pre-existing answer text with what's being spoken now
          const base = answerBaseRef.current ? answerBaseRef.current.trim() + ' ' : '';
          const combined = (base + finalTranscript).trim();
          setAnswerText(combined);
          setInterimText(interim || '');
          // Reset the silence timer every time new speech comes in
          scheduleSilenceAutoSubmit((combined + ' ' + (interim || '')).trim());
        },
        onError: (err) => {
          if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture') {
            alert('Microphone access is blocked. Please allow microphone permission in your browser and try again.');
            setIsListening(false);
          }
        },
        onEnd: () => {
          setIsListening(false);
          setInterimText('');
        },
      });

      if (!recognizer) {
        setSpeechSupported(false);
        alert('Voice input is not supported in this browser. Please use Chrome or Edge, or type your answer.');
        return;
      }
      recognizerRef.current = recognizer;
    }

    // Preserve whatever the candidate already has in the box
    answerBaseRef.current = answerText || '';
    recognizerRef.current.start();
    setIsListening(true);
    setInterviewState('listening');
  };

  const stopListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setIsListening(false);
    setInterimText('');
  };

  const submitAnswerToAgent = async (answerText) => {
    try {
      if (!currentQuestionData) return;
      if (submittedRef.current) return; // already submitted this question
      submittedRef.current = true;
      // Stop capturing speech when the answer is submitted
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (recognizerRef.current) {
        recognizerRef.current.stop();
        setIsListening(false);
        setInterimText('');
      }
      
      const apiRoot = getApiBase();
      setIsSavingAnswer(true);

      const response = await fetch(`${apiRoot}/interview/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: currentQuestionData.id,
          answer_text: answerText,
          attempt: 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Agent] Answer evaluated (hidden):', data.evaluation?.score);
      } else {
        // Fallback question (not in DB) or transient error — don't block the flow
        console.warn('[Agent] Answer not scored by backend (continuing anyway)');
      }

      setInterviewState('processing');
      const isLastQuestion = currentQuestionRef.current >= totalQuestionsFromAgent;

      // Brief, neutral acknowledgement — no score revealed.
      const ack = isLastQuestion
        ? 'Thank you. That was the last question. Let me prepare your results.'
        : 'Thank you. Let\'s move on to the next question.';

      speak(ack, {
        onEnd: () => {
          setInterviewState('idle');
          setTimeout(() => { handleNextQuestion(); }, 400);
        },
      });

      setIsSavingAnswer(false);
    } catch (error) {
      console.error('[Agent] Error submitting answer (continuing):', error);
      setIsSavingAnswer(false);
      // Still advance so the interview never gets stuck
      setInterviewState('idle');
      setTimeout(() => { handleNextQuestion(); }, 400);
    }
  };

  const sendBehaviorAnalysisToAgent = async (visionSnapshot, audioSnapshot) => {
    try {
      if (!sessionId) return;
      
      const apiRoot = getApiBase();
      
      const response = await fetch(`${apiRoot}/interview/behavior`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          eye_contact: visionSnapshot?.eye_contact || 0.75,
          attention_score: visionSnapshot?.attention_score || 0.80,
          additional_metrics: {
            face_presence: visionSnapshot?.face_presence_ratio || 0.95,
            stress_level: visionSnapshot?.stress_proxy || 0.3,
            audio_speaking: audioSnapshot?.isSpeaking || false,
            audio_volume: audioSnapshot?.volumeLevel || 0
          }
        })
      });

      if (!response.ok) throw new Error('Failed to send behavior analysis');
      
      const data = await response.json();
      console.log('[Agent] Behavior analysis:', data.analysis);
      return data.analysis;
    } catch (error) {
      console.error('[Agent] Failed to send behavior analysis:', error);
    }
  };

  // Detect speech-to-text support once on mount
  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  // Tab-switch / window-blur detection = proctoring violation
  useEffect(() => {
    if (showGuidelines) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const warning = getWarningForFlag('tab_switch');
        if (warning) registerViolation(warning);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGuidelines]);

  // Read each new question aloud once, then auto-start listening.
  useEffect(() => {
    const qText = currentQuestionData?.text || currentQuestionData?.question;
    if (!qText || isLoadingQuestion) return;

    // Reset answer for the new question
    setAnswerText('');
    setInterimText('');
    answerBaseRef.current = '';
    submittedRef.current = false; // allow a fresh submit for the new question

    console.log('[Interview] Reading question aloud:', qText);
    setInterviewState('speaking');

    // Make sure the mic isn't running while the AI talks
    if (recognizerRef.current) {
      recognizerRef.current.stop();
      setIsListening(false);
    }

    speak('Here is your next question. ' + qText, {
      onEnd: () => {
        console.log('[Interview] Finished reading question, starting to listen');
        // After the AI finishes reading, automatically start listening
        if (speechSupported) {
          startListening();
        } else {
          setInterviewState('idle');
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionData]);

  // Central handler: register a proctoring violation, warn, and enforce strikes.
  const registerViolation = (warning) => {
    if (interviewEndingRef.current) return;

    // Global cooldown so a single event isn't counted many times in a row
    const now = Date.now();
    if (now - lastViolationAtRef.current < 6000) {
      return;
    }
    lastViolationAtRef.current = now;

    violationCountRef.current += 1;
    const count = violationCountRef.current;
    setViolationCount(count);

    const remaining = MAX_VIOLATIONS - count;

    if (count >= MAX_VIOLATIONS) {
      // Third strike — end the interview
      const endMsg = {
        flag: warning.flag,
        title: 'Interview ended',
        message: 'Multiple proctoring violations were detected. The interview is being ended.',
        severity: 'high',
      };
      setProctorWarning(endMsg);
      speak('You have exceeded the allowed number of warnings. The interview will now end.', {
        onEnd: () => endInterviewForViolation(),
      });
      // Safety fallback in case TTS doesn't fire onEnd
      setTimeout(() => endInterviewForViolation(), 6000);
    } else {
      const withStrike = {
        ...warning,
        message: `${warning.message}  (Warning ${count} of ${MAX_VIOLATIONS} — ${remaining} left before the interview ends.)`,
      };
      setProctorWarning(withStrike);
      speakWarning(warning.voice);
      setTimeout(() => {
        setProctorWarning((current) => (current && current.flag === warning.flag ? null : current));
      }, 6000);
    }
  };

  const endInterviewForViolation = () => {
    if (interviewEndingRef.current) return;
    interviewEndingRef.current = true;
    finishInterview(true);
  };

  // Proctoring: evaluate the vision snapshot and warn/strike on malpractice.
  const checkProctoring = (snapshot) => {
    const warning = evaluateProctorWarning(snapshot);
    if (!warning) return;

    // Require the same flag to appear twice in a row before acting,
    // so a single noisy frame doesn't trigger a false alarm.
    const counts = proctorWarnCountRef.current;
    counts[warning.flag] = (counts[warning.flag] || 0) + 1;
    Object.keys(counts).forEach((k) => {
      if (k !== warning.flag) counts[k] = 0;
    });

    if (counts[warning.flag] < 2) return;
    counts[warning.flag] = 0;

    registerViolation(warning);
  };

  // Initialize camera when interview starts
  useEffect(() => {
    if (!showGuidelines) {
      startCamera();
      connectInterviewSocket();
    }
    return () => {
      // Cleanup camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (intelIntervalRef.current) {
        clearInterval(intelIntervalRef.current);
        intelIntervalRef.current = null;
      }
      if (visionEngineRef.current) {
        visionEngineRef.current.dispose();
        visionEngineRef.current = null;
      }
      if (audioEngineRef.current) {
        audioEngineRef.current.dispose();
        audioEngineRef.current = null;
      }
      if (streamVisionSessionRef.current) {
        streamVisionSessionRef.current.disconnect();
        streamVisionSessionRef.current = null;
      }
      if (recognizerRef.current) {
        recognizerRef.current.stop();
        recognizerRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      // Stop any AI speech on unmount
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGuidelines]);

  useEffect(() => {
    if (!showGuidelines && stream && videoRef.current) {
      initVisionAndStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGuidelines, stream]);

  useEffect(() => {
    if (!showGuidelines && stream) {
      if (intelIntervalRef.current) {
        clearInterval(intelIntervalRef.current);
      }

      sendVisionIntelPacket();

      intelIntervalRef.current = setInterval(() => {
        sendVisionIntelPacket();

        const snapshot = visionEngineRef.current ? visionEngineRef.current.snapshot() : null;

        // Proctoring: gently warn on malpractice signals
        checkProctoring(snapshot);

        // Send behavior analysis every 10 seconds
        if (sessionId && currentQuestion % 2 === 0) {
          const audioSnapshot = audioEngineRef.current ? audioEngineRef.current.snapshot() : null;
          sendBehaviorAnalysisToAgent(snapshot, audioSnapshot);
        }
      }, 5000);
    }

    return () => {
      if (intelIntervalRef.current) {
        clearInterval(intelIntervalRef.current);
        intelIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGuidelines, stream, interviewState, sessionId]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please grant camera permissions and try again.');
    }
  };

  const initVisionAndStream = async () => {
    try {
      if (!visionEngineRef.current) {
        const engine = createVisionIntelEngine({ fps: 12, maxFaces: 2 });
        await engine.init();
        engine.start(videoRef.current);
        visionEngineRef.current = engine;
        setVisionReady(true);
      }
    } catch (error) {
      console.warn('MediaPipe vision engine unavailable. Using telemetry fallback.', error);
      setVisionReady(false);
    }

    // Initialize audio capture from media stream
    try {
      if (!audioEngineRef.current && stream) {
        const audioEngine = createAudioIntelEngine();
        const audioInitSuccess = await audioEngine.init(stream);
        if (audioInitSuccess) {
          audioEngineRef.current = audioEngine;
          console.log('[Interview] Audio engine initialized');
        }
      }
    } catch (error) {
      console.warn('Audio engine initialization failed. Continuing without audio.', error);
    }

    try {
      if (!streamVisionSessionRef.current) {
        streamVisionSessionRef.current = await createStreamVisionSession({
          callId: id || 'local-session',
          userId: `candidate-${id || 'local'}`
        });
      }
    } catch (error) {
      console.warn('Stream Vision session unavailable. Continuing with WS transport.', error);
    }
  };

  const getWebSocketUrl = () => {
    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:8001';
    const normalizedApiBase = apiBase
      .replace(/\/$/, '')
      .replace(/\/api$/, '');
    const wsBase = process.env.REACT_APP_WS_URL || normalizedApiBase.replace(/^http/i, 'ws');
    const sessionId = id || 'local-session';
    return `${wsBase}/ws/interview/${sessionId}`;
  };

  const connectInterviewSocket = () => {
    try {
      const wsUrl = getWebSocketUrl();
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setWsStatus('connected');
        console.log('[Interview] WS connected:', wsUrl);
      };

      socket.onclose = () => {
        setWsStatus('disconnected');
        console.warn('[Interview] WS disconnected');
      };

      socket.onerror = (event) => {
        setWsStatus('error');
        console.error('[Interview] WS error:', event);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'vision_intel_ack') {
            // ACK received; no UI rendering needed for packet capture phase.
          }
        } catch (error) {
          console.error('Invalid WS message:', error);
        }
      };

      wsRef.current = socket;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setWsStatus('error');
    }
  };

  const sendIntelPacketViaHttp = async (packet) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:8001';
      const normalizedApiBase = apiBase.replace(/\/$/, '');
      const apiRoot = normalizedApiBase.endsWith('/api')
        ? normalizedApiBase
        : `${normalizedApiBase}/api`;

      await fetch(`${apiRoot}/interview/intel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packet)
      });
    } catch (error) {
      console.error('[Interview] HTTP intel fallback failed:', error);
    }
  };

  const sendVisionIntelPacket = () => {
    seqRef.current += 1;
    const focused = typeof document.hasFocus === 'function' ? document.hasFocus() : true;
    const visible = document.visibilityState === 'visible';
    const snapshot = visionEngineRef.current ? visionEngineRef.current.snapshot() : null;
    const audioSnapshot = audioEngineRef.current ? audioEngineRef.current.snapshot() : null;
    const audioChunks = audioEngineRef.current ? audioEngineRef.current.getAndClearChunks() : [];
    const fallbackAttention = focused && visible ? 0.82 : 0.45;
    const fallbackEyeContact = focused ? 0.76 : 0.42;

    const packet = {
      version: 1,
      seq: seqRef.current,
      session_id: id || 'local-session',
      timestamp: new Date().toISOString(),
      window_sec: 5,
      face_count: snapshot ? snapshot.face_count : 1,
      face_presence_ratio: snapshot ? snapshot.face_presence_ratio : (visible ? 1 : 0.6),
      gaze_offscreen_ratio: snapshot ? snapshot.gaze_offscreen_ratio : (focused ? 0.2 : 0.62),
      head_turn_ratio: snapshot ? snapshot.head_turn_ratio : (focused ? 0.25 : 0.55),
      eye_contact: snapshot ? snapshot.eye_contact : fallbackEyeContact,
      attention_score: snapshot ? snapshot.attention_score : fallbackAttention,
      confidence_proxy: snapshot
        ? snapshot.confidence_proxy
        : interviewState === 'listening'
          ? 0.72
          : 0.66,
      stress_proxy: snapshot
        ? snapshot.stress_proxy
        : interviewState === 'processing'
          ? 0.48
          : 0.32,
      anomaly_flags: snapshot
        ? snapshot.anomaly_flags
        : focused
          ? []
          : ['offscreen_attention_drop'],
      quality_score: snapshot ? snapshot.quality_score : (visible ? 0.8 : 0.5),
      audio_metrics: audioSnapshot || {
        isSpeaking: false,
        volumeLevel: 0,
        detectedSpeakers: 1,
        silenceDuration: 0,
        bufferSize: 0,
        timestamp: Date.now()
      },
      audio_chunks_count: audioChunks.length,
      audio_chunks: audioChunks,
      transport_meta: {
        source: snapshot ? 'frontend_mediapipe' : 'frontend_fallback',
        vision_ready: visionReady,
        audio_ready: !!audioEngineRef.current,
        audio_chunks_sent: audioChunks.length,
        ws_status: wsStatus
      }
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'vision_intel', data: packet }));
      return;
    }

    // Fallback path to ensure packet capture still works if WS is unavailable.
    sendIntelPacketViaHttp(packet);
  };

  const enterFullscreen = async () => {
    try {
      if (containerRef.current) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (containerRef.current.webkitRequestFullscreen) {
          await containerRef.current.webkitRequestFullscreen();
        } else if (containerRef.current.msRequestFullscreen) {
          await containerRef.current.msRequestFullscreen();
        }
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  };

  const handleStartInterview = async () => {
    try {
      setShowGuidelines(false);

      // Enter fullscreen
      setTimeout(() => { enterFullscreen(); }, 100);

      // Initialize agent session
      const newSessionId = await initializeInterviewSession();

      // Spoken interviewer intro, then load the first question
      const candidateName = (localStorage.getItem('user_email') || '').split('@')[0] || 'there';
      const intro = `Hello ${candidateName}, welcome to your interview. I'm your AI interviewer today. ` +
        `I'll ask you a few questions. When you're ready to answer, tap the Speak Answer button and talk naturally. ` +
        `Take your time, and let's begin with the first question.`;

      setInterviewState('speaking');
      speak(intro, {
        onEnd: async () => {
          // Fetch and read the first question after the intro finishes
          try {
            currentQuestionRef.current = 1;
            setCurrentQuestion(1);
            await fetchNextQuestion(newSessionId, 1);
          } catch (e) {
            console.error('Failed to fetch first question:', e);
          }
        },
      });
    } catch (error) {
      console.error('Failed to start interview:', error);
      alert('Failed to start interview. Please try again.');
      setShowGuidelines(true);
    }
  };

  useEffect(() => {
    if (!showGuidelines) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/candidate/results');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showGuidelines, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const finishInterview = async (dueToViolation = false) => {
    // Stop any AI speech immediately
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    // Stop any speech recognition immediately
    if (recognizerRef.current) {
      recognizerRef.current.stop();
      setIsListening(false);
    }
    // Clear any pending silence-based auto-submit timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    try {
      const apiRoot = getApiBase();
      
      // Call the decision endpoint to get final evaluation
      if (sessionId) {
        await fetch(`${apiRoot}/interview/decision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            terminated: dueToViolation,
            termination_reason: dueToViolation ? 'Proctoring violations detected' : null,
            violation_count: violationCountRef.current
          })
        });
      }
    } catch (error) {
      console.error('[Agent] Decision endpoint error (non-blocking):', error);
    }
    
    // Cleanup resources
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (intelIntervalRef.current) {
      clearInterval(intelIntervalRef.current);
      intelIntervalRef.current = null;
    }
    if (visionEngineRef.current) {
      visionEngineRef.current.dispose();
      visionEngineRef.current = null;
    }
    if (streamVisionSessionRef.current) {
      await streamVisionSessionRef.current.disconnect();
      streamVisionSessionRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Store session and navigate to results
    await exitFullscreen().catch(() => {});
    sessionStorage.setItem('current_session_id', sessionId);
    navigate('/candidate/results', {
      state: { sessionId, terminated: dueToViolation }
    });
  };

  const handleNextQuestion = async () => {
    try {
      const current = currentQuestionRef.current;
      if (current < totalQuestionsFromAgent) {
        const next = current + 1;
        currentQuestionRef.current = next;
        setCurrentQuestion(next);
        // Fetch next question from agent (pass the fresh number)
        await fetchNextQuestion(sessionId, next);
      } else {
        // All questions done - get decision and navigate to results
        await finishInterview();
      }
    } catch (error) {
      console.error('Failed to load next question:', error);
      alert('Failed to load next question. Please try again.');
    }
  };

  const handleEndInterview = async () => {
    if (window.confirm('Are you sure you want to end the interview?')) {
      await finishInterview();
    }
  };

  if (showGuidelines) {
    return <PreInterviewScreen onStart={handleStartInterview} />;
  }

  const getVoiceStatus = () => {
    switch (interviewState) {
      case 'speaking':
        return { icon: '🎙️', text: 'AI is speaking...', color: 'text-purple-400' };
      case 'listening':
        return { icon: '🎤', text: 'Listening...', color: 'text-green-400' };
      case 'processing':
        return { icon: '🧠', text: 'Analyzing response...', color: 'text-blue-400' };
      default:
        return { icon: '🎙️', text: '', color: 'text-gray-400' };
    }
  };

  const voiceStatus = getVoiceStatus();

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/30 flex flex-col overflow-hidden">
      {/* PROCTORING WARNING POPUP */}
      <AnimatePresence>
        {proctorWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90%]"
          >
            <div className={`flex items-start space-x-3 px-5 py-4 rounded-2xl backdrop-blur-xl border shadow-2xl ${
              proctorWarning.severity === 'high'
                ? 'bg-red-950/80 border-red-500/60'
                : proctorWarning.severity === 'medium'
                ? 'bg-orange-950/80 border-orange-500/60'
                : 'bg-yellow-950/70 border-yellow-500/50'
            }`}>
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="text-white font-bold text-sm mb-0.5">{proctorWarning.title}</p>
                <p className="text-gray-200 text-sm">{proctorWarning.message}</p>
              </div>
              <button
                onClick={() => setProctorWarning(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-black/30 backdrop-blur-xl rounded-full border border-gray-700">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">Recording</span>
          </div>
          <div className="px-3 py-1.5 bg-black/30 backdrop-blur-xl rounded-full border border-gray-700 text-white text-sm font-medium">
            Question {currentQuestion}/{totalQuestionsFromAgent}
          </div>
          {violationCount > 0 && (
            <div className={`px-3 py-1.5 backdrop-blur-xl rounded-full border text-sm font-bold ${
              violationCount >= MAX_VIOLATIONS - 1
                ? 'bg-red-500/20 border-red-500/60 text-red-300'
                : 'bg-yellow-500/20 border-yellow-500/60 text-yellow-300'
            }`}>
              ⚠ Warnings {violationCount}/{MAX_VIOLATIONS}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 px-4 py-1.5 bg-black/30 backdrop-blur-xl rounded-full border border-gray-700">
          <Clock className="w-4 h-4 text-purple-400" />
          <span className="text-white font-bold" style={{ fontFamily: 'Bebas Neue' }}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-between py-24 px-8">
        {/* TOP - AI Orbs */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center space-x-16"
        >
          <AIOrb
            type="question"
            isActive={interviewState === 'speaking'}
            state={interviewState}
            delay={0}
          />
          <AIOrb
            type="interviewer"
            isActive={true}
            state={interviewState}
            delay={0.5}
          />
          <AIOrb
            type="evaluator"
            isActive={interviewState === 'processing'}
            state={interviewState}
            delay={1}
          />
        </motion.div>

        {/* MIDDLE - Camera */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl"
        >
          <div className="relative aspect-video bg-gray-900 rounded-3xl overflow-hidden border border-purple-500/20 shadow-2xl">
            {/* Real Camera Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Overlay when camera is not available */}
            {!stream && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600/30 to-blue-500/30 flex items-center justify-center border border-purple-500/30">
                    <Activity className="w-12 h-12 text-purple-400" />
                  </div>
                  <p className="text-gray-300 text-lg font-medium">Initializing Camera...</p>
                </div>
              </div>
            )}
            
            {/* Camera frame overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-2 border-purple-500/10 rounded-3xl" />
            </div>
          </div>
        </motion.div>

        {/* BOTTOM - Question Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl space-y-4"
        >
          {/* Question */}
          <AnimatePresence mode="wait">
            {isLoadingQuestion ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-800/40 backdrop-blur-2xl border border-gray-700/50 rounded-2xl p-6 shadow-xl text-center"
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                  <p className="text-gray-200 font-medium">Loading question from agent...</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gray-800/40 backdrop-blur-2xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">
                    Question {currentQuestion} of {totalQuestionsFromAgent}
                  </span>
                  {currentQuestionData?.difficulty && (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      currentQuestionData.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                      currentQuestionData.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {currentQuestionData.difficulty.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-white text-xl text-center font-medium leading-relaxed">
                  {currentQuestionData?.text || questions[currentQuestion - 1] || 'Loading...'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Answer Input Section */}
          {!isLoadingQuestion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-800/40 backdrop-blur-2xl border border-gray-700/50 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-200 uppercase tracking-widest">Your Answer</label>
                {speechSupported ? (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                      isListening
                        ? 'bg-red-500/20 text-red-300 border border-red-500/50 animate-pulse'
                        : 'bg-purple-500/20 text-purple-200 border border-purple-500/50 hover:bg-purple-500/30'
                    }`}
                  >
                    <span className="text-base">{isListening ? '🔴' : '🎤'}</span>
                    <span>{isListening ? 'Stop & Listening...' : 'Speak Answer'}</span>
                  </button>
                ) : (
                  <span className="text-xs text-yellow-400">Voice input not supported in this browser — please type.</span>
                )}
              </div>
              <textarea
                value={isListening ? (answerText + (interimText ? (answerText ? ' ' : '') + interimText : '')) : answerText}
                onChange={(e) => {
                  // Only allow manual edits when not actively listening
                  if (!isListening) setAnswerText(e.target.value);
                }}
                readOnly={isListening}
                placeholder={speechSupported ? 'Tap "Speak Answer" and start talking — your words appear here...' : 'Type your answer here...'}
                className="w-full h-24 bg-gray-900/50 border border-gray-600/50 rounded-lg p-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all resize-none"
              />
              {isListening && (
                <p className="text-xs text-purple-300 flex items-center space-x-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span>Listening — speak clearly. Tap "Stop" when finished.</span>
                </p>
              )}
              
              {isSavingAnswer && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2 text-purple-300 text-sm"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                  <span>Recording your answer...</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Voice Status */}
          <div className="flex flex-col items-center space-y-3">
            <motion.div
              key={interviewState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex items-center space-x-2 text-white font-bold`}
            >
              <span className="text-lg">{interviewState === 'speaking' ? '🎤' : interviewState === 'listening' ? '👂' : '⏳'}</span>
              <span>{interviewState === 'speaking' ? 'AI Speaking' : interviewState === 'listening' ? 'Listening to you' : 'Processing...'}</span>
            </motion.div>

            <WaveformBars isActive={interviewState !== 'processing'} />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEndInterview}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-white rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
              <span className="font-medium">End Interview</span>
            </motion.button>

            {!isSavingAnswer && !isLoadingQuestion && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Stop listening first so any final words are captured
                  if (isListening) stopListening();
                  const finalAnswer = (answerText + (interimText ? ' ' + interimText : '')).trim();
                  if (!finalAnswer) {
                    alert('Please speak or type your answer before submitting.');
                    return;
                  }
                  submitAnswerToAgent(finalAnswer);
                }}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold transition-all shadow-lg"
              >
                Submit Answer
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Interview;
