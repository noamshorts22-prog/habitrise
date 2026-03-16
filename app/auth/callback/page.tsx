"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        router.replace(error ? "/login" : "/");
      });
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        router.replace(user ? "/" : "/login");
      });
    }
  }, [router]);

  return (
    <main
      className="flex items-center justify-center min-h-screen"
      style={{ background: "linear-gradient(180deg, #0D0D1F 0%, #060610 100%)" }}
    >
      <span
        className="text-lg font-bold tracking-widest animate-pulse"
        style={{ color: "#C9A84C" }}
      >
        LOADING...
      </span>
    </main>
  );
}
