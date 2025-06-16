import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spin } from "antd";
import { useEffect } from "react";
import apiClient from "../api/client";

export default function ProtectedRoute({ children }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleUnauthorized = () => logout();
    apiClient.interceptors.response.eject(401, handleUnauthorized);
    return () => apiClient.interceptors.response.eject(handleUnauthorized);
  }, [logout]);

  if (loading) {
    return (
      <div className="full-page-spinner">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
