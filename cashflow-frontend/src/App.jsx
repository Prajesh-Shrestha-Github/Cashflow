import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GoalsProvider } from './context/GoalsContext';
import { TransactionProvider } from './context/TransactionContext';
import { FinancialHealthProvider } from './context/FinancialHealthContext';
import { AIRecommendationProvider } from './context/AIRecommendationContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
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
          
          {/* Article Routes - These are public but will show sidebar if authenticated */}
          <Route path="/articles" element={
            <Layout>
              <ArticlesPage />
            </Layout>
          } />
          <Route path="/articles/:slug" element={
            <Layout>
              <ArticleDetailPage />
            </Layout>
          } />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ReminderProvider>
                  <TransactionProvider>
                    <FinancialHealthProvider>
                      <Layout>
                        <DashboardPage />
                      </Layout>
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
                  <Layout>
                    <TransactionsPage />
                  </Layout>
                </TransactionProvider>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <GoalsProvider>
                  <Layout>
                    <GoalsPage />
                  </Layout>
                </GoalsProvider>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/financial-health"
            element={
              <ProtectedRoute>
                <FinancialHealthProvider>
                  <Layout>
                    <FinancialHealthPage />
                  </Layout>
                </FinancialHealthProvider>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/ai-advisor"
            element={
              <ProtectedRoute>
                <AIRecommendationProvider>
                  <Layout>
                    <AIAdvisorPage />
                  </Layout>
                </AIRecommendationProvider>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/bookmarks"
            element={
              <ProtectedRoute>
                <Layout>
                  <BookmarksPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <AdminDashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/admin/articles" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <ArticlesManagementPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/articles/new" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <CreateArticlePage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/articles/edit/:slug" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <EditArticlePage />
                </Layout>
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