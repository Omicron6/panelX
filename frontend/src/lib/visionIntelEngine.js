const clamp01 = (value) => Math.max(0, Math.min(1, value));

const average = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

export function createVisionIntelEngine(options = {}) {
  const config = {
    modelAssetPath:
      options.modelAssetPath ||
      'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
    maxFaces: options.maxFaces || 2,
    fps: options.fps || 12,
  };

  let running = false;
  let faceLandmarker = null;
  let rafId = null;
  let lastVideoTime = -1;
  let frameIntervalMs = Math.round(1000 / config.fps);
  let lastFrameAt = 0;
  let prevNose = null;

  const history = [];

  const pushHistory = (sample) => {
    history.push(sample);
    if (history.length > 90) {
      history.shift();
    }
  };

  const buildSnapshot = () => {
    if (!history.length) {
      return {
        sample_count: 0,
        face_count: 0,
        face_presence_ratio: 0,
        gaze_offscreen_ratio: 1,
        head_turn_ratio: 1,
        eye_contact: 0,
        attention_score: 0,
        confidence_proxy: 0,
        stress_proxy: 0,
        quality_score: 0,
        anomaly_flags: ['no_face'],
      };
    }

    const presence = average(history.map((h) => h.facePresent ? 1 : 0));
    const faceCountAvg = average(history.map((h) => h.faceCount));
    const gazeOffscreen = average(history.map((h) => h.gazeOffscreen));
    const headTurn = average(history.map((h) => h.headTurn));
    const jitter = average(history.map((h) => h.jitter));

    const eyeContact = clamp01((1 - gazeOffscreen) * presence);
    const attentionScore = clamp01((1 - (0.6 * gazeOffscreen + 0.4 * headTurn)) * presence);
    const confidenceProxy = clamp01(0.55 * eyeContact + 0.45 * (1 - jitter));
    const stressProxy = clamp01(0.65 * jitter + 0.35 * gazeOffscreen);

    const anomalyFlags = [];
    if (faceCountAvg > 1.2) anomalyFlags.push('multiple_people_detected');
    // Tightened: catch sideways glances / head turns sooner
    if (gazeOffscreen > 0.32 || headTurn > 0.4) anomalyFlags.push('offscreen_focus_drop');
    if (presence < 0.6) anomalyFlags.push('low_face_presence');
    // Camera covered / candidate absent: almost no face detected across the window
    if (presence < 0.15) anomalyFlags.push('camera_blocked');

    return {
      sample_count: history.length,
      face_count: Number(faceCountAvg.toFixed(2)),
      face_presence_ratio: Number(presence.toFixed(3)),
      gaze_offscreen_ratio: Number(gazeOffscreen.toFixed(3)),
      head_turn_ratio: Number(headTurn.toFixed(3)),
      eye_contact: Number(eyeContact.toFixed(3)),
      attention_score: Number(attentionScore.toFixed(3)),
      confidence_proxy: Number(confidenceProxy.toFixed(3)),
      stress_proxy: Number(stressProxy.toFixed(3)),
      quality_score: Number((presence * (1 - jitter)).toFixed(3)),
      anomaly_flags: anomalyFlags,
    };
  };

  const analyzeFace = (faceLandmarks) => {
    if (!faceLandmarks || !faceLandmarks.length) {
      prevNose = null;
      return {
        facePresent: false,
        faceCount: 0,
        gazeOffscreen: 1,
        headTurn: 1,
        jitter: 0.6,
      };
    }

    const face = faceLandmarks[0];
    const nose = face[1] || face[4] || face[0];
    if (!nose) {
      return {
        facePresent: true,
        faceCount: faceLandmarks.length,
        gazeOffscreen: 0.7,
        headTurn: 0.6,
        jitter: 0.5,
      };
    }

    const dx = Math.abs(nose.x - 0.5);
    const dy = Math.abs(nose.y - 0.5);
    const gazeOffscreen = clamp01(dx * 1.9 + dy * 0.8);
    const headTurn = clamp01(dx * 2.1);

    let jitter = 0;
    if (prevNose) {
      const move = Math.hypot(nose.x - prevNose.x, nose.y - prevNose.y);
      jitter = clamp01(move * 20);
    }
    prevNose = { x: nose.x, y: nose.y };

    return {
      facePresent: true,
      faceCount: faceLandmarks.length,
      gazeOffscreen,
      headTurn,
      jitter,
    };
  };

  const loop = (videoElement) => {
    if (!running || !faceLandmarker || !videoElement) return;

    const now = performance.now();
    if (now - lastFrameAt < frameIntervalMs) {
      rafId = requestAnimationFrame(() => loop(videoElement));
      return;
    }

    if (videoElement.readyState >= 2 && videoElement.currentTime !== lastVideoTime) {
      lastVideoTime = videoElement.currentTime;
      lastFrameAt = now;

      const result = faceLandmarker.detectForVideo(videoElement, now);
      const sample = analyzeFace(result.faceLandmarks || []);
      pushHistory(sample);
    }

    rafId = requestAnimationFrame(() => loop(videoElement));
  };

  return {
    async init() {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );

      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: config.modelAssetPath,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: config.maxFaces,
      });
    },

    start(videoElement) {
      if (!faceLandmarker || !videoElement || running) return;
      running = true;
      loop(videoElement);
    },

    stop() {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },

    snapshot() {
      return buildSnapshot();
    },

    dispose() {
      this.stop();
      if (faceLandmarker) {
        faceLandmarker.close();
      }
      faceLandmarker = null;
      prevNose = null;
      history.length = 0;
    },
  };
}
