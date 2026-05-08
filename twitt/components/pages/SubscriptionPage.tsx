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
  planId, amount, onPay, onClose, processing,
}: {
  planId: string; amount: number;
  onPay: () => void; onClose: () => void; processing: boolean;
}) {
  const amountDisplay = (amount / 100).toLocaleString("en-IN");

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
      animation: "fadeIn 0.2s ease",
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin   { to { transform: rotate(360deg) } }
      `}</style>

      <div style={{
        background: "#0f0f0f",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        width: "100%", maxWidth: 400,
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* ── Red top bar ── */}
        <div style={{
          background: "linear-gradient(90deg, #c0392b, #e74c3c)",
          padding: "14px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Razorpay logo-style text */}
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 900, color: "#fff",
            }}>R</div>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}>
              Razorpay
            </span>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none",
            borderRadius: "50%", width: 28, height: 28,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff", fontSize: 16, lineHeight: 1,
          }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "28px 24px 24px" }}>

          {/* Icon */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 26,
            }}>⚠️</div>
          </div>

          {/* Title */}
          <h2 style={{
            color: "#fff", fontSize: 18, fontWeight: 800,
            textAlign: "center", margin: "0 0 10px",
          }}>
            Razorpay Payment Restriction
          </h2>

          {/* Description */}
          <p style={{
            color: "rgba(255,255,255,0.5)", fontSize: 14,
            textAlign: "center", lineHeight: 1.6, margin: "0 0 10px",
          }}>
            Razorpay restricts live domains in test mode.
          </p>

          {/* Info box */}
          <div style={{
            background: "rgba(29,155,240,0.08)",
            border: "1px solid rgba(29,155,240,0.2)",
            borderRadius: 12, padding: "12px 16px",
            marginBottom: 24,
          }}>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              Your <strong style={{ color: "#1d9bf0" }}>₹{amountDisplay} · {planId}</strong> plan payment will be processed directly through our system — subscription activates instantly.
            </p>
          </div>

          {/* Pay button */}
          <button
            onClick={onPay}
            disabled={processing}
            style={{
              width: "100%", padding: "13px 0",
              borderRadius: 9999, border: "none",
              background: processing ? "rgba(29,155,240,0.5)" : "#1d9bf0",
              color: "#fff", fontWeight: 700, fontSize: 15,
              cursor: processing ? "default" : "pointer",
              marginBottom: 12,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "background 0.2s, transform 0.15s",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => { if (!processing) e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {processing ? (
              <>
                <div style={{
                  width: 15, height: 15, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid #fff",
                  animation: "spin 0.7s linear infinite",
                }} />
                Processing…
              </>
            ) : `Proceed with Demo Payment · ₹${amountDisplay}`}
          </button>

          {/* Go back */}
          <button
            onClick={onClose}
            disabled={processing}
            style={{
              width: "100%", padding: "10px 0",
              background: "none", border: "none",
              color: "rgba(255,255,255,0.35)", fontSize: 14,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
          >
            Go Back
          </button>
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