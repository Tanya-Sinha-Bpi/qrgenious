import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./Context/AuthContext";
import RegisterPage from "./Pages/Auth/RegisterPage";
import LoginPage from "./Pages/Auth/LoignPage";
import VerifyPage from "./Pages/Auth/VerifyPage";
import ForgotPasswordPage from "./Pages/Auth/ForgotPassword";
import ResetPasswordPage from "./Pages/Auth/ResetPasswordPage";
// import ResendOTPPage from './Pages/Auth/re';
import DashboardPage from "./Pages/General/DashboardPage";
import HistoryPage from "./Pages/General/HistoryPage";
import QRDetailPage from "./Pages/General/QRDetailPage";
import NotFoundPage from "./Pages/NotFoundPage";
import Layout from "./Components/Layout/Layout";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import PublicQRViewPage from "./Pages/PublicQRViewPage";
// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading,logout  } = useAuth();


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/auth/login" replace />;
}

// Auth Layout Component
function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Outlet />
    </div>
  );
}

// Main App Component
function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        pauseOnHover
      />
      <AuthProvider>
        {/* <div>Hello</div> */}
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="register" element={<RegisterPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="verify" element={<VerifyPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            {/* <Route path="resend-otp" element={<ResendOTPPage />} /> */}
            <Route index element={<Navigate to="/auth/login" replace />} />
          </Route>

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="qr/:id" element={<QRDetailPage />} />
            <Route path="edit/:id" element={<QRDetailPage />} />
            <Route index element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Public QR Detail Page */}


          {/* Not Found */}
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/public/qr/:slug" element={<PublicQRViewPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
