"""
Tool: Question Generator
Generates adaptive interview questions based on context and performance
"""

import logging
import uuid
from typing import Dict, List, Optional
from datetime import datetime
from .context_builder import call_llm
from ..config import LLM_PROVIDER

logger = logging.getLogger(__name__)


def generate_question(
    context: Dict,
    difficulty: str = "medium",
    question_type: str = "technical",
    previous_evaluations: Optional[List[Dict]] = None
) -> Dict:
    """
    Generates contextual interview question using AI.
    
    Args:
        context: Interview context from build_context
        difficulty: easy/medium/hard
        question_type: technical/behavioral/scenario
        previous_evaluations: List of previous answer evaluations for adaptation
    
    Returns:
        Question dictionary with id, text, type, difficulty
    """
    
    logger.info(f"Generating {difficulty} {question_type} question...")
    
    # Extract context info
    role = context.get('role', 'Position')
    skills = context.get('skills_required', [])
    gaps = context.get('candidate_gaps', [])
    focus_areas = context.get('focus_areas', [])
    interview_type = context.get('interview_type', 'technical')
    company_type = context.get('company_type', 'startup')

    company_type_guidance = {
        'mnc': 'Use enterprise-scale scenarios, cross-team collaboration, reliability, and process maturity expectations.',
        'startup': 'Use speed-of-execution, ownership, ambiguity handling, and pragmatic trade-off expectations.',
    }
    company_focus = company_type_guidance.get(
        company_type,
        'Balance execution, communication, and role-relevant technical depth.',
    )
    
    # Analyze previous performance
    performance_context = ""
    if previous_evaluations:
        last_eval = previous_evaluations[-1]
        avg_score = sum(e.get('score', 5) for e in previous_evaluations) / len(previous_evaluations)
        performance_context = f"\n\nPREVIOUS PERFORMANCE: {len(previous_evaluations)} questions asked, average score {avg_score:.1f}/10"
        if last_eval.get('score', 5) < 5:
            performance_context += "\nLast answer was weak - consider asking follow-up or easier question."
        elif last_eval.get('score', 5) >= 8:
            performance_context += "\nLast answer was strong - candidate is ready for harder questions."
    
    # Difficulty guidance — make "easy" genuinely easy (important for demos)
    difficulty_guidance = {
        'easy': (
            'VERY EASY. A beginner should be able to answer it. '
            'Ask about a single fundamental concept in one short sentence. '
            'No multi-part questions, no complex scenarios.'
        ),
        'medium': 'Moderate difficulty. Requires solid working knowledge and some detail.',
        'hard': 'Challenging. Requires deep expertise, trade-offs, and real-world experience.',
    }
    diff_note = difficulty_guidance.get(difficulty, difficulty_guidance['medium'])

    # Question-type guidance — theoretical (conceptual) vs coding (write code)
    qtype = (question_type or 'theoretical').lower()
    if qtype == 'coding':
        type_note = (
            'This must be a CODING challenge. Ask the candidate to WRITE actual code '
            'to solve a concrete, self-contained problem relevant to the role. '
            'State the task clearly and what the code should do.'
        )
    else:
        type_note = (
            'This must be a THEORETICAL / CONCEPTUAL question. Ask the candidate to '
            'EXPLAIN or DESCRIBE a concept in their own words. Do NOT ask them to write '
            'any code. No coding, no "implement this" — explanation only.'
        )

    # Build question generation prompt
    prompt = f"""You are an expert interviewer conducting a {interview_type} interview.

ROLE: {role}
REQUIRED SKILLS: {', '.join(skills)}
CANDIDATE GAPS: {', '.join(gaps) if gaps else 'None identified'}
FOCUS AREAS: {', '.join(focus_areas) if focus_areas else 'General assessment'}{performance_context}
COMPANY TYPE: {company_type}

DIFFICULTY: {difficulty.upper()} — {diff_note}
QUESTION TYPE: {type_note}

Generate ONE interview question following the DIFFICULTY and QUESTION TYPE rules above.
- Make it relevant to the role and required skills
- Be direct and clear, one question only
- Keep it concise

Return ONLY the question text, nothing else."""

    try:
        # Gemma may spend some output tokens on internal reasoning; allow enough
        # room for the actual question to be returned as well.
        raw_response = call_llm(prompt, max_tokens=512, temperature=0.8)

        raw = (raw_response or "").strip()

        # 1) Cut everything from the first meta-commentary marker onward.
        #    The model sometimes appends "Answer:", "### Note", "Let me know...", etc.
        # Strip leading instruction-echo prefixes the model sometimes adds
        for prefix in ['Write your interview question:', 'Interview question:',
                       'Here is your question:', 'Question:', 'Sure!', 'Sure,']:
            if raw.lower().startswith(prefix.lower()):
                raw = raw[len(prefix):].strip()

        meta_markers = [
            '\nanswer:', ' answer:', '### note', '###note', 'let me know',
            'please let me know', 'i hope this', 'this meets', 'please respond',
            'no coding required', '(no coding', 'i can assist', 'thank you',
            'note:', '\n\n*', '\n*', 'is this what', '// your code',
            'this question assesses', 'this question tests', 'this assesses',
            'this is a fundamental', 'this evaluates', '(waiting for',
            'waiting for feedback', 'before proceeding',
        ]
        low_raw = raw.lower()
        cut_at = len(raw)
        for marker in meta_markers:
            idx = low_raw.find(marker)
            if idx != -1:
                cut_at = min(cut_at, idx)
        raw = raw[:cut_at].strip()

        # 2) Drop boilerplate lines and join the rest.
        lines = [ln.strip() for ln in raw.split('\n')]
        content_lines = []
        for line in lines:
            if not line:
                continue
            low = line.lower()
            if (line.startswith('```') or low.startswith('please note') or
                    low.startswith('here is') or low.startswith('here\'s') or
                    low.startswith('sure') or low.startswith('explain a key concept') or
                    low.startswith('note')):
                continue
            # "Question:" / "Interview Question:" — keep text after the colon
            if low.startswith('question:') or low.startswith('interview question'):
                after = line.split(':', 1)[1].strip() if ':' in line else ''
                if after:
                    content_lines.append(after)
                continue
            content_lines.append(line)

        joined = ' '.join(content_lines).strip()

        import re as _re

        # 2b) Trim any leading junk before the real question start. Find the first
        #     occurrence of a typical question opener and cut everything before it.
        openers = r'(What|How|Why|When|Where|Which|Write|Implement|Create|Describe|Explain|Given|Consider|Design|Can you)\b'
        opener_match = _re.search(openers, joined)
        if opener_match and opener_match.start() > 0:
            # Only trim if there's clearly a junk prefix (a sentence break before it)
            prefix = joined[:opener_match.start()]
            if '.' in prefix or ':' in prefix or len(prefix) < 60:
                joined = joined[opener_match.start():].strip()

        # 3) Prefer the first sentence that ends with '?' (the actual question),
        #    but keep multi-sentence coding prompts intact.
        if question_type and question_type.lower() == 'coding':
            question_text = joined if len(joined) >= 25 else (max(content_lines, key=len) if content_lines else raw)
        else:
            q_match = _re.search(r'(.+?\?)', joined)
            if q_match and len(q_match.group(1).strip()) >= 25:
                question_text = q_match.group(1).strip()
            elif len(joined) >= 25:
                question_text = joined
            elif content_lines:
                question_text = max(content_lines, key=len)
            else:
                question_text = raw

        # Clean up the question
        question_text = question_text.strip()
        
        # Remove common prefixes
        prefixes_to_remove = ['Question:', 'Q:', 'Ask:', 'Interview Question:']
        for prefix in prefixes_to_remove:
            if question_text.startswith(prefix):
                question_text = question_text[len(prefix):].strip()
        
        # Remove quotes if present
        if question_text.startswith('"') or question_text.startswith("'"):
            question_text = question_text[1:]
        if question_text.endswith('"') or question_text.endswith("'"):
            question_text = question_text[:-1]
        
        import re
        # Remove all backticks (code fences and inline)
        question_text = question_text.replace('```', '').replace('`', '').strip()
        # Strip runs of filler/padding characters the model sometimes appends
        question_text = re.sub(r'[\*\-_=]{2,}', ' ', question_text)
        question_text = re.sub(r'["\']{2,}', '', question_text)
        # Collapse repeated whitespace created by the cleanup
        question_text = re.sub(r'\s{2,}', ' ', question_text).strip()
        # Remove any leading/trailing stray quote/asterisk/backtick leftovers
        question_text = question_text.strip('"\'*` ').strip()
        # Tidy floating punctuation
        question_text = re.sub(r'\s+([?.!])', r'\1', question_text)
        # Ensure question ends with a single ? (strip trailing . ! ? first)
        question_text = question_text.rstrip('?.! `').strip()
        if question_text:
            question_text += '?'
        
        # Fallback if question is still too short or invalid
        if len(question_text) < 20 or question_text == '?':
            # Extract from code blocks or use a fallback
            if '```' in raw_response:
                # Try to extract from code block
                code_match = raw_response.split('```')
                if len(code_match) > 1:
                    question_text = f"Can you implement the following: {code_match[1].strip()}?"
            else:
                # Use a simple fallback based on context
                if gaps:
                    question_text = f"Can you explain your experience with {gaps[0]} and how you would use it in this role?"
                else:
                    question_text = f"Can you describe your experience with {skills[0] if skills else 'relevant technologies'} in detail?"
        
        question = {
            "id": str(uuid.uuid4()),
            "question": question_text,
            "text": question_text,  # alias for frontend/results compatibility
            "type": question_type,
            "difficulty": difficulty,
            "generated_at": datetime.utcnow().isoformat(),
            "context_role": role,
            "company_type": company_type,
            "generation_source": LLM_PROVIDER
        }
        
        logger.info(f"Question generated: {question['id'][:8]}...")
        return question
        
    except Exception as e:
        logger.error(f"Error generating question: {e}")
        # Fallback question
        _fallback_text = f"Can you tell me about your experience with {skills[0] if skills else 'relevant technologies'}?"
        return {
            "id": str(uuid.uuid4()),
            "question": _fallback_text,
            "text": _fallback_text,  # alias for frontend/results compatibility
            "type": question_type,
            "difficulty": difficulty,
            "generated_at": datetime.utcnow().isoformat(),
            "company_type": company_type,
            "generation_source": "fallback",
            "error": str(e)
        }
