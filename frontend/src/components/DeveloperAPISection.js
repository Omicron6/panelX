import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Copy, Check } from 'lucide-react';

const DeveloperAPISection = () => {
  const [copied, setCopied] = useState(false);

  const codeExample = `// Start an interview
POST /api/start-interview
{
  "candidate_id": "12345",
  "role": "Software Engineer",
  "skills": ["Python", "React", "AWS"]
}

// Get next question
POST /api/next
{
  "session_id": "abc-123",
  "response": "I have 5 years of experience..."
}

// Get interview results
GET /api/result/{session_id}
{
  "score": 92,
  "recommendation": "proceed",
  "insights": {...}
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="api" className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white" data-testid="developer-api-section">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-3 mb-6">
            <Code2 className="w-12 h-12 text-purple-600" />
            <h2 className="text-5xl md:text-7xl font-bold uppercase" style={{ fontFamily: 'Bebas Neue' }}>
              Developer <span className="gradient-text">API</span>
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple, RESTful API to integrate AI interviews into your application
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
            {/* Code Header */}
            <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-gray-400 text-sm font-mono">interview-api.js</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                data-testid="copy-code-btn"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-300" />
                    <span className="text-gray-300 text-sm font-medium">Copy</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Code Content */}
            <div className="p-8 overflow-x-auto">
              <pre className="text-sm font-mono leading-relaxed">
                <code className="text-gray-300">
                  <span className="text-gray-500">// Start an interview</span>
                  {'\n'}
                  <span className="text-pink-400">POST</span> <span className="text-blue-400">/api/start-interview</span>
                  {'\n'}
                  {'{'}
                  {'\n  '}
                  <span className="text-green-400">"candidate_id"</span>: <span className="text-yellow-300">"12345"</span>,
                  {'\n  '}
                  <span className="text-green-400">"role"</span>: <span className="text-yellow-300">"Software Engineer"</span>,
                  {'\n  '}
                  <span className="text-green-400">"skills"</span>: [<span className="text-yellow-300">"Python"</span>, <span className="text-yellow-300">"React"</span>, <span className="text-yellow-300">"AWS"</span>]
                  {'\n}'}
                  {'\n\n'}
                  <span className="text-gray-500">// Get next question</span>
                  {'\n'}
                  <span className="text-pink-400">POST</span> <span className="text-blue-400">/api/next</span>
                  {'\n'}
                  {'{'}
                  {'\n  '}
                  <span className="text-green-400">"session_id"</span>: <span className="text-yellow-300">"abc-123"</span>,
                  {'\n  '}
                  <span className="text-green-400">"response"</span>: <span className="text-yellow-300">"I have 5 years of experience..."</span>
                  {'\n}'}
                  {'\n\n'}
                  <span className="text-gray-500">// Get interview results</span>
                  {'\n'}
                  <span className="text-pink-400">GET</span> <span className="text-blue-400">/api/result/{'{'}</span><span className="text-purple-400">session_id</span><span className="text-blue-400">{'}'}</span>
                  {'\n'}
                  {'{'}
                  {'\n  '}
                  <span className="text-green-400">"score"</span>: <span className="text-purple-400">92</span>,
                  {'\n  '}
                  <span className="text-green-400">"recommendation"</span>: <span className="text-yellow-300">"proceed"</span>,
                  {'\n  '}
                  <span className="text-green-400">"insights"</span>: {'{'}<span className="text-gray-500">...</span>{'}'}
                  {'\n}'}
                </code>
              </pre>
            </div>
          </div>

          {/* API Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { title: 'RESTful', desc: 'Standard HTTP methods' },
              { title: 'JSON', desc: 'Simple data format' },
              { title: 'Webhooks', desc: 'Real-time updates' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-center"
              >
                <h4 className="text-xl font-bold mb-2 text-gray-900" style={{ fontFamily: 'Bebas Neue' }}>
                  {item.title}
                </h4>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DeveloperAPISection;
