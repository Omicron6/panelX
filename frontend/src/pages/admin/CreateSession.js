import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Target, Clock, Zap, Building2, FileText, ListChecks, Loader2, Upload } from 'lucide-react';

const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:8001').replace(/\/$/, '');
const apiRoot = `${apiBase}/api`;

const DIFFICULTY_MAP = {
  beginner: 'easy',
  intermediate: 'medium',
  advanced: 'hard',
};

const CreateSession = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    jobRole: '',
    jobDescription: '',
    skills: '',
    companyType: 'startup',
    difficulty: 'intermediate',
    interviewType: 'technical',
    duration: '30',
    questionCount: '5',
  });

  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [previewMeta, setPreviewMeta] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [selectedPdfName, setSelectedPdfName] = useState('');

  const normalizedSkills = useMemo(
    () => formData.skills.split(',').map((item) => item.trim()).filter(Boolean),
    [formData.skills],
  );

  const buildJobDescription = () => {
    const trimmed = formData.jobDescription.trim();
    if (trimmed) {
      return trimmed;
    }
    return `${formData.jobRole} role requiring ${normalizedSkills.join(', ')}.`;
  };

  const buildPayload = () => {
    const description = buildJobDescription();
    if (description.length < 20) {
      throw new Error('Please provide a more detailed job description (at least 20 characters).');
    }
    if (!normalizedSkills.length) {
      throw new Error('Please add at least one required skill.');
    }

    return {
      job_description: description,
      required_skills: normalizedSkills,
      interview_type: formData.interviewType,
      company_type: formData.companyType,
      candidate_resume: 'Pending candidate resume',
    };
  };

  const generatePreview = async () => {
    setError('');
    setSuccess('');
    setPreviewQuestions([]);

    try {
      const payload = buildPayload();
      setIsPreviewLoading(true);

      const response = await fetch(`${apiRoot}/interview/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          question_count: Number(formData.questionCount),
          difficulty: DIFFICULTY_MAP[formData.difficulty] || 'medium',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate preview questions.');
      }

      setPreviewQuestions(data.questions || []);
      setPreviewMeta(data);
      setSuccess(`Preview generated: ${data.questions?.length || 0} questions.`);
    } catch (err) {
      setError(err.message || 'Preview generation failed.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = buildPayload();
      setIsCreatingSession(true);

      const startResponse = await fetch(`${apiRoot}/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
        }),
      });
      const startData = await startResponse.json();
      if (!startResponse.ok) {
        throw new Error(startData.detail || 'Failed to create session.');
      }

      // Pre-generate interviewer-selected question count so all generated questions are visible in admin.
      const generationCount = Number(formData.questionCount);
      for (let i = 0; i < generationCount; i += 1) {
        await fetch(`${apiRoot}/interview/question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: startData.session_id,
            difficulty: DIFFICULTY_MAP[formData.difficulty] || 'medium',
            question_type: formData.interviewType,
          }),
        });
      }

      navigate(`/admin/generated-questions?session=${encodeURIComponent(startData.session_id)}`);
    } catch (err) {
      setError(err.message || 'Session creation failed.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8" data-testid="create-session-page">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue' }}>
          Create Interview Session
        </h1>
        <p className="text-gray-400">Configure dynamic agent generation and preview all questions before launch.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="flex items-center space-x-2 text-white font-bold mb-3">
              <Briefcase className="w-5 h-5 text-purple-400" />
              <span>Job Role</span>
            </label>
            <input
              type="text"
              value={formData.jobRole}
              onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
              placeholder="e.g., Senior Software Engineer"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              required
              data-testid="job-role-input"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-white font-bold mb-3">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>Job Description</span>
            </label>
            <textarea
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              placeholder="Paste the full job description used by the agent for dynamic generation."
              rows={5}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all resize-y"
              required
              data-testid="job-description-input"
            />
          </div>

          <div className="rounded-xl border border-dashed border-purple-500/50 bg-purple-500/5 p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Upload className="w-5 h-5 text-purple-300" />
                  <span>Upload PDF instead</span>
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  PDF upload and question generation from the file are not connected yet. Paste the description above for now.
                </p>
              </div>
              <label className="cursor-pointer rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-white hover:border-purple-400 hover:bg-purple-500/10">
                Choose PDF
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  onChange={(event) => setSelectedPdfName(event.target.files?.[0]?.name || '')}
                  aria-label="Choose a job description PDF"
                />
              </label>
            </div>
            {selectedPdfName ? <p className="mt-3 text-sm text-purple-200">Selected: {selectedPdfName} (not uploaded)</p> : null}
          </div>

          <div>
            <label className="flex items-center space-x-2 text-white font-bold mb-3">
              <Target className="w-5 h-5 text-blue-400" />
              <span>Required Skills</span>
            </label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="e.g., Python, React, AWS (comma separated)"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              required
              data-testid="skills-input"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-white font-bold mb-3">
              <Building2 className="w-5 h-5 text-orange-400" />
              <span>Company Type</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              {['startup', 'mnc'].map((type) => (
                <motion.button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, companyType: type })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`py-3 px-4 rounded-xl font-bold uppercase transition-all ${
                    formData.companyType === type
                      ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg'
                      : 'bg-gray-900/50 text-gray-400 border border-gray-700 hover:border-purple-500/50'
                  }`}
                  data-testid={`company-type-${type}`}
                >
                  {type}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-white font-bold mb-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span>Difficulty Level</span>
            </label>
            <div className="grid grid-cols-3 gap-4">
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <motion.button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty: level })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`py-3 px-4 rounded-xl font-bold capitalize transition-all ${
                    formData.difficulty === level
                      ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg'
                      : 'bg-gray-900/50 text-gray-400 border border-gray-700 hover:border-purple-500/50'
                  }`}
                  data-testid={`difficulty-${level}`}
                >
                  {level}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-white font-bold mb-3 block">Interview Type</label>
            <div className="grid grid-cols-2 gap-4">
              {['technical', 'behavioral'].map((type) => (
                <motion.button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, interviewType: type })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`py-3 px-4 rounded-xl font-bold capitalize transition-all ${
                    formData.interviewType === type
                      ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg'
                      : 'bg-gray-900/50 text-gray-400 border border-gray-700 hover:border-purple-500/50'
                  }`}
                  data-testid={`type-${type}`}
                >
                  {type}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-white font-bold mb-3">
                <Clock className="w-5 h-5 text-green-400" />
                <span>Duration (minutes)</span>
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                data-testid="duration-select"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-white font-bold mb-3">
                <ListChecks className="w-5 h-5 text-pink-400" />
                <span>Preview / Generate Question Count</span>
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.questionCount}
                onChange={(e) => setFormData({ ...formData, questionCount: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                data-testid="question-count-input"
              />
            </div>
          </div>

          {error ? <p className="text-red-400 font-medium">{error}</p> : null}
          {success ? <p className="text-green-400 font-medium">{success}</p> : null}

          <div className="grid md:grid-cols-2 gap-4">
            <motion.button
              type="button"
              onClick={generatePreview}
              disabled={isPreviewLoading || isCreatingSession}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gray-900/70 border border-gray-700 text-white font-bold text-lg rounded-xl hover:border-purple-500/70 transition-all disabled:opacity-60"
              data-testid="preview-questions-button"
            >
              {isPreviewLoading ? (
                <span className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Preview...</span>
                </span>
              ) : (
                'PREVIEW QUESTIONS'
              )}
            </motion.button>

            <motion.button
              type="submit"
              disabled={isPreviewLoading || isCreatingSession}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-60"
              data-testid="create-session-submit"
            >
              {isCreatingSession ? (
                <span className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Session...</span>
                </span>
              ) : (
                'CREATE SESSION + GENERATE QUESTIONS'
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {previewQuestions.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8"
          data-testid="preview-results"
        >
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Bebas Neue' }}>
              Generated Questions Preview
            </h2>
            <p className="text-gray-400 mt-1">
              Source: {previewMeta?.generation_source || 'strands_tools'} | Company Type: {previewMeta?.company_type}
            </p>
          </div>
          <div className="space-y-4">
            {previewQuestions.map((question, index) => (
              <div key={question.id || `${index}-${question.question}`} className="p-4 rounded-xl border border-gray-700 bg-gray-900/50">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs uppercase tracking-wide px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    {question.type}
                  </span>
                  <span className="text-xs uppercase tracking-wide px-2 py-1 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">
                    {question.difficulty}
                  </span>
                  <span className="text-xs uppercase tracking-wide px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {question.company_type || previewMeta?.company_type}
                  </span>
                </div>
                <p className="text-white leading-relaxed">{index + 1}. {question.question}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
};

export default CreateSession;
