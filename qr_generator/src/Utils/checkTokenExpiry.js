import {jwtDecode} from 'jwt-decode';
import { toast } from 'react-toastify';

export const checkTokenExpiry = (token) => {
    if (!token){
        toast.error("Token not exist")
        return true;
    };

    try {
        const decoded = jwtDecode(token);

        const currentTime = Date.now() / 1000;

        return decoded.exp < currentTime;
    } catch (error) {
        toast.error(error.message)
        return true;
    }
}

export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const verifyTokenAndLogoutIfExpired = (logoutFn) => {
  const token = getCookie('token');

  if (!token || checkTokenExpiry(token)) {
    // Clear cookie by setting expiry to past
    document.cookie = 'token=; Max-Age=0; path=/;';

    // Optional: Clear localStorage/sessionStorage if used
    localStorage.clear();
    sessionStorage.clear();

    logoutFn();

    return true;

    // Dispatch logout
    //dispatch({ type: 'auth/logout' }); // or your actual logout action
  }
  return false;
};