import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Brain, BarChart3, CheckCircle } from 'lucide-react';

const SolutionSection = () => {
  const solutions = [
    {
      icon: Mic,
      title: 'Voice-Based Interviews',
      description: 'Natural conversations powered by advanced speech recognition'
    },
    {
      icon: Brain,
      title: 'Real-Time Evaluation',
      description: 'AI analyzes responses, tone, and confidence in real-time'
    },
    {
      icon: BarChart3,
      title: 'Behavioral Analysis',
      description: 'Deep insights into communication patterns and soft skills'
    },
    {
      icon: CheckCircle,
      title: 'Smart Shortlisting',
      description: 'Automatically rank and recommend top candidates'
    }
  ];

  return (
    <section className="py-24 px-6 bg-white" data-testid="solution-section">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-bold uppercase mb-6" style={{ fontFamily: 'Bebas Neue' }}>
            <span className="gradient-text">AI-Powered</span> Screening Intelligence
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your hiring process with intelligent automation that never sleeps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="group relative bg-gradient-to-br from-white to-purple-50/50 rounded-3xl p-6 border border-purple-100 hover:border-purple-300 transition-all duration-300 shadow-sm hover:shadow-xl"
                data-testid={`solution-card-${index}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'Bebas Neue' }}>
                    {solution.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {solution.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
