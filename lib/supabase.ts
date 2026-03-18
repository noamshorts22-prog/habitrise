import { createBrowserClient } from "@supabase/ssr";

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  habit_type: string;
  habit_frequency: number;
  current_streak: number;
  longest_streak: number;
  total_xp: number;
  level: number;
  avatar_stage: number;
  gender: "male" | "female";
  coins: number;
  created_at: string;
};

export type HabitLog = {
  id: string;
  user_id: string;
  completed_at: string;
  habit_type: string;
};

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const XP_PER_COMPLETION = 50;
export const XP_PER_LEVEL = 500;

export function makeDefaultProfile(userId: string): Profile {
  return {
    id: userId,
    username: "",
    avatar_url: null,
    habit_type: "Daily Training",
    habit_frequency: 1,
    current_streak: 0,
    longest_streak: 0,
    total_xp: 0,
    level: 1,
    avatar_stage: 1,
    gender: "male",
    coins: 0,
    created_at: new Date().toISOString(),
  };
}

export function computeAvatarStage(streak: number): number {
  if (streak <= 1) return 1;
  if (streak === 2) return 2;
  if (streak === 3) return 3;
  if (streak === 4) return 4;
  return 5;
}

export function todayRange() {
  const d = new Date().toISOString().split("T")[0];
  return { from: `${d}T00:00:00`, to: `${d}T23:59:59` };
}

export function xpProgressInLevel(totalXp: number) {
  return totalXp % XP_PER_LEVEL;
}

export function xpPercent(totalXp: number) {
  return (xpProgressInLevel(totalXp) / XP_PER_LEVEL) * 100;
}

export function computeLevel(totalXp: number) {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}
