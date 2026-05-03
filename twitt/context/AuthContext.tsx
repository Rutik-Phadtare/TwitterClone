"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "./firebase";
import axiosInstance from "../lib/axiosInstance";

interface User {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  banner: string;
  bio?: string;
  joinedDate: string;
  email: string;
  website: string;
  location: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  updateProfile: (profileData: {
    displayName: string; bio: string; location: string; website: string; avatar: string;
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  googlesignin: () => void;
  requiresOtp: boolean;
  clearOtpRequirement: () => void;
  showOtpModal: boolean;
  dismissOtpModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

const DEFAULT_AVATAR =
  "https://as1.ftcdn.net/jpg/03/91/19/22/1000_F_391192211_2w5pQpFV1aozYQhcIw3FqA35vuTxJKrB.webp";

const persistUser = (u: User | null) => {
  if (u) localStorage.setItem("twitter-user", JSON.stringify(u));
  else   localStorage.removeItem("twitter-user");
};

const readCachedUser = (): User | null => {
  try {
    const raw = localStorage.getItem("twitter-user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?._id ? (parsed as User) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]               = useState<User | null>(readCachedUser);
  const [isLoading, setIsLoading]     = useState(true);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false); // ← NEW

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser?.email) {
        try {
          const res = await axiosInstance.get("/loggedinuser");
          if (res.data?._id) {
            setUser(res.data);
            persistUser(res.data);
          }
        } catch (err: any) {
          if (err.response?.status !== 404) {
            console.error("[AuthContext] Failed to fetch user on auth change:", err);
          }
        }
      } else {
        setUser(null);
        persistUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Record login event + trigger OTP modal if Chrome ─────────────────────
  const recordLogin = async () => {
    try {
      const res = await axiosInstance.post("/login-event");
      if (res.data.requiresOtp) {
        await axiosInstance.post("/send-otp");
        setRequiresOtp(true);
        setShowOtpModal(true); // ← show modal
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        await signOut(auth);
        setUser(null);
        persistUser(null);
        alert(err.response.data.error);
      } else {
        console.error("[AuthContext] Login event error:", err);
      }
    }
  };

  const clearOtpRequirement = () => setRequiresOtp(false);
  const dismissOtpModal     = () => {
    setShowOtpModal(false);
    setRequiresOtp(false);
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await recordLogin();
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error.message || "Login failed");
    }
  };

  // ── Signup ─────────────────────────────────────────────────────────────────
  const signup = async (
    email: string, password: string, username: string, displayName: string
  ) => {
    setIsLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const res = await axiosInstance.post("/register", {
        username,
        displayName,
        avatar: userCred.user.photoURL || DEFAULT_AVATAR,
        email:  userCred.user.email,
      });
      if (res.data?._id) {
        setUser(res.data);
        persistUser(res.data);
      }
      await recordLogin();
    } catch (error: any) {
      throw new Error(error.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    setUser(null);
    setRequiresOtp(false);
    setShowOtpModal(false);
    persistUser(null);
    await signOut(auth);
  };

  // ── Update profile ─────────────────────────────────────────────────────────
  const updateProfile = async (profileData: {
    displayName: string; bio: string; location: string; website: string; avatar: string;
  }) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await axiosInstance.patch(`/userupdate/${user.email}`, profileData);
      if (res.data?._id) {
        setUser(res.data);
        persistUser(res.data);
      }
    } catch (error: any) {
      throw new Error(error.message || "Profile update failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google sign-in ─────────────────────────────────────────────────────────
  const googlesignin = async () => {
    setIsLoading(true);
    try {
      const provider     = new GoogleAuthProvider();
      const result       = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      if (!firebaseUser?.email) throw new Error("No email from Google account");

      let userData: User | null = null;

      try {
        const res = await axiosInstance.get("/loggedinuser");
        userData = res.data;
      } catch (err: any) {
        if (err.response?.status !== 404) throw err;
      }

      if (!userData) {
        const res = await axiosInstance.post("/register", {
          username:    firebaseUser.email.split("@")[0],
          displayName: firebaseUser.displayName || "User",
          avatar:      firebaseUser.photoURL    || DEFAULT_AVATAR,
          banner:      firebaseUser.photoURL    || DEFAULT_AVATAR,
          email:       firebaseUser.email,
        });
        userData = res.data;
      }

      if (userData?._id) {
        setUser(userData);
        persistUser(userData);
      } else {
        throw new Error("No user data returned from server");
      }

      await recordLogin();
    } catch (error: any) {
      console.error("[AuthContext] Google Sign-In Error:", error);
      alert(error.response?.data?.message || error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, login, signup, updateProfile, logout,
      isLoading, googlesignin,
      requiresOtp, clearOtpRequirement,
      showOtpModal, dismissOtpModal,
    }}>
      {children}
    </AuthContext.Provider>
  );
};