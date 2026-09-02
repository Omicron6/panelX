import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, TrendingDown } from 'lucide-react';

const ProblemSection = () => {
  const problems = [
    {
      icon: Clock,
      title: 'Time-Consuming',
      description: 'HR teams spend countless hours manually screening candidates, reducing productivity'
    },
    {
      icon: TrendingDown,
      title: 'Inconsistent Outcomes',
      description: 'Manual interviews lead to biased and inconsistent candidate evaluations'
    },
    {
      icon: Users,
      title: 'Talent Identification',
      description: 'Difficulty in quickly identifying top talent from large applicant pools'
    }
  ];

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-white to-gray-50" data-testid="problem-section">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-bold uppercase mb-6" style={{ fontFamily: 'Bebas Neue' }}>
            Hiring is <span className="gradient-text">Broken</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Traditional recruitment processes are inefficient, inconsistent, and unable to scale
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
                className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100"
                data-testid={`problem-card-${index}`}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mb-6">
                  <Icon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900" style={{ fontFamily: 'Bebas Neue' }}>
                  {problem.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {problem.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
