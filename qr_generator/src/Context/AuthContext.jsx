import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyToken } from "../api/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const ranOnce = useRef(false);

  // Check authentication on initial load and route changes
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     setLoading(true);

  //     // const token = localStorage.getItem('token');

  //     try {
  //       const userData = await verifyToken();
  //       setUser(userData);

  //       // Redirect if user is on auth page after checking user verified or not
  //     if (location.pathname.startsWith('/auth') && !location.pathname.includes('/verify') && userData?.isVerified) {
  //       navigate('/dashboard', { replace: true });
  //     }
  //     } catch (err) {
  //       handleLogout();
  //       setError('Session expired. Please login again.' + err.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   checkAuth();
  // }, [location.pathname, navigate]);
  useEffect(() => {
    // if (ranOnce.current) return;
    // ranOnce.current = true;
    const checkAuth = async () => {
      setLoading(true);
      try {
        const userData = await verifyToken();
        setUser(userData);

        // Redirect only if user is verified and trying to visit /auth or /auth/login
        if (
          userData?.isVerified &&
          (location.pathname === "/auth" || location.pathname === "/auth/login")
        ) {
          navigate("/dashboard", { replace: true });
        }
        // Otherwise allow visiting other /auth routes freely (like register, verify, reset)
      } catch (err) {
        // No token or invalid token — allow user to access auth routes freely
        // Just clear user and don't redirect forcibly here
        setUser(null);
        setError(null); // or your message
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname, navigate]);
  const login = (token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    document.cookie = "token=; Max-Age=0; path=/;";
    localStorage.removeItem("token");
    setUser(null);
    navigate("/auth/login");
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout: handleLogout,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
