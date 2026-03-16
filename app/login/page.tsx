"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) setError(error.message);
      else router.push("/");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) setError(error.message);
      else router.push("/");
    }
  }

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen px-6"
      style={{
        background: "linear-gradient(180deg, #0D0D1F 0%, #060610 100%)",
      }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 mb-12">
        <h1
          style={{
            fontSize: 48,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 700,
            color: "#C9A84C",
            letterSpacing: "0.12em",
            lineHeight: 1,
          }}
        >
          HabitRise
        </h1>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "#C9A84C",
            opacity: 0.4,
          }}
        >
          Rise Every Day
        </span>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl text-sm font-medium outline-none"
          style={{
            backgroundColor: "#0D0D1F",
            border: "1px solid rgba(201,168,76,0.3)",
            color: "#C9A84C",
            padding: "14px 18px",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.7)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.3)")}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl text-sm font-medium outline-none"
          style={{
            backgroundColor: "#0D0D1F",
            border: "1px solid rgba(201,168,76,0.3)",
            color: "#C9A84C",
            padding: "14px 18px",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.7)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.3)")}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        {error && (
          <p className="text-xs text-center font-semibold" style={{ color: "#ff6b6b" }}>
            {error}
          </p>
        )}

        {/* Sign In button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-xl text-sm font-black tracking-widest uppercase transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #8B6914, #C9A84C)",
            color: "#0D0D1F",
            padding: "14px 18px",
            opacity: loading ? 0.6 : 1,
            border: "none",
          }}
        >
          {loading ? "..." : isSignUp ? "Create Account" : "Sign In"}
        </button>

        {/* Toggle sign up */}
        <p className="text-center text-xs" style={{ color: "rgba(201,168,76,0.45)" }}>
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="underline"
            style={{ color: "#C9A84C" }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(201,168,76,0.15)" }} />
          <span className="text-xs font-semibold" style={{ color: "#C9A84C", opacity: 0.3 }}>
            OR
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(201,168,76,0.15)" }} />
        </div>

        {/* Google */}
        <button
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${window.location.origin}/auth/callback` },
            })
          }
          disabled={loading}
          className="w-full rounded-xl text-sm font-bold tracking-wide flex items-center justify-center gap-3 transition-all active:scale-95"
          style={{
            backgroundColor: "transparent",
            border: "1px solid rgba(201,168,76,0.35)",
            color: "#ffffff",
            padding: "14px 18px",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
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
