import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Mic, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
      {/* LEFT SECTION - Product introduction */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-[#080b18] text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_15%,rgba(109,72,255,0.22),transparent_38%),radial-gradient(ellipse_at_80%_80%,rgba(30,144,255,0.16),transparent_40%)]" />
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, #c4b5fd 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -right-36 top-1/4 h-[30rem] w-[30rem] rounded-full border border-purple-300/10" />
        <div className="absolute -right-20 top-[30%] h-[22rem] w-[22rem] rounded-full border border-blue-300/10" />

        <div className="relative z-10 flex w-full flex-col px-10 py-8 xl:px-14 xl:py-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-lg font-black shadow-lg shadow-purple-900/40">P</div>
            <span className="text-lg font-bold tracking-[0.18em]">PANELX</span>
          </div>

          <div className="grid flex-1 grid-cols-[1fr_0.9fr] items-center gap-6 xl:gap-10">
            <div className="max-w-md">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-purple-200">
                <Sparkles className="h-3.5 w-3.5" /> AI interview platform
              </div>
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-4xl font-bold uppercase leading-[1.08] xl:text-5xl"
                style={{ fontFamily: 'Bebas Neue' }}
              >
                Intelligent Interviews.
                <span className="mt-1 block bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">Real Decisions.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="mt-5 max-w-sm text-base leading-7 text-slate-300 xl:text-lg"
              >
                AI-powered agents that screen, evaluate, and shortlist candidates in real-time.
              </motion.p>
              <div className="mt-8 space-y-3 text-sm text-slate-200">
                {['Role-based questions', 'Consistent answer evaluation', 'Clear candidate insights'].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 18, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.7 }}
              className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl xl:p-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" /> Interview preview
                </div>
                <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-400">03 / 05</span>
              </div>
              <div className="pt-5">
                <p className="text-xs font-medium uppercase tracking-wider text-purple-300">Question</p>
                <p className="mt-2 text-lg font-semibold leading-7 text-white xl:text-xl">
                  Tell me about a challenge you solved and how you approached it.
                </p>
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-2"><Mic className="h-4 w-4 text-blue-300" /> Candidate response</span>
                  <span>00:42</span>
                </div>
                <div className="mt-4 flex h-8 items-center gap-1" aria-hidden="true">
                  {[12, 20, 15, 27, 18, 30, 14, 23, 32, 18, 25, 12, 22, 16, 28, 13, 20, 30, 16, 24, 12, 19, 28, 15, 22, 11].map((height, index) => (
                    <span key={index} className="flex-1 rounded-full bg-gradient-to-t from-purple-500 to-blue-300 opacity-80" style={{ height: `${height}px` }} />
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-400/10 px-4 py-3">
                <div>
                  <p className="text-xs text-slate-400">Evaluation status</p>
                  <p className="mt-0.5 text-sm font-semibold text-emerald-200">Ready for review</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              </div>
            </motion.div>
          </div>

          <p className="text-xs tracking-wide text-slate-500">A more focused interview experience, from first question to final review.</p>
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
