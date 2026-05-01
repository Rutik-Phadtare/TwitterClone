"use client";
import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";
import LoadingSpinner from "../loading-spinner";
import Sidebar from "./Sidebar";
import RightSidebar from "./Rightsidebar";
import ProfilePage from "../ProfilePage";
import ExplorePage from "../pages/ExplorePage";
import NotificationsPage from "../pages/NotificationsPage";
import MessagesPage from "../pages/MessagesPage";
import BookmarksPage from "../pages/BookmarksPage";
import SubscriptionPage from "../pages/SubscriptionPage";

const Mainlayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-4xl font-bold mb-4">X</div>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) return <>{children}</>;

  const renderPage = () => {
    switch (currentPage) {
      case "profile":      return <ProfilePage />;
      case "explore":      return <ExplorePage />;
      case "notifications":return <NotificationsPage />;
      case "messages":     return <MessagesPage />;
      case "bookmarks":    return <BookmarksPage />;
      case "subscription": return <SubscriptionPage />;
      default:             return <>{children}</>;  // home → Feed
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div className="w-20 sm:w-24 md:w-64 border-r border-gray-800">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      </div>
      <main className="flex-1 max-w-2xl border-x border-gray-800">
        {renderPage()}
      </main>
      <div className="hidden lg:block w-80 p-4">
        <RightSidebar onNavigate={setCurrentPage} />
      </div>
    </div>
  );
};

export default Mainlayout;