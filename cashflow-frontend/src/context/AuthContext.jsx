import { createContext, useState, useEffect, useContext } from 'react';
import { getUserProfile } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Add isAdmin state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await getUserProfile();
          setUser(userData);
          // Check if user has admin role/flag
          setIsAdmin(userData.is_admin || userData.is_staff || false);
          console.log('Auth initialized, isAdmin:', userData.is_admin || userData.is_staff || false);
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setIsAdmin(false);
        }
      }
      setLoading(false);
    };
    
    initializeAuth();
  }, []);
  
  const login = (userData, tokens) => {
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    // Set admin status when logging in
    setIsAdmin(userData.is_admin || userData.is_staff || false);
    console.log('Login successful, isAdmin:', userData.is_admin || userData.is_staff || false);
  };
  
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAdmin(false); // Reset isAdmin on logout
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin, // Include isAdmin in the context value
      loading, 
      error, 
      login, 
      logout, 
      setUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;