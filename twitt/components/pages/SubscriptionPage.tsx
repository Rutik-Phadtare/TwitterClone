"use client";
import React, { useState, useEffect } from "react";
import { Check, Zap, Star, Crown, AlertCircle, Clock } from "lucide-react";
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

export default function SubscriptionPage() {
  const [current, setCurrent]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [paying, setPaying]       = useState<string | null>(null);
  const [timeError, setTimeError] = useState("");

  useEffect(() => {
    axiosInstance.get("/subscription").then(res => setCurrent(res.data)).finally(() => setLoading(false));
    if (!document.getElementById("razorpay-script")) {
      const s   = document.createElement("script");
      s.id      = "razorpay-script";
      s.src     = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(s);
    }
  }, []);

  const [demoModal, setDemoModal] = useState<{ open: boolean; planId: string; amount: number } | null>(null);
const [demoProcessing, setDemoProcessing] = useState(false);

const handleSubscribe = async (planId: string) => {
  if (planId === "free") return;
  setPaying(planId);
  setTimeError("");

  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  try {
    const orderRes = await axiosInstance.post("/create-order", { plan: planId });
    const { amount } = orderRes.data;

    if (isDemo) {
      // Show our fake Razorpay-style popup
      setPaying(null);
      setDemoModal({ open: true, planId, amount });
      return;
    }

    // Real Razorpay flow (works on localhost)
    const options = {
      key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount,
      currency:    "INR",
      name:        "Twiller",
      description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
      order_id:    orderRes.data.orderId,
      handler: async (response: any) => {
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
      prefill: { email: "" },
      theme:   { color: "#1d9bf0" },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err: any) {
    const msg = err.response?.data?.error;
    setTimeError(msg || "Something went wrong. Please try again.");
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
            {/* Row 1: label */}
            <p style={{
              color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 6px",
              textTransform: "uppercase", letterSpacing: 1,
            }}>Current plan</p>

            {/* Row 2: plan name */}
            <p style={{
              color: "#1d9bf0", fontSize: 20, fontWeight: 800, margin: "0 0 14px",
              textTransform: "capitalize",
            }}>
              {current.plan || "Free"}
            </p>

            {current.plan === "gold" ? (
              /* ── Gold: unlimited banner ── */
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)",
                borderRadius: 10, padding: "10px 14px",
              }}>
                <Crown size={15} color="#FFD700" />
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, margin: 0 }}>
                  You have <strong style={{ color: "#FFD700" }}>unlimited</strong> tweets access
                </p>
              </div>
            ) : (
              /* ── Other plans: count + progress bar ── */
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>
                    Tweets used
                  </p>
                  <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, margin: 0 }}>
                    {used}&nbsp;/&nbsp;{limit === -1 ? "∞" : limit}
                  </p>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 9999 }}>
                  <div style={{
                    height: "100%", borderRadius: 9999,
                    width: `${pct}%`,
                    background: pct >= 100 ? "#ef4444" : "#1d9bf0",
                    transition: "width 0.4s ease",
                  }} />
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
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10, padding: "10px 14px", marginBottom: 28,
        }}>
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
              /* Outer wrapper gives space for the "MOST POPULAR" chip above the card */
              <div key={plan.id} style={{ paddingTop: plan.popular ? 16 : 0, position: "relative" }}>

                {/* Most popular chip — sits above the card border */}
                {plan.popular && (
                  <div style={{
                    position: "absolute", top: 0, left: "50%",
                    transform: "translateX(-50%)",
                    background: "#1d9bf0", color: "#fff",
                    fontSize: 10, fontWeight: 800, letterSpacing: 1,
                    padding: "3px 16px", borderRadius: 9999,
                    whiteSpace: "nowrap", zIndex: 1,
                  }}>
                    MOST POPULAR
                  </div>
                )}

                <div style={{
                  background: plan.color,
                  border: `1px solid ${isActive ? "#1d9bf0" : plan.border}`,
                  borderRadius: 18,
                  padding: "20px 22px",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: isActive ? "0 0 0 1px rgba(29,155,240,0.3)" : "none",
                }}>

                  {/* ── Card header: icon+name  |  price ── */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>

                    {/* Icon bubble */}
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                      background: plan.iconBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {plan.icon}
                    </div>

                    {/* Name + limit + CURRENT tag stacked */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <p style={{ color: "#fff", fontWeight: 800, fontSize: 17, margin: 0 }}>
                          {plan.name}
                        </p>
                        {isActive && (
                          <span style={{
                            background: "rgba(29,155,240,0.15)", border: "1px solid rgba(29,155,240,0.5)",
                            color: "#1d9bf0", fontSize: 10, fontWeight: 700,
                            padding: "2px 9px", borderRadius: 9999, letterSpacing: 0.5,
                            lineHeight: 1.6,
                          }}>
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "2px 0 0" }}>
                        {plan.limit}
                      </p>
                    </div>

                    {/* Price — isolated on the right, no absolute positioning */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {plan.price === 0 ? (
                        <p style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: 0 }}>Free</p>
                      ) : (
                        <>
                          <p style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: 0 }}>
                            ₹{plan.price}
                          </p>
                          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "1px 0 0" }}>
                            /month
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }} />

                  {/* Features */}
                  <ul style={{
                    margin: "0 0 16px", padding: 0, listStyle: "none",
                    display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    {plan.features.map(f => (
                      <li key={f} style={{
                        display: "flex", alignItems: "center", gap: 9,
                        color: "rgba(255,255,255,0.75)", fontSize: 14,
                      }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                          background: "rgba(29,155,240,0.12)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Check size={11} color="#1d9bf0" strokeWidth={3} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA button */}
                  {plan.id !== "free" && (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isActive || isLoading}
                      style={{
                        width: "100%", padding: "11px 0", borderRadius: 9999,
                        border: isActive ? "1px solid rgba(255,255,255,0.1)" : "none",
                        fontWeight: 700, fontSize: 15,
                        cursor: isActive || isLoading ? "default" : "pointer",
                        background: isActive
                          ? "rgba(255,255,255,0.05)"
                          : isLoading
                          ? "rgba(29,155,240,0.6)"
                          : "#1d9bf0",
                        color: isActive ? "rgba(255,255,255,0.3)" : "#fff",
                        transition: "background 0.2s, transform 0.15s",
                        fontFamily: "'DM Sans', sans-serif",
                        letterSpacing: 0.2,
                      }}
                      onMouseEnter={e => {
                        if (!isActive && !isLoading)
                          (e.currentTarget.style.transform = "scale(1.015)");
                      }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                    >
                      {isLoading ? "Processing…" : isActive ? "Current plan" : `Upgrade to ${plan.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* ── Demo Razorpay Modal ── */}
{demoModal?.open && (
  <div style={{
    position: "fixed", inset: 0, zIndex: 999,
    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 16px",
  }}>
    <div style={{
      background: "#fff", borderRadius: 16, width: "100%", maxWidth: 380,
      overflow: "hidden", fontFamily: "sans-serif",
    }}>
      {/* Razorpay-style header */}
      <div style={{ background: "#1d9bf0", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, color: "#1d9bf0", fontSize: 18,
        }}>T</div>
        <div>
          <p style={{ color: "#fff", fontWeight: 700, margin: 0, fontSize: 16 }}>Twiller</p>
          <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: 13 }}>
            ₹{(demoModal.amount / 100).toLocaleString("en-IN")} · {demoModal.planId} Plan
          </p>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Test mode notice */}
        <div style={{
          background: "#fff8e1", border: "1px solid #ffe082",
          borderRadius: 8, padding: "10px 14px", marginBottom: 16,
          fontSize: 13, color: "#795548",
        }}>
          🧪 <strong>Test Mode</strong> — Razorpay restricts live domains in test mode.
          Your demo payment will be processed directly.
        </div>

        {/* Test card info */}
        <div style={{
          background: "#f5f5f5", borderRadius: 10, padding: "14px 16px", marginBottom: 20,
        }}>
          <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#333" }}>
            Test Card Details
          </p>
          {[
            ["Card Number", "4111 1111 1111 1111"],
            ["Expiry",      "Any future date"],
            ["CVV",         "Any 3 digits"],
            ["OTP",         "Any 6 digits"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#888", fontSize: 13 }}>{label}</span>
              <span style={{ color: "#333", fontWeight: 600, fontSize: 13 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <button
          onClick={handleDemoPayment}
          disabled={demoProcessing}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 9999, border: "none",
            background: demoProcessing ? "#90caf9" : "#1d9bf0",
            color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer",
            marginBottom: 10,
          }}
        >
          {demoProcessing ? "Processing…" : `Pay ₹${(demoModal.amount / 100).toLocaleString("en-IN")}`}
        </button>
        <button
          onClick={() => setDemoModal(null)}
          disabled={demoProcessing}
          style={{
            width: "100%", padding: "11px 0", borderRadius: 9999,
            border: "1px solid #e0e0e0", background: "#fff",
            color: "#666", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>

      <div style={{ textAlign: "center", padding: "0 0 14px", color: "#aaa", fontSize: 12 }}>
        🔒 Secured by <strong>Razorpay</strong>
      </div>
    </div>
  </div>
)}
    </div>
  );
}