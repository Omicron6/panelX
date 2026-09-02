import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const SecurityVisualization = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden opacity-40">
      {/* Animated Background Gradient */}
      <motion.div
        animate={{
          background: [
            'radial-gradient(circle at 30% 40%, rgba(115, 83, 246, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 60%, rgba(0, 192, 255, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 40%, rgba(115, 83, 246, 0.3) 0%, transparent 50%)'
          ]
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute inset-0"
      />

      <div className="relative w-[500px] h-[500px]">
        {/* Rotating Shield/Lock Shape */}
        <motion.div
          animate={{
            rotateY: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64"
        >
          {/* Shield Shape */}
          <svg viewBox="0 0 100 120" className="w-full h-full">
            <defs>
              <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#7353F6', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#00C0FF', stopOpacity: 0.8 }} />
              </linearGradient>
            </defs>
            <motion.path
              d="M50 5 L90 25 L90 55 Q90 85 50 115 Q10 85 10 55 L10 25 Z"
              fill="url(#shieldGradient)"
              stroke="#fff"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2 }}
            />
            {/* Lock Icon in Center */}
            <motion.circle
              cx="50"
              cy="50"
              r="15"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.rect
              x="43"
              y="55"
              width="14"
              height="18"
              rx="2"
              fill="#fff"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle cx="50" cy="63" r="2" fill="#7353F6" />
          </svg>
        </motion.div>

        {/* Orbiting Particles */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 360) / 12;
          const radius = 150;
          return (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full shadow-lg"
              style={{
                top: '50%',
                left: '50%',
              }}
              animate={{
                x: [
                  Math.cos((angle * Math.PI) / 180) * radius,
                  Math.cos(((angle + 360) * Math.PI) / 180) * radius,
                ],
                y: [
                  Math.sin((angle * Math.PI) / 180) * radius,
                  Math.sin(((angle + 360) * Math.PI) / 180) * radius,
                ],
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'linear'
              }}
            />
          );
        })}

        {/* Concentric Rings */}
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-purple-400/20 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360, scale: [1, 1.05, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-blue-400/20 rounded-full border-dashed"
        />

        {/* Floating Data Streams */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`stream-${i}`}
            className="absolute w-1 bg-gradient-to-b from-purple-400 to-transparent rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              height: '60px',
            }}
            animate={{
              y: [-100, 600],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'linear'
            }}
          />
        ))}
      </div>
    </div>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('candidate');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:8001';
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          user_type: userType
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Store token and user type in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_type', data.user_type);
      localStorage.setItem('user_email', data.email);
      
      // Redirect based on user type
      if (data.user_type === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/candidate/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* LEFT SECTION - 3D Visual (60%) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-[60%] bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle, #7353F6 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        {/* 3D Security Visualization */}
        <div className="absolute inset-0">
          <SecurityVisualization />
        </div>

        {/* Text Overlay - Centered */}
        <div className="absolute inset-0 flex items-center justify-center z-20 px-12">
          <div className="text-center max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-5xl md:text-6xl font-bold uppercase text-white mb-6 leading-tight"
              style={{ fontFamily: 'Bebas Neue' }}
            >
              Intelligent Interviews.
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                Real Decisions.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-lg text-gray-300 mx-auto"
            >
              AI-powered agents that screen, evaluate, and shortlist candidates in real-time.
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* RIGHT SECTION - Login Form (40%) */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full lg:w-[40%] bg-white flex items-center justify-center p-6 relative"
      >
        {/* Subtle Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-white to-blue-50/50" />

        <div className="w-full max-w-md relative z-10">
          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-gray-100"
            data-testid="login-card"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Bebas Neue' }}>
              Welcome Back
            </h2>
            <p className="text-gray-600 mb-6 text-sm">Sign in to continue to PanelX</p>

            {/* User Type Toggle */}
            <div className="mb-6">
              <div className="bg-gray-100 rounded-full p-1 flex" data-testid="user-type-toggle">
                <motion.button
                  type="button"
                  onClick={() => setUserType('candidate')}
                  className={`flex-1 py-2.5 px-5 rounded-full font-bold text-xs transition-all ${
                    userType === 'candidate'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileTap={{ scale: 0.98 }}
                  data-testid="candidate-toggle"
                >
                  CANDIDATE
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setUserType('admin')}
                  className={`flex-1 py-2.5 px-5 rounded-full font-bold text-xs transition-all ${
                    userType === 'admin'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileTap={{ scale: 0.98 }}
                  data-testid="admin-toggle"
                >
                  ADMIN
                </motion.button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                    required
                    data-testid="email-input"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                    required
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    data-testid="toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    data-testid="remember-me"
                  />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <a href="#" className="font-bold text-purple-600 hover:text-purple-700">
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-sm tracking-wider rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                data-testid="sign-in-btn"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-500">Or</span>
              </div>
            </div>

            {/* Create Account */}
            <div className="text-center text-sm">
              <p className="text-gray-600">
                {userType === 'candidate' ? (
                  <>
                    Don't have an account?{' '}
                    <a href="#" className="font-bold text-purple-600 hover:text-purple-700">
                      Create account
                    </a>
                  </>
                ) : (
                  <>
                    Need admin access?{' '}
                    <a href="#" className="font-bold text-purple-600 hover:text-purple-700">
                      Request access
                    </a>
                  </>
                )}
              </p>
            </div>
          </motion.div>

          {/* Back to Home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-6"
          >
            <Link to="/" className="text-gray-600 hover:text-purple-600 font-medium text-sm inline-flex items-center space-x-2">
              <span>← Back to home</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
