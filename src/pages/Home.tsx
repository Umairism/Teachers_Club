import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useStats } from '../hooks/useStats';
import { 
  Users, 
  FileText, 
  MessageCircle, 
  TrendingUp,
  ArrowRight,
  Star,
  Award,
  Activity
} from 'lucide-react';

export function Home() {
  const { user } = useAuth();
  const { stats, loading } = useStats();

  const statCards = [
    {
      icon: Users,
      label: 'Active Members',
      value: stats?.totalUsers || 0,
      gradient: 'from-blue-600 to-blue-700',
      link: '/register'
    },
    {
      icon: FileText,
      label: 'Published Articles',
      value: stats?.publishedArticles || 0,
      gradient: 'from-green-600 to-green-700',
      link: '/articles'
    },
    {
      icon: MessageCircle,
      label: 'Community Posts',
      value: stats?.totalConfessions || 0,
      gradient: 'from-purple-600 to-purple-700',
      link: '/confessions'
    },
    {
      icon: TrendingUp,
      label: 'Total Engagement',
      value: stats ? `${((stats.totalLikes + stats.totalComments) / Math.max(stats.totalUsers, 1) * 100).toFixed(0)}%` : '0%',
      gradient: 'from-orange-600 to-orange-700',
      link: user ? '/dashboard' : '/login'
    }
  ];

  const features = [
    {
      icon: FileText,
      title: 'Rich Content Creation',
      description: 'Create and publish articles with beautiful formatting and multimedia support.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: MessageCircle,
      title: 'Community Confessions',
      description: 'Share thoughts anonymously and build meaningful connections with peers.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Professional Dashboard',
      description: 'Track your progress and engagement with comprehensive analytics.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Award,
      title: 'Achievement System',
      description: 'Earn badges and recognition for your contributions to the community.',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative w-full h-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-24">
          <div className="w-full max-w-7xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Teacher's Club
              </span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed px-4">
              A modern, professional education platform that brings together educators, 
              students, and administrators in a comprehensive digital environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Link
                  to="/dashboard"
                  className="group bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="group bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition-all duration-300 flex items-center space-x-2"
                  >
                    <span>Join Today</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                  <Link
                    to="/login"
                    className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-gray-900 transition-all duration-300"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-16 bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mr-3">
                Community Statistics
              </h2>
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-green-500 animate-pulse mr-2" />
                <span className="text-sm text-green-600 font-medium">Live</span>
              </div>
            </div>
            <p className="text-xl text-gray-600">
              See how our platform is growing and engaging our community
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  to={stat.link}
                  key={stat.label}
                  className="block bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer"
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                    {loading ? (
                      <div className="w-12 h-8 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value
                    )}
                  </div>
                  <div className="text-gray-600 font-medium group-hover:text-gray-800 transition-colors duration-300">{stat.label}</div>
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.title}
                  className="group cursor-pointer"
                >
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2 h-full">
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="w-full py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="w-full max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl mx-auto">
              Join thousands of educators and students who are already experiencing 
              the future of educational technology.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <span>Start Your Journey</span>
              <Star className="h-5 w-5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}