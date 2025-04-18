import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { toast } from 'react-hot-toast';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title
);

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderOutput, setReminderOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/admin/');
      setAdminData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch admin dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user ${username}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete('/dashboard/admin/', { data: { user_id: userId } });
      toast.success(`User ${username} deleted successfully`);
      fetchData(); // Refresh data
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
      console.error(err);
    }
  };

  const handleSendReminders = async () => {
    try {
      setSendingReminders(true);
      setReminderOutput('');
      setShowOutput(false);
      
      const response = await api.post('/dashboard/admin/actions/', { 
        action: 'send_reminders' 
      });
      
      setReminderOutput(response.data.details || 'Reminders sent successfully.');
      setShowOutput(true);
      toast.success('Reminders sent successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reminders');
      setReminderOutput(err.response?.data?.details || 'Error sending reminders');
      setShowOutput(true);
      console.error(err);
    } finally {
      setSendingReminders(false);
    }
  };

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

  // Prepare chart data
  const userGrowthData = {
    labels: adminData.charts.user_growth.labels,
    datasets: [
      {
        label: 'Total Users',
        data: adminData.charts.user_growth.data,
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const transactionVolumeData = {
    labels: adminData.charts.transaction_volume.labels,
    datasets: [
      {
        label: 'Transaction Volume',
        data: adminData.charts.transaction_volume.data,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      }
    ]
  };

  const categoryDistributionData = {
    labels: adminData.charts.category_distribution.labels,
    datasets: [
      {
        label: 'Expense by Category',
        data: adminData.charts.category_distribution.data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Admin Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
          <h2 className="text-xl font-semibold">Admin Dashboard</h2>
          <div className="mt-3 md:mt-0 space-y-2 md:space-y-0 md:space-x-2">
            <button 
              onClick={handleSendReminders} 
              disabled={sendingReminders}
              className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center justify-center"
            >
              {sendingReminders ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : "Send Reminders"}
            </button>
          </div>
        </div>
        
        {showOutput && (
          <div className="mt-3 p-4 bg-gray-100 rounded-md overflow-auto max-h-40">
            <pre className="text-xs whitespace-pre-wrap">{reminderOutput}</pre>
          </div>
        )}
      </div>
      
      {/* Summary Cards */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-purple-500">Total Users</h3>
            <p className="text-2xl font-bold">{adminData.user_stats.total_users.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{adminData.user_stats.active_users} active</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-blue-500">Transactions</h3>
            <p className="text-2xl font-bold">{adminData.transaction_stats.total_transactions.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Avg: ${adminData.transaction_stats.average_transaction.toFixed(2)}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-green-500">Platform Balance</h3>
            <p className="text-2xl font-bold">${adminData.transaction_stats.total_platform_balance.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Growth</h2>
          <div className="h-64">
            <Line 
              data={userGrowthData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
        
        {/* Transaction Volume Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Transaction Volume</h2>
          <div className="h-64">
            <Bar 
              data={transactionVolumeData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
        
        {/* Category Distribution Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Top Expense Categories</h2>
          <div className="h-64">
            <Pie data={categoryDistributionData} options={{ maintainAspectRatio: false }} />
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
      
      {/* Users Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adminData.users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-medium">{user.username.substring(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || user.username}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.date_joined}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.last_login}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.transaction_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {user.is_admin && (
                      <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {!user.is_admin && (
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;