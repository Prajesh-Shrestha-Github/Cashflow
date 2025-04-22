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
    <div className="space-y-4">
      {message && <p className="text-green-500">{message}</p>}
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          className="w-full p-2 border rounded"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
          Send Reset Token
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
