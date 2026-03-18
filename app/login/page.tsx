"use client";

import { supabase } from "@/lib/supabase";

const CINZEL = "var(--font-cinzel, 'Cinzel', Georgia, serif)";

const STARS = [
  { left: "8%",  top: "12%", size: 2, dur: 2.3, delay: 0.1 },
  { left: "15%", top: "28%", size: 3, dur: 3.8, delay: 0.7 },
  { left: "22%", top: "7%",  size: 2, dur: 4.5, delay: 1.2 },
  { left: "31%", top: "45%", size: 2, dur: 2.8, delay: 0.4 },
  { left: "38%", top: "18%", size: 3, dur: 3.1, delay: 1.8 },
  { left: "45%", top: "62%", size: 2, dur: 4.2, delay: 0.9 },
  { left: "52%", top: "9%",  size: 2, dur: 2.6, delay: 2.1 },
  { left: "59%", top: "35%", size: 3, dur: 3.5, delay: 0.3 },
  { left: "66%", top: "55%", size: 2, dur: 4.8, delay: 1.5 },
  { left: "73%", top: "14%", size: 2, dur: 2.4, delay: 0.6 },
  { left: "80%", top: "42%", size: 3, dur: 3.9, delay: 1.1 },
  { left: "87%", top: "22%", size: 2, dur: 4.1, delay: 2.4 },
  { left: "93%", top: "68%", size: 2, dur: 2.9, delay: 0.8 },
  { left: "5%",  top: "72%", size: 3, dur: 3.3, delay: 1.6 },
  { left: "12%", top: "55%", size: 2, dur: 4.6, delay: 0.2 },
  { left: "19%", top: "84%", size: 2, dur: 2.7, delay: 1.9 },
  { left: "27%", top: "91%", size: 3, dur: 3.7, delay: 0.5 },
  { left: "35%", top: "78%", size: 2, dur: 4.3, delay: 2.2 },
  { left: "43%", top: "88%", size: 2, dur: 2.5, delay: 1.3 },
  { left: "50%", top: "75%", size: 3, dur: 3.6, delay: 0.0 },
  { left: "57%", top: "92%", size: 2, dur: 4.9, delay: 1.7 },
  { left: "64%", top: "80%", size: 2, dur: 3.0, delay: 2.8 },
  { left: "71%", top: "70%", size: 3, dur: 2.2, delay: 1.0 },
  { left: "78%", top: "86%", size: 2, dur: 4.4, delay: 0.4 },
  { left: "90%", top: "48%", size: 2, dur: 3.2, delay: 2.0 },
];

const PARTICLES = [
  { left: "3%",  top: "5%",  size: 2, dur: 4.2, delay: 0.3 },
  { left: "10%", top: "18%", size: 1, dur: 5.8, delay: 1.1 },
  { left: "16%", top: "33%", size: 3, dur: 3.5, delay: 0.7 },
  { left: "23%", top: "10%", size: 1, dur: 6.2, delay: 2.0 },
  { left: "7%",  top: "50%", size: 2, dur: 4.8, delay: 0.5 },
  { left: "30%", top: "25%", size: 1, dur: 5.1, delay: 1.8 },
  { left: "37%", top: "58%", size: 2, dur: 3.9, delay: 0.2 },
  { left: "42%", top: "8%",  size: 1, dur: 6.7, delay: 1.4 },
  { left: "48%", top: "40%", size: 3, dur: 4.4, delay: 0.9 },
  { left: "55%", top: "15%", size: 1, dur: 5.5, delay: 2.3 },
  { left: "60%", top: "52%", size: 2, dur: 3.3, delay: 0.6 },
  { left: "67%", top: "30%", size: 1, dur: 6.0, delay: 1.2 },
  { left: "74%", top: "60%", size: 2, dur: 4.6, delay: 0.1 },
  { left: "80%", top: "10%", size: 1, dur: 5.3, delay: 2.5 },
  { left: "86%", top: "45%", size: 3, dur: 3.7, delay: 0.8 },
  { left: "92%", top: "20%", size: 1, dur: 6.4, delay: 1.6 },
  { left: "95%", top: "65%", size: 2, dur: 4.1, delay: 0.4 },
  { left: "14%", top: "68%", size: 1, dur: 5.9, delay: 2.1 },
  { left: "20%", top: "78%", size: 2, dur: 3.4, delay: 0.0 },
  { left: "28%", top: "88%", size: 1, dur: 6.6, delay: 1.3 },
  { left: "34%", top: "95%", size: 3, dur: 4.3, delay: 0.7 },
  { left: "40%", top: "72%", size: 1, dur: 5.2, delay: 2.4 },
  { left: "46%", top: "85%", size: 2, dur: 3.8, delay: 1.0 },
  { left: "53%", top: "93%", size: 1, dur: 6.1, delay: 0.3 },
  { left: "58%", top: "76%", size: 2, dur: 4.7, delay: 1.9 },
  { left: "65%", top: "88%", size: 1, dur: 5.6, delay: 0.5 },
  { left: "72%", top: "95%", size: 3, dur: 3.6, delay: 2.2 },
  { left: "78%", top: "72%", size: 1, dur: 6.3, delay: 1.5 },
  { left: "84%", top: "82%", size: 2, dur: 4.0, delay: 0.2 },
  { left: "90%", top: "90%", size: 1, dur: 5.4, delay: 1.7 },
  { left: "4%",  top: "38%", size: 2, dur: 4.5, delay: 2.6 },
  { left: "11%", top: "44%", size: 1, dur: 3.1, delay: 0.9 },
  { left: "25%", top: "52%", size: 2, dur: 5.0, delay: 1.1 },
  { left: "33%", top: "65%", size: 1, dur: 6.5, delay: 0.4 },
  { left: "50%", top: "55%", size: 3, dur: 4.9, delay: 2.7 },
  { left: "62%", top: "42%", size: 1, dur: 3.2, delay: 1.6 },
  { left: "69%", top: "48%", size: 2, dur: 5.7, delay: 0.8 },
  { left: "76%", top: "35%", size: 1, dur: 4.2, delay: 2.0 },
  { left: "88%", top: "55%", size: 2, dur: 3.5, delay: 1.3 },
  { left: "96%", top: "38%", size: 1, dur: 6.8, delay: 0.6 },
];

export default function LoginPage() {
  return (
    <main className="login-main" style={{ background: "linear-gradient(180deg, #0D0D1F 0%, #060610 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flicker { 0%,100% { opacity: 0.1; } 50% { opacity: 0.8; } }
        @keyframes goldOrb1 { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.4; } 50% { transform: translate(-50%,-50%) scale(1.15); opacity: 0.8; } }
        @keyframes goldOrb2 { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.4; } 50% { transform: translate(-50%,-50%) scale(1.15); opacity: 0.8; } }
        @keyframes goldOrb3 { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.2; } 50% { transform: translate(-50%,-50%) scale(1.15); opacity: 0.4; } }
        @keyframes goldFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes logoFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes glowPulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.18; } 50% { transform: translate(-50%,-50%) scale(1.12); opacity: 0.32; } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .google-btn:hover { border-color: rgba(201,168,76,0.7) !important; box-shadow: 0 0 40px rgba(201,168,76,0.2) !important; transform: scale(1.02); }
        .google-btn { transition: all 0.2s ease; position: relative; overflow: hidden; }
        .shimmer-overlay { position: absolute; inset: 0; border-radius: 16px; background: linear-gradient(90deg, transparent 0%, rgba(255,220,100,0.18) 50%, transparent 100%); background-size: 200% auto; animation: shimmer 3s linear infinite; pointer-events: none; }
        .logo-wrap { width: 200px; height: 200px; }
        .title { font-size: 64px; }
        .login-main { min-height: 100vh; min-height: 100dvh; padding: 0 32px; }
        .btn-wrap { width: 100%; max-width: 340px; }
        @media (max-width: 400px) {
          .logo-wrap { width: 150px; height: 150px; }
          .title { font-size: 48px; }
          .login-main { padding: 0 20px; }
        }
        @media (max-height: 680px) {
          .logo-wrap { width: 140px; height: 140px; }
          .title { font-size: 44px; }
        }
      `}</style>

      {/* Stars */}
      {STARS.map((s, i) => (
        <div key={i} style={{
          position: "absolute", left: s.left, top: s.top,
          width: s.size, height: s.size, borderRadius: "50%",
          backgroundColor: "#ffffff", pointerEvents: "none",
          animation: `flicker ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }} />
      ))}

      {/* Gold particles */}
      {PARTICLES.map((p, i) => (
        <div key={`p${i}`} style={{
          position: "absolute", left: p.left, top: p.top,
          width: p.size, height: p.size, borderRadius: "50%",
          backgroundColor: "rgba(201,168,76,0.6)", pointerEvents: "none",
          animation: `goldFloat ${p.dur}s ${p.delay}s ease-in-out infinite`,
        }} />
      ))}

      {/* Gold orb 500px — centered on logo */}
      <div style={{ position: "absolute", top: "42%", left: "50%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)", animation: "goldOrb1 6s ease-in-out infinite", pointerEvents: "none" }} />
      {/* Gold orb 280px — offset 60px left, 40px down */}
      <div style={{ position: "absolute", top: "calc(42% + 40px)", left: "calc(50% - 60px)", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)", animation: "goldOrb2 4s 2s ease-in-out infinite", pointerEvents: "none" }} />
      {/* Gold orb 680px — half opacity */}
      <div style={{ position: "absolute", top: "42%", left: "50%", width: 680, height: 680, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)", animation: "goldOrb3 8s 1s ease-in-out infinite", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 56, zIndex: 1 }}>
        {/* Logo image — fadeUp wrapper */}
        <div style={{ animation: "fadeUp 0.5s 0s ease-out both", marginBottom: 4 }}>
          {/* Float wrapper */}
          <div className="logo-wrap" style={{ animation: "logoFloat 4s ease-in-out infinite" }}>
            <div className="logo-wrap" style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)", pointerEvents: "none", animation: "glowPulse 4s ease-in-out infinite" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/habitrise-icon.png" alt="HabitRise" style={{
                width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1,
                filter: "drop-shadow(0 0 30px rgba(201,168,76,0.9)) drop-shadow(0 0 60px rgba(201,168,76,0.6)) drop-shadow(0 0 120px rgba(201,168,76,0.4))",
              }} />
            </div>
          </div>
        </div>
        <h1 className="title" style={{ fontFamily: CINZEL, fontWeight: 900, color: "#C9A84C", letterSpacing: "0.14em", lineHeight: 1, margin: 0, textShadow: "0 0 40px rgba(201,168,76,0.55)", animation: "fadeUp 0.5s 0.2s ease-out both" }}>
          HabitRise
        </h1>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.45em", textTransform: "uppercase", color: "#C9A84C", opacity: 0.35, animation: "fadeUp 0.5s 0.4s ease-out both" }}>
          Rise Every Day
        </span>
      </div>

      {/* Google button */}
      <div className="btn-wrap" style={{ animation: "fadeUp 0.5s 0.6s ease-out both", zIndex: 1 }}>
        <button
          className="google-btn"
          onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } })}
          style={{ width: "100%", padding: "17px 24px", borderRadius: 16, background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))", border: "1.5px solid rgba(201,168,76,0.45)", boxShadow: "0 0 24px rgba(201,168,76,0.1)", color: "#ffffff", fontWeight: 600, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div className="shimmer-overlay" />
          <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
            <path d="M43.611 20.083H42V20H24v8h11.303C33.953 32.2 29.373 35 24 35c-6.075 0-11-4.925-11-11s4.925-11 11-11c2.804 0 5.354 1.057 7.29 2.79l5.657-5.657C33.83 7.343 29.145 5 24 5 12.954 5 4 13.954 4 25s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
            <path d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 13 24 13c2.804 0 5.354 1.057 7.29 2.79l5.657-5.657C33.83 7.343 29.145 5 24 5 16.318 5 9.656 8.906 6.306 14.691z" fill="#FF3D00"/>
            <path d="M24 45c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.354 0-9.919-3.766-11.29-8.836l-6.522 5.025C9.505 39.556 16.227 45 24 45z" fill="#4CAF50"/>
            <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C42.021 35.376 44 30.467 44 25c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </main>
  );
}
