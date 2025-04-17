import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

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

const UserDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get(`/dashboard/?period=${timeRange}`);
        setDashboardData(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

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

  // Default values if backend doesn't provide the data yet
  const categoryBreakdown = dashboardData.category_breakdown || [
    { category: 'Food', amount: 300 },
    { category: 'Housing', amount: 1200 },
    { category: 'Transport', amount: 200 },
    { category: 'Entertainment', amount: 150 },
    { category: 'Other', amount: 250 }
  ];

  const trendData = dashboardData.trends || [
    { date: '1-Jan', income: 2000, expense: 1800 },
    { date: '8-Jan', income: 2100, expense: 1750 },
    { date: '15-Jan', income: 1950, expense: 1900 },
    { date: '22-Jan', income: 2200, expense: 1850 },
    { date: '29-Jan', income: 2300, expense: 1700 }
  ];

  const spendingPatterns = dashboardData.spending_patterns || [
    { day_of_week: 'Mon', average_amount: 80 },
    { day_of_week: 'Tue', average_amount: 65 },
    { day_of_week: 'Wed', average_amount: 75 },
    { day_of_week: 'Thu', average_amount: 90 },
    { day_of_week: 'Fri', average_amount: 120 },
    { day_of_week: 'Sat', average_amount: 150 },
    { day_of_week: 'Sun', average_amount: 95 }
  ];

  const insights = dashboardData.insights || [
    { 
      title: 'Weekend Spending', 
      description: 'You tend to spend more on weekends, especially on entertainment and dining out.' 
    },
    { 
      title: 'Monthly Savings', 
      description: 'Your savings rate is healthy at approximately 15% of your income.' 
    }
  ];

  // Enhanced stats with defaults
  const stats = {
    total_income: dashboardData.stats.total_income || 0,
    total_expense: dashboardData.stats.total_expense || 0,
    balance: dashboardData.stats.balance || 0,
    income_change: dashboardData.stats.income_change || 0,
    expense_change: dashboardData.stats.expense_change || 0,
    savings_rate: dashboardData.stats.savings_rate || 0
  };

  // Prepare data for expense category pie chart
  const expenseCategoryData = {
    labels: categoryBreakdown.map(item => item.category),
    datasets: [
      {
        label: 'Expense by Category',
        data: categoryBreakdown.map(item => item.amount),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for income vs expense trend line chart
  const trendChartData = {
    labels: trendData.map(item => item.date),
    datasets: [
      {
        label: 'Income',
        data: trendData.map(item => item.income),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Expenses',
        data: trendData.map(item => item.expense),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Prepare data for spending habits bar chart
  const spendingPatternData = {
    labels: spendingPatterns.map(item => item.day_of_week || item.time_of_day),
    datasets: [
      {
        label: 'Average Spending',
        data: spendingPatterns.map(item => item.average_amount),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Welcome, {user.first_name || user.username}!</h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => setTimeRange('week')} 
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Week
            </button>
            <button 
              onClick={() => setTimeRange('month')} 
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setTimeRange('year')} 
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'year' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Year
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-blue-500">Total Income</h3>
            <p className="text-2xl font-bold">${stats.total_income.toLocaleString()}</p>
            {stats.income_change !== 0 && (
              <p className={`text-sm ${stats.income_change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.income_change > 0 ? '↑' : '↓'} {Math.abs(stats.income_change)}% from previous {timeRange}
              </p>
            )}
          </div>
          
          <div className="bg-red-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-red-500">Total Expenses</h3>
            <p className="text-2xl font-bold">${stats.total_expense.toLocaleString()}</p>
            {stats.expense_change !== 0 && (
              <p className={`text-sm ${stats.expense_change < 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.expense_change > 0 ? '↑' : '↓'} {Math.abs(stats.expense_change)}% from previous {timeRange}
              </p>
            )}
          </div>
          
          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-green-500">Balance</h3>
            <p className="text-2xl font-bold">${stats.balance.toLocaleString()}</p>
            {stats.savings_rate > 0 && (
              <p className="text-sm text-gray-600">
                Savings Rate: {stats.savings_rate}%
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Expense Breakdown</h2>
          <div className="h-64">
            <Pie data={expenseCategoryData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        
        {/* Income vs Expense Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Income vs Expense Trend</h2>
          <div className="h-64">
            <Line 
              data={trendChartData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: value => `$${value}`
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: $${context.raw.toLocaleString()}`;
                      }
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
        
        {/* Spending Patterns Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Spending Patterns</h2>
          <div className="h-64">
            <Bar 
              data={spendingPatternData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: value => `$${value}`
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Average Spending: $${context.raw.toLocaleString()}`;
                      }
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
        
        {/* Transaction Insights */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Transaction Insights</h2>
          <div className="space-y-4">
            {insights && insights.map((insight, index) => (
              <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2">
                <h3 className="font-medium text-gray-800">{insight.title}</h3>
                <p className="text-gray-600">{insight.description}</p>
              </div>
            ))}
            {!insights || insights.length === 0 ? (
              <p className="text-gray-500 italic">Not enough transaction data to generate insights.</p>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.recent_transactions && dashboardData.recent_transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${transaction.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!dashboardData.recent_transactions || dashboardData.recent_transactions.length === 0) && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    No recent transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;