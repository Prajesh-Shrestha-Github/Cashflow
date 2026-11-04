import ResetPasswordForm from "../components/auth/ResetPasswordForm";
import AuthShell, { FormHeading } from "../components/auth/AuthShell";

const ResetPassword = () => {
  return (
    <AuthShell
      panelTitle="A fresh start for your password."
      panelNote="Paste the token from your email and choose a new password."
    >
      <FormHeading title="Reset password" subtitle="Enter the reset token sent to your email and set a new password." />
      <ResetPasswordForm />
    </AuthShell>
  );
};

export default ResetPassword;
