"""
Configuration for Strands Interview Agent
Centralized configuration management
"""

import os
from dotenv import load_dotenv

load_dotenv()

# AWS Bedrock Configuration
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "meta.llama3-8b-instruct-v1:0")

# Application Configuration
# Kept modest to reduce Bedrock token-per-minute throttling.
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
