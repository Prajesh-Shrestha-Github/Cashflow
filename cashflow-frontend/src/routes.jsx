// src/routes.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/auth/LoginForm';
import Register from './components/auth/RegisterForm';
import ForgotPassword from './components/ForgotPassword';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<Login />} /> {/* default route */}
      </Routes>
    </Router>
  );
};

export default AppRoutes;
