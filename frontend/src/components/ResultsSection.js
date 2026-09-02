import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Star, ThumbsUp, AlertCircle } from 'lucide-react';

const ResultsSection = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white" data-testid="results-section">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-bold uppercase mb-6" style={{ fontFamily: 'Bebas Neue' }}>
            Interview <span className="gradient-text">Results</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive candidate insights delivered instantly
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 md:p-12"
          data-testid="results-dashboard"
        >
          {/* Header */}
          <div className="border-b border-gray-200 pb-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Bebas Neue' }}>
                  Candidate Evaluation Report
                </h3>
                <p className="text-gray-600">John Smith • Software Engineer Role</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold gradient-text mb-1" style={{ fontFamily: 'Bebas Neue' }}>92</div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
            </div>
          </div>

          {/* Score Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border border-purple-200">
              <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
              <div className="text-3xl font-bold text-purple-700 mb-1" style={{ fontFamily: 'Bebas Neue' }}>95</div>
              <div className="text-sm text-gray-700 font-medium">Technical Skills</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-200">
              <Star className="w-8 h-8 text-blue-600 mb-3" />
              <div className="text-3xl font-bold text-blue-700 mb-1" style={{ fontFamily: 'Bebas Neue' }}>88</div>
              <div className="text-sm text-gray-700 font-medium">Communication</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 border border-green-200">
              <ThumbsUp className="w-8 h-8 text-green-600 mb-3" />
              <div className="text-3xl font-bold text-green-700 mb-1" style={{ fontFamily: 'Bebas Neue' }}>91</div>
              <div className="text-sm text-gray-700 font-medium">Problem Solving</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-6 border border-orange-200">
              <AlertCircle className="w-8 h-8 text-orange-600 mb-3" />
              <div className="text-3xl font-bold text-orange-700 mb-1" style={{ fontFamily: 'Bebas Neue' }}>93</div>
              <div className="text-sm text-gray-700 font-medium">Cultural Fit</div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="text-xl font-bold mb-4 text-gray-900" style={{ fontFamily: 'Bebas Neue' }}>Strengths</h4>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <span className="text-gray-700">Strong algorithmic thinking and data structures knowledge</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <span className="text-gray-700">Excellent communication and articulation skills</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <span className="text-gray-700">Demonstrated experience with system design</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4 text-gray-900" style={{ fontFamily: 'Bebas Neue' }}>Areas for Growth</h4>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                  <span className="text-gray-700">Could improve knowledge of cloud infrastructure</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                  <span className="text-gray-700">Limited experience with microservices architecture</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Final Recommendation */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Bebas Neue' }}>RECOMMENDATION</h4>
                <p className="text-purple-100">Strong candidate - Proceed to technical interview round</p>
              </div>
              <div className="text-5xl font-bold" style={{ fontFamily: 'Bebas Neue' }}>✓</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ResultsSection;
