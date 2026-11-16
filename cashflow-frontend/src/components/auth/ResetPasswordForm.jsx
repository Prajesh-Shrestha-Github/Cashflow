import { useState } from "react";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { resetPassword } from "../../services/auth";
import { useNavigate } from "react-router-dom";

const ResetPasswordForm = () => {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await resetPassword(token, newPassword);
      setMessage("Password reset successful! Redirecting to login...");
      
      // Short delay before redirecting to show the success message
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err?.error || "Invalid token or password.");
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div>
      {message && <p role="status" className="mt-6 rounded-xl border border-brand/25 bg-brand-tint p-3.5 text-sm font-medium text-brand-dark">{message}</p>}
      {error && <p id="reset-error" role="alert" className="mt-6 rounded-xl border border-signal/25 bg-signal/5 p-3.5 text-sm font-medium text-signal">{error}</p>}
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
        <label htmlFor="reset-token" className="label">Reset token</label>
        <input
          id="reset-token"
          type="text"
          autoComplete="one-time-code"
          className="field"
          placeholder="Paste the token from your email"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        </div>
        <div>
        <label htmlFor="reset-password" className="label">New password</label>
        <div className="relative">
          <input
            id="reset-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className="field pr-11"
            placeholder="Choose a new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3.5 text-ink-mute hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
          >
            {showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
          </button>
        </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1 py-3">
            Reset Password
          </button>
          <button 
            type="button" 
            onClick={handleCancel} 
            className="btn-ghost flex-1 py-3"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordForm;