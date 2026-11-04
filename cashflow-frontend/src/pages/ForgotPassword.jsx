import { useState } from "react";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import AuthShell, { FormHeading } from "../components/auth/AuthShell";
import { Link, useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [isSent, setIsSent] = useState(false);

  return (
    <AuthShell
      panelTitle="Locked out? It happens."
      panelNote="We will email you a reset token so you can set a new password."
      footer={
        <p>
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <FormHeading title="Forgot password" subtitle="Enter your email to receive a password reset token." />
      {isSent ? (
        <button className="btn-accent mt-8 w-full py-3" onClick={() => navigate("/reset-password")}>
          Proceed to Reset Password
        </button>
      ) : (
        <ForgotPasswordForm onSuccess={() => setIsSent(true)} />
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
