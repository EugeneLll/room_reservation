import axios from "axios";
import Cookies from "js-cookie";

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isTokenEndpoint = originalRequest.url.includes("/api/token/");

    // Handle 401 errors (excluding token endpoints)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isTokenEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get("refresh_token");
        if (!refreshToken) throw new Error("Missing refresh token");

        const { data } = await refreshClient.post("/api/token/refresh/", {
          refresh: refreshToken,
        });

        // Update tokens in cookies
        Cookies.set("access_token", data.access);
        if (data.refresh) {
          // Optional: handle refresh token rotation
          Cookies.set("refresh_token", data.refresh);
        }

        // Update original request header
        originalRequest.headers.Authorization = `Bearer ${data.access}`;

        // Retry original request with new token
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Clear tokens and handle logout
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        return Promise.reject(new Error("Session expired. Please login again"));
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
