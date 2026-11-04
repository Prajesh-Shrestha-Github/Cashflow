import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import AdminDashboard from '../../components/admin/AdminDashboard';
import { FaEdit, FaChartLine, FaUsers } from 'react-icons/fa';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  
  const adminModules = [
    {
      name: 'Articles Management',
      description: 'Create, edit, and manage articles and content',
      icon: <FaEdit className="w-8 h-8 text-brand" />,
      link: '/admin/articles'
    },
  ];
  
  return (
    <div className="space-y-5">
      <PageHeader title="Admin Dashboard" />

      {/* Admin Dashboard Component */}
      <div className="card-pad">
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">System Overview</h2>
        <AdminDashboard />
      </div>
      
      {/* Quick Access Modules */}
      <div>
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Admin Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminModules.map((module, index) => (
            <Link
              key={index}
              to={module.link}
              className="card flex flex-col p-5 transition-shadow hover:shadow-lift"
            >
              <div className="mb-3">{module.icon}</div>
              <h3 className="text-lg font-semibold text-ink mb-1">{module.name}</h3>
              <p className="text-sm text-ink-mute">{module.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;