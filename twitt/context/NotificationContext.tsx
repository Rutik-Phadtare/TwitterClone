"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { ALL_CATEGORIES, getSelectedCategories } from "@/lib/notificationUtils";

const LAST_READ_KEY = "twiller-notif-last-read";

interface NotificationContextType {
  count:      number;
  markAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  count:      0,
  markAsRead: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const lastRead = parseInt(localStorage.getItem(LAST_READ_KEY) || "0", 10);
      const cats     = getSelectedCategories();
      const res      = await axiosInstance.get("/post");
      const tweets   = res.data.tweets ?? [];

      const matched = tweets.filter((tweet: any) => {
        const content   = (tweet.content || "").toLowerCase();
        const tweetTime = new Date(tweet.timestamp).getTime();
        if (tweetTime <= lastRead) return false;
        return ALL_CATEGORIES.some(c => cats.includes(c.id) && content.includes(`#${c.id}`));
      });

      setCount(matched.length);
    } catch {}
  }, []);

  const markAsRead = useCallback(() => {
    localStorage.setItem(LAST_READ_KEY, Date.now().toString());
    setCount(0);
  }, []);

  useEffect(() => {
    fetchCount();                                              // run immediately on app load
    pollRef.current = setInterval(fetchCount, 30_000);        // then every 30s
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchCount]);

  return (
    <NotificationContext.Provider value={{ count, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}