"""
Speech-to-Text Processing Module for Interview Audio Analysis
Transcribes candidate audio and detects anomalies (multiple speakers, suspicious patterns)
"""

import base64
import json
import logging
import re
from datetime import datetime
from typing import Dict, Any, List

import boto3

logger = logging.getLogger(__name__)

# Suspicious keywords/patterns for academic dishonesty or outside help
SUSPICIOUS_KEYWORDS = {
    'let_me_check': [r'\blet me check\b', r'\bone second\b', r'\bhang on\b'],
    'external_search': [r'\bgoogle\b', r'\blooking it up\b', r'\blet me search\b'],
    'collaboration': [r"\bwhat do (you|they) think\b", r'\bdo you agree\b', r'\bdo you know\b'],
    'script_use': [r'\breadline\b', r'\bkey skills\b', r'\bcore competencies\b'],
    'distraction': [r'\bphone\b', r'\bsomeone\b', r'\bwait\b']
}

# Stress indicators in speech (verbal)
STRESS_INDICATORS = {
    'hesitation': [r'\bum+\b', r'\buh+\b', r'\berr+\b', r'\blike+\b'],
    'filler_words': [r'\byou know\b', r'\bi mean\b', r'\bbasically\b'],
    'rushed_speech': None,  # Detected from speech rate, not keywords
}


class SpeechAnalyzer:
    """
    Analyzes transcribed speech for anomalies and suspicious patterns
    """

    def __init__(self, transcribe_client=None):
        self.transcribe_client = transcribe_client or boto3.client('transcribe')
        self.transcribed_cache = {}  # Track transcriptions to avoid re-processing

    def transcribe_audio_chunk(self, audio_base64: str) -> Dict[str, Any]:
        """
        Transcribe single audio chunk using AWS Transcribe
        
        Args:
            audio_base64: Base64-encoded 16-bit PCM audio
            
        Returns:
            {
                'transcription': str,
                'confidence': float 0-1,
                'duration_sec': float,
                'error': str or None
            }
        """
        try:
            # Decode audio
            audio_bytes = base64.b64decode(audio_base64)
            
            # AWS Transcribe requires S3 upload for real transcription
            # For MVP, we'll use local speech recognition via Web Speech API fallback or mock
            # In production: upload to S3, call transcribe_client.start_transcription_job()
            
            # For now, return placeholder - will be upgraded to real AWS Transcribe
            transcription = {
                'transcription': '[Audio chunk - AWS Transcribe integration pending S3 upload]',
                'confidence': 0.0,
                'duration_sec': len(audio_bytes) / (16000 * 2),  # 16kHz, 16-bit
                'error': 'S3_UPLOAD_REQUIRED',
                'timestamp': datetime.utcnow().isoformat()
            }
            
            logger.info(f'Audio transcription placeholder: {len(audio_bytes)} bytes')
            return transcription
            
        except Exception as e:
            logger.error(f'Transcription error: {e}')
            return {
                'transcription': '',
                'confidence': 0.0,
                'duration_sec': 0,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }

    def analyze_transcription(self, transcription: str) -> Dict[str, Any]:
        """
        Analyze transcribed text for suspicious patterns and stress indicators
        
        Args:
            transcription: Transcribed text from candidate
            
        Returns:
            {
                'suspicious_flags': [...],
                'stress_indicators': [...],
                'anomaly_score': 0-1,
                'keyword_matches': {...},
                'analysis_timestamp': iso_string
            }
        """
        if not transcription:
            return {
                'suspicious_flags': [],
                'stress_indicators': [],
                'anomaly_score': 0.0,
                'keyword_matches': {},
                'analysis_timestamp': datetime.utcnow().isoformat()
            }

        text_lower = transcription.lower()
        suspicious_flags = []
        stress_indicators = []
        keyword_matches = {}

        # Check for suspicious patterns
        for category, patterns in SUSPICIOUS_KEYWORDS.items():
            matches = []
            for pattern in patterns:
                found = re.findall(pattern, text_lower, re.IGNORECASE)
                if found:
                    matches.extend(found)
            if matches:
                keyword_matches[category] = matches
                suspicious_flags.append(category)

        # Check for stress indicators
        for category, patterns in STRESS_INDICATORS.items():
            if patterns:  # Skip categories with no keyword patterns
                matches = []
                for pattern in patterns:
                    found = re.findall(pattern, text_lower, re.IGNORECASE)
                    if found:
                        matches.extend(found)
                if matches:
                    keyword_matches[f'stress_{category}'] = matches
                    stress_indicators.append(category)

        # Compute anomaly score (0-1)
        anomaly_score = min(1.0, len(suspicious_flags) * 0.3 + len(stress_indicators) * 0.1)

        return {
            'suspicious_flags': suspicious_flags,
            'stress_indicators': stress_indicators,
            'anomaly_score': anomaly_score,
            'keyword_matches': keyword_matches,
            'analysis_timestamp': datetime.utcnow().isoformat()
        }

    def detect_multiple_speakers(self, transcription: str) -> Dict[str, Any]:
        """
        Heuristic detection of multiple speakers in transcription
        (Real implementation uses AWS Transcribe speaker labels)
        
        Args:
            transcription: Full transcription text
            
        Returns:
            {
                'detected_speaker_count': int,
                'speaker_change_moments': [...],
                'confidence': 0-1
            }
        """
        # Heuristic: Look for conversation-like patterns (questions back-and-forth)
        conversation_patterns = [
            r'(?:yes|no|sure|okay|ok|right|exactly|exactly what i mean)',
            r'(?:i think|i believe|i think so)',
            r'(?:yeah|yep|uh-huh|mm-hmm)'
        ]

        speaker_changes = 0
        for pattern in conversation_patterns:
            matches = re.finditer(pattern, transcription.lower())
            speaker_changes += len(list(matches))

        # Conservative heuristic: high density of short affirmations suggests multiple speakers
        words = len(transcription.split())
        affirmation_density = speaker_changes / max(words, 1)

        detected_speakers = 1
        confidence = 0.0
        
        if affirmation_density > 0.15:  # High density of short responses
            detected_speakers = 2
            confidence = 0.6
        elif affirmation_density > 0.25:
            detected_speakers = 3
            confidence = 0.4

        return {
            'detected_speaker_count': detected_speakers,
            'speaker_change_moments': speaker_changes,
            'confidence': confidence
        }

    def process_audio_chunk(self, audio_chunk: Dict[str, Any]) -> Dict[str, Any]:
        """
        Full pipeline: transcribe audio chunk and analyze results
        
        Args:
            audio_chunk: {
                'audioBase64': str,
                'duration': float ms,
                'speechMetrics': {...},
                'index': int
            }
            
        Returns:
            speech_data dict with transcription, anomalies, speaker detection
        """
        try:
            audio_base64 = audio_chunk.get('audioBase64', '')
            chunk_index = audio_chunk.get('index', 0)

            # Transcribe
            transcription_result = self.transcribe_audio_chunk(audio_base64)
            transcription_text = transcription_result.get('transcription', '')

            # Analyze
            analysis = self.analyze_transcription(transcription_text)
            speaker_analysis = self.detect_multiple_speakers(transcription_text)

            speech_data = {
                'chunk_index': chunk_index,
                'transcription': transcription_text,
                'confidence': transcription_result.get('confidence', 0.0),
                'duration_ms': audio_chunk.get('duration', 0),
                'suspicious_flags': analysis.get('suspicious_flags', []),
                'stress_indicators': analysis.get('stress_indicators', []),
                'anomaly_score': analysis.get('anomaly_score', 0.0),
                'keyword_matches': analysis.get('keyword_matches', {}),
                'detected_speakers': speaker_analysis.get('detected_speaker_count', 1),
                'speaker_confidence': speaker_analysis.get('confidence', 0.0),
                'transcribe_error': transcription_result.get('error'),
                'processed_at': datetime.utcnow().isoformat()
            }

            logger.info(f'Processed audio chunk {chunk_index}: anomaly_score={speech_data["anomaly_score"]:.2f}')
            return speech_data

        except Exception as e:
            logger.error(f'Error processing audio chunk: {e}')
            return {
                'chunk_index': audio_chunk.get('index', -1),
                'transcription': '',
                'confidence': 0.0,
                'error': str(e),
                'processed_at': datetime.utcnow().isoformat()
            }


# Global analyzer instance
_speech_analyzer = None


def get_speech_analyzer():
    """Singleton access to SpeechAnalyzer"""
    global _speech_analyzer
    if _speech_analyzer is None:
        _speech_analyzer = SpeechAnalyzer()
    return _speech_analyzer
