import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, CheckCircle, TrendingUp, Plus, Clock, User } from 'lucide-react';

const AdminDashboard = () => {
  const stats = [
    { label: 'Total Interviews', value: '248', icon: Users, color: 'from-purple-600 to-purple-400', change: '+12%' },
    { label: 'Candidates Screened', value: '1,847', icon: User, color: 'from-blue-600 to-blue-400', change: '+8%' },
    { label: 'Shortlisted', value: '342', icon: CheckCircle, color: 'from-green-600 to-green-400', change: '+15%' },
    { label: 'Avg Score', value: '87.5', icon: TrendingUp, color: 'from-orange-600 to-orange-400', change: '+3%' },
  ];

  const recentActivity = [
    { candidate: 'Sarah Johnson', role: 'Senior Developer', score: 92, time: '2 hours ago', status: 'completed' },
    { candidate: 'Mike Chen', role: 'Product Manager', score: 88, time: '4 hours ago', status: 'completed' },
    { candidate: 'Emily Davis', role: 'UX Designer', score: 91, time: '6 hours ago', status: 'completed' },
    { candidate: 'James Wilson', role: 'Data Scientist', score: 85, time: '8 hours ago', status: 'completed' },
    { candidate: 'Lisa Anderson', role: 'Frontend Dev', score: 0, time: 'In progress', status: 'in-progress' },
  ];

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue' }}>
            Admin Dashboard
          </h1>
          <p className="text-gray-400">Manage interviews and track candidate performance</p>
        </div>
        <Link to="/admin/create-session">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/50 transition-all"
            data-testid="create-session-btn"
          >
            <Plus className="w-5 h-5" />
            <span>Create Interview Session</span>
          </motion.button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 hover:border-purple-500/50 transition-all"
              data-testid={`stat-card-${index}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-400 text-sm font-bold">{stat.change}</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Bebas Neue' }}>
                {stat.value}
              </h3>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Bebas Neue' }}>
            Recent Activity
          </h2>
          <Link to="/admin/results" className="text-purple-400 hover:text-purple-300 font-medium text-sm">
            View All →
          </Link>
        </div>

        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <motion.div
              key={index}
              whileHover={{ x: 5 }}
              className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold">{activity.candidate[0]}</span>
                </div>
                <div>
                  <p className="text-white font-bold">{activity.candidate}</p>
                  <p className="text-gray-400 text-sm">{activity.role}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                {activity.status === 'completed' ? (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Bebas Neue' }}>
                      {activity.score}
                    </p>
                    <p className="text-gray-400 text-xs">Score</p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-400 text-sm font-medium">In Progress</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{activity.time}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
