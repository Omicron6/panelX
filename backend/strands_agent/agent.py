"""
Strands Interview Agent - Main Orchestrator
Modular architecture using separated tool files
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

from .tools.context_builder import build_context
from .tools.question_generator import generate_question
from .tools.answer_evaluator import evaluate_answer
from .tools.behavior_analyzer import analyze_behavior
from .tools.decision_engine import make_decision
from .config import AGENT_NAME, AGENT_VERSION, AGENT_TYPE, MAX_QUESTIONS, ACTIVE_MODEL_ID, LLM_PROVIDER

logger = logging.getLogger(__name__)


class StrandsInterviewAgent:
    """
    Main orchestrator for the modular interview agent.
    
    Coordinates between:
    - Context Builder
    - Question Generator
    - Answer Evaluator
    - Behavior Analyzer
    - Decision Engine
    """
    
    def __init__(self):
        """Initialize the agent with empty session storage"""
        self.sessions = {}
        logger.info(f"Initialized {AGENT_NAME} v{AGENT_VERSION}")
    
    def _get_session_state(self, session_id: str = "default") -> Dict:
        """
        Get or create session state.
        
        Args:
            session_id: Unique session identifier
        
        Returns:
            Session state dictionary
        """
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "questions_asked": 0,
                "evaluations": [],
                "context": None,
                "interview_complete": False,
                "created_at": datetime.utcnow().isoformat()
            }
        return self.sessions[session_id]
    
    def build_context(
        self,
        job_description: str,
        required_skills: List[str],
        candidate_resume: str,
        interview_type: str = "technical",
        company_type: str = "startup",
        session_id: str = "default"
    ) -> Dict:
        """
        Build interview context using Context Builder tool.
        
        Args:
            job_description: Full job description
            required_skills: List of required skills
            candidate_resume: Candidate's resume text
            interview_type: Type of interview (technical/behavioral/mixed)
            company_type: Company type (mnc/startup)
            session_id: Session identifier
        
        Returns:
            Context dictionary with analysis
        """
        logger.info(f"Building context for session {session_id}")
        
        # Use Context Builder tool
        context = build_context(
            job_description=job_description,
            required_skills=required_skills,
            candidate_resume=candidate_resume,
            interview_type=interview_type,
            company_type=company_type
        )
        
        # Store context in session
        state = self._get_session_state(session_id)
        state["context"] = context
        
        logger.info(f"Context built for session {session_id}")
        return context
    
    def generate_question(
        self,
        difficulty: str = "medium",
        question_type: str = "technical",
        session_id: str = "default"
    ) -> Dict:
        """
        Generate next interview question using Question Generator tool.
        
        Args:
            difficulty: easy/medium/hard
            question_type: technical/behavioral/scenario
            session_id: Session identifier
        
        Returns:
            Question dictionary
        """
        logger.info(f"Generating question for session {session_id}")
        
        state = self._get_session_state(session_id)
        context = state.get("context", {})
        evaluations = state.get("evaluations", [])
        
        if not context:
            raise ValueError("Context not built. Call build_context first.")
        
        # Use Question Generator tool
        question = generate_question(
            context=context,
            difficulty=difficulty,
            question_type=question_type,
            previous_evaluations=evaluations if evaluations else None
        )
        
        # Update session state
        state["questions_asked"] += 1
        
        logger.info(f"Question #{state['questions_asked']} generated for session {session_id}")
        return question
    
    def evaluate_answer(
        self,
        question: Dict,
        answer: str,
        context: Dict,
        session_id: str = "default"
    ) -> Dict:
        """
        Evaluate candidate's answer using Answer Evaluator tool.
        
        Args:
            question: Question dictionary
            answer: Candidate's answer text
            context: Interview context
            session_id: Session identifier
        
        Returns:
            Evaluation dictionary
        """
        logger.info(f"Evaluating answer for session {session_id}")
        
        state = self._get_session_state(session_id)
        
        # Use Answer Evaluator tool
        evaluation = evaluate_answer(
            question=question,
            answer=answer,
            context=context
        )
        
        # Store evaluation in session
        state["evaluations"].append(evaluation)
        
        logger.info(f"Answer evaluated: {evaluation['score']}/10 for session {session_id}")
        return evaluation
    
    def analyze_behavior(
        self,
        eye_contact: float,
        attention_score: float,
        session_id: str = "default"
    ) -> Dict:
        """
        Analyze candidate behavior using Behavior Analyzer tool.
        
        Args:
            eye_contact: Eye contact score (0-1)
            attention_score: Attention score (0-1)
            session_id: Session identifier
        
        Returns:
            Behavior analysis dictionary
        """
        logger.info(f"Analyzing behavior for session {session_id}")
        
        # Use Behavior Analyzer tool
        analysis = analyze_behavior(
            eye_contact=eye_contact,
            attention_score=attention_score
        )
        
        logger.info(f"Behavior analyzed: {analysis['behavior_score']}/10 for session {session_id}")
        return analysis
    
    def make_decision(
        self,
        behavior_analysis: Dict,
        context: Dict,
        session_id: str = "default"
    ) -> Dict:
        """
        Make final hiring decision using Decision Engine tool.
        
        Args:
            behavior_analysis: Behavior analysis results
            context: Interview context
            session_id: Session identifier
        
        Returns:
            Decision dictionary with recommendation
        """
        logger.info(f"Making decision for session {session_id}")
        
        state = self._get_session_state(session_id)
        evaluations = state.get("evaluations", [])
        
        if not evaluations:
            return {"error": "No evaluations to base decision on"}
        
        # Use Decision Engine tool
        decision_result = make_decision(
            evaluations=evaluations,
            behavior_analysis=behavior_analysis,
            context=context
        )
        
        # Mark interview as complete
        state["interview_complete"] = True
        
        logger.info(f"Decision made: {decision_result['decision']} for session {session_id}")
        return decision_result
    
    def should_continue(self, session_id: str = "default") -> bool:
        """
        Check if interview should continue.
        
        Args:
            session_id: Session identifier
        
        Returns:
            True if should continue, False otherwise
        """
        state = self._get_session_state(session_id)
        return state["questions_asked"] < MAX_QUESTIONS and not state["interview_complete"]
    
    def get_session_info(self, session_id: str = "default") -> Dict:
        """
        Get session information.
        
        Args:
            session_id: Session identifier
        
        Returns:
            Session state dictionary
        """
        return self._get_session_state(session_id)


# Global agent instance for reuse
_agent_instance = None


def get_agent() -> StrandsInterviewAgent:
    """
    Get or create the singleton agent instance.
    
    Returns:
        StrandsInterviewAgent instance
    """
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = StrandsInterviewAgent()
    return _agent_instance


def get_agent_info() -> Dict:
    """
    Get agent information.
    
    Returns:
        Dictionary with agent metadata
    """
    return {
        "name": AGENT_NAME,
        "version": AGENT_VERSION,
        "type": AGENT_TYPE,
        "model": f"{ACTIVE_MODEL_ID} ({LLM_PROVIDER.title()})",
        "architecture": "Modular Tool-Based",
        "capabilities": [
            "Real-time question generation",
            "Dynamic answer evaluation",
            "Autonomous decision making",
            "Adaptive difficulty adjustment",
            "Behavioral analysis",
            "No hardcoded questions"
        ],
        "tools": [
            "Context Builder",
            "Question Generator",
            "Answer Evaluator",
            "Behavior Analyzer",
            "Decision Engine"
        ]
    }
