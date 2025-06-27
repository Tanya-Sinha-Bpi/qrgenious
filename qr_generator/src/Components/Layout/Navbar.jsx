import { Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { manualLogout } from '../../api/auth';
import { toast } from 'react-toastify';

function Navbar({ user, onLogout }) {

const handleLogout = async () => {
  try {
    const res = await manualLogout();
    toast.success(res.data?.message || "Logout successfully");
    localStorage.clear();
    window.location.href = "/auth/login";
  } catch (error) {
    toast.error(error?.response?.data?.message || "Something happened");
  }
};
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-bold text-indigo-600">
              QRGenius
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center">
                <div className="mr-3 text-right hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                  <p className="text-xs text-gray-500">Premium User</p>
                </div>
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold">
                    {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;