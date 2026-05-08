"use client";
import React, { useState, useEffect, useRef } from "react";
import { Check, Zap, Star, Crown, AlertCircle, Clock, X, ChevronRight, Wifi } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";

declare global { interface Window { Razorpay: any; } }

const PLANS = [
  {
    id:    "free",
    name:  "Free",
    price: 0,
    icon:  <Zap size={20} color="#fff" />,
    iconBg:"rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.03)",
    border:"rgba(255,255,255,0.1)",
    limit: "1 tweet / month",
    features: ["1 tweet per month", "Basic feed access", "Like & retweet"],
  },
  {
    id:    "bronze",
    name:  "Bronze",
    price: 100,
    icon:  <Star size={20} color="#cd7f32" />,
    iconBg:"rgba(205,127,50,0.15)",
    color: "rgba(205,127,50,0.05)",
    border:"rgba(205,127,50,0.4)",
    limit: "3 tweets / month",
    features: ["3 tweets per month", "Everything in Free", "Priority support"],
  },
  {
    id:    "silver",
    name:  "Silver",
    price: 300,
    icon:  <Star size={20} color="#C0C0C0" />,
    iconBg:"rgba(192,192,192,0.12)",
    color: "rgba(192,192,192,0.05)",
    border:"rgba(192,192,192,0.4)",
    limit: "5 tweets / month",
    features: ["5 tweets per month", "Everything in Bronze", "Profile badge"],
    popular: true,
  },
  {
    id:    "gold",
    name:  "Gold",
    price: 1000,
    icon:  <Crown size={20} color="#FFD700" />,
    iconBg:"rgba(255,215,0,0.12)",
    color: "rgba(255,215,0,0.04)",
    border:"rgba(255,215,0,0.4)",
    limit: "Unlimited tweets",
    features: ["Unlimited tweets", "Everything in Silver", "Verified badge", "Analytics"],
  },
];

// ── Razorpay-lookalike Demo Modal ─────────────────────────────────────────────
function RazorpayDemoModal({
  planId,
  amount,
  onPay,
  onClose,
  processing,
}: {
  planId: string;
  amount: number;
  onPay: () => void;
  onClose: () => void;
  processing: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"upi" | "cards" | "emi" | "netbanking" | "wallet" | "paylater">("cards");
  const amountDisplay = (amount / 100).toLocaleString("en-IN");

  const paymentMethods = [
    { id: "upi",        label: "UPI",          icons: ["🏦","💳","📱","💰"] },
    { id: "cards",      label: "Cards",        icons: ["💳","🔵","🔴","🟠"] },
    { id: "emi",        label: "EMI",          icons: ["📊","💹"] },
    { id: "netbanking", label: "Netbanking",   icons: ["🏛️","🏦","🦁","🐯"] },
    { id: "wallet",     label: "Wallet",       icons: ["👛","💚","🔵"] },
    { id: "paylater",   label: "Pay Later",    icons: ["⏰","🔶","✅"] },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", animation: "fadeIn 0.15s ease",
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .rzp-method:hover { background: #f0f4ff !important; }
        .rzp-pay-btn:hover:not(:disabled) { background: #3a7bd5 !important; }
      `}</style>

      <div style={{
        background: "#fff",
        borderRadius: 12,
        width: "100%",
        maxWidth: 740,
        minHeight: 480,
        display: "flex",
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>

        {/* ── LEFT PANEL (blue) ── */}
        <div style={{
          width: 260,
          minWidth: 260,
          background: "linear-gradient(160deg, #2563eb 0%, #1e40af 60%, #1e3a8a 100%)",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* background circle decorations */}
          <div style={{
            position: "absolute", bottom: -40, left: -40,
            width: 200, height: 200, borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }} />
          <div style={{
            position: "absolute", bottom: 40, right: -60,
            width: 160, height: 160, borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }} />

          {/* Merchant info */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, color: "#2563eb", fontSize: 20, flexShrink: 0,
            }}>T</div>
            <div>
              <p style={{ color: "#fff", fontWeight: 700, margin: 0, fontSize: 17, lineHeight: 1.2 }}>Twiller</p>
              <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: 12 }}>Subscription</p>
            </div>
          </div>

          {/* Price summary */}
          <div style={{
            background: "rgba(255,255,255,0.12)",
            borderRadius: 10, padding: "14px 16px", marginBottom: 16,
            backdropFilter: "blur(4px)",
          }}>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.8 }}>
              Price Summary
            </p>
            <p style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
              ₹{amountDisplay}
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "4px 0 0", textTransform: "capitalize" }}>
              {planId} Plan · 1 month
            </p>
          </div>

          {/* Phone */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(255,255,255,0.08)", borderRadius: 8,
            padding: "10px 12px", marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13 }}>👤</span>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: 0 }}>Using as</p>
                <p style={{ color: "#fff", fontSize: 12, fontWeight: 600, margin: 0 }}>+91 XXXXX XXXXX</p>
              </div>
            </div>
            <ChevronRight size={14} color="rgba(255,255,255,0.4)" />
          </div>

          {/* Test Mode Warning */}
          <div style={{
            background: "rgba(251,191,36,0.15)",
            border: "1px solid rgba(251,191,36,0.35)",
            borderRadius: 8, padding: "10px 12px",
            marginBottom: "auto",
          }}>
            <p style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700, margin: "0 0 3px" }}>⚠️ TEST MODE</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: 0, lineHeight: 1.4 }}>
              Razorpay blocked this domain. Use the demo flow below.
            </p>
          </div>

          {/* Bottom branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 20 }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Secured by</span>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700 }}>Razorpay</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #f0f0f0",
          }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Payment Options</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4 }}>···</button>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4, display: "flex", alignItems: "center" }}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body: methods sidebar + content */}
          <div style={{ display: "flex", flex: 1 }}>

            {/* Methods list */}
            <div style={{ width: 160, borderRight: "1px solid #f0f0f0", padding: "8px 0" }}>
              {paymentMethods.map(m => (
                <button
                  key={m.id}
                  className="rzp-method"
                  onClick={() => setActiveTab(m.id as any)}
                  style={{
                    width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                    padding: "12px 16px",
                    background: activeTab === m.id ? "#f0f4ff" : "transparent",
                    borderRight: activeTab === m.id ? "2px solid #2563eb" : "2px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{
                    fontSize: 13, fontWeight: activeTab === m.id ? 600 : 400,
                    color: activeTab === m.id ? "#2563eb" : "#444",
                  }}>{m.label}</span>
                  <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                    {m.icons.map((ic, i) => <span key={i} style={{ fontSize: 9 }}>{ic}</span>)}
                  </div>
                </button>
              ))}
            </div>

            {/* Content area */}
            <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column" }}>

              {/* Cards tab (demo) */}
              {activeTab === "cards" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{
                    background: "#fffbeb", border: "1px solid #fde68a",
                    borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400e",
                  }}>
                    🧪 <strong>Test Mode</strong> — Real Razorpay blocked this domain. Clicking Pay below will activate your subscription directly.
                  </div>

                  {/* Card number */}
                  <div>
                    <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Card Number</label>
                    <div style={{
                      border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 14px",
                      fontSize: 15, fontFamily: "monospace", color: "#1a1a1a",
                      background: "#fafafa", letterSpacing: 2,
                    }}>4111 1111 1111 1111</div>
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Expiry</label>
                      <div style={{
                        border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 14px",
                        fontSize: 14, color: "#1a1a1a", background: "#fafafa",
                      }}>12 / 29</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>CVV</label>
                      <div style={{
                        border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 14px",
                        fontSize: 14, color: "#1a1a1a", background: "#fafafa",
                      }}>•••</div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Name on Card</label>
                    <div style={{
                      border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 14px",
                      fontSize: 14, color: "#1a1a1a", background: "#fafafa",
                    }}>Test User</div>
                  </div>

                  <button
                    className="rzp-pay-btn"
                    onClick={onPay}
                    disabled={processing}
                    style={{
                      width: "100%", padding: "13px 0", borderRadius: 8, border: "none",
                      background: processing ? "#93c5fd" : "#2563eb",
                      color: "#fff", fontWeight: 700, fontSize: 15,
                      cursor: processing ? "default" : "pointer",
                      marginTop: 4,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      transition: "background 0.2s",
                    }}
                  >
                    {processing ? (
                      <>
                        <div style={{
                          width: 16, height: 16, borderRadius: "50%",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTop: "2px solid #fff",
                          animation: "spin 0.7s linear infinite",
                        }} />
                        Processing…
                      </>
                    ) : `Pay ₹${amountDisplay}`}
                  </button>
                </div>
              )}

              {/* UPI tab */}
              {activeTab === "upi" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 12 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#333", margin: 0 }}>UPI QR Code</p>
                  {/* Fake QR */}
                  <div style={{
                    width: 140, height: 140, background: "#f5f5f5",
                    border: "1px solid #e0e0e0", borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#bbb", fontSize: 12, textAlign: "center", padding: 10,
                  }}>
                    QR not available<br/>in demo mode
                  </div>
                  <p style={{ color: "#888", fontSize: 13, textAlign: "center", margin: 0 }}>
                    Switch to <strong>Cards</strong> tab to complete the demo payment
                  </p>
                  <button
                    onClick={() => setActiveTab("cards")}
                    style={{
                      background: "#2563eb", color: "#fff", border: "none",
                      borderRadius: 8, padding: "10px 24px", fontWeight: 600,
                      fontSize: 14, cursor: "pointer",
                    }}
                  >Use Cards instead</button>
                </div>
              )}

              {/* Other tabs */}
              {!["cards","upi"].includes(activeTab) && (
                <div style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 12,
                }}>
                  <div style={{ fontSize: 40 }}>🚧</div>
                  <p style={{ color: "#666", fontSize: 14, textAlign: "center", margin: 0 }}>
                    This method is not available in demo mode.<br/>
                    <span
                      onClick={() => setActiveTab("cards")}
                      style={{ color: "#2563eb", cursor: "pointer", fontWeight: 600 }}
                    >
                      Use Cards tab instead →
                    </span>
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const [current, setCurrent]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [paying, setPaying]         = useState<string | null>(null);
  const [timeError, setTimeError]   = useState("");
  const [demoModal, setDemoModal]   = useState<{ open: boolean; planId: string; amount: number } | null>(null);
  const [demoProcessing, setDemoProcessing] = useState(false);
  const rzpScriptLoaded = useRef(false);

  useEffect(() => {
    // Load subscription
    axiosInstance.get("/subscription")
      .then(res => setCurrent(res.data))
      .finally(() => setLoading(false));

    // Preload Razorpay script immediately so it's ready when user clicks
    if (!document.getElementById("razorpay-script")) {
      const s   = document.createElement("script");
      s.id      = "razorpay-script";
      s.src     = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload  = () => { rzpScriptLoaded.current = true; };
      document.body.appendChild(s);
    } else {
      rzpScriptLoaded.current = true;
    }

    // ── Speed fix: pre-warm Render backend (free tier cold starts) ──
    // Ping a lightweight endpoint so it's awake before user clicks Pay
    axiosInstance.get("/").catch(() => {});
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return;
    setPaying(planId);
    setTimeError("");

    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    try {
      const orderRes = await axiosInstance.post("/create-order", { plan: planId });
      const { orderId, amount } = orderRes.data;

      let paymentSucceeded = false;

      const options = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency:    "INR",
        name:        "Twiller",
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
        order_id:    orderId,

        handler: async (response: any) => {
          // Real payment succeeded (works on localhost) ✅
          paymentSucceeded = true;
          try {
            await axiosInstance.post("/verify-payment", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              plan:                planId,
            });
            const sub = await axiosInstance.get("/subscription");
            setCurrent(sub.data);
            alert(`✅ ${planId} plan activated! Check your email for the invoice.`);
          } catch {
            alert("Payment verification failed. Contact support.");
          }
        },

        modal: {
          ondismiss: () => {
            // Razorpay closed without success — show demo fallback on deployed
            if (!paymentSucceeded && isDemo) {
              setDemoModal({ open: true, planId, amount });
            }
          },
        },

        prefill:  { email: "" },
        theme:    { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err: any) {
      const status = err.response?.status;
      const msg    = err.response?.data?.error;
      if (status === 403) {
        setTimeError(msg || "Payments only accepted 10AM–11AM IST");
      } else if (status === 401) {
        setTimeError("Please log in again to make a payment.");
      } else {
        setTimeError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setPaying(null);
    }
  };

  const handleDemoPayment = async () => {
    if (!demoModal) return;
    setDemoProcessing(true);
    try {
      await axiosInstance.post("/demo-payment", { plan: demoModal.planId });
      const sub = await axiosInstance.get("/subscription");
      setCurrent(sub.data);
      setDemoModal(null);
      alert(`✅ ${demoModal.planId} plan activated! Check your email for the invoice.`);
    } catch (err: any) {
      setTimeError(err.response?.data?.error || "Demo payment failed.");
      setDemoModal(null);
    } finally {
      setDemoProcessing(false);
    }
  };

  const used  = current?.tweetsUsed ?? 0;
  const limit = current?.tweetLimit ?? 1;
  const pct   = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#000", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(18px)",
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>
          Premium Plans
        </h1>
      </div>

      <div style={{ padding: "24px 20px", maxWidth: 640, margin: "0 auto" }}>

        {/* ── Error banner ── */}
        {timeError && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 12, padding: "14px 16px", marginBottom: 20,
          }}>
            <AlertCircle size={17} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: "#ef4444", margin: 0, fontSize: 14, lineHeight: 1.5 }}>{timeError}</p>
          </div>
        )}

        {/* ── Current plan card ── */}
        {!loading && current && (
          <div style={{
            background: "rgba(29,155,240,0.07)",
            border: "1px solid rgba(29,155,240,0.22)",
            borderRadius: 16, padding: "18px 20px", marginBottom: 20,
          }}>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>
              Current plan
            </p>
            <p style={{ color: "#1d9bf0", fontSize: 20, fontWeight: 800, margin: "0 0 14px", textTransform: "capitalize" }}>
              {current.plan || "Free"}
            </p>

            {current.plan === "gold" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 10, padding: "10px 14px" }}>
                <Crown size={15} color="#FFD700" />
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, margin: 0 }}>
                  You have <strong style={{ color: "#FFD700" }}>unlimited</strong> tweets access
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>Tweets used</p>
                  <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, margin: 0 }}>{used}&nbsp;/&nbsp;{limit === -1 ? "∞" : limit}</p>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 9999 }}>
                  <div style={{ height: "100%", borderRadius: 9999, width: `${pct}%`, background: pct >= 100 ? "#ef4444" : "#1d9bf0", transition: "width 0.4s ease" }} />
                </div>
              </>
            )}

            {current.expiresAt && (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "10px 0 0" }}>
                Expires: {new Date(current.expiresAt).toDateString()}
              </p>
            )}
          </div>
        )}

        {/* ── Time restriction notice ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px", marginBottom: 28 }}>
          <Clock size={13} color="rgba(255,255,255,0.35)" />
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: 0 }}>
            Payments accepted only between&nbsp;
            <strong style={{ color: "rgba(255,255,255,0.6)" }}>10:00 AM – 11:00 AM IST</strong>
          </p>
        </div>

        {/* ── Plan cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PLANS.map(plan => {
            const isActive  = current?.plan === plan.id || (!current && plan.id === "free");
            const isLoading = paying === plan.id;

            return (
              <div key={plan.id} style={{ paddingTop: plan.popular ? 16 : 0, position: "relative" }}>
                {plan.popular && (
                  <div style={{
                    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                    background: "#1d9bf0", color: "#fff",
                    fontSize: 10, fontWeight: 800, letterSpacing: 1,
                    padding: "3px 16px", borderRadius: 9999, whiteSpace: "nowrap", zIndex: 1,
                  }}>MOST POPULAR</div>
                )}
                <div style={{
                  background: plan.color,
                  border: `1px solid ${isActive ? "#1d9bf0" : plan.border}`,
                  borderRadius: 18, padding: "20px 22px",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: isActive ? "0 0 0 1px rgba(29,155,240,0.3)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, background: plan.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {plan.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <p style={{ color: "#fff", fontWeight: 800, fontSize: 17, margin: 0 }}>{plan.name}</p>
                        {isActive && (
                          <span style={{ background: "rgba(29,155,240,0.15)", border: "1px solid rgba(29,155,240,0.5)", color: "#1d9bf0", fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 9999, letterSpacing: 0.5, lineHeight: 1.6 }}>
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "2px 0 0" }}>{plan.limit}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {plan.price === 0 ? (
                        <p style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: 0 }}>Free</p>
                      ) : (
                        <>
                          <p style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: 0 }}>₹{plan.price}</p>
                          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "1px 0 0" }}>/month</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }} />
                  <ul style={{ margin: "0 0 16px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: 9, color: "rgba(255,255,255,0.75)", fontSize: 14 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, background: "rgba(29,155,240,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Check size={11} color="#1d9bf0" strokeWidth={3} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {plan.id !== "free" && (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isActive || isLoading}
                      style={{
                        width: "100%", padding: "11px 0", borderRadius: 9999,
                        border: isActive ? "1px solid rgba(255,255,255,0.1)" : "none",
                        fontWeight: 700, fontSize: 15,
                        cursor: isActive || isLoading ? "default" : "pointer",
                        background: isActive ? "rgba(255,255,255,0.05)" : isLoading ? "rgba(29,155,240,0.6)" : "#1d9bf0",
                        color: isActive ? "rgba(255,255,255,0.3)" : "#fff",
                        transition: "background 0.2s, transform 0.15s",
                        fontFamily: "'DM Sans', sans-serif",
                        letterSpacing: 0.2,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      }}
                      onMouseEnter={e => { if (!isActive && !isLoading) (e.currentTarget.style.transform = "scale(1.015)"); }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                    >
                      {isLoading ? (
                        <>
                          <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", animation: "spin 0.7s linear infinite" }} />
                          Connecting to Razorpay…
                        </>
                      ) : isActive ? "Current plan" : `Upgrade to ${plan.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Razorpay-lookalike Demo Modal ── */}
      {demoModal?.open && (
        <RazorpayDemoModal
          planId={demoModal.planId}
          amount={demoModal.amount}
          onPay={handleDemoPayment}
          onClose={() => setDemoModal(null)}
          processing={demoProcessing}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}