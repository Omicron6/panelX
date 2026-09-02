import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Plus, FolderOpen, BarChart3, ListChecks, LogOut, Menu, X } from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Create Session', path: '/admin/create-session', icon: Plus },
    { name: 'Sessions', path: '/admin/sessions', icon: FolderOpen },
    { name: 'Generated Questions', path: '/admin/generated-questions', icon: ListChecks },
    { name: 'Results', path: '/admin/results', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" data-testid="admin-layout">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed lg:relative w-64 h-full bg-gray-900/50 backdrop-blur-xl border-r border-gray-800 z-50"
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
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">{localStorage.getItem('user_email')?.split('@')[0] || 'Admin'}</p>
              <p className="text-gray-400 text-xs">{localStorage.getItem('user_email') || 'admin@panelx.com'}</p>
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

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 rounded-lg text-white"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
