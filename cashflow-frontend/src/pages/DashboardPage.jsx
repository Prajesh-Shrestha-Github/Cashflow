import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserDashboard from '../components/dashboard/UserDashboard';
import { useFinancialHealth } from '../context/FinancialHealthContext';
import FinancialHealthBar from '../components/financial-health/FinancialHealthBar';
import { useTransactions } from '../context/TransactionContext';
import RecurringTransactions from '../components/dashboard/RecurringTransactions';

const DashboardPage = () => {
  const { user } = useAuth();
  const { currentHealth, fetchCurrentHealth } = useFinancialHealth();
  const { summary } = useTransactions();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.is_admin) {
        navigate('/admin-dashboard');
      } else {
        fetchCurrentHealth(); // Fetch financial health data for the bar
      }
    }
  }, [user, navigate, fetchCurrentHealth]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome back, <span className="font-medium">{user.username || user.email}</span>
        </div>
      </div>

      {/* Main Dashboard Content - 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Charts and data visualization (2/3 width) */}
        <div className="lg:col-span-2">
          <UserDashboard />
        </div>
        
        {/* Right column - Financial Health and Recurring Transactions (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Financial Health Summary */}
          {currentHealth && (
            <div className="bg-white rounded-lg shadow p-4">
    
              
              <FinancialHealthBar 
                healthStatus={currentHealth.health_status} 
                savingsRate={currentHealth.savings_rate} 
              />
              
              <p className="mt-3 text-sm text-gray-600">
                {currentHealth.message || 'Maintain your financial habits to improve your score.'}
              </p>
            </div>
          )}

          {/* Recurring Transactions */}
          <RecurringTransactions />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;