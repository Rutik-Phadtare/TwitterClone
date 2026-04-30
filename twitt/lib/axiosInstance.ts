import axios from "axios";
import { auth } from "@/context/firebase";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach Firebase token to every request
axiosInstance.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error("Failed to get Firebase token:", err);
  }
  return config;
});

// Global response error handler
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized — token missing or expired");
    }
    if (error.response?.status === 403) {
      console.error("Forbidden — you don't have permission for this action");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;