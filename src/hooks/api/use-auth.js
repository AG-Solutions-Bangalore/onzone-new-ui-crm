import { useEffect, useState } from "react";

const useAuth = () => {
  const [authData, setAuthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    const id = localStorage.getItem("id");
    const name = localStorage.getItem("name");
    const userType = localStorage.getItem("userType");
    const email = localStorage.getItem("email");

    const isValidToken = token && token.trim() !== "" && token !== "null" && token !== "undefined";
    const isValidUser = id && id !== "null" && id !== "undefined";

    if (isValidToken && isValidUser) {
      setAuthData({
        user: {
          id,
          name,
          userType,
          email,
          token,
        },
      });
    } else {
      setAuthData({ user: null });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();

    const handleAuthEvent = () => checkAuth();
    window.addEventListener("auth:logout", handleAuthEvent);
    window.addEventListener("auth:login", handleAuthEvent);
    window.addEventListener("storage", handleAuthEvent);

    return () => {
      window.removeEventListener("auth:logout", handleAuthEvent);
      window.removeEventListener("auth:login", handleAuthEvent);
      window.removeEventListener("storage", handleAuthEvent);
    };
  }, []);

  return { data: authData, isLoading };
};

export default useAuth;