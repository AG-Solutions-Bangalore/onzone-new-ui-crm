import axios from "axios";
import { queryClient } from "./queryClient";

// Setup global Axios response interceptor for handling 401 Unauthorized / 403 Forbidden
// and automatic React Query cache invalidation on successful data mutations
axios.interceptors.response.use(
  (response) => {
    try {
      const method = response.config?.method?.toLowerCase();
      if (["post", "put", "patch", "delete"].includes(method)) {
        const url = response.config?.url || "";
        const isReadOrAuth =
          url.includes("/fetch-") ||
          url.includes("/get-") ||
          url.includes("/login") ||
          url.includes("report");
        if (!isReadOrAuth) {
          queryClient.invalidateQueries();
        }
      }
    } catch (e) {
      console.warn("Failed to invalidate queries in axios interceptor", e);
    }
    return response;
  },
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
