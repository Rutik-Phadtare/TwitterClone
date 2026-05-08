export const TRIGGER_KEYWORDS = ["cricket", "science"];

// Request browser notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

// Check if notifications are enabled by user preference
export const areNotificationsEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  if (Notification.permission !== "granted") return false;
  return localStorage.getItem("twiller-notifications-enabled") !== "false";
};

// Send notification if tweet contains trigger keywords
export const sendTweetNotification = (content: string, author: string) => {
  if (!areNotificationsEnabled()) return;
  if (!content) return;

  const lower = content.toLowerCase();
  const matched = TRIGGER_KEYWORDS.find(k => lower.includes(k.toLowerCase()));
  if (!matched) return;

  const notification = new Notification(`🔔 Trending: ${matched}`, {
    body: `${author}: ${content.slice(0, 120)}${content.length > 120 ? "…" : ""}`,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: `tweet-${matched}-${Date.now()}`,
    requireInteraction: false,
  });

  // Auto-close after 5 seconds
  setTimeout(() => notification.close(), 5000);

  // Click navigates to app
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};