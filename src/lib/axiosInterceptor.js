import axios from "axios";

// Setup global Axios response interceptor for handling 401 Unauthorized / 403 Forbidden
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      console.warn("⚠️ Unauthorized or forbidden request (401/403). Clearing session & logging out...");
      
      // Clear all auth credentials from local storage
      localStorage.clear();
      
      // Notify active components/hooks about auth state change
      window.dispatchEvent(new Event("auth:logout"));

      // Force redirect to login page if user is on a protected route
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
