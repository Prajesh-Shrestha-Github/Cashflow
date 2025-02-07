// src/App.jsx
import React, { useState } from 'react';
import Register from './components/Register';
import Login from './components/Login';

function App() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="mb-4">
        <button
          onClick={() => setShowLogin(true)}
          className={`px-4 py-2 ${showLogin ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-l`}
        >
          Login
        </button>
        <button
          onClick={() => setShowLogin(false)}
          className={`px-4 py-2 ${!showLogin ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-r`}
        >
          Register
        </button>
      </div>
      {showLogin ? <Login /> : <Register />}
    </div>
  );
}

export default App;
