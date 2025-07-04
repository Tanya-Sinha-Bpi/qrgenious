import { Link } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { manualLogout } from "../../api/auth";
import { toast } from "react-toastify";

function getUserInitials(user) {
  const { name, email, registeredViaGoogle } = user;

  // If registered with Google and name is valid
  if (registeredViaGoogle && name && name !== "N/A") {
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase(); // first 2 letters
    }
    return (parts[0][0] + parts[1][0]).toUpperCase(); // first letter of first and last name
  }

  // If name is not available or is "N/A"
  if (!name || name === "N/A") {
    return email?.[0]?.toUpperCase() || "U"; // fallback to email first char
  }

  // For normal registered users with name
  const validParts = name.trim().split(" ");
  if (validParts.length === 1) {
    return validParts[0].substring(0, 2).toUpperCase();
  }
  return (validParts[0][0] + validParts[1][0]).toUpperCase();
}

function Navbar({ user, onLogout }) {
  // console.log("user in navbar", user);
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
                  <p className="text-sm font-medium text-gray-900">
                    {user.data?.registeredViaGoogle
                      ? user.data.name
                      : user.data.email || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">Premium User</p>
                </div>
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold">
                    {getUserInitials(user.data)}
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
