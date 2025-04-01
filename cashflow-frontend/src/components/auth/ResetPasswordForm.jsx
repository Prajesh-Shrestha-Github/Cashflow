import { useState } from "react";
import { resetPassword } from "../../services/auth";
import { useNavigate } from "react-router-dom";

const ResetPasswordForm = () => {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
    <div className="space-y-4">
      {message && <p className="text-green-500">{message}</p>}
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Enter reset token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full p-2 border rounded"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <div className="flex space-x-3">
          <button type="submit" className="flex-1 bg-blue-500 text-white p-2 rounded">
            Reset Password
          </button>
          <button 
            type="button" 
            onClick={handleCancel} 
            className="flex-1 bg-gray-300 text-gray-800 p-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordForm;