import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:8001').replace(/\/$/, '');
const apiRoot = `${apiBase}/api`;
const MOCK_CANDIDATE_NAMES = ['Alex Morgan', 'Jordan Lee', 'Taylor Reed', 'Casey Brooks', 'Riley Parker'];

const mockCandidateName = (sessionId = '') => {
  const stableIndex = Array.from(sessionId).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return MOCK_CANDIDATE_NAMES[stableIndex % MOCK_CANDIDATE_NAMES.length];
};

const Results = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const sessionResponse = await fetch(`${apiRoot}/interview/sessions?limit=30`);
        const sessionData = await sessionResponse.json();
        if (!sessionResponse.ok) {
          throw new Error(sessionData.detail || 'Unable to fetch sessions');
        }

        const loadedSessions = sessionData.sessions || [];
        setSessions(loadedSessions);

        const requested = searchParams.get('session');
        const activeId = requested || loadedSessions[0]?.id;
        if (activeId) {
          const detailsResponse = await fetch(`${apiRoot}/interview/session/${activeId}`);
          const detailsData = await detailsResponse.json();
          if (!detailsResponse.ok) {
            throw new Error(detailsData.detail || 'Unable to fetch selected session');
          }
          setSelectedSession(detailsData);
        }
      } catch (err) {
        setError(err.message || 'Failed to load results data.');
      }
    };

    load();
  }, [searchParams]);

  const candidates = useMemo(() => {
    return sessions.map((session) => {
      const evals = session.evaluations || [];
      const overallScore = evals.length
        ? Math.round((evals.reduce((sum, item) => sum + (item.score || 0), 0) / evals.length) * 10) / 10
        : 0;

      const proctoring = session.proctoring || {};
      const terminated = session.status === 'terminated' || session.final_decision?.disqualified;
      const status = terminated
        ? 'Disqualified'
        : (session.final_decision?.decision || (session.status === 'completed' ? 'Completed' : 'In Progress'));

      const emailOrName = (session.candidate_name || '').trim();
      // Older admin-created sessions stored the job role in candidate_name.
      // Trust only names explicitly supplied by a candidate (or existing account emails).
      const candidateName = session.candidate_name_source === 'candidate'
        ? emailOrName
        : (emailOrName.includes('@') ? emailOrName.split('@')[0] : mockCandidateName(session.id));

      return {
        id: session.id,
        name: candidateName,
        jobDescription: session.context?.job_description || session.context?.role || '—',
        score: overallScore,
        status,
        terminated,
        violationCount: proctoring.violation_count || session.final_decision?.violation_count || 0,
        terminationReason: proctoring.reason || session.final_decision?.termination_reason || '',
        date: session.created_at ? new Date(session.created_at).toLocaleDateString() : '-',
        technical: overallScore,
        behavioral: session.behavior_analysis?.behavior_score || 0,
        questionCount: session.questions?.length || 0,
      };
    });
  }, [sessions]);

  const filteredCandidates = useMemo(
    () =>
      candidates.filter((c) =>
        [c.name, c.jobDescription, c.id].join(' ').toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [candidates, searchTerm],
  );

  const getStatusColor = (status) => {
    const value = status.toLowerCase();
    if (value.includes('disqualified') || value.includes('terminated')) {
      return 'bg-red-600/30 text-red-300 border-red-500/70';
    }
    if (value.includes('shortlisted') || value.includes('selected')) {
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    }
    if (value.includes('review') || value.includes('progress') || value.includes('maybe')) {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
    if (value.includes('reject') || value.includes('not')) {
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    }
    return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  return (
    <div className="space-y-6" data-testid="results-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue' }}>
            Candidate Results
          </h1>
          <p className="text-gray-400">Review outcomes and inspect generated question history by session.</p>
        </div>
      </div>

      {selectedSession ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Bebas Neue' }}>
              Generated Question History
            </h2>
            <Link
              to={`/admin/generated-questions?session=${encodeURIComponent(selectedSession.id)}`}
              className="text-sm text-purple-300 hover:text-purple-200"
            >
              Open full question view
            </Link>
          </div>

          {!selectedSession.questions?.length ? (
            <p className="text-gray-300">No generated questions found for this session.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selectedSession.questions.map((question, index) => (
                <div key={question.id || `${index}-${question.question}`} className="p-3 rounded-lg border border-gray-700 bg-gray-900/50">
                  <div className="flex gap-2 mb-2 text-xs uppercase">
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">{question.type || 'technical'}</span>
                    <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">{question.difficulty || 'medium'}</span>
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">{question.company_type || selectedSession.context?.company_type || 'startup'}</span>
                  </div>
                  <p className="text-white">{index + 1}. {question.question}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ) : null}

      {error ? <p className="text-red-400">{error}</p> : null}

      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            data-testid="search-input"
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-4 text-gray-400 font-bold text-sm">Candidate</th>
                <th className="text-left p-4 text-gray-400 font-bold text-sm">Job Description</th>
                <th className="text-center p-4 text-gray-400 font-bold text-sm">Overall Score</th>
                <th className="text-center p-4 text-gray-400 font-bold text-sm">Behavior</th>
                <th className="text-center p-4 text-gray-400 font-bold text-sm">Questions</th>
                <th className="text-center p-4 text-gray-400 font-bold text-sm">Status</th>
                <th className="text-center p-4 text-gray-400 font-bold text-sm">Date</th>
                <th className="text-center p-4 text-gray-400 font-bold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate, index) => (
                <motion.tr
                  key={candidate.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all"
                  data-testid={`candidate-row-${candidate.id}`}
                >
                  <td className="p-4">
                    <span className="text-white font-bold">{candidate.name}</span>
                  </td>
                  <td className="p-4 text-gray-300 max-w-md">
                    <span
                      className="block whitespace-pre-wrap text-sm"
                      style={{
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 5,
                        overflow: 'hidden',
                      }}
                      title={candidate.jobDescription}
                    >
                      {candidate.jobDescription}
                    </span>
                  </td>
                  <td className="p-4 text-center text-gray-300">{candidate.score}</td>
                  <td className="p-4 text-center text-gray-300">{candidate.behavioral}</td>
                  <td className="p-4 text-center text-gray-300">{candidate.questionCount}</td>
                  <td className="p-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(candidate.status)}`}>
                        {candidate.terminated ? '⚠ Disqualified' : candidate.status}
                      </span>
                      {candidate.terminated && (
                        <span className="text-[10px] text-red-300/80">
                          Cheating: {candidate.violationCount} warning{candidate.violationCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center text-gray-400 text-sm">{candidate.date}</td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <Link to={`/admin/generated-questions?session=${encodeURIComponent(candidate.id)}`}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all"
                          title="View Generated Questions"
                        >
                          <Eye className="w-4 h-4 text-white" />
                        </motion.button>
                      </Link>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Results;
