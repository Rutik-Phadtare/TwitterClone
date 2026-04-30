export const TRIGGER_KEYWORDS = ["cricket", "science"];

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

export const sendTweetNotification = (content: string) => {
  if (Notification.permission !== "granted") return;
  const pref = localStorage.getItem("notifications-enabled");
  if (pref === "false") return;
  const lower = content.toLowerCase();
  const matched = TRIGGER_KEYWORDS.find(k => lower.includes(k));
  if (!matched) return;
  new Notification("Trending tweet", {
    body: content.slice(0, 120),
    icon: "/favicon.ico",
    tag: `tweet-${Date.now()}`,
  });
};