"""
Tool: Decision Engine
Makes final hiring decision based on evaluations and behavior
"""

import logging
from typing import Dict, List
from datetime import datetime
from .context_builder import call_llm
from ..config import TECHNICAL_WEIGHT, BEHAVIOR_WEIGHT, PASS_THRESHOLD, MAYBE_THRESHOLD

logger = logging.getLogger(__name__)


def make_decision(
    evaluations: List[Dict],
    behavior_analysis: Dict,
    context: Dict
) -> Dict:
    """
    Makes final hiring recommendation based on all interview data.
    
    Combines:
    - Technical performance (70% weight)
    - Behavioral assessment (30% weight)
    
    Args:
        evaluations: List of all answer evaluations
        behavior_analysis: Behavior analysis results
        context: Interview context
    
    Returns:
        Decision dictionary with final score, recommendation, summary
    """
    
    logger.info("Making final hiring decision...")
    
    if not evaluations:
        return {
            "error": "No evaluations found",
            "message": "Cannot make decision without answer evaluations"
        }
    
    # Calculate average answer score
    answer_scores = [eval.get("score", 0) for eval in evaluations]
    avg_answer_score = sum(answer_scores) / len(answer_scores)
    
    # Get behavior score (behavior_analysis may be None if no data was captured)
    behavior_analysis = behavior_analysis or {}
    behavior_score = behavior_analysis.get("behavior_score", 5.0)
    
    # Calculate final score (70% technical + 30% behavior)
    final_score = round(
        (avg_answer_score * TECHNICAL_WEIGHT) + (behavior_score * BEHAVIOR_WEIGHT),
        2
    )
    
    # Make decision based on thresholds
    if final_score >= PASS_THRESHOLD:
        decision = "Shortlisted"
        decision_color = "green"
    elif final_score >= MAYBE_THRESHOLD:
        decision = "Maybe"
        decision_color = "yellow"
    else:
        decision = "Rejected"
        decision_color = "red"
    
    # Collect strengths and weaknesses
    all_strengths = []
    all_weaknesses = []
    
    for eval in evaluations:
        all_strengths.extend(eval.get("strengths", []))
        all_weaknesses.extend(eval.get("missing_points", []))
    
    # Deduplicate and limit
    strengths = list(set(all_strengths))[:5]
    weaknesses = list(set(all_weaknesses))[:5]
    
    # Add behavior insights to strengths/weaknesses
    if behavior_score >= 7:
        strengths.append("Strong interview presence and communication")
    elif behavior_score < 5:
        weaknesses.append("Needs improvement in non-verbal communication")
    
    # Generate AI summary
    role = context.get('role', 'position')
    
    summary_prompt = f"""You are an interviewer writing a final candidate assessment.

ROLE: {role}
QUESTIONS ASKED: {len(evaluations)}
TECHNICAL SCORE: {avg_answer_score:.1f}/10
BEHAVIOR SCORE: {behavior_score}/10
FINAL SCORE: {final_score}/10
DECISION: {decision}

Write a brief, professional 2-3 sentence summary of the candidate's overall performance.
Be balanced and constructive."""

    try:
        ai_summary = call_llm(summary_prompt, max_tokens=150, temperature=0.5)
        summary = ai_summary[:400]
    except Exception as e:
        logger.error(f"Error generating AI summary: {e}")
        # Fallback summary
        if final_score >= 8:
            performance = "exceptional"
        elif final_score >= 7:
            performance = "strong"
        elif final_score >= 5:
            performance = "adequate"
        else:
            performance = "needs improvement"
        
        summary = f"Candidate completed interview for {role} with {performance} performance. " \
                 f"Technical competency scored {avg_answer_score:.1f}/10 and behavioral assessment " \
                 f"scored {behavior_score}/10, resulting in a final score of {final_score}/10. " \
                 f"Recommendation: {decision}."
    
    decision_result = {
        "final_score": final_score,
        "answer_score": round(avg_answer_score, 2),
        "behavior_score": behavior_score,
        "decision": decision,
        "decision_color": decision_color,
        "summary": summary,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "total_questions": len(evaluations),
        "role": role,
        "weights": {
            "technical": f"{int(TECHNICAL_WEIGHT * 100)}%",
            "behavior": f"{int(BEHAVIOR_WEIGHT * 100)}%"
        },
        "decided_at": datetime.utcnow().isoformat()
    }
    
    logger.info(f"Decision made: {decision} (Score: {final_score}/10)")
    return decision_result
