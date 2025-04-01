import ResetPasswordForm from "../components/auth/ResetPasswordForm";

const ResetPassword = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold text-center">Reset Password</h2>
        <p className="text-sm text-gray-600 text-center">
          Enter the reset token sent to your email and set a new password.
        </p>
        <ResetPasswordForm />
      </div>
    </div>
  );
};

export default ResetPassword;
