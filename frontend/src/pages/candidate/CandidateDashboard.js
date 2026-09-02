import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, TrendingUp, Clock, Calendar, Play, Loader } from 'lucide-react';

const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:8001').replace(/\/$/, '');
const apiRoot = `${apiBase}/api`;

const CandidateDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(`${apiRoot}/interview/sessions?limit=20`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch (e) {
        console.error('Failed to load sessions:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // Split into available (not completed) and completed
  const available = sessions.filter((s) => s.status !== 'completed');
  const completed = sessions.filter((s) => s.status === 'completed');

  const stats = [
    { label: 'Available Interviews', value: String(available.length), icon: Calendar, color: 'from-purple-600 to-purple-400' },
    { label: 'Completed', value: String(completed.length), icon: Award, color: 'from-blue-600 to-blue-400' },
    { label: 'Total Sessions', value: String(sessions.length), icon: Clock, color: 'from-green-600 to-green-400' },
  ];

  const roleOf = (s) => {
    const r = s.context?.role || 'Interview Session';
    return r.length > 55 ? r.slice(0, 55) + '...' : r;
  };

  return (
    <div className="space-y-8" data-testid="candidate-dashboard">
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue' }}>
          Welcome Back, {localStorage.getItem('user_email')?.split('@')[0] || 'Candidate'}! 👋
        </h1>
        <p className="text-gray-400">Your available interviews are listed below</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 hover:border-purple-500/50 transition-all"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Bebas Neue' }}>
                {stat.value}
              </h3>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Available Interviews (from Admin) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Bebas Neue' }}>
            Available Interviews
          </h2>
          <Link to="/candidate/interviews" className="text-purple-400 hover:text-purple-300 font-medium text-sm">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
              <Loader className="w-8 h-8 text-purple-400" />
            </motion.div>
          </div>
        ) : available.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No interviews available yet. An admin needs to create an interview session for you.
          </p>
        ) : (
          <div className="space-y-4">
            {available.slice(0, 5).map((session) => (
              <motion.div
                key={session.id}
                whileHover={{ x: 5 }}
                className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition-all"
              >
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-1">{roleOf(session)}</h3>
                  <p className="text-gray-400 text-sm mb-2 capitalize">
                    {session.context?.company_type || 'startup'} • {session.context?.interview_type || 'technical'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(session.context?.skills_required || []).slice(0, 4).map((skill, i) => (
                      <span key={i} className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <Link to={`/candidate/interview/${session.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/50 transition-all"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start</span>
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Completed Interviews */}
      {completed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Bebas Neue' }}>
            Completed Interviews
          </h2>
          <div className="space-y-4">
            {completed.slice(0, 5).map((session) => (
              <Link
                key={session.id}
                to="/candidate/results"
                state={{ sessionId: session.id }}
                className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition-all"
              >
                <div>
                  <h3 className="text-white font-bold mb-1">{roleOf(session)}</h3>
                  <p className="text-gray-400 text-sm">Completed • {(session.evaluations || []).length} questions answered</p>
                </div>
                <div className="flex items-center space-x-2 text-purple-400 text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>View Results</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CandidateDashboard;
