import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src="https://customer-assets.emergentagent.com/job_hi-hub-7/artifacts/bcdp0q1j_panelX_logo.png"
            alt="PanelX Logo"
            className="h-12 w-12 object-contain"
          />
          <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Bebas Neue' }}>
            PANELX
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
            How It Works
          </a>
          <a href="#api" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
            API
          </a>
        </div>

        <Link to="/login">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 rounded-full font-bold text-sm tracking-wider text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:shadow-lg transition-all"
            data-testid="navbar-book-demo-btn"
          >
            BOOK DEMO
          </motion.button>
        </Link>
      </div>
    </motion.nav>
  );
};

export default Navbar;
