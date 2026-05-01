import axios from "axios";
import { auth } from "@/context/firebase";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

// ── Dev-mode sanity check ─────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  console.log("[axiosInstance] baseURL →", BASE_URL);
}

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Attach Firebase token to every request ────────────────────────────────────
axiosInstance.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error("[axiosInstance] Failed to get Firebase token:", err);
  }
  return config;
});

// ── Global response error handler ─────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url    = error.config?.url || "";

    if (process.env.NODE_ENV === "development") {
      // 404 on /loggedinuser is EXPECTED for brand-new users who haven't been
      // registered in MongoDB yet — suppress it so console stays clean.
      // Every other failure gets logged with the full URL for easy debugging.
      const isExpected404 = status === 404 && url.includes("/loggedinuser");

      if (!isExpected404) {
        console.error(
          `[axiosInstance] ${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${url}`,
          "→ status:", status,
          "→ data:",   error.response?.data
        );
      }
    }

    if (status === 401) {
      console.error("[axiosInstance] Unauthorized — token missing or expired");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;