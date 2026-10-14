from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
import os
import logging
import uuid
import json
import asyncio

# Load .env FIRST before any checks
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
FRONTEND_DIR = ROOT_DIR.parent / 'frontend'
INTEL_PACKET_FILE = FRONTEND_DIR / 'intel storage'

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import modular Strands agent
from strands_agent import get_agent, get_agent_info
from strands_agent.tools.speech_analyzer import get_speech_analyzer

logger.info("✅ Using Modular Strands Interview Agent")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
intel_file_lock = asyncio.Lock()


async def append_intel_packet(packet: Dict[str, Any], source: str) -> None:
    """Append one intel packet as a JSONL line for offline accuracy review."""
    record = {
        "source": source,
        "received_at": datetime.now(timezone.utc).isoformat(),
        "packet": packet,
    }

    line = json.dumps(record, ensure_ascii=True)
    try:
        async with intel_file_lock:
            def _append_line() -> None:
                with open(INTEL_PACKET_FILE, 'a', encoding='utf-8') as f:
                    f.write(line + "\n")

            await asyncio.to_thread(_append_line)
    except Exception as e:
        logger.warning(f"Intel packet write failed: {e}")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
interviews_collection = db.interviews
sessions_collection = db.sessions

# Create the main app
app = FastAPI(title="AI Interview Agent API", version="1.0.0")

# Create API router with /api prefix
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ====================
# PYDANTIC MODELS
# ====================

class InterviewStartRequest(BaseModel):
    """Request to start a new interview"""
    job_description: str
    required_skills: List[str]
    candidate_resume: str
    interview_type: str = "technical"
    company_type: str = "startup"
    candidate_name: Optional[str] = None

    @field_validator("job_description")
    @classmethod
    def validate_job_description(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 20:
            raise ValueError("job_description must be at least 20 characters")
        return cleaned

    @field_validator("required_skills")
    @classmethod
    def validate_required_skills(cls, skills: List[str]) -> List[str]:
        normalized = [skill.strip() for skill in skills if skill and skill.strip()]
        if not normalized:
            raise ValueError("required_skills must contain at least one skill")
        if len(normalized) > 20:
            raise ValueError("required_skills cannot exceed 20 items")
        return normalized

    @field_validator("company_type")
    @classmethod
    def validate_company_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"mnc", "startup"}:
            raise ValueError("company_type must be either 'mnc' or 'startup'")
        return normalized


class InterviewPreviewRequest(BaseModel):
    """Request to preview generated interview questions"""
    job_description: str
    required_skills: List[str]
    interview_type: str = "technical"
    company_type: str = "startup"
    question_count: int = Field(default=5, ge=1, le=20)
    difficulty: str = "medium"
    candidate_resume: Optional[str] = "Not provided yet"

    @field_validator("job_description")
    @classmethod
    def validate_job_description(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 20:
            raise ValueError("job_description must be at least 20 characters")
        return cleaned

    @field_validator("required_skills")
    @classmethod
    def validate_required_skills(cls, skills: List[str]) -> List[str]:
        normalized = [skill.strip() for skill in skills if skill and skill.strip()]
        if not normalized:
            raise ValueError("required_skills must contain at least one skill")
        if len(normalized) > 20:
            raise ValueError("required_skills cannot exceed 20 items")
        return normalized

    @field_validator("company_type")
    @classmethod
    def validate_company_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"mnc", "startup"}:
            raise ValueError("company_type must be either 'mnc' or 'startup'")
        return normalized


class QuestionRequest(BaseModel):
    """Request to generate a question"""
    session_id: str
    difficulty: Optional[str] = "medium"
    question_type: Optional[str] = "technical"
    candidate_name: Optional[str] = None


class AnswerSubmission(BaseModel):
    """Candidate's answer submission"""
    session_id: str
    question_id: str
    answer_text: str
    audio_base64: Optional[str] = None


class BehaviorMetrics(BaseModel):
    """Behavior metrics from frontend"""
    session_id: str
    eye_contact: float = Field(ge=0, le=1)
    attention_score: float = Field(ge=0, le=1)
    additional_metrics: Optional[Dict[str, float]] = None


class DecisionRequest(BaseModel):
    """Request to make final decision"""
    session_id: str
    terminated: bool = False
    termination_reason: Optional[str] = None
    violation_count: Optional[int] = 0


class LoginRequest(BaseModel):
    """User login request"""
    email: str
    password: str
    user_type: str  # 'candidate' or 'admin'


class LoginResponse(BaseModel):
    """Login response with token"""
    status: str
    token: str
    user_type: str
    email: str


class InterviewSession(BaseModel):
    """Interview session data"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_name: Optional[str] = None
    context: Dict[str, Any]
    questions: List[Dict[str, Any]] = []
    evaluations: List[Dict[str, Any]] = []
    behavior_analysis: Optional[Dict[str, Any]] = None
    final_decision: Optional[Dict[str, Any]] = None
    status: str = "in_progress"  # in_progress, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def _normalize_interview_type(raw_type: str) -> str:
    """Map legacy interview types to supported generator types."""
    type_value = (raw_type or "technical").strip().lower()
    if type_value == "hr":
        return "behavioral"
    if type_value not in {"technical", "behavioral", "scenario"}:
        return "technical"
    return type_value


# ====================
# REST API ENDPOINTS
# ====================

@app.get("/")
async def app_root():
    """Top-level health check endpoint."""
    return {
        "message": "AI Interview Agent API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "api_root": "/api"
    }

@api_router.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Interview Agent API",
        "status": "running",
        "version": "1.0.0"
    }


@api_router.get("/agent/info")
async def agent_info():
    """Get information about the interviewer agent"""
    return get_agent_info()


@api_router.post("/interview/start")
async def start_interview(request: InterviewStartRequest):
    """Start a new interview session with autonomous agent"""
    try:
        logger.info(f"Starting interview: {request.job_description[:50]}")
        
        # Create session first
        session = InterviewSession(
            candidate_name=request.candidate_name,
            context={}  # Will be filled by agent
        )
        # Get autonomous agent
        agent = get_agent()
        
        # Agent builds context
        context = agent.build_context(
            job_description=request.job_description,
            required_skills=request.required_skills,
            candidate_resume=request.candidate_resume,
            interview_type=request.interview_type,
            company_type=request.company_type,
            session_id=session.id
        )
        
        # Update session with context
        session.context = context
        
        # Save to database
        session_dict = session.model_dump()
        if request.candidate_name:
            session_dict["candidate_name_source"] = "candidate"
        session_dict['created_at'] = session_dict['created_at'].isoformat()
        session_dict['updated_at'] = session_dict['updated_at'].isoformat()
        
        await sessions_collection.insert_one(session_dict)
        
        logger.info(f"Session created: {session.id}")
        
        return {
            "session_id": session.id,
            "context": context,
            "status": "ready",
            "message": "Modular Strands agent ready. Questions generated in real-time.",
            "agent_type": "Strands Modular Agent",
            "company_type": request.company_type
        }
        
    except Exception as e:
        logger.error(f"Error starting interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/interview/preview")
async def preview_questions(request: InterviewPreviewRequest):
    """Preview dynamically generated questions before creating a session."""
    try:
        logger.info(
            "Preview request received (company_type=%s, question_count=%s)",
            request.company_type,
            request.question_count,
        )

        normalized_type = _normalize_interview_type(request.interview_type)
        preview_session_id = f"preview-{uuid.uuid4()}"
        agent = get_agent()

        preview_context = agent.build_context(
            job_description=request.job_description,
            required_skills=request.required_skills,
            candidate_resume=request.candidate_resume or "Not provided yet",
            interview_type=normalized_type,
            company_type=request.company_type,
            session_id=preview_session_id
        )

        generated_questions: List[Dict[str, Any]] = []
        for _ in range(request.question_count):
            generated = agent.generate_question(
                difficulty=request.difficulty,
                question_type=normalized_type,
                session_id=preview_session_id
            )
            generated_questions.append(generated)

        return {
            "status": "ok",
            "generation_source": "configured_provider",
            "company_type": request.company_type,
            "interview_type": normalized_type,
            "question_count": request.question_count,
            "questions": generated_questions,
            "context_summary": {
                "role": preview_context.get("role"),
                "focus_areas": preview_context.get("focus_areas", []),
                "candidate_gaps": preview_context.get("candidate_gaps", []),
            }
        }
    except Exception as e:
        logger.error(f"Error generating preview questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/interview/question")
async def generate_question(request: QuestionRequest):
    """Generate next question using autonomous agent"""
    try:
        logger.info(f"Generating question for session: {request.session_id}")
        
        # Get session
        session_doc = await sessions_collection.find_one({"id": request.session_id})
        if not session_doc:
            raise HTTPException(status_code=404, detail="Session not found")

        # Persist the candidate's entered name as soon as they join, even if AI generation fails.
        if request.candidate_name and request.candidate_name.strip():
            await sessions_collection.update_one(
                {"id": request.session_id},
                {"$set": {
                    "candidate_name": request.candidate_name.strip(),
                    "candidate_name_source": "candidate",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }}
            )
        
        # Get autonomous agent
        agent = get_agent()
        
        # Agent generates question
        question = agent.generate_question(
            difficulty=request.difficulty,
            question_type=request.question_type,
            session_id=request.session_id
        )
        
        # Update session
        update_fields = {"updated_at": datetime.now(timezone.utc).isoformat()}
        await sessions_collection.update_one(
            {"id": request.session_id},
            {
                "$push": {"questions": question},
                "$set": update_fields
            }
        )
        
        logger.info(f"Question generated: {question['id']}")
        
        return {
            "question": question,
            "session_id": request.session_id
        }
        
    except Exception as e:
        logger.error(f"Error generating question: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/interview/answer")
async def submit_answer(answer: AnswerSubmission):
    """Submit and evaluate answer using autonomous agent"""
    try:
        logger.info(f"Evaluating answer for session: {answer.session_id}")
        
        # Get session
        session_doc = await sessions_collection.find_one({"id": answer.session_id})
        if not session_doc:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Find question
        questions = session_doc.get('questions', [])
        question = next((q for q in questions if q['id'] == answer.question_id), None)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        context = session_doc.get('context', {})
        
        # Get autonomous agent
        agent = get_agent()
        
        # Agent evaluates answer
        evaluation = agent.evaluate_answer(
            question=question,
            answer=answer.answer_text,
            context=context,
            session_id=answer.session_id
        )
        
        # Update session
        await sessions_collection.update_one(
            {"id": answer.session_id},
            {
                "$push": {"evaluations": evaluation},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        logger.info(f"Answer evaluated: {evaluation['score']}/10")
        
        return {
            "evaluation": evaluation,
            "session_id": answer.session_id
        }
        
    except Exception as e:
        logger.error(f"Error evaluating answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/interview/behavior")
async def analyze_behavior(metrics: BehaviorMetrics):
    """Analyze candidate behavior using autonomous agent"""
    try:
        logger.info(f"Analyzing behavior for session: {metrics.session_id}")

        # Mirror behavior payload to intel capture file for calibration review.
        await append_intel_packet(
            {
                "session_id": metrics.session_id,
                "eye_contact": metrics.eye_contact,
                "attention_score": metrics.attention_score,
                "additional_metrics": metrics.additional_metrics or {},
            },
            source="rest_behavior"
        )
        
        # Get session
        session_doc = await sessions_collection.find_one({"id": metrics.session_id})
        if not session_doc:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get autonomous agent
        agent = get_agent()
        
        # Agent analyzes behavior
        analysis = agent.analyze_behavior(
            eye_contact=metrics.eye_contact,
            attention_score=metrics.attention_score,
            session_id=metrics.session_id
        )
        
        # Update session
        await sessions_collection.update_one(
            {"id": metrics.session_id},
            {
                "$set": {
                    "behavior_analysis": analysis,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"Behavior analyzed: Score {analysis['behavior_score']}/10")
        
        return {
            "analysis": analysis,
            "session_id": metrics.session_id
        }
        
    except Exception as e:
        logger.error(f"Error analyzing behavior: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/interview/intel")
async def ingest_intel_packet(packet: Dict[str, Any] = Body(...)):
    """Capture a raw intel packet via REST as fallback when WS is unavailable."""
    try:
        await append_intel_packet(packet, source="rest_intel")
        return {
            "status": "ok",
            "seq": packet.get("seq"),
            "session_id": packet.get("session_id")
        }
    except Exception as e:
        logger.error(f"Error ingesting intel packet: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/interview/decision")
async def make_final_decision(request: DecisionRequest):
    """Make final hiring decision using autonomous agent"""
    try:
        logger.info(f"Making decision for session: {request.session_id}")
        
        # Get session
        session_doc = await sessions_collection.find_one({"id": request.session_id})
        if not session_doc:
            raise HTTPException(status_code=404, detail="Session not found")
        
        evaluations = session_doc.get('evaluations', [])
        behavior_analysis = session_doc.get('behavior_analysis', {})
        context = session_doc.get('context', {})

        # If the interview was terminated for proctoring violations, record a
        # disqualified decision regardless of how many questions were answered.
        if request.terminated:
            answered = len(evaluations)
            avg = (sum(e.get('score', 0) for e in evaluations) / answered) if answered else 0
            decision_result = {
                "decision": "Disqualified",
                "final_score": round(avg, 1),
                "summary": (
                    f"Interview terminated due to proctoring violations "
                    f"({request.violation_count or 0} warnings). "
                    f"Candidate answered {answered} question(s) before termination."
                ),
                "disqualified": True,
                "termination_reason": request.termination_reason or "Proctoring violations",
                "violation_count": request.violation_count or 0,
            }
            await sessions_collection.update_one(
                {"id": request.session_id},
                {
                    "$set": {
                        "final_decision": decision_result,
                        "status": "terminated",
                        "proctoring": {
                            "terminated": True,
                            "reason": request.termination_reason or "Proctoring violations",
                            "violation_count": request.violation_count or 0,
                        },
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            logger.info(f"Interview terminated (violations={request.violation_count}) for {request.session_id}")
            return {"decision": decision_result, "session_id": request.session_id}

        if not evaluations:
            # No answers and not terminated — record an incomplete decision instead of erroring
            decision_result = {
                "decision": "Incomplete",
                "final_score": 0,
                "summary": "The interview ended before any questions were answered.",
            }
            await sessions_collection.update_one(
                {"id": request.session_id},
                {"$set": {"final_decision": decision_result, "status": "completed",
                          "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            return {"decision": decision_result, "session_id": request.session_id}
        
        # Get autonomous agent
        agent = get_agent()
        
        # Agent makes final decision
        decision_result = agent.make_decision(
            behavior_analysis=behavior_analysis,
            context=context,
            session_id=request.session_id
        )
        
        # Update session
        await sessions_collection.update_one(
            {"id": request.session_id},
            {
                "$set": {
                    "final_decision": decision_result,
                    "status": "completed",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        decision = decision_result.get('decision')
        final_score = decision_result.get('final_score')
        logger.info(f"Decision made: {decision} (Score: {final_score}/10)")
        
        return {
            "decision": decision_result,
            "session_id": request.session_id
        }
        
    except Exception as e:
        logger.error(f"Error making decision: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/interview/session/{session_id}")
async def get_session(session_id: str):
    """Get complete interview session data"""
    session_doc = await sessions_collection.find_one({"id": session_id}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_doc


@api_router.get("/interview/results/{session_id}")
async def get_interview_results(session_id: str):
    """Get formatted interview results for results page"""
    try:
        session_doc = await sessions_collection.find_one({"id": session_id}, {"_id": 0})
        if not session_doc:
            raise HTTPException(status_code=404, detail="Session not found")
        
        evaluations = session_doc.get('evaluations') or []
        behavior_analysis = session_doc.get('behavior_analysis') or {}
        final_decision = session_doc.get('final_decision') or {}
        questions = session_doc.get('questions') or []
        
        # Calculate overall score from evaluations
        if evaluations:
            scores = [e.get('score', 5) for e in evaluations]
            overall_score = sum(scores) / len(scores)
        else:
            overall_score = 0
        
        # Build a question-id -> text lookup (question text lives in the questions array)
        q_text_by_id = {}
        for q in questions:
            if isinstance(q, dict):
                q_text_by_id[q.get('id')] = q.get('text') or q.get('question') or 'Question'
        
        # Extract question evaluations (defensive: 'question' may be an id string or missing)
        question_evaluations = []
        for e in evaluations:
            qref = e.get('question')
            if isinstance(qref, dict):
                q_text = qref.get('text') or qref.get('question') or 'Question'
            else:
                q_text = q_text_by_id.get(e.get('question_id'), 'Question')
            question_evaluations.append({
                'question': q_text,
                'score': e.get('score', 0),
                'feedback': e.get('feedback', '')
            })
        
        # Get strengths and improvements from final decision or provide defaults
        strengths = final_decision.get('strengths', [])
        improvements = final_decision.get('improvements') or final_decision.get('weaknesses', [])
        feedback = final_decision.get('summary') or final_decision.get('feedback') or ''
        
        return {
            "session_id": session_id,
            "overall_score": round(overall_score, 1),
            "technical_score": round(overall_score * 1.02, 1),  # Slightly adjusted
            "behavioral_score": round(overall_score * 0.98, 1),  # Slightly adjusted
            "questions_answered": len(evaluations),
            "strengths": strengths[:4] if strengths else [
                "Good communication",
                "Problem-solving approach",
                "Technical understanding"
            ],
            "improvements": improvements[:4] if improvements else [
                "Deeper technical knowledge",
                "More practical examples"
            ],
            "feedback": feedback if isinstance(feedback, str) else "Good overall performance!",
            "question_evaluations": question_evaluations,
            "decision": final_decision.get('decision', 'No decision made yet'),
            "final_score": final_decision.get('final_score', overall_score)
        }
    except Exception as e:
        logger.error(f"Error getting interview results: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/interview/sessions")
async def list_sessions(limit: int = 10):
    """List recent interview sessions"""
    sessions = await sessions_collection.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"sessions": sessions, "total": len(sessions)}


# ====================
# AUTH ENDPOINTS
# ====================

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate user and return token"""
    try:
        # For MVP: accept any valid email/password combo, generate token
        if not request.email or not request.password or len(request.password) < 3:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Generate simple token (in production use JWT with expiry)
        token = str(uuid.uuid4())
        
        logger.info(f"User logged in: {request.email} ({request.user_type})")
        
        return LoginResponse(
            status="success",
            token=token,
            user_type=request.user_type,
            email=request.email
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


# ====================
# WEBSOCKET ENDPOINT
# ====================

class ConnectionManager:
    """Manage WebSocket connections for real-time communication"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"WebSocket connected: {session_id}")
    
    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info(f"WebSocket disconnected: {session_id}")
    
    async def send_message(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(message)


manager = ConnectionManager()


@app.websocket("/ws/interview/{session_id}")
async def websocket_interview(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time interview communication.
    
    Supports:
    - Real-time question delivery
    - Voice streaming
    - Live feedback
    """
    await manager.connect(websocket, session_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "ping":
                await websocket.send_json({"type": "pong"})
            
            elif message_type == "question_request":
                # Generate question via agent
                try:
                    req_data = data.get("data", {})
                    difficulty = req_data.get("difficulty", "medium")
                    question_type = req_data.get("question_type", "technical")
                    
                    agent = get_agent()
                    question = agent.generate_question(
                        difficulty=difficulty,
                        question_type=question_type,
                        session_id=session_id
                    )
                    
                    # Also persist to DB
                    await sessions_collection.update_one(
                        {"id": session_id},
                        {
                            "$push": {"questions": question},
                            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
                        }
                    )
                    
                    await websocket.send_json({
                        "type": "question",
                        "data": question
                    })
                except Exception as e:
                    logger.error(f"WS question generation error: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "data": {"message": f"Failed to generate question: {str(e)}"}
                    })
            
            elif message_type == "answer":
                # Evaluate answer via agent
                try:
                    req_data = data.get("data", {})
                    answer_text = req_data.get("answer_text", "")
                    question_id = req_data.get("question_id", "")
                    
                    # Get session to find the question
                    session_doc = await sessions_collection.find_one({"id": session_id})
                    questions = session_doc.get("questions", []) if session_doc else []
                    question = next((q for q in questions if q.get("id") == question_id), None)
                    context = session_doc.get("context", {}) if session_doc else {}
                    
                    if question:
                        agent = get_agent()
                        evaluation = agent.evaluate_answer(
                            question=question,
                            answer=answer_text,
                            context=context,
                            session_id=session_id
                        )
                        
                        # Persist evaluation
                        await sessions_collection.update_one(
                            {"id": session_id},
                            {
                                "$push": {"evaluations": evaluation},
                                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
                            }
                        )
                        
                        await websocket.send_json({
                            "type": "evaluation",
                            "data": evaluation
                        })
                    else:
                        await websocket.send_json({
                            "type": "evaluation",
                            "data": {"score": 5, "feedback": "Question not found in session."}
                        })
                except Exception as e:
                    logger.error(f"WS answer evaluation error: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "data": {"message": f"Failed to evaluate answer: {str(e)}"}
                    })
            
            elif message_type == "voice_chunk":
                # Handle voice streaming
                await websocket.send_json({
                    "type": "voice_received",
                    "status": "processing"
                })

            elif message_type == "vision_intel":
                payload = data.get("data", {})
                payload.setdefault("session_id", session_id)
                
                # Process audio chunks if present
                speech_analysis = None
                audio_chunks = payload.get("audio_chunks", [])
                if audio_chunks:
                    try:
                        speech_analyzer = get_speech_analyzer()
                        speech_analysis = []
                        for chunk in audio_chunks:
                            chunk_result = speech_analyzer.process_audio_chunk(chunk)
                            speech_analysis.append(chunk_result)
                            logger.info(f"Audio chunk {chunk.get('index')} analyzed: anomaly_score={chunk_result.get('anomaly_score', 0):.2f}")
                        
                        # Attach speech analysis to payload
                        payload["speech_analysis"] = speech_analysis
                        # Compute aggregate anomaly score
                        if speech_analysis:
                            avg_anomaly = sum(s.get("anomaly_score", 0) for s in speech_analysis) / len(speech_analysis)
                            payload["aggregate_speech_anomaly"] = avg_anomaly
                    except Exception as e:
                        logger.warning(f"Speech analysis error: {e}")
                        payload["speech_analysis_error"] = str(e)
                
                # Log complete packet (vision + speech)
                await append_intel_packet(payload, source="ws_vision_intel")
                
                # Send ACK with summary
                ack_response = {
                    "type": "vision_intel_ack",
                    "seq": payload.get("seq"),
                    "session_id": session_id,
                    "audio_chunks_processed": len(audio_chunks),
                    "speech_analysis_available": speech_analysis is not None
                }
                if speech_analysis and len(speech_analysis) > 0:
                    # Add anomaly summary to ACK
                    ack_response["max_speech_anomaly"] = max(s.get("anomaly_score", 0) for s in speech_analysis)
                    ack_response["suspicious_flags_detected"] = list(set(
                        flag for s in speech_analysis for flag in s.get("suspicious_flags", [])
                    ))
                
                await websocket.send_json(ack_response)
            
    except WebSocketDisconnect:
        manager.disconnect(session_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(session_id)


# Include router in app
app.include_router(api_router)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


@app.on_event("startup")
async def startup_file_storage():
    """Prepare local intel packet storage path."""
    try:
        FRONTEND_DIR.mkdir(parents=True, exist_ok=True)
        if not INTEL_PACKET_FILE.exists():
            INTEL_PACKET_FILE.touch()
        logger.info(f"Intel packet capture enabled: {INTEL_PACKET_FILE}")
    except Exception as e:
        logger.warning(f"Could not initialize intel packet file: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
