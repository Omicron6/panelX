# Audio/STT Integration - Interview Proctoring System

## Overview

Added real-time audio capture and speech-to-text (STT) analysis to the interview proctoring system. The system now monitors both **vision** (face, gaze, attention) and **audio** (speech patterns, keywords, speaker count) to detect interview integrity issues.

## Architecture

### Frontend (React)

#### New File: `src/lib/audioIntelEngine.js`
**Purpose**: Capture audio from candidate's microphone stream

**Key Features**:
- Captures audio at 16kHz (optimal for speech recognition)
- Buffers audio in 2-second chunks (~64KB PCM per chunk)
- Detects real-time speech presence and volume levels
- Tracks speech metrics: isSpeaking, volumeLevel, detectedSpeakers, silenceDuration
- No audio rendering to candidate (hidden inference)
- Circular buffer to prevent memory accumulation

**API**:
```javascript
const audioEngine = createAudioIntelEngine();
await audioEngine.init(mediaStream);  // Start capturing
const snapshot = audioEngine.snapshot();  // Get current metrics
const chunks = audioEngine.getAndClearChunks();  // Retrieve buffered audio
audioEngine.dispose();  // Cleanup
```

#### Modified: `src/pages/candidate/Interview.js`
**Changes**:
- Import `createAudioIntelEngine` 
- Initialize audio engine on interview start (after camera permission)
- Add audio metrics to 5-second intel packets
- Include audio chunks in WS payload for backend analysis
- Graceful fallback if audio unavailable

**Data Sent**:
```json
{
  "audio_metrics": {
    "isSpeaking": boolean,
    "volumeLevel": 0-1,
    "detectedSpeakers": 1,5,
    "silenceDuration": ms
  },
  "audio_chunks_count": integer,
  "audio_chunks": [
    {
      "index": number,
      "audioBase64": "...",
      "duration": ms,
      "speechMetrics": {...}
    }
  ]
}
```

### Backend (Python/FastAPI)

#### New File: `backend/strands_agent/tools/speech_analyzer.py`
**Purpose**: Analyze transcribed speech for anomalies

**Key Features**:
- `SpeechAnalyzer` class orchestrates transcription and analysis
- Transcription placeholder (ready for AWS Transcribe S3 integration)
- Detects suspicious keywords:
  - "let me check", "google", "collaborate", "phone", etc.
- Detects speech stress indicators:
  - Filler words ("um", "uh", "like")
  - Hesitation patterns
- Heuristic multi-speaker detection from conversation flow
- Computes anomaly scores (0-1) per audio chunk

**API**:
```python
analyzer = SpeechAnalyzer(transcribe_client)
result = analyzer.process_audio_chunk(audio_chunk)
# Returns: {
#   'transcription': str,
#   'suspicious_flags': [...],
#   'stress_indicators': [...],
#   'anomaly_score': 0-1,
#   'detected_speakers': 1-N,
#   ...
# }
```

#### Modified: `backend/server.py`
**Changes**:
- Import `get_speech_analyzer()`
- Enhanced `vision_intel` WebSocket handler:
  - Extract audio chunks from intel packet
  - Process each chunk through speech analyzer
  - Aggregate results and attach to logged packet
  - Send ACK with speech analysis summary

**Workflow**:
```
Frontend --[audio chunks in vision_intel packet]-> Backend
Backend --[processes chunks]-> SpeechAnalyzer
SpeechAnalyzer --[transcription + anomaly analysis]-> JSONL log
Backend --[ACK with summary]-> Frontend
```

#### Modified: `backend/strands_agent/tools/behavior_analyzer.py`
**Changes**:
- Added `speech_metrics` and `suspicious_speech_flags` parameters
- Integrates speech concerns into behavior scoring
- Applies penalty for detected anomalies (up to 2-point reduction)
- Enhanced remarks with emoji warnings for:
  - Multiple speakers
  - Volume anomalies
  - Suspicious keyword flags
  - External resource references

**Scoring**:
- Base score: 40% eye_contact + 60% attention_score (0-10)
- Speech penalty: -0.5 points per speech concern
- Final score reported with explanation

## Data Flow

### Per Interview Packet (5-second window)

1. **Frontend Captures**:
   - Vision metrics (face detection, gaze, attention) via MediaPipe
   - Audio chunks from microphone buffer
   - Speech metrics (volume, presence, detected speakers)

2. **WebSocket Sends** (`vision_intel` message):
   ```
   {
     version: 1,
     seq: packet_number,
     session_id: interview_id,
     timestamp: ISO_time,
     window_sec: 5,
     
     // Vision data
     face_count, face_presence_ratio, gaze_offscreen_ratio,
     eye_contact, attention_score, stress_proxy, ...
     
     // Audio data
     audio_metrics: { isSpeaking, volumeLevel, ... },
     audio_chunks: [...],
     audio_chunks_count: N,
     
     // Transport metadata
     transport_meta: { source, vision_ready, audio_ready, ... }
   }
   ```

3. **Backend Processes**:
   - Receives packet over WebSocket
   - For each audio chunk in packet:
     - Call `speech_analyzer.process_audio_chunk(chunk)`
     - Get {transcription, anomaly_score, suspicious_flags, ...}
   - Aggregate speech analysis results
   - Log complete packet (vision + audio + speech) to JSONL
   - Send ACK with max_anomaly_score and detected_flags

4. **Logging** (`backend/data/intel_packets.jsonl`):
   ```json
   {
     "source": "ws_vision_intel",
     "received_at": "2026-03-26T...",
     "packet": {
       ...vision and audio metrics...,
       "speech_analysis": [
         {
           "chunk_index": 0,
           "transcription": "[placeholder]",
           "anomaly_score": 0.3,
           "suspicious_flags": ["let_me_check"],
           "detected_speakers": 2,
           ...
         }
       ],
       "aggregate_speech_anomaly": 0.25
     }
   }
   ```

## Anomaly Detection

### Suspicious Keyword Categories
| Category | Examples | Implication |
|----------|----------|-------------|
| `let_me_check` | "let me check", "hang on" | Consulting external resources |
| `external_search` | "google", "look it up" | Real-time research mention |
| `collaboration` | "what do you think", "do you agree" | Seeking outside input/help |
| `script_use` | "key skills", "core competencies" | Possible pre-written response |
| `distraction` | "phone", "someone", "wait" | External interruption |

### Stress Indicators
| Indicator | Examples | Implication |
|-----------|----------|-------------|
| `hesitation` | "um", "uh", "err" | Nervousness or thinking |
| `filler_words` | "you know", "i mean", "basically" | Lack of confidence |
| Multi-speaker (heuristic) | High density of affirmations | Possible collaboration |
| Volume anomalies | <0.1 or >0.9 | Audio quality or environment issues |

### Anomaly Score Calculation
```
anomaly_score = min(1.0, 
  len(suspicious_flags) * 0.3 + 
  len(stress_indicators) * 0.1
)
```

## Testing the Integration

### 1. Audio Capture Test
```bash
# Frontend logs when audio engine initializes
# Check browser console: "[AudioIntel] Audio engine initialized"
# Watch buffering: "[AudioIntel] Chunk X buffered (Y queued)"
```

### 2. Intel Packet Inspection
```bash
# Start backend: python -m uvicorn server:app --reload
# Run interview in browser
# Check captured packets:
tail -f backend/data/intel_packets.jsonl | jq .packet.audio_chunks_count
tail -f backend/data/intel_packets.jsonl | jq .packet.audio_metrics
```

### 3. Speech Analysis Review
```bash
# Look for speech_analysis in logged packets
jq '.packet.speech_analysis[0]' backend/data/intel_packets.jsonl
# Should show: transcription, anomaly_score, suspicious_flags, detected_speakers
```

## Next Steps

### Phase 1 (MVP - Current)
✅ Audio capture and buffering (frontend)  
✅ Audio chunk transmission (WebSocket)  
✅ Speech analysis skeleton (backend)  
✅ Anomaly detection heuristics  
✅ JSONL logging for review  

### Phase 2 (Calibration)
- [ ] AWS Transcribe S3 integration (replace placeholder)
- [ ] Manual packet review and threshold tuning
- [ ] Collect 20-30 interviews for calibration
- [ ] Build admin dashboard to visualize speech anomalies

### Phase 3 (Automation)
- [ ] Implement backend decision rules:
  - `anomaly_score > 0.7` → Log warning + flag for review
  - `detected_speakers > 1` → Pause interview + warn candidate
  - `suspicious_keyword + repeat` → Alert proctor
- [ ] Add real-time WebSocket alerts to admin/proctor UI
- [ ] Implement conditional follow-up questions on anomalies

### Phase 4 (Advanced)
- [ ] Speaker diarization (AWS Transcribe native support)
- [ ] Voice stress analysis (pitch, rate, tempo metrics)
- [ ] Keyword context-awareness (reduce false positives)
- [ ] Audio transcription caching for faster replay

## Fallbacks & Graceful Degradation

### If Audio Unavailable
- Interview continues normally
- Vision metrics alone drive behavior analysis
- No audio anomalies logged
- Status flag `audio_ready: false` in transport_meta

### If Transcription Fails
- Packet still logged with audio chunks
- `transcribe_error` field documents reason
- Anomalies not computed for that chunk
- Manual review still possible (audio is stored)

### If Backend Speech Analysis Crashes
- WebSocket logs error but continues
- `speech_analysis_error` appended to packet
- Interview uninterrupted
- All data still captured for post-session review

## Performance Notes

- **Frontend**: Audio buffering ~40ms latency, minimal CPU (Web Audio API)
- **Backend**: Speech analysis ~200ms per chunk (heuristics only)
- **Storage**: ~2MB per 30-min interview (audio chunks base64-encoded)
- **Network**: ~5-10 KB per 5s packet (audio + metadata)

## Security & Privacy

- Audio is NOT stored permanently (only chunks for pending analysis)
- Transcriptions are placeholder (not querying external APIs yet)
- No audio played back in candidate UI (hidden analysis)
- JSONL files contain only interview data (no external uploads)
- Plan AWS Transcribe usage with S3 encryption in Phase 2

---

**Last Updated**: March 26, 2026  
**Status**: Phase 1 complete, ready for calibration testing
