import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GoalsProvider } from './context/GoalsContext';
import { TransactionProvider } from './context/TransactionContext'; // Added import for GoalsProvider
import { FinancialHealthProvider } from './context/FinancialHealthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TransactionsPage from './pages/Transactionspage';
import GoalsPage from './pages/GoalsPage';
import FinancialHealthPage from './pages/FinancialHealthPage';


function App() {
  return (
    <AuthProvider>
      {/* <GoalsProvider> */}
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <FinancialHealthProvider>
                    <DashboardPage />
                  </FinancialHealthProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <TransactionProvider>
                    <TransactionsPage />
                  </TransactionProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/goals"
              element={
                <ProtectedRoute>
                  <GoalsProvider>
                    <GoalsPage />
                  </GoalsProvider>
                </ProtectedRoute>
              }
            />
           

            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financial-health"
              element={
                <ProtectedRoute>
                  <FinancialHealthProvider>
                    <FinancialHealthPage />
                  </FinancialHealthProvider>
                </ProtectedRoute>
              }
            />

            {/* Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      {/* </GoalsProvider> */}
    </AuthProvider>
  );
}

export default App;