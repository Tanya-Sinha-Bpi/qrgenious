import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyToken } from '../api/auth';


const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication on initial load and route changes
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);

      // const token = localStorage.getItem('token');
      
      try {
        const userData = await verifyToken();
        setUser(userData);
        
        // Redirect if user is on auth page after checking user verified or not 
      if (location.pathname.startsWith('/auth') && !location.pathname.includes('/verify') && userData?.isVerified) {
        navigate('/dashboard', { replace: true });
      }
      } catch (err) {
        handleLogout();
        setError('Session expired. Please login again.' + err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname, navigate]);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    document.cookie = 'token=; Max-Age=0; path=/;';
    localStorage.removeItem('token');
    setUser(null);
    navigate('/auth/login');
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout: handleLogout,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);