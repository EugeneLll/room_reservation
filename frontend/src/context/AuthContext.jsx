import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import apiClient from "../api/client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get("access_token");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await apiClient.get("/api/users/me/");
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await apiClient.post("/api/token/", credentials);

      Cookies.set("access_token", response.data.access);
      Cookies.set("refresh_token", response.data.refresh);

      const userResponse = await apiClient.get("/api/users/me/");
      setUser(userResponse.data);
      return true;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const signup = async (userData) => {
    try {
      await apiClient.post("/api/users/signup/", {
        username: userData.username,
        email: userData.email,
        password: userData.password,
      });
      return true;
    } catch (error) {
      console.error("Signup failed", error.response?.data);
      return false;
    }
  };

  const logout = async () => {
    await apiClient.post("/api/token/logout/", {
      token: Cookies.remove("refresh_token"),
    });
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
