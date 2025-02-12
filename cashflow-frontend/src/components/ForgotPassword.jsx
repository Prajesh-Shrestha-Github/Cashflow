// src/components/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isQuestionFetched, setIsQuestionFetched] = useState(false);

  // Fetch the security question for the given username
  const handleFetchQuestion = async () => {
    if (!username) {
      setMessage('Please enter your username first.');
      return;
    }
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/auth/get-security-question/?username=${username}`
      );
      if (response.ok) {
        const data = await response.json();
        setSecurityQuestion(data.security_question);
        setIsQuestionFetched(true);
        setMessage('');
      } else {
        setMessage('Username not found.');
      }
    } catch (error) {
      console.error('Error fetching security question:', error);
      setMessage('Error fetching security question.');
    }
  };

  // Submit the reset password form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/reset-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          security_answer: securityAnswer,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(data.error || 'Error resetting password.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
      {message && <div className="mb-4 text-red-500">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username input and button to fetch security question */}
        <div>
          <label className="block">Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <button
            type="button"
            onClick={handleFetchQuestion}
            className="mt-2 bg-blue-500 text-white p-2 rounded"
          >
            Get Security Question
          </button>
        </div>

        {isQuestionFetched && (
          <>
            {/* Display the fetched security question */}
            <div>
              <label className="block">Security Question:</label>
              <input
                type="text"
                value={securityQuestion}
                disabled
                className="w-full p-2 border rounded bg-gray-200"
              />
            </div>
            {/* Input for the security answer */}
            <div>
              <label className="block">Security Answer:</label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            {/* New password inputs */}
            <div>
              <label className="block">New Password:</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block">Confirm New Password:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
              Reset Password
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default ForgotPassword;
