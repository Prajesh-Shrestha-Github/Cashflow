import { useState } from "react";
import { forgotPassword } from "../../services/auth";

const ForgotPasswordForm = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await forgotPassword(email);
      setMessage("A reset token has been sent to your email.");
      onSuccess();
    } catch (err) {
      setError("Please enter the correct email address.");
    }
  };

  return (
    <div>
      {message && <p role="status" className="mt-6 rounded-xl border border-brand/25 bg-brand-tint p-3.5 text-sm font-medium text-brand-dark">{message}</p>}
      {error && <p id="forgot-error" role="alert" className="mt-6 rounded-xl border border-signal/25 bg-signal/5 p-3.5 text-sm font-medium text-signal">{error}</p>}
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
        <label htmlFor="forgot-email" className="label">Email</label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          aria-describedby={error ? "forgot-error" : undefined}
          className="field"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        </div>
        <button type="submit" className="btn-primary w-full py-3">
          Send Reset Token
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
