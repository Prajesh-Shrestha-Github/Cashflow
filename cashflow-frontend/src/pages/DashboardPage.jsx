import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserDashboard from '../components/dashboard/UserDashboard';
import { useFinancialHealth } from '../context/FinancialHealthContext';
import FinancialHealthBar from '../components/financial-health/FinancialHealthBar';
import { useTransactions } from '../context/TransactionContext';
import RecurringTransactions from '../components/dashboard/RecurringTransactions';
import PageHeader from '../components/common/PageHeader';

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
        fetchCurrentHealth(); 
      }
    }
  }, [user, navigate, fetchCurrentHealth]);

  if (!user) return null;

  return (
    <div>
      <PageHeader eyebrow="Overview" title="Dashboard" subtitle={`Welcome back, ${user.username || user.email}`}>
        <Link to="/transactions" state={{ openForm: true }} className="btn-accent px-6 py-3 text-base">
          Add transaction
        </Link>
      </PageHeader>

      {/* Main Dashboard Content - 2-column layout */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Left column - Charts and data visualization (2/3 width) */}
        <div>
          <UserDashboard />
        </div>
        
        {/* Right column - Financial Health and Recurring Transactions (1/3 width) */}
        <div className="space-y-5">
          {/* Financial Health Summary */}
          {currentHealth && (
            <div className="card-pad">
              <FinancialHealthBar 
                healthStatus={currentHealth.health_status} 
                savingsRate={currentHealth.savings_rate} 
              />
              <p className="mt-3 text-sm text-ink-mute">
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