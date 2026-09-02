"""
Tool: Answer Evaluator
Evaluates candidate answers with scoring and detailed feedback
"""

import logging
from typing import Dict
from datetime import datetime
from .context_builder import call_llm

logger = logging.getLogger(__name__)


def evaluate_answer(
    question: Dict,
    answer: str,
    context: Dict
) -> Dict:
    """
    Evaluates candidate's answer with AI-powered analysis.
    
    Args:
        question: Question dictionary
        answer: Candidate's answer text
        context: Interview context
    
    Returns:
        Evaluation dictionary with score, strengths, weaknesses, feedback
    """
    
    logger.info(f"Evaluating answer for question {question.get('id', '')[:8]}...")
    
    role = context.get('role', 'Position')
    skills = context.get('skills_required', [])
    
    prompt = f"""You are a STRICT senior technical interviewer. Evaluate the candidate's answer harshly and honestly. Do NOT be generous.

QUESTION: {question.get('question')}
CANDIDATE ANSWER: {answer}

Scoring rubric (be strict — most mediocre answers should score 3-5):
- 9-10: Correct, complete, with specific technical detail AND a concrete example or code.
- 7-8: Mostly correct with good detail, minor gaps.
- 5-6: Partially correct, understands the basics but vague or incomplete.
- 3-4: Weak. Mentions the topic but shows shallow or unclear understanding.
- 1-2: Does not actually answer, is off-topic, hedges ("not sure", "I think"), or admits not knowing.
- 0: No answer or completely wrong.

IMPORTANT RULES:
- If the answer says things like "I don't know", "I'm not sure", "I don't remember", or does not directly address the question, score 1 or 2 MAXIMUM.
- Do NOT reward vague filler. Require concrete technical substance for any score above 5.
- Judge only whether the answer correctly and specifically addresses the QUESTION.

Respond using this exact structure (fill in real content, do not repeat the labels' descriptions):
SCORE: <number>/10
STRENGTHS: <what was actually good, or None>
MISSING: <key things the answer failed to cover>
FEEDBACK: <one honest, direct sentence of feedback>

Example of a well-formed response:
SCORE: 7/10
STRENGTHS: Correctly described the reconciliation and diffing process.
MISSING: Did not mention keys or performance trade-offs.
FEEDBACK: Solid technical explanation, but add concrete examples to strengthen it."""

    # Guard: empty or non-answers should score very low without needing the LLM
    _clean_answer = (answer or "").strip()
    _low = _clean_answer.lower()
    _non_answers = {"i dont know", "i don't know", "idk", "no idea", "not sure",
                    "dont know", "don't know", "pass", "skip", "no", "na", "n/a"}
    # Hedging phrases that signal the candidate is not actually answering
    _hedge_phrases = [
        "i don't know", "i dont know", "i'm not sure", "im not sure", "not sure",
        "i don't remember", "i dont remember", "don't remember", "dont remember",
        "no idea", "i forgot", "i can't recall", "cant recall", "not familiar",
        "i have no", "i'm not familiar",
    ]
    _hedge_hit = any(p in _low for p in _hedge_phrases)
    # If the answer is very short, or is a known non-answer, or is dominated by hedging
    if len(_clean_answer) < 3 or _low in _non_answers or (_hedge_hit and len(_clean_answer) < 120):
        return {
            "question_id": question.get("id"),
            "score": 1,
            "strengths": [],
            "missing_points": ["No substantive answer was provided"],
            "feedback": "The candidate did not actually answer the question.",
            "follow_up_needed": True,
            "evaluated_at": datetime.utcnow().isoformat()
        }

    try:
        evaluation_text = call_llm(prompt, max_tokens=300, temperature=0.3)
        # Retry once if the first response is unusable (transient empty responses)
        if not evaluation_text or len(evaluation_text.strip()) < 10:
            logger.warning("Empty evaluation response; retrying once...")
            evaluation_text = call_llm(prompt, max_tokens=300, temperature=0.4)
        
        # Parse the evaluation with improved logic
        score = 5  # default
        strengths = []
        missing = []
        feedback = ""
        
        # If response is STILL empty or too short, use content-aware fallback
        if not evaluation_text or len(evaluation_text.strip()) < 10:
            ans = answer.lower()
            word_count = len(answer.split())
            # Technical-depth signal words
            technical_terms = ['because', 'algorithm', 'diff', 'reconcil', 'render', 'state',
                               'component', 'api', 'async', 'promise', 'memory', 'performance',
                               'example', 'for instance', 'complexity', 'trade-off', 'optimize']
            depth = sum(1 for t in technical_terms if t in ans)
            if word_count > 40 and depth >= 3:
                score = 7
                strengths = ["Detailed answer with technical substance"]
                missing = ["Could add more concrete examples"]
            elif word_count > 20 and depth >= 1:
                score = 5
                strengths = ["Relevant information provided"]
                missing = ["Lacks depth and specific detail"]
            else:
                score = 3
                strengths = ["Attempted to answer"]
                missing = ["Answer is too vague and lacks technical detail"]
            feedback = f"Answer scored {score}/10 based on length and technical content."
        else:
            # Extract only the evaluation part (before any extra conversation)
            eval_lines = []
            for line in evaluation_text.split('\n'):
                line = line.strip()
                # Stop at conversational markers
                if any(marker in line.lower() for marker in ['i hope this helps', 'thank you', 'let me know', 'glad you found']):
                    break
                if line and not line.startswith('|'):
                    eval_lines.append(line)
            
            evaluation_text = '\n'.join(eval_lines)
            
            # Parse the LLM response
            for line in eval_lines:
                line = line.strip()
                if 'SCORE:' in line.upper() or line.startswith('SCORE'):
                    try:
                        # Extract number from various formats
                        score_part = line.split(':')[-1].strip() if ':' in line else line
                        # Look for numbers in the text
                        import re
                        numbers = re.findall(r'\d+', score_part)
                        if numbers:
                            score = int(numbers[0])
                            score = max(0, min(10, score))  # Clamp 0-10
                    except (ValueError, IndexError):
                        pass
                elif 'STRENGTH' in line.upper() and ':' in line:
                    strengths_text = line.split(':', 1)[1].strip()
                    strengths = [s.strip() for s in strengths_text.split(',') if s.strip()][:3]
                elif 'MISSING' in line.upper() and ':' in line:
                    missing_text = line.split(':', 1)[1].strip()
                    missing = [m.strip() for m in missing_text.split(',') if m.strip()][:3]
                elif 'FEEDBACK:' in line.upper():
                    feedback = line.split(':', 1)[1].strip()
            
            # Extract feedback from the response if not found in structured format
            if not feedback and evaluation_text:
                # Use the last meaningful sentence as feedback
                sentences = [s.strip() for s in evaluation_text.replace('\n', ' ').split('.') if s.strip()]
                if sentences:
                    feedback = sentences[-1][:200]
        
        # Ensure we have some content
        if not strengths:
            if score >= 7:
                strengths = ["Strong technical knowledge demonstrated"]
            elif score >= 5:
                strengths = ["Provided relevant information"]
            else:
                strengths = ["Attempted to answer the question"]
        
        if not missing:
            if score < 8:
                missing = ["Could provide more specific examples and details"]
            else:
                missing = ["Minor areas for improvement"]
        
        if not feedback:
            feedback = f"Answer scored {score}/10 based on content quality and relevance."
        
        # Clean filler/padding characters the model sometimes emits
        import re
        def _clean(text):
            if not text:
                return text
            text = re.sub(r'[\*\-_=]{2,}', ' ', text)
            text = re.sub(r'["\']{2,}', '', text)
            text = re.sub(r'\s{2,}', ' ', text).strip()
            return text.strip('"\'* ').strip()
        
        # Reject values that are just leaked template placeholders
        def _is_placeholder(text):
            if not text:
                return True
            t = text.strip().lower()
            return (t.startswith('<') or t.startswith('[')) or 'one honest' in t or 'constructive suggestion' in t or 'number>' in t

        if _is_placeholder(feedback):
            feedback = ""
        strengths = [s for s in strengths if not _is_placeholder(s)]
        missing = [m for m in missing if not _is_placeholder(m)]

        feedback = _clean(feedback)
        strengths = [_clean(s) for s in strengths if _clean(s)]
        missing = [_clean(m) for m in missing if _clean(m)]

        # Fallback feedback if it got cleared
        if not feedback:
            feedback = f"Answer scored {score}/10 based on technical accuracy and depth."
        
        evaluation = {
            "question_id": question.get("id"),
            "score": score,
            "strengths": strengths[:3],
            "missing_points": missing[:3],
            "feedback": feedback[:250],
            "follow_up_needed": score < 6,
            "evaluated_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Answer evaluated: {score}/10")
        return evaluation
        
    except Exception as e:
        logger.error(f"Error evaluating answer: {e}")
        # Fallback evaluation
        return {
            "question_id": question.get("id"),
            "score": 5,
            "strengths": ["Provided an answer"],
            "missing_points": ["Could not evaluate automatically"],
            "feedback": "Unable to evaluate automatically. Manual review recommended.",
            "reasoning": "Evaluation failed",
            "follow_up_needed": False,
            "evaluated_at": datetime.utcnow().isoformat(),
            "error": str(e)
        }
