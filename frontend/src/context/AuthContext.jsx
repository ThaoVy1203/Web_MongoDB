import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("wops_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("wops_access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("wops_user", JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem("wops_access_token");
        localStorage.removeItem("wops_refresh_token");
        localStorage.removeItem("wops_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    localStorage.setItem("wops_access_token", res.access_token);
    if (res.refresh_token) localStorage.setItem("wops_refresh_token", res.refresh_token);
    localStorage.setItem("wops_user", JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  };

  const register = async (payload) => {
    const res = await authApi.register(payload);
    localStorage.setItem("wops_access_token", res.access_token);
    if (res.refresh_token) localStorage.setItem("wops_refresh_token", res.refresh_token);
    localStorage.setItem("wops_user", JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    await authApi.logout().catch(() => null);
    localStorage.removeItem("wops_access_token");
    localStorage.removeItem("wops_refresh_token");
    localStorage.removeItem("wops_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
