import { Link, useLocation } from 'react-router-dom';
import AuthShell, { Notice } from '../components/auth/AuthShell';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  const location = useLocation();
  const message = location.state?.message;

  return (
    <AuthShell
      panelTitle="Your month, accounted for."
      panelNote="Sign in to see income, expenses, goals and bills in one place."
      footer={
        <p>
          New to Cashflow?{' '}
          <Link to="/register" className="font-semibold text-brand underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      {message && <Notice tone="success">{message}</Notice>}
      <LoginForm />
    </AuthShell>
  );
};

export default LoginPage;
