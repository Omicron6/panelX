import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';

const NeuralNetwork3D = () => {
  // Create neural network nodes
  const nodes = [
    // Layer 1 (Input)
    { id: 1, x: 15, y: 20, size: 16, layer: 1 },
    { id: 2, x: 15, y: 50, size: 20, layer: 1 },
    { id: 3, x: 15, y: 80, size: 16, layer: 1 },
    
    // Layer 2 (Hidden)
    { id: 4, x: 40, y: 15, size: 14, layer: 2 },
    { id: 5, x: 40, y: 40, size: 18, layer: 2 },
    { id: 6, x: 40, y: 65, size: 14, layer: 2 },
    { id: 7, x: 40, y: 85, size: 16, layer: 2 },
    
    // Layer 3 (Hidden)
    { id: 8, x: 65, y: 25, size: 16, layer: 3 },
    { id: 9, x: 65, y: 50, size: 22, layer: 3 },
    { id: 10, x: 65, y: 75, size: 14, layer: 3 },
    
    // Layer 4 (Output)
    { id: 11, x: 85, y: 35, size: 18, layer: 4 },
    { id: 12, x: 85, y: 65, size: 18, layer: 4 },
  ];

  // Create connections between layers
  const connections = [];
  nodes.forEach(node1 => {
    nodes.forEach(node2 => {
      if (node2.layer === node1.layer + 1) {
        connections.push({ from: node1, to: node2 });
      }
    });
  });

  return (
    <div className="relative w-full h-full flex items-center justify-center perspective-1000">
      <div className="relative w-[500px] h-[500px]">
        {/* Background Glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-blue-400/30 rounded-full blur-3xl"
        />

        {/* SVG for connections */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#7353F6', stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: '#00C0FF', stopOpacity: 0.6 }} />
            </linearGradient>
          </defs>
          {connections.map((conn, i) => (
            <motion.line
              key={i}
              x1={`${conn.from.x}%`}
              y1={`${conn.from.y}%`}
              x2={`${conn.to.x}%`}
              y2={`${conn.to.y}%`}
              stroke="url(#connectionGradient)"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                pathLength: { duration: 2, delay: i * 0.05 },
                opacity: { duration: 3, repeat: Infinity, delay: i * 0.1 }
              }}
            />
          ))}
        </svg>

        {/* Neural Nodes */}
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            className="absolute"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${node.size}px`,
              height: `${node.size}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: 1,
              rotateY: [0, 360]
            }}
            transition={{
              scale: {
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              },
              rotateY: {
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              },
              opacity: { duration: 0.6, delay: i * 0.1 }
            }}
          >
            <div className="relative w-full h-full">
              {/* Outer Ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-purple-400/50"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.15
                }}
              />
              {/* Core */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/50" />
              {/* Inner Glow */}
              <div className="absolute inset-1 rounded-full bg-white/30" />
            </div>
          </motion.div>
        ))}

        {/* Rotating Rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
          style={{ zIndex: 5 }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-2 border-purple-300/20 rounded-full" />
        </motion.div>

        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
          style={{ zIndex: 5 }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] border border-blue-300/20 rounded-full border-dashed" />
        </motion.div>

        {/* Data Particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 bg-white rounded-full shadow-lg shadow-blue-400/50"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
};

const HeroSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });

  // Parallax effects for different layers
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const yNetwork = useTransform(scrollYProgress, [0, 1], ['0%', '-20%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30"
      data-testid="hero-section"
    >
      {/* Animated Background Glow with Parallax */}
      <motion.div 
        style={{ y: useTransform(scrollYProgress, [0, 1], ['0%', '20%']) }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse-glow" 
      />
      <motion.div 
        style={{ y: useTransform(scrollYProgress, [0, 1], ['0%', '-15%']) }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse-glow" 
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10 pt-24">
        {/* Left: Content with Parallax */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ y: yText, opacity, scale }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-8"
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold uppercase leading-none"
            style={{ fontFamily: 'Bebas Neue' }}
            data-testid="hero-headline"
          >
            <span className="gradient-text">AI THAT INTERVIEWS</span>
            <br />
            <span className="text-gray-900">LIKE HUMANS</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-gray-600 font-medium leading-relaxed max-w-xl"
            data-testid="hero-subheading"
          >
            Automate candidate screening with intelligent interview agents that evaluate skills, behavior, and fit in real-time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-4 rounded-full bg-purple-600 text-white font-bold text-sm tracking-widest shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 transition-all"
                data-testid="hero-start-demo-btn"
              >
                START DEMO
              </motion.button>
            </Link>

            <a href="#architecture">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-4 rounded-full border-2 border-purple-600 text-purple-600 font-bold text-sm tracking-widest hover:bg-purple-50 transition-all"
                data-testid="hero-view-architecture-btn"
              >
                VIEW ARCHITECTURE
              </motion.button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center space-x-8 pt-4"
          >
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Bebas Neue' }}>10X</div>
              <div className="text-sm text-gray-600">Faster Screening</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Bebas Neue' }}>95%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Bebas Neue' }}>24/7</div>
              <div className="text-sm text-gray-600">Availability</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right: Neural Network 3D with Parallax */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ y: yNetwork }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative h-[500px] w-full"
        >
          <NeuralNetwork3D />
          <motion.div 
            style={{ scale: useTransform(scrollYProgress, [0, 0.5], [1, 1.3]) }}
            className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-blue-500/20 rounded-full blur-3xl -z-10" 
          />
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, repeat: Infinity, duration: 1.5 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-1.5 h-1.5 bg-gradient-to-b from-purple-600 to-blue-500 rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
