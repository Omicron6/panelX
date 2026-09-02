"""
Tool: Behavior Analyzer
Analyzes candidate behavior metrics (eye contact, attention, etc.)
"""

import logging
from typing import Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


def analyze_behavior(
    eye_contact: float,
    attention_score: float,
    additional_metrics: Optional[Dict[str, float]] = None,
    speech_metrics: Optional[Dict] = None,
    suspicious_speech_flags: Optional[list] = None
) -> Dict:
    """
    Analyzes candidate behavior based on visual and speech metrics.
    
    This is heuristic-based analysis of non-verbal cues and voice patterns.
    NOT deep psychological analysis.
    
    Args:
        eye_contact: Eye contact score 0-1 (from MediaPipe or similar)
        attention_score: Attention/focus score 0-1
        additional_metrics: Optional dict of additional behavioral metrics
        speech_metrics: Optional dict with 'isSpeaking', 'volumeLevel', 'detectedSpeakers'
        suspicious_speech_flags: Optional list of detected suspicious keywords/patterns
    
    Returns:
        Analysis dictionary with behavior score and remarks
    """
    
    logger.info("Analyzing candidate behavior...")
    
    # Validate inputs
    eye_contact = max(0.0, min(1.0, eye_contact))
    attention_score = max(0.0, min(1.0, attention_score))
    
    # Calculate weighted behavior score
    # Eye contact: 40%, Attention: 60%
    behavior_score = round((eye_contact * 0.4 + attention_score * 0.6) * 10, 1)
    
    # Apply speech penalty if anomalies detected
    if 'speech_penalty' in locals():
        behavior_score = max(0.0, behavior_score - speech_penalty)
    
    # Generate remarks based on scores
    remarks = []
    
    # Eye contact analysis
    if eye_contact >= 0.8:
        remarks.append("Excellent eye contact - demonstrates confidence and engagement")
    elif eye_contact >= 0.6:
        remarks.append("Good eye contact maintained throughout interview")
    elif eye_contact >= 0.4:
        remarks.append("Moderate eye contact - room for improvement in engagement")
    else:
        remarks.append("Limited eye contact - may indicate nervousness or distraction")
    
    # Attention analysis
    if attention_score >= 0.8:
        remarks.append("High attention level - actively engaged and focused")
    elif attention_score >= 0.6:
        remarks.append("Maintained focus during interview")
    elif attention_score >= 0.4:
        remarks.append("Attention fluctuated - some moments of distraction")
    else:
        remarks.append("Low attention level - appeared distracted or disengaged")
    
    # Process additional metrics if provided
    if additional_metrics:
        for metric_name, metric_value in additional_metrics.items():
            if metric_value >= 0.7:
                remarks.append(f"Good {metric_name}")
    
    # Analyze speech metrics if provided
    speech_concerns = []
    if speech_metrics:
        speakers = speech_metrics.get('detectedSpeakers', 1)
        if speakers > 1:
            speech_concerns.append(f"⚠️ Multiple speakers detected ({speakers}) - possible outside help")
        
        volume = speech_metrics.get('volumeLevel', 0)
        if volume < 0.1:
            speech_concerns.append("🔇 Unusually low volume - check audio clarity")
        elif volume > 0.9:
            speech_concerns.append("🔊 Very high volume - possible environmental noise")
    
    # Check for suspicious speech flags
    if suspicious_speech_flags and len(suspicious_speech_flags) > 0:
        for flag in suspicious_speech_flags:
            if flag == 'external_search':
                speech_concerns.append("🔍 Possible external resource lookup mentioned")
            elif flag == 'collaboration':
                speech_concerns.append("👥 Possible collaboration or seeking input detected")
            elif flag == 'let_me_check':
                speech_concerns.append("⏸️ Checking external resources - possible research during interview")
            elif flag == 'distraction':
                speech_concerns.append("📱 Possible distraction or interruption detected")
        
        # Add speech concerns to remarks
        remarks.extend(speech_concerns)
    
    # Adjust behavior score for speech anomalies
    speech_penalty = 0
    if speech_concerns:
        speech_penalty = min(2.0, len(speech_concerns) * 0.5)  # Up to 2 point reduction
    
    # Overall assessment
    if behavior_score >= 8:
        overall = "Excellent non-verbal communication and professional presence"
    elif behavior_score >= 6:
        overall = "Good professional demeanor and engagement"
    elif behavior_score >= 4:
        overall = "Acceptable presence with some concerns"
    else:
        overall = "Significant concerns regarding interview conduct and authenticity"
    
    # Add warnings if speech concerns detected
    if speech_concerns:
        overall += " ⚠️ Audio analysis flagged potential issues - review transcript"
    
    analysis = {
        "behavior_score": behavior_score,
        "eye_contact": eye_contact,
        "attention_score": attention_score,
        "remarks": remarks,
        "overall_assessment": overall,
        "speech_concerns_count": len(speech_concerns),
        "analyzed_at": datetime.utcnow().isoformat()
    }
    
    # Include speech metrics if provided
    if speech_metrics:
        analysis["speech_metrics_summary"] = {
            "detected_speakers": speech_metrics.get('detectedSpeakers', 1),
            "volume_level": speech_metrics.get('volumeLevel', 0),
            "is_speaking": speech_metrics.get('isSpeaking', False)
        }
    
    if suspicious_speech_flags:
        analysis["suspicious_flags"] = suspicious_speech_flags
    
    if additional_metrics:
        analysis["additional_metrics"] = additional_metrics
    
    logger.info(f"Behavior analyzed: {behavior_score}/10")
    return analysis
