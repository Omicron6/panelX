/**
 * Audio Intelligence Engine for Candidate Voice Monitoring
 * Captures audio from interview session and prepares chunks for STT analysis
 * Detects: speech presence, multiple speakers, volume anomalies
 */

const AUDIO_CONFIG = {
  sampleRate: 16000,           // 16kHz optimal for speech recognition
  channels: 1,                 // Mono for candidate voice
  chunkDurationMs: 2000,       // 2s chunks = ~64KB at 16-bit PCM
  bufferQueueLimit: 20,        // Max 40s of buffered audio
  frameSize: 512,              // Check silence every 512 samples
};

/**
 * Creates audio capture engine that buffers and emits chunks for STT
 */
export function createAudioIntelEngine() {
  let audioContext = null;
  let mediaStreamSource = null;
  let processor = null;
  let isRecording = false;
  let audioBuffer = null;
  let sampleCount = 0;
  let audioChunks = [];
  let speechMetrics = {
    isSpeaking: false,
    volumeLevel: 0,          // 0-1 normalized
    detectedSpeakers: 1,     // Initially assume single speaker
    silenceDuration: 0,
    lastSpeechTimestamp: null,
  };
  let chunkIndex = 0;

  /**
   * Initialize audio capture from media stream
   */
  async function init(mediaStream) {
    try {
      if (!mediaStream) {
        console.warn('[AudioIntel] No media stream provided');
        return false;
      }

      // Create audio context if needed
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: AUDIO_CONFIG.sampleRate,
        });
      }

      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create source from media stream
      if (mediaStreamSource) {
        mediaStreamSource.disconnect();
      }
      mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);

      // Create script processor for manual audio processing
      // Note: ScriptProcessorNode is deprecated but still works; AudioWorklet is alternative for future
      processor = audioContext.createScriptProcessor(
        AUDIO_CONFIG.frameSize,
        1, // input channels
        1  // output channels
      );

      // Audio data handler
      processor.onaudioprocess = handleAudioFrame;

      // Connect: microphone -> processor -> destination
      mediaStreamSource.connect(processor);
      processor.connect(audioContext.destination);

      isRecording = true;
      audioBuffer = new Float32Array(AUDIO_CONFIG.sampleRate * (AUDIO_CONFIG.chunkDurationMs / 1000));
      sampleCount = 0;
      audioChunks = [];

      console.log('[AudioIntel] Audio engine initialized');
      return true;
    } catch (err) {
      console.error('[AudioIntel] Init error:', err);
      return false;
    }
  }

  /**
   * Process incoming audio frames
   */
  function handleAudioFrame(event) {
    if (!isRecording) return;

    const inputData = event.inputBuffer.getChannelData(0);
    let sum = 0;
    let max = 0;

    // Detect speech presence and volume
    for (let i = 0; i < inputData.length; i++) {
      const sample = inputData[i];
      sum += sample * sample;
      max = Math.max(max, Math.abs(sample));

      // Copy to buffer
      if (sampleCount < audioBuffer.length) {
        audioBuffer[sampleCount++] = sample;
      }
    }

    // Calculate RMS volume (0-1)
    const rms = Math.sqrt(sum / inputData.length);
    speechMetrics.volumeLevel = Math.min(1, rms * 10); // Scale to 0-1

    // Update speech presence (threshold: 0.02)
    const isSpeechFrame = rms > 0.02;
    if (isSpeechFrame) {
      speechMetrics.lastSpeechTimestamp = Date.now();
      speechMetrics.isSpeaking = true;
      speechMetrics.silenceDuration = 0;
    } else {
      speechMetrics.silenceDuration += (AUDIO_CONFIG.frameSize / AUDIO_CONFIG.sampleRate) * 1000;
      if (speechMetrics.silenceDuration > 500) {
        speechMetrics.isSpeaking = false;
      }
    }

    // Emit chunk when buffer full
    if (sampleCount >= audioBuffer.length) {
      emitChunk();
    }
  }

  /**
   * Convert Float32 buffer to 16-bit PCM and emit for transmission
   */
  function emitChunk() {
    if (audioChunks.length >= AUDIO_CONFIG.bufferQueueLimit) {
      console.warn('[AudioIntel] Audio chunk queue full, dropping oldest');
      audioChunks.shift();
    }

    // Convert Float32 to 16-bit PCM
    const pcmData = new Int16Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      let s = Math.max(-1, Math.min(1, audioBuffer[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Emit chunk info
    const chunk = {
      index: chunkIndex++,
      audioBase64: btoa(String.fromCharCode.apply(null, new Uint8Array(pcmData.buffer))),
      duration: (sampleCount / AUDIO_CONFIG.sampleRate) * 1000, // ms
      timestamp: Date.now(),
      speechMetrics: { ...speechMetrics },
    };

    audioChunks.push(chunk);
    console.log(`[AudioIntel] Chunk ${chunk.index} buffered (${audioChunks.length} queued)`);

    // Reset buffer
    audioBuffer = new Float32Array(AUDIO_CONFIG.sampleRate * (AUDIO_CONFIG.chunkDurationMs / 1000));
    sampleCount = 0;
  }

  /**
   * Get snapshot of current audio metrics
   */
  function snapshot() {
    return {
      isSpeaking: speechMetrics.isSpeaking,
      volumeLevel: speechMetrics.volumeLevel,
      detectedSpeakers: speechMetrics.detectedSpeakers,
      silenceDuration: speechMetrics.silenceDuration,
      bufferSize: audioChunks.length,
      timestamp: Date.now(),
    };
  }

  /**
   * Get and clear buffered audio chunks for transmission
   */
  function getAndClearChunks() {
    const chunks = [...audioChunks];
    audioChunks = [];
    return chunks;
  }

  /**
   * Stop recording and cleanup
   */
  function stop() {
    try {
      isRecording = false;
      if (processor) {
        processor.disconnect();
        processor.onaudioprocess = null;
      }
      if (mediaStreamSource) {
        mediaStreamSource.disconnect();
      }
      console.log('[AudioIntel] Audio engine stopped');
    } catch (err) {
      console.error('[AudioIntel] Stop error:', err);
    }
  }

  /**
   * Cleanup and dispose resources
   */
  function dispose() {
    stop();
    if (audioContext) {
      audioContext.close().catch(() => {});
      audioContext = null;
    }
    audioBuffer = null;
    audioChunks = [];
  }

  return {
    init,
    snapshot,
    getAndClearChunks,
    stop,
    dispose,
  };
}
