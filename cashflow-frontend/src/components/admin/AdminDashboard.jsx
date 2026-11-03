import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { COLORS, CATEGORY_PALETTE, applyChartDefaults, gridOptions } from '../../utils/chartTheme';
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
applyChartDefaults(ChartJS);

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-signal/10 text-signal rounded-lg">
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
        borderColor: COLORS.brand,
        backgroundColor: COLORS.brandSoft,
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: COLORS.brand,
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
        backgroundColor: COLORS.forest,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 36,
      }
    ]
  };

  const categoryDistributionData = {
    labels: adminData.charts.category_distribution.labels,
    datasets: [
      {
        label: 'Expense by Category',
        data: adminData.charts.category_distribution.data,
        backgroundColor: CATEGORY_PALETTE,
        borderColor: COLORS.paper,
        borderWidth: 3,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Admin Actions */}
      <div className="bg-card p-6 rounded-xl shadow-card overflow-x-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
          <h2 className="text-xl font-semibold">Admin Dashboard</h2>
          <div className="mt-3 md:mt-0 space-y-2 md:space-y-0 md:space-x-2">
            <button 
              onClick={handleSendReminders} 
              disabled={sendingReminders}
              className="btn-primary md:w-auto"
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
          <div className="mt-3 p-4 bg-paper rounded-lg overflow-auto max-h-40">
            <pre className="text-xs whitespace-pre-wrap">{reminderOutput}</pre>
          </div>
        )}
      </div>
      
      {/* Summary Cards */}
      <div className="bg-card p-6 rounded-xl shadow-card overflow-x-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-accent-tint p-4 rounded-lg">
            <h3 className="text-sm font-medium text-forest">Total Users</h3>
            <p className="text-2xl font-bold">{adminData.user_stats.total_users.toLocaleString()}</p>
            <p className="text-sm text-ink-mute">{adminData.user_stats.active_users} active</p>
          </div>
          
          <div className="bg-brand-tint p-4 rounded-lg">
            <h3 className="text-sm font-medium text-brand">Transactions</h3>
            <p className="text-2xl font-bold">{adminData.transaction_stats.total_transactions.toLocaleString()}</p>
            <p className="text-sm text-ink-mute">Avg: ${adminData.transaction_stats.average_transaction.toFixed(2)}</p>
          </div>
          
          <div className="bg-brand-tint p-4 rounded-lg">
            <h3 className="text-sm font-medium text-brand">Platform Balance</h3>
            <p className="text-2xl font-bold">${adminData.transaction_stats.total_platform_balance.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Growth Chart */}
        <div className="bg-card p-6 rounded-xl shadow-card overflow-x-auto">
          <h2 className="mb-4 font-display text-xl font-bold tracking-tight">User Growth</h2>
          <div className="h-48 sm:h-64 md:h-80">
            <Line 
              data={userGrowthData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  x: { ...gridOptions, grid: { display: false } },
                  y: {
                    ...gridOptions,
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
        <div className="bg-card p-6 rounded-xl shadow-card overflow-x-auto">
          <h2 className="mb-4 font-display text-xl font-bold tracking-tight">Transaction Volume</h2>
          <div className="h-48 sm:h-64 md:h-80">
            <Bar 
              data={transactionVolumeData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  x: { ...gridOptions, grid: { display: false } },
                  y: {
                    ...gridOptions,
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
        <div className="bg-card p-6 rounded-xl shadow-card overflow-x-auto">
          <h2 className="mb-4 font-display text-xl font-bold tracking-tight">Top Expense Categories</h2>
          <div className="h-48 sm:h-64 md:h-80">
            <Doughnut data={categoryDistributionData} options={{ maintainAspectRatio: false, cutout: '66%', plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
        
        {/* New Users This Month */}
        <div className="bg-card p-6 rounded-xl shadow-card">
          <h2 className="mb-4 font-display text-xl font-bold tracking-tight">New Users This Month</h2>
          <div className="flex items-center space-x-4">
            <div className="bg-brand-tint p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{adminData.user_stats.new_users_this_month}</p>
              <p className="text-sm text-ink-mute">New users</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="bg-card p-6 rounded-xl shadow-card">
        <h2 className="mb-4 font-display text-xl font-bold tracking-tight">Users</h2>
        <div className="overflow-x-auto sm:rounded-xl">
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-paper">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-mute uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-mute uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-mute uppercase tracking-wider">Date Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-mute uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-mute uppercase tracking-wider">Transactions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-mute uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-mute uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-line">
              {adminData.users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-brand-tint rounded-full flex items-center justify-center">
                        <span className="text-brand font-medium">{user.username.substring(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-ink">{user.name || user.username}</div>
                        <div className="text-sm text-ink-mute">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-mute">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-mute">{user.date_joined}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-mute">{user.last_login}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-mute">{user.transaction_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_active ? 'bg-brand-tint text-brand-dark' : 'bg-signal/10 text-signal'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {user.is_admin && (
                      <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-accent-tint text-forest">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-mute">
                    {!user.is_admin && (
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="text-signal hover:text-signal"
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