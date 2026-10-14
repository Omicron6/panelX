"""
Configuration for Strands Interview Agent
Centralized configuration management
"""

import os
from dotenv import load_dotenv

load_dotenv()

# AWS Configuration
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")
REQUESTY_API_KEY = os.getenv("REQUESTY_API_KEY")
REQUESTY_MODEL_ID = os.getenv("REQUESTY_MODEL_ID", "google/gemma-4-31b-it")
REQUESTY_BASE_URL = os.getenv("REQUESTY_BASE_URL", "https://router.requesty.ai/v1")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "requesty").strip().lower()
LLM_PROVIDER_ORDER = [p.strip().lower() for p in os.getenv("LLM_PROVIDER_ORDER", "deepseek,requesty").split(",") if p.strip()]
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_MODEL_ID = os.getenv("DEEPSEEK_MODEL_ID", "deepseek-flash")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
ACTIVE_MODEL_ID = (
    f"{DEEPSEEK_MODEL_ID} (DeepSeek) → {REQUESTY_MODEL_ID} (Requesty) fallback"
    if LLM_PROVIDER == "auto"
    else DEEPSEEK_MODEL_ID if LLM_PROVIDER == "deepseek" else REQUESTY_MODEL_ID
)

# Application Configuration
# Default output budget for Requesty-backed model calls.
MAX_TOKENS = 512
TEMPERATURE = 0.7
TOP_P = 0.9

# Interview Configuration
MAX_QUESTIONS = 12
MIN_QUESTIONS = 8
PASS_THRESHOLD = 7.0
MAYBE_THRESHOLD = 5.0

# Scoring Weights
TECHNICAL_WEIGHT = 0.7
BEHAVIOR_WEIGHT = 0.3

# Agent Info
AGENT_NAME = "AI Interview Agent"
AGENT_VERSION = "1.0.0"
AGENT_TYPE = "Autonomous Interview Agent"
