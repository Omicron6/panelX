"""
Tool: Context Builder
Analyzes job description and candidate resume to build interview context
"""

import boto3
import json
import logging
import time
import random
from botocore.config import Config
from botocore.exceptions import ClientError
from typing import Dict, List
from datetime import datetime
from ..config import (
    AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
    BEDROCK_MODEL_ID, MAX_TOKENS, TEMPERATURE
)

logger = logging.getLogger(__name__)

# Boto3 client with adaptive retry mode - automatically backs off on throttling
_boto_config = Config(
    retries={
        "max_attempts": 8,
        "mode": "adaptive"
    },
    read_timeout=60,
    connect_timeout=10
)

# Initialize Bedrock client
bedrock = boto3.client(
    "bedrock-runtime",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    config=_boto_config
)

# Throttling / transient error codes worth retrying manually on top of boto retries
_RETRYABLE_ERRORS = {
    "ThrottlingException",
    "TooManyRequestsException",
    "ServiceUnavailableException",
    "ModelTimeoutException",
    "ModelNotReadyException",
    "InternalServerException",
}

# Max time to wait across all manual retries (seconds)
_MAX_TOTAL_RETRY_SECONDS = 45


def call_llm(prompt: str, max_tokens: int = MAX_TOKENS, temperature: float = TEMPERATURE) -> str:
    """
    Call Bedrock LLM with exponential backoff + jitter on throttling.

    Boto3's adaptive retry handles most throttling, but we add an explicit
    layer so a burst of ThrottlingExceptions doesn't immediately fail the request.
    """
    max_manual_retries = 5
    attempt = 0
    elapsed = 0.0

    # Llama 3 Instruct models expect their chat template. Sending a raw prompt
    # often yields empty/erratic output, so wrap it properly.
    formatted_prompt = (
        "<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n"
        f"{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
    )

    while True:
        try:
            response = bedrock.invoke_model(
                modelId=BEDROCK_MODEL_ID,
                body=json.dumps({
                    "prompt": formatted_prompt,
                    "max_gen_len": max_tokens,
                    "temperature": temperature,
                    "top_p": 0.9
                })
            )
            result = json.loads(response['body'].read())
            return (result.get('generation') or '').strip()

        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            attempt += 1

            if error_code in _RETRYABLE_ERRORS and attempt <= max_manual_retries and elapsed < _MAX_TOTAL_RETRY_SECONDS:
                # Exponential backoff with jitter: 1s, 2s, 4s, 8s... capped at 15s
                backoff = min(2 ** (attempt - 1), 15)
                jitter = random.uniform(0, 0.5 * backoff)
                wait = backoff + jitter
                elapsed += wait
                logger.warning(
                    f"Bedrock {error_code} (attempt {attempt}/{max_manual_retries}). "
                    f"Retrying in {wait:.1f}s..."
                )
                time.sleep(wait)
                continue

            logger.error(f"LLM call failed after {attempt} attempt(s): {error_code or e}")
            raise
        except Exception as e:
            logger.error(f"LLM call error: {e}")
            raise


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
        analysis = call_llm(prompt, max_tokens=400, temperature=0.5)
        
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
