import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, FileText, BarChart2, LogOut } from 'lucide-react';

const CandidateLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', path: '/candidate/dashboard', icon: Home },
    { name: 'Interviews', path: '/candidate/interviews', icon: FileText },
    { name: 'Results', path: '/candidate/results', icon: BarChart2 },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900" data-testid="candidate-layout">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-64 h-full bg-gray-900/50 backdrop-blur-xl border-r border-gray-800"
      >
        <div className="p-6">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 mb-10">
            <img
              src="https://customer-assets.emergentagent.com/job_hi-hub-7/artifacts/bcdp0q1j_panelX_logo.png"
              alt="PanelX"
              className="h-10 w-10"
            />
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Bebas Neue' }}>
              PANELX
            </span>
          </Link>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800 w-64">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">{localStorage.getItem('user_email')?.split('@')[0] || 'Candidate'}</p>
              <p className="text-gray-400 text-xs">{localStorage.getItem('user_email') || 'candidate@email.com'}</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_type');
                localStorage.removeItem('user_email');
                navigate('/login');
              }}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CandidateLayout;
