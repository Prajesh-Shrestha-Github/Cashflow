import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Verify, Step 2: Reset Password
  const [username, setUsername] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("pet");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const securityQuestions = [
    { value: "pet", label: "What is the name of your first pet?" },
    { value: "city", label: "In what city were you born?" },
    { value: "school", label: "What is the name of your first school?" },
  ];

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/verify-security-question/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, security_question: securityQuestion, security_answer: securityAnswer }),
      });
      if (res.ok) {
        setStep(2);
      } else {
        alert("Incorrect answer. Try again!");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/reset-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, new_password: newPassword }),
      });
      if (res.ok) {
        alert("Password reset successful!");
        navigate("/login");
      } else {
        alert("Reset failed. Try again!");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        {step === 1 ? (
          <>
            <h2 className="text-xl font-semibold mb-4">Verify Security Question</h2>
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {securityQuestions.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Security Answer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
              <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
                Verify
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
              <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">
                Reset Password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
