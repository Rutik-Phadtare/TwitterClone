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
import OtpVerificationModal from "../OtpVerificationModal";
import { Home, Search, Bell, User, Star } from "lucide-react";

const MOBILE_NAV = [
  { page: "home",          icon: Home,   label: "Home" },
  { page: "explore",       icon: Search, label: "Explore" },
  { page: "notifications", icon: Bell,   label: "Alerts" },
  { page: "profile",       icon: User,   label: "Profile" },
  { page: "subscription",  icon: Star,   label: "Premium" },
];

const BOTTOM_NAV_STYLES = `
  @keyframes bn-fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .bn-root {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 58px;
    background: rgba(0,0,0,0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    justify-content: space-around;
    z-index: 100;
    padding: 0 4px;
    animation: bn-fadeIn 0.3s ease both;
  }

  /* ── Hide mobile nav on desktop ── */
  @media (min-width: 768px) {
    .bn-root {
      display: none !important;
    }
  }

  .bn-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 6px 10px;
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.4);
    cursor: pointer;
    border-radius: 12px;
    transition: color 0.15s ease, background 0.15s ease, transform 0.15s ease;
    min-width: 52px;
    flex: 1;
  }
  .bn-btn:active { transform: scale(0.9); }
  .bn-btn.active { color: #1d9bf0; }
  .bn-btn.active .bn-icon-wrap { background: rgba(29,155,240,0.12); }
  .bn-icon-wrap {
    width: 32px; height: 32px;
    border-radius: 9999px;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s ease;
  }
  .bn-btn:not(.active):hover { color: rgba(255,255,255,0.75); }
  .bn-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2px;
    font-family: 'DM Sans', sans-serif;
    line-height: 1;
  }
`;

// ─── Props ────────────────────────────────────────────────────────────────────
interface MainlayoutProps {
  children: React.ReactNode;
}

const Mainlayout = ({ children }: MainlayoutProps) => {
  const { user, isLoading, showOtpModal, dismissOtpModal, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#fff", fontSize: 36, fontWeight: 800, marginBottom: 16 }}>X</div>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) return <>{children}</>;

  const renderPage = () => {
    switch (currentPage) {
      case "profile":       return <ProfilePage />;
      case "explore":       return <ExplorePage />;
      case "notifications": return <NotificationsPage />;
      case "messages":      return <MessagesPage />;
      case "bookmarks":     return <BookmarksPage />;
      case "subscription":  return <SubscriptionPage />;
      default:              return <>{children}</>;
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BOTTOM_NAV_STYLES }} />

      <div style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        justifyContent: "center",
      }}>
        {/* ── Desktop left sidebar ── */}
        <div
          style={{
            flexShrink: 0,
            borderRight: "1px solid rgba(255,255,255,0.08)",
            position: "sticky",
            top: 0,
            height: "100vh",
          }}
          className="hidden md:block md:w-64 lg:w-72"
        >
          <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        </div>

        {/* ── Main content ── */}
        <main
          style={{
            flex: 1,
            maxWidth: 600,
            borderLeft:  "1px solid rgba(255,255,255,0.08)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            minHeight: "100vh",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
          className="pb-16 md:pb-0"
        >
          {renderPage()}
        </main>

        {/* ── Desktop right sidebar ── */}
        <div
          style={{
            flexShrink: 0,
            padding: "12px 16px",
            position: "sticky",
            top: 0,
            height: "100vh",
          }}
          className="hidden lg:block lg:w-80"
        >
          <RightSidebar onNavigate={setCurrentPage} />
        </div>
      </div>

      {/* ── Mobile bottom nav (hidden on desktop) ── */}
      <nav className="bn-root md:hidden">
        {MOBILE_NAV.map(item => (
          <button
            key={item.page}
            className={`bn-btn${currentPage === item.page ? " active" : ""}`}
            onClick={() => setCurrentPage(item.page)}
          >
            <div className="bn-icon-wrap">
              <item.icon size={20} strokeWidth={currentPage === item.page ? 2.5 : 2} />
            </div>
            <span className="bn-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ── OTP verification modal ── */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={dismissOtpModal}
        onLogout={async () => { await logout(); dismissOtpModal(); }}
      />
    </>
  );
};

export default Mainlayout;