import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FinalCTASection = () => {
  return (
    <section className="py-32 px-6 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 relative overflow-hidden" data-testid="final-cta-section">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-6xl md:text-8xl font-bold uppercase text-white mb-6" style={{ fontFamily: 'Bebas Neue' }}>
            Build Smarter
            <br />
            Hiring Pipelines
          </h2>
          <p className="text-xl md:text-2xl text-purple-100 mb-12 max-w-3xl mx-auto font-medium">
            Deploy AI interview agents and focus only on the best candidates.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="group px-12 py-5 bg-white text-purple-700 rounded-full font-bold text-lg tracking-wider shadow-2xl hover:shadow-white/50 transition-all flex items-center space-x-3"
                data-testid="final-cta-try-demo-btn"
              >
                <span>TRY DEMO</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>

            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-12 py-5 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg tracking-wider hover:bg-white/10 transition-all"
                data-testid="final-cta-contact-sales-btn"
              >
                CONTACT SALES
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto"
          >
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue' }}>500+</div>
              <div className="text-purple-200 font-medium">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue' }}>50K+</div>
              <div className="text-purple-200 font-medium">Interviews</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue' }}>99.9%</div>
              <div className="text-purple-200 font-medium">Uptime</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTASection;
