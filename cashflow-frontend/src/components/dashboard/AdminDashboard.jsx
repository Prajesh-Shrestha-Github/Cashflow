import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await api.get('/dashboard/admin/');
        setAdminData(response.data);
      } catch (err) {
        setError('Failed to fetch admin dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-purple-500">Total Users</h3>
            <p className="text-2xl font-bold">{adminData.user_stats.total_users.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{adminData.user_stats.active_users} active</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-blue-500">Transactions</h3>
            <p className="text-2xl font-bold">{adminData.transaction_stats.total_transactions.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Avg: ${adminData.transaction_stats.average_transaction}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-green-500">Platform Balance</h3>
            <p className="text-2xl font-bold">${adminData.transaction_stats.total_platform_balance.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      {/* User Growth Chart (Placeholder for now) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">User Growth</h2>
        <div className="h-64 bg-gray-100 flex items-center justify-center rounded-md">
          <p className="text-gray-500">Chart would be displayed here</p>
        </div>
      </div>
      
      {/* New Users This Month */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">New Users This Month</h2>
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold">{adminData.user_stats.new_users_this_month}</p>
            <p className="text-sm text-gray-500">New users</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;