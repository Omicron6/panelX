"""
Tool: Context Builder
Analyzes job description and candidate resume to build interview context
"""

import logging
import requests
from typing import Dict, List
from datetime import datetime
from ..config import (
    LLM_PROVIDER, LLM_PROVIDER_ORDER, REQUESTY_API_KEY, REQUESTY_MODEL_ID, REQUESTY_BASE_URL,
    DEEPSEEK_API_KEY, DEEPSEEK_MODEL_ID, DEEPSEEK_BASE_URL, MAX_TOKENS, TEMPERATURE
)

logger = logging.getLogger(__name__)

def call_llm(prompt: str, max_tokens: int = MAX_TOKENS, temperature: float = TEMPERATURE) -> str:
    """Generate text with a selected provider, or fail over in auto mode."""
    providers = {
        "deepseek": (DEEPSEEK_API_KEY, DEEPSEEK_MODEL_ID, DEEPSEEK_BASE_URL),
        "requesty": (REQUESTY_API_KEY, REQUESTY_MODEL_ID, REQUESTY_BASE_URL),
    }
    if LLM_PROVIDER == "auto":
        provider_order = LLM_PROVIDER_ORDER
    elif LLM_PROVIDER in providers:
        provider_order = [LLM_PROVIDER]
    else:
        raise RuntimeError("LLM_PROVIDER must be 'requesty', 'deepseek', or 'auto'.")

    errors = []
    for provider in provider_order:
        if provider not in providers:
            errors.append(f"Unknown provider '{provider}' in LLM_PROVIDER_ORDER")
            continue
        api_key, model_id, base_url = providers[provider]
        if not api_key:
            errors.append(f"{provider} key is not configured")
            continue
        try:
            response = requests.post(
                f"{base_url.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": model_id,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
                timeout=60,
            )
            response.raise_for_status()
            choices = response.json().get("choices") or []
            if not choices:
                raise RuntimeError("provider returned no completion choices")
            message = choices[0].get("message") or {}
            content = message.get("content") or ""
            if isinstance(content, list):
                content = "".join(part.get("text", "") for part in content if isinstance(part, dict))
            content = str(content).strip()
            if not content:
                raise RuntimeError("provider returned an empty response")
            logger.info("LLM request succeeded using %s (%s)", provider, model_id)
            return content
        except Exception as exc:
            # Do not include request headers or credentials in logs/errors.
            logger.warning("LLM provider %s failed: %s", provider, exc)
            errors.append(f"{provider} failed: {exc}")

    raise RuntimeError("All configured LLM providers failed: " + "; ".join(errors))


call_requesty = call_llm  # Backward-compatible alias for older imports.

def build_context(
    job_description: str,
    required_skills: List[str],
    candidate_resume: str,
    interview_type: str = "technical",
    company_type: str = "startup"
) -> Dict:
    """
    Analyzes candidate against job requirements and builds interview context.
    
    Args:
        job_description: Full job description
        required_skills: List of required skills
        candidate_resume: Candidate's resume text
        interview_type: Type of interview (technical/behavioral/mixed)
        company_type: Company type (mnc/startup)
    
    Returns:
        Context dictionary with analysis
    """
    
    logger.info("Building interview context...")
    
    prompt = f"""You are an expert HR analyst. Analyze this candidate for the job.

JOB DESCRIPTION:
{job_description}

REQUIRED SKILLS:
{', '.join(required_skills)}

CANDIDATE RESUME:
{candidate_resume}

INTERVIEW TYPE: {interview_type}
COMPANY TYPE: {company_type}

Analyze and provide:
1. STRENGTHS: Skills the candidate HAS (be specific)
2. GAPS: Skills the candidate LACKS (be specific)
3. FOCUS AREAS: What to probe in the interview
4. COMPANY FIT: One short line describing how to tailor for {company_type}

Keep response concise and actionable. Format as:
STRENGTHS: [list]
GAPS: [list]
FOCUS: [key areas to explore]"""

    try:
        analysis = call_requesty(prompt, max_tokens=768, temperature=0.5)
        
        # Parse the analysis
        strengths = []
        gaps = []
        focus_areas = []
        
        for line in analysis.split('\n'):
            line = line.strip()
            if 'STRENGTH' in line.upper() and ':' in line:
                strengths_text = line.split(':', 1)[1].strip()
                strengths = [s.strip() for s in strengths_text.split(',') if s.strip()]
            elif 'GAP' in line.upper() and ':' in line:
                gaps_text = line.split(':', 1)[1].strip()
                gaps = [g.strip() for g in gaps_text.split(',') if g.strip()]
            elif 'FOCUS' in line.upper() and ':' in line:
                focus_text = line.split(':', 1)[1].strip()
                focus_areas = [f.strip() for f in focus_text.split(',') if f.strip()]
        
        # Build context dictionary
        context = {
            "role": job_description.split('\n')[0] if '\n' in job_description else job_description,
            "skills_required": required_skills,
            "candidate_strengths": strengths[:5],
            "candidate_gaps": gaps[:5],
            "focus_areas": focus_areas[:3],
            "interview_type": interview_type,
            "company_type": company_type,
            "job_description": job_description,
            "candidate_resume": candidate_resume,
            "analysis": analysis,
            "created_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Context built: {len(strengths)} strengths, {len(gaps)} gaps")
        return context
        
    except Exception as e:
        logger.error(f"Error building context: {e}")
        # Return minimal context on error
        return {
            "role": job_description[:100],
            "skills_required": required_skills,
            "candidate_strengths": [],
            "candidate_gaps": required_skills,
            "focus_areas": ["General assessment"],
            "interview_type": interview_type,
            "company_type": company_type,
            "error": str(e),
            "created_at": datetime.utcnow().isoformat()
        }
