"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await saveAndRedirect(session.user.id);
        return;
      }

      // Fallback: listen for auth state change (handles redirect flow)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === "SIGNED_IN" && session?.user) {
            subscription.unsubscribe();
            await saveAndRedirect(session.user.id);
          }
        }
      );
    }

    async function saveAndRedirect(userId: string) {
      // Read onboarding data from cookie (set during onboarding, survives OAuth redirect)
      const match = document.cookie.match(/hab_data=([^;]+)/);
      const raw = match ? decodeURIComponent(match[1]) : null;

      if (raw) {
        try {
          const data = JSON.parse(raw);

          // WAIT for RPC to complete before redirecting
          const { error: rpcErr } = await supabase.rpc('create_profile', {
            p_id: userId,
            p_username: data.username,
            p_gender: data.gender,
            p_habit_type: data.habit_type,
            p_habit_frequency: data.habit_frequency,
          });
          if (rpcErr) console.error("Profile RPC failed:", rpcErr);

        } catch (e) {
          console.error("Failed to parse onboarding data:", e);
        } finally {
          // Clear cookie
          document.cookie = "hab_data=; max-age=0; path=/";
        }
      }

      router.replace("/");
    }

    handleCallback();
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
