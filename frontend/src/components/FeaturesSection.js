import React from 'react';
import { motion } from 'framer-motion';
import { Bot, MessageSquare, Eye, FileText, Webhook } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Bot,
      title: 'AI Interview Agent',
      description: 'Strands-based orchestration ensures natural, context-aware conversations',
      color: 'from-purple-600 to-purple-400'
    },
    {
      icon: MessageSquare,
      title: 'Role-Aware Questions',
      description: 'RAG system generates relevant questions based on job requirements',
      color: 'from-blue-600 to-blue-400'
    },
    {
      icon: Eye,
      title: 'Behavioral Analysis',
      description: 'MediaPipe integration analyzes facial cues and body language',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: FileText,
      title: 'Explainable Decisions',
      description: 'Transparent AI reasoning with detailed evaluation reports',
      color: 'from-cyan-600 to-blue-500'
    },
    {
      icon: Webhook,
      title: 'API-Based Integration',
      description: 'Seamlessly integrate with existing HR systems and workflows',
      color: 'from-indigo-600 to-purple-500'
    }
  ];

  return (
    <section id="features" className="py-24 px-6 bg-white" data-testid="features-section">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-bold uppercase mb-6" style={{ fontFamily: 'Bebas Neue' }}>
            Powerful <span className="gradient-text">Features</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enterprise-grade AI capabilities designed for modern recruitment
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative bg-white rounded-3xl p-8 border border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 overflow-hidden"
                data-testid={`feature-card-${index}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className="relative z-10">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900" style={{ fontFamily: 'Bebas Neue' }}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
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

export default FeaturesSection;
