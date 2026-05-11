export const ALL_CATEGORIES = [
  { id: "cricket",    label: "Cricket",    emoji: "🏏" },
  { id: "science",    label: "Science",    emoji: "🔬" },
  { id: "football",   label: "Football",   emoji: "⚽" },
  { id: "politics",   label: "Politics",   emoji: "🏛️" },
  { id: "news",       label: "News",       emoji: "📰" },
  { id: "math",       label: "Math",       emoji: "📐" },
  { id: "technology", label: "Technology", emoji: "💻" },
  { id: "health",     label: "Health",     emoji: "💊" },
];

const CATEGORIES_KEY    = "twiller-selected-categories";
const SEEN_TWEETS_KEY   = "twiller-seen-tweet-notifications";
const NOTIF_ENABLED_KEY = "twiller-notifications-enabled";
export const NOTIF_COUNT_KEY = "twiller-notification-count"; // ← shared with Sidebar

// ── Category preferences ──────────────────────────────────────────────────────

export const getSelectedCategories = (): string[] => {
  if (typeof window === "undefined") return ["cricket", "science"];
  try {
    const saved = localStorage.getItem(CATEGORIES_KEY);
    if (!saved) return ["cricket", "science"];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length >= 2 ? parsed : ["cricket", "science"];
  } catch {
    return ["cricket", "science"];
  }
};

export const setSelectedCategories = (cats: string[]): boolean => {
  if (cats.length < 2) return false;
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
  return true;
};

// ── Notification count (for sidebar badge) ────────────────────────────────────

export const getNotificationCount = (): number => {
  try {
    return parseInt(localStorage.getItem(NOTIF_COUNT_KEY) || "0", 10);
  } catch { return 0; }
};

export const setNotificationCount = (count: number) => {
  localStorage.setItem(NOTIF_COUNT_KEY, count.toString());
  // Dispatch so Sidebar picks it up immediately in the same tab
  window.dispatchEvent(new StorageEvent("storage", {
    key:      NOTIF_COUNT_KEY,
    newValue: count.toString(),
  }));
};

// ── Seen tweet deduplication ──────────────────────────────────────────────────

const getSeenTweets = (): Set<string> => {
  try {
    const saved = localStorage.getItem(SEEN_TWEETS_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch { return new Set(); }
};

const markTweetSeen = (tweetId: string) => {
  const seen = getSeenTweets();
  seen.add(tweetId);
  localStorage.setItem(SEEN_TWEETS_KEY, JSON.stringify(Array.from(seen).slice(-500)));
};

export const hasTweetBeenNotified = (tweetId: string): boolean =>
  getSeenTweets().has(tweetId);

// ── Permission helpers ────────────────────────────────────────────────────────

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied")  return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

export const areNotificationsEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;
  return localStorage.getItem(NOTIF_ENABLED_KEY) !== "false";
};

// ── Hashtag matcher — only matches #keyword (not bare words) ─────────────────

export const getMatchingCategory = (content: string): string | null => {
  if (!content) return null;
  const lower    = content.toLowerCase();
  const selected = getSelectedCategories();
  // Must be prefixed with # e.g. #news #cricket
  const matched  = ALL_CATEGORIES.find(
    cat => selected.includes(cat.id) && lower.includes(`#${cat.id}`)
  );
  return matched?.id || null;
};

// ── Main send function ────────────────────────────────────────────────────────

export const sendTweetNotification = (tweetId: string, content: string, author: string) => {
  if (!areNotificationsEnabled()) return;
  if (hasTweetBeenNotified(tweetId)) return;

  const matched = getMatchingCategory(content);
  if (!matched) return;

  const cat = ALL_CATEGORIES.find(c => c.id === matched);

  const notification = new Notification(
    `${cat?.emoji || "🔔"} Trending: #${matched}`,
    {
      body:               `${author}: ${content.slice(0, 120)}${content.length > 120 ? "…" : ""}`,
      icon:               "/favicon.ico",
      badge:              "/favicon.ico",
      tag:                `tweet-${tweetId}`,
      requireInteraction: false,
    }
  );

  markTweetSeen(tweetId);
  setTimeout(() => notification.close(), 5000);
  notification.onclick = () => { window.focus(); notification.close(); };
};