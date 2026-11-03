import { Link } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <AuthShell
      panelTitle="Start with this month."
      panelNote="Create an account and log your first income and expense in a minute."
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
};

export default RegisterPage;
