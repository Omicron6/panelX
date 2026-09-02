import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, ExternalLink, Copy, Clock, ListChecks } from 'lucide-react';

const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:8001').replace(/\/$/, '');
const apiRoot = `${apiBase}/api`;

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${apiRoot}/interview/sessions?limit=50`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Unable to fetch sessions');
        }
        setSessions(data.sessions || []);
      } catch (err) {
        setError(err.message || 'Failed to load sessions.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, []);

  const formattedSessions = useMemo(
    () =>
      sessions.map((session) => ({
        ...session,
        role: session.context?.role || 'Unknown Role',
        companyType: session.context?.company_type || 'startup',
        questionCount: session.questions?.length || 0,
        createdLabel: session.created_at ? new Date(session.created_at).toLocaleString() : 'Unknown',
      })),
    [sessions],
  );

  const copyLink = async (sessionId) => {
    const appBase = window.location.origin;
    await navigator.clipboard.writeText(`${appBase}/candidate/interview/${sessionId}`);
  };

  return (
    <div className="space-y-8" data-testid="sessions-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue' }}>
            Interview Sessions
          </h1>
          <p className="text-gray-400">Manage sessions and open every generated question output from the agent.</p>
        </div>
        <Link to="/admin/create-session">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            + New Session
          </motion.button>
        </Link>
      </div>

      {error ? <p className="text-red-400">{error}</p> : null}
      {isLoading ? <p className="text-gray-300">Loading sessions...</p> : null}

      <div className="grid gap-6">
        {!isLoading && !formattedSessions.length ? (
          <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 text-gray-300">
            No sessions found yet. Create one to start generating questions.
          </div>
        ) : null}

        {formattedSessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -2 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 hover:border-purple-500/50 transition-all"
            data-testid={`session-${session.id}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{session.candidate_name || 'Interview Session'}</h3>
                  <p className="text-gray-400 text-sm mb-2">{session.role}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{session.createdLabel}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-400">
                      <ListChecks className="w-4 h-4" />
                      <span>{session.questionCount} generated</span>
                    </div>
                    <span className="px-2 py-1 rounded border border-blue-500/40 bg-blue-500/20 text-blue-300 uppercase text-xs">
                      {session.companyType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyLink(session.id)}
                  className="p-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all"
                  title="Copy interview link"
                >
                  <Copy className="w-5 h-5 text-gray-300" />
                </motion.button>

                <Link to={`/admin/generated-questions?session=${encodeURIComponent(session.id)}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-white transition-all flex items-center space-x-2"
                  >
                    <span>View Questions</span>
                    <ListChecks className="w-4 h-4" />
                  </motion.button>
                </Link>

                <Link to={`/admin/results?session=${encodeURIComponent(session.id)}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white transition-all flex items-center space-x-2"
                  >
                    <span>View Results</span>
                    <ExternalLink className="w-4 h-4" />
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Sessions;
