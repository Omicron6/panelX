import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, Briefcase, Target, Play, Loader, AlertCircle } from 'lucide-react';

const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:8001').replace(/\/$/, '');
const apiRoot = `${apiBase}/api`;

const Interviews = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${apiRoot}/interview/sessions?limit=20`);
        if (!response.ok) throw new Error('Failed to fetch sessions');
        const data = await response.json();
        setSessions(data.sessions || []);
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
        setError('Could not load interview sessions.');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const getDifficultyColor = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('behavioral') || t.includes('hr')) {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
    if (t.includes('scenario')) {
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    }
    return 'bg-green-500/20 text-green-400 border-green-500/50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Loader className="w-10 h-10 text-purple-400" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-300 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="interviews-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue' }}>
          Available Interviews
        </h1>
        <p className="text-gray-400">
          {sessions.length > 0
            ? 'Choose an interview session to begin your assessment'
            : 'No interview sessions available yet. Ask an admin to create one.'}
        </p>
      </div>

      {/* Interviews Grid */}
      <div className="grid gap-6">
        {sessions.map((session, index) => {
          const context = session.context || {};
          const role = context.role || 'Interview Session';
          const skills = context.skills_required || [];
          const interviewType = context.interview_type || 'technical';
          const companyType = context.company_type || 'startup';
          const status = session.status || 'in_progress';
          const isCompleted = status === 'completed';

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 hover:border-purple-500/50 transition-all"
              data-testid={`interview-${session.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-2xl font-bold text-white">
                      {role.length > 60 ? role.slice(0, 60) + '...' : role}
                    </h3>
                    {isCompleted && (
                      <span className="px-3 py-1 bg-gray-600/30 text-gray-400 rounded-full text-xs font-bold">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-purple-400 font-medium mb-4 capitalize">
                    {companyType} • {session.candidate_name || 'Candidate'}
                  </p>

                  {/* Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">30 min</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Target className="w-4 h-4" />
                      <span className="text-sm capitalize">{interviewType}</span>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(interviewType)}`}>
                        {interviewType.charAt(0).toUpperCase() + interviewType.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2">
                    {skills.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                    {skills.length > 5 && (
                      <span className="px-3 py-1 text-gray-400 text-xs">+{skills.length - 5} more</span>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div>
                  {!isCompleted ? (
                    <Link to={`/candidate/interview/${session.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/50 transition-all"
                      >
                        <Play className="w-5 h-5" />
                        <span>Start Interview</span>
                      </motion.button>
                    </Link>
                  ) : (
                    <Link to="/candidate/results" state={{ sessionId: session.id }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-600 transition-all"
                      >
                        View Results
                      </motion.button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Interviews;
