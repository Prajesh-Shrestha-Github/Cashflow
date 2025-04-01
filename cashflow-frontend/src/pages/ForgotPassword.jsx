import { useState } from "react";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [isSent, setIsSent] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold text-center">Forgot Password</h2>
        <p className="text-sm text-gray-600 text-center">
          Enter your email to receive a password reset token.
        </p>
        {isSent ? (
          <button
            className="w-full bg-green-500 text-white p-2 mt-3 rounded"
            onClick={() => navigate("/reset-password")}
          >
            Proceed to Reset Password
          </button>
        ) : (
          <ForgotPasswordForm onSuccess={() => setIsSent(true)} />
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
