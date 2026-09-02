import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Award, TrendingUp, ThumbsUp, AlertCircle, ArrowRight, Loader } from 'lucide-react';

const CandidateResults = () => {
  const location = useLocation();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const wasTerminated = location.state?.terminated === true;

  useEffect(() => {
    const fetchSessionResults = async () => {
      try {
        // Get session ID from location state
        const sessionId = location.state?.sessionId || sessionStorage.getItem('current_session_id');
        
        if (!sessionId) {
          setError('No interview session found. Please complete an interview first.');
          setLoading(false);
          return;
        }

        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:8001';
        const apiRoot = apiBase.replace(/\/$/, '') + '/api';
        
        const response = await fetch(`${apiRoot}/interview/results/${sessionId}`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          setError('Results not available. You may not have completed this interview yet.');
          setLoading(false);
          return;
        }

        const data = await response.json();
        setSessionData(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch session results:', err);
        setError('Could not load results. Please try again later.');
        setLoading(false);
      }
    };

    fetchSessionResults();
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Loader className="w-12 h-12 text-purple-400" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Results</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link to="/candidate/dashboard">
            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl font-bold">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const data = sessionData;
  const overallScore = data.overall_score || 0;
  const technicalScore = data.technical_score || 0;
  const behavioralScore = data.behavioral_score || 0;

  const getPerformanceLabel = (score) => {
    if (score >= 80) return 'Excellent Performance!';
    if (score >= 60) return 'Good Performance';
    if (score >= 40) return 'Average Performance';
    if (score > 0) return 'Needs Improvement';
    return 'No Score Available';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" data-testid="results-page">
      {wasTerminated && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start space-x-3 px-5 py-4 rounded-2xl bg-red-950/60 border border-red-500/50"
        >
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-bold">Interview ended early</p>
            <p className="text-red-200/80 text-sm">
              This interview was terminated due to multiple proctoring violations. Results below reflect answers completed before termination.
            </p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 mb-4">
          <Award className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue' }}>
          Interview Complete!
        </h1>
        <p className="text-gray-400">Here's how you performed</p>
      </motion.div>

      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-purple-600 to-blue-500 rounded-3xl p-8 text-center"
      >
        <h2 className="text-white text-xl font-bold mb-2">Overall Score</h2>
        <div className="text-8xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue' }}>
          {overallScore}
        </div>
        <p className="text-purple-100 text-lg">{getPerformanceLabel(overallScore)}</p>
      </motion.div>

      {/* Score Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Technical Skills</h3>
              <p className="text-gray-400 text-sm">Problem-solving & Code Quality</p>
            </div>
          </div>
          <div className="text-5xl font-bold text-white" style={{ fontFamily: 'Bebas Neue' }}>
            {technicalScore}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <ThumbsUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Communication</h3>
              <p className="text-gray-400 text-sm">Clarity & Presentation</p>
            </div>
          </div>
          <div className="text-5xl font-bold text-white" style={{ fontFamily: 'Bebas Neue' }}>
            {behavioralScore}
          </div>
        </motion.div>
      </div>

      {/* Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">AI Feedback</h3>
        <p className="text-gray-300 leading-relaxed">{data.feedback}</p>
      </motion.div>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <ThumbsUp className="w-5 h-5 text-green-400" />
            <span>Strengths</span>
          </h3>
          <ul className="space-y-3">
            {(data.strengths || []).map((strength, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <span className="text-gray-300">{strength}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <span>Areas for Growth</span>
          </h3>
          <ul className="space-y-3">
            {(data.improvements || []).map((improvement, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                <span className="text-gray-300">{improvement}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Question-wise Breakdown */}
      {data.question_evaluations && data.question_evaluations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Question-by-Question Scores</h3>
          <div className="space-y-3">
            {data.question_evaluations.map((evaluation, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700/30">
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{evaluation.question.slice(0, 50)}...</p>
                  <p className="text-xs text-gray-500 mt-1">{evaluation.feedback}</p>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-lg font-bold text-purple-400">{evaluation.score}/10</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-center space-x-4 flex-wrap gap-4"
      >
        <Link to="/candidate/dashboard">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gray-800 border border-gray-700 text-white rounded-xl font-bold hover:border-purple-500/50 transition-all"
          >
            Back to Dashboard
          </motion.button>
        </Link>
        <Link to="/candidate/interviews">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            <span>Take Another Interview</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
};

export default CandidateResults;

