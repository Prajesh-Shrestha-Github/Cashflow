import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import BalanceHero from '../components/dashboard/BalanceHero';
import MoneyHealthStrip from '../components/dashboard/MoneyHealthStrip';
import RecurringTransactions from '../components/dashboard/RecurringTransactions';
import UserDashboard from '../components/dashboard/UserDashboard';
import PageHeader from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';

// The balance is the focus: what you have, then how healthy your money habits are, then the details.
const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.is_admin) navigate('/admin-dashboard');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" />
      <BalanceHero />
      <MoneyHealthStrip />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <UserDashboard />
        <div className="space-y-5">
          <RecurringTransactions />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
