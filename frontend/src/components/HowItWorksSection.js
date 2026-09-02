import React from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Mic2, Brain, BarChart2, CheckCircle2 } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      icon: UserCircle,
      title: 'Candidate',
      description: 'Applicant enters the interview platform'
    },
    {
      icon: Mic2,
      title: 'Voice',
      description: 'Natural voice conversation begins'
    },
    {
      icon: Brain,
      title: 'AI Agent',
      description: 'Strands-based orchestration analyzes responses'
    },
    {
      icon: BarChart2,
      title: 'Evaluation',
      description: 'Real-time scoring and behavioral insights'
    },
    {
      icon: CheckCircle2,
      title: 'Shortlist',
      description: 'Top candidates automatically ranked'
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white" data-testid="how-it-works-section">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-7xl font-bold uppercase mb-6" style={{ fontFamily: 'Bebas Neue' }}>
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A seamless pipeline from candidate interaction to intelligent decision-making
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-purple-400 to-blue-500 transform -translate-y-1/2 hidden lg:block" />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="flex flex-col items-center text-center"
                  data-testid={`step-${index}`}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/40 relative"
                  >
                    <Icon className="w-12 h-12 text-white" />
                    {index < steps.length - 1 && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: index * 0.15 + 0.3 }}
                        className="absolute left-full w-16 h-1 bg-gradient-to-r from-purple-600 to-blue-500 origin-left hidden lg:block"
                      />
                    )}
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-3 uppercase" style={{ fontFamily: 'Bebas Neue' }}>
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-blue-100 px-8 py-4 rounded-full">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="font-bold text-gray-900">Average Interview Time: 15 minutes</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
