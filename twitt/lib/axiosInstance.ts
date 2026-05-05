import axios from "axios";
import { auth } from "@/context/firebase";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

// ── Wait for Firebase to be ready then get token ──────────────────────────────
const getTokenWithRetry = async (retries = 3, delayMs = 800): Promise<string | null> => {
  for (let i = 0; i < retries; i++) {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        return await currentUser.getIdToken(true); // force refresh
      } catch {
        // token fetch failed, wait and retry
      }
    }
    // Wait for Firebase auth to settle
    await new Promise(res => setTimeout(res, delayMs));
  }
  return null;
};

axiosInstance.interceptors.request.use(async (config) => {
  try {
    const token = await getTokenWithRetry();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error("[axiosInstance] Failed to get Firebase token:", err);
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const method  = error.config?.method?.toUpperCase();
    const url     = (error.config?.baseURL || "") + (error.config?.url || "");
    const data    = error.response?.data;

    // Only log unexpected errors — skip expected 404s (user not found yet)
    const isExpected404 =
      status === 404 &&
      (url.includes("/loggedinuser") || url.includes("/suggested-users"));

    if (!isExpected404) {
      console.error(
        `[axiosInstance] ${method} ${url}`,
        "→ status:", status,
        "→ data:", data
      );
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;