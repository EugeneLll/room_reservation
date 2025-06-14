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

        Cookies.set("access_token", data.access);
        if (data.refresh) {
          Cookies.set("refresh_token", data.refresh);
        }

        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        return Promise.reject(new Error("Session expired. Please login again"));
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
