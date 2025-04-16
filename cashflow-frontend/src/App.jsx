import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GoalsProvider } from './context/GoalsContext';
import { TransactionProvider } from './context/TransactionContext';
import { FinancialHealthProvider } from './context/FinancialHealthContext';
import { AIRecommendationProvider } from './context/AIRecommendationContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { ReminderProvider } from './context/ReminderContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TransactionsPage from './pages/TransactionsPage';
import GoalsPage from './pages/GoalsPage';
import FinancialHealthPage from './pages/FinancialHealthPage';
import AIAdvisorPage from './pages/AIAdvisorPage';

// New Article Pages
import ArticlesPage from './pages/ArticlesPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import BookmarksPage from './pages/BookmarksPage';
import ArticlesManagementPage from './pages/admin/ArticlesManagementPage';
import CreateArticlePage from './pages/admin/CreateArticlePage';
import EditArticlePage from './pages/admin/EditArticlePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Article Routes */}
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:slug" element={<ArticleDetailPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ReminderProvider>
                  <TransactionProvider>
                    <FinancialHealthProvider>
                      <DashboardPage />
                    </FinancialHealthProvider>
                  </TransactionProvider>
                </ReminderProvider>
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
            path="/ai-advisor"
            element={
              <ProtectedRoute>
                <AIRecommendationProvider>
                  <AIAdvisorPage />
                </AIRecommendationProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookmarks"
            element={
              <ProtectedRoute>
                <BookmarksPage />
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
          
          {/* Admin Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/admin/articles" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <ArticlesManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/articles/new" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <CreateArticlePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/articles/edit/:slug" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <EditArticlePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;