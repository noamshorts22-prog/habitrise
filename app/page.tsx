"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import {
  supabase,
  makeDefaultProfile,
  XP_PER_COMPLETION,
  XP_PER_LEVEL,
  todayRange,
  xpPercent,
  computeAvatarStage,
  type Profile,
} from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const HABITS = [
  { emoji: "🏃", label: "ספורט יומי",  labelEn: "Daily Sport",   value: "ספורט יומי" },
  { emoji: "📚", label: "קריאה יומית", labelEn: "Daily Reading", value: "קריאה יומית" },
  { emoji: "🧘", label: "מדיטציה",     labelEn: "Meditation",    value: "מדיטציה" },
  { emoji: "💧", label: "שתיית מים",   labelEn: "Drink Water",   value: "שתיית מים" },
];

const BG_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 4.73) % 90}%`,
  size: 2 + Math.round((i * 1.31) % 4),
  dur: 9 + Math.round((i * 1.71) % 8),
  delay: Math.round((i * 0.93) % 7),
}));

const BURST_DIRS = [
  { tx:  0,   ty: -70 }, { tx:  50,  ty: -50 },
  { tx:  70,  ty:   0 }, { tx:  50,  ty:  50 },
  { tx:  0,   ty:  70 }, { tx: -50,  ty:  50 },
  { tx: -70,  ty:   0 }, { tx: -50,  ty: -50 },
];

const AVATAR_BURST_DIRS = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * Math.PI * 2;
  const dist  = 80 + (i % 3) * 40;
  return { tx: Math.round(Math.cos(angle) * dist), ty: Math.round(Math.sin(angle) * dist) };
});

const MOTIVATIONAL_QUOTES = {
  en: [
    "To be in the 1%, you must do what the 99% won't.",
    "I do it anyway.",
    "1.01³⁶⁵ = 37.7. One percent better every day.",
    "The pain of discipline weighs ounces. The pain of regret weighs tons.",
    "You don't rise to the level of your goals. You fall to the level of your systems.",
    "Every rep you do when you don't want to is the one that changes you.",
    "The version of you that quits and the version that doesn't — same effort, different life.",
    "Champions aren't made in the gym. They're revealed there.",
    "Do it tired. Do it scared. Do it anyway.",
    "Your future self is watching you right now through your memories.",
    "One more day. That's all. One more day.",
    "The hard part isn't starting. It's showing up again tomorrow.",
    "Motivation gets you started. Identity keeps you going.",
    "You are not behind. You are exactly where the work begins.",
    "Small daily improvements are the key to staggering long-term results.",
    "The man who moves mountains begins by carrying small stones.",
    "Discipline is choosing between what you want now and what you want most.",
    "Don't count the days. Make the days count.",
    "Wake up. Show up. Level up.",
    "Your streak is a promise you made to yourself. Keep it.",
    "Every day you show up, your future gets lighter.",
    "The only workout you regret is the one you didn't do.",
    "Hard days build the strongest warriors.",
    "You've already started. That's harder than most people ever get.",
    "Today's effort is tomorrow's strength.",
    "Forge yourself in the fire of your own discipline.",
    "The body achieves what the mind believes.",
    "One decision separates who you are from who you want to be.",
    "Show up. Suit up. Never give up.",
    "Legends aren't born. They're built — one day at a time.",
  ],
  he: [
    "כדי להיות ב-1% צריך לעשות מה ש-99% לא עושים.",
    "אני עושה את זה בכל מקרה.",
    "1.01³⁶⁵ = 37.7. אחוז אחד טוב יותר כל יום.",
    "הכאב של משמעת שוקל גרמים. הכאב של חרטה שוקל טונות.",
    "אתה לא עולה לרמת המטרות שלך. אתה נופל לרמת המערכות שלך.",
    "כל חזרה שאתה עושה כשלא בא לך — היא זו שמשנה אותך.",
    "הגרסה שמוותרת והגרסה שלא — אותו מאמץ, חיים שונים לגמרי.",
    "אלופים לא נוצרים באולם. הם מתגלים שם.",
    "עשה את זה כשאתה עייף. עשה את זה כשאתה פוחד. עשה את זה בכל מקרה.",
    "העצמי העתידי שלך צופה בך עכשיו דרך הזיכרונות שלו.",
    "עוד יום אחד. זהו. עוד יום אחד.",
    "החלק הקשה הוא לא להתחיל. זה לחזור מחר.",
    "מוטיבציה מתחילה אותך. זהות ממשיכה אותך.",
    "אתה לא מפגר. אתה בדיוק במקום שבו העבודה מתחילה.",
    "שיפורים יומיים קטנים הם המפתח לתוצאות עצומות לטווח ארוך.",
    "המשמעת היא לבחור בין מה שאתה רוצה עכשיו למה שאתה רוצה הכי הרבה.",
    "אל תספור ימים. תעשה שהימים יספרו.",
    "קום. הופיע. עלה רמה.",
    "הסטריק שלך הוא הבטחה שנתת לעצמך. שמור עליה.",
    "כל יום שאתה מגיע, העתיד שלך נעשה קל יותר.",
    "האימון היחיד שמצטער עליו הוא זה שלא עשית.",
    "ימים קשים בונים לוחמים חזקים.",
    "כבר התחלת. זה קשה יותר ממה שרוב האנשים אי פעם מגיעים אליו.",
    "המאמץ של היום הוא הכוח של מחר.",
    "גיבורים לא נולדים. הם נבנים — יום אחד בכל פעם.",
  ],
};

const MONTH_NAMES_HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const MONTH_NAMES_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TAB_ORDER = ["home", "profile", "settings"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Translations
// ─────────────────────────────────────────────────────────────────────────────
const TRANS = {
  he: {
    home: "בית", profile: "פרופיל", settings: "הגדרות",
    dayStreak: "ימי רצף", longestStreak: "הכי ארוך",
    changeHabit: "שנה הרגל", signOut: "התנתקות",
    language: "שפה", darkMode: "מצב כהה",
    level: "רמה", xpToNext: "ל-רמה הבאה", stage: "שלב",
    chooseHabit: "בחר הרגל", save: "שמור", cancel: "ביטול",
    currentMonth: "החודש",
  },
  en: {
    home: "Home", profile: "Profile", settings: "Settings",
    dayStreak: "Day Streak", longestStreak: "Longest",
    changeHabit: "Change Habit", signOut: "Sign Out",
    language: "Language", darkMode: "Dark Mode",
    level: "Level", xpToNext: "to next level", stage: "Stage",
    chooseHabit: "Choose Habit", save: "Save", cancel: "Cancel",
    currentMonth: "This Month",
  },
} as const;
type Lang = keyof typeof TRANS;
type TT = {
  home: string; profile: string; settings: string;
  dayStreak: string; longestStreak: string;
  changeHabit: string; signOut: string;
  language: string; darkMode: string;
  level: string; xpToNext: string; stage: string;
  chooseHabit: string; save: string; cancel: string;
  currentMonth: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Themes
// ─────────────────────────────────────────────────────────────────────────────
const THEMES: Record<"dark" | "light", TC> = {
  dark: {
    bg: "#0D0D1F", card: "#111830", card2: "#0A0A18",
    border: "rgba(201,168,76,0.2)", borderStrong: "rgba(201,168,76,0.5)",
    text: "#F0EAD6", textSub: "#8A8FA8", textMuted: "rgba(240,234,214,0.35)",
    gold: "#C9A84C", goldLight: "#E8C96A",
    navBg: "rgba(8,8,20,0.97)", navBorder: "rgba(201,168,76,0.25)",
    calEmpty: "#0D1428", calBorder: "rgba(201,168,76,0.08)",
    toggleOff: "#1e2d5e", inputBg: "#0A0A18",
    xpTrack: "#1a1a3e",
  },
  light: {
    bg: "#F2E8D5", card: "#FFFDF8", card2: "#EDE3D0",
    border: "rgba(140,110,30,0.25)", borderStrong: "rgba(140,110,30,0.5)",
    text: "#1A1A2E", textSub: "#5A5F72", textMuted: "rgba(26,26,46,0.3)",
    gold: "#8C6E1E", goldLight: "#A68628",
    navBg: "rgba(238,230,212,0.97)", navBorder: "rgba(140,110,30,0.25)",
    calEmpty: "#E8DEC8", calBorder: "rgba(140,110,30,0.1)",
    toggleOff: "#C8C4BB", inputBg: "#EDE3D0",
    xpTrack: "#DDD4C0",
  },
};
type ThemeKey = keyof typeof THEMES;
type TC = {
  bg: string; card: string; card2: string;
  border: string; borderStrong: string;
  text: string; textSub: string; textMuted: string;
  gold: string; goldLight: string;
  navBg: string; navBorder: string;
  calEmpty: string; calBorder: string;
  toggleOff: string; inputBg: string; xpTrack: string;
};

const CINZEL = "var(--font-cinzel, 'Cinzel', Georgia, serif)";

// ─────────────────────────────────────────────────────────────────────────────
// Root — auth gating
// ─────────────────────────────────────────────────────────────────────────────
type AppView = "loading" | "welcome" | "login" | "onboarding" | "home";

export default function Root() {
  const [view, setView]   = useState<AppView>("loading");
  const [user, setUser]   = useState<User | null>(null);
  const timeoutRef        = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    timeoutRef.current = setTimeout(() => {
      if (mounted) setView(v => v === "loading" ? "welcome" : v);
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (!mounted) return;

          if (!session) {
            // Show welcome screen for first-time visitors, login for returning
            const seen = localStorage.getItem("hr-welcome-seen");
            setView(seen ? "login" : "welcome");
            return;
          }

          setUser(session.user);

          const { data: prof, error } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!mounted) return;

          if (error) {
            setView("login");
            return;
          }

          if (!prof?.username || prof.username === "Hero") {
            setView("onboarding");
          } else {
            setView("home");
          }
        } catch (e: unknown) {
          if (e instanceof Error && e.name === "AbortError") return;
          if (mounted) setView("login");
        } finally {
          clearTimeout(timeoutRef.current);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutRef.current);
    };
  }, []);

  if (view === "loading") {
    return (
      <main style={{ backgroundColor: "#0D0D1F", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" } as React.CSSProperties}>
        <style>{`
          @keyframes loadingPulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
          @keyframes loadingGlow { 0%,100%{ transform:translate(-50%,-50%) scale(1); opacity:0.3; } 50%{ transform:translate(-50%,-50%) scale(1.15); opacity:0.6; } }
          @keyframes loadingLogoIn { from{ opacity:0; transform:scale(0.8); } to{ opacity:1; transform:scale(1); } }
          @keyframes loadingBarGrow { from{ width:0%; } to{ width:70%; } }
        `}</style>
        <div style={{ position: "absolute", top: "45%", left: "50%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)", animation: "loadingGlow 3s ease-in-out infinite", pointerEvents: "none" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/habitrise-icon.png" alt="" style={{ width: 80, height: 80, objectFit: "contain", marginBottom: 20, animation: "loadingLogoIn 0.6s ease-out both", filter: "drop-shadow(0 0 20px rgba(201,168,76,0.7))" }} />
        <span style={{ color: "#C9A84C", fontFamily: CINZEL, fontSize: 16, fontWeight: 700, letterSpacing: "0.2em", animation: "loadingPulse 1.5s ease-in-out infinite", marginBottom: 24 }}>
          HABITRISE
        </span>
        <div style={{ width: 120, height: 3, borderRadius: 2, backgroundColor: "rgba(201,168,76,0.15)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #8B6914, #C9A84C)", animation: "loadingBarGrow 2s ease-in-out forwards" }} />
        </div>
      </main>
    );
  }

  if (view === "welcome") {
    return <WelcomeScreen onContinue={() => { localStorage.setItem("hr-welcome-seen", "1"); setView("login"); }} />;
  }

  if (view === "login") {
    return <LoginScreen onLogin={() => {}} />;
  }

  if (view === "onboarding") {
    return (
      <OnboardingScreen
        user={user!}
        onComplete={() => setView("home")}
      />
    );
  }

  return (
    <MainApp
      user={user!}
      onSignOut={async () => { await supabase.auth.signOut(); setUser(null); setView("login"); }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome / Intro Screen
// ─────────────────────────────────────────────────────────────────────────────
const welcomeContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const welcomeFadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const welcomeScaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.7 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] } },
};

const welcomeSlideRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  const features = [
    { emoji: "🎯", title: "בנה הרגלים", desc: "בחר הרגל יומי ושמור על רצף" },
    { emoji: "⚡", title: "צבור XP", desc: "כל יום שאתה משלים מרוויח ניקוד" },
    { emoji: "🏆", title: "עלה רמות", desc: "התקדם, שפר את הדמות שלך והפוך לגיבור" },
  ];

  return (
    <main className="login-main" style={{ background: "linear-gradient(180deg, #0D0D1F 0%, #060610 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes logoFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes glowPulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.18; } 50% { transform: translate(-50%,-50%) scale(1.12); opacity: 0.32; } }
        @keyframes ctaPulse { 0%,100% { box-shadow: 0 0 30px rgba(201,168,76,0.3); } 50% { box-shadow: 0 0 50px rgba(201,168,76,0.5); } }
        @keyframes flicker { 0%,100% { opacity: 0.1; } 50% { opacity: 0.8; } }
        @keyframes goldFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .login-main { min-height: 100vh; min-height: 100dvh; padding: 0 32px; }
        .logo-wrap { width: 200px; height: 200px; }
        @media (max-width: 400px) {
          .logo-wrap { width: 140px; height: 140px; }
          .login-main { padding: 0 20px; }
        }
        @media (max-height: 680px) {
          .logo-wrap { width: 120px; height: 120px; }
        }
      `}</style>

      {/* Stars */}
      {[
        { left: "8%", top: "10%", size: 2, dur: 2.5, delay: 0.2 },
        { left: "20%", top: "25%", size: 3, dur: 3.8, delay: 0.9 },
        { left: "35%", top: "8%", size: 2, dur: 4.2, delay: 1.5 },
        { left: "55%", top: "15%", size: 2, dur: 2.8, delay: 0.4 },
        { left: "70%", top: "5%", size: 3, dur: 3.4, delay: 1.1 },
        { left: "85%", top: "20%", size: 2, dur: 4.6, delay: 0.7 },
        { left: "92%", top: "40%", size: 2, dur: 2.3, delay: 1.8 },
        { left: "12%", top: "60%", size: 2, dur: 3.9, delay: 0.3 },
        { left: "78%", top: "70%", size: 3, dur: 4.1, delay: 1.3 },
        { left: "45%", top: "85%", size: 2, dur: 3.2, delay: 0.6 },
        { left: "65%", top: "90%", size: 2, dur: 2.7, delay: 2.0 },
        { left: "5%", top: "88%", size: 3, dur: 3.6, delay: 1.6 },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.left, top: s.top, width: s.size, height: s.size, borderRadius: "50%", backgroundColor: "#ffffff", pointerEvents: "none", animation: `flicker ${s.dur}s ${s.delay}s ease-in-out infinite` }} />
      ))}

      {/* Gold particles */}
      {[
        { left: "10%", top: "30%", size: 2, dur: 4.5, delay: 0.5 },
        { left: "25%", top: "50%", size: 1, dur: 5.2, delay: 1.2 },
        { left: "40%", top: "70%", size: 2, dur: 3.8, delay: 0.8 },
        { left: "60%", top: "35%", size: 1, dur: 6.0, delay: 1.6 },
        { left: "75%", top: "55%", size: 2, dur: 4.3, delay: 0.3 },
        { left: "90%", top: "75%", size: 1, dur: 5.5, delay: 2.1 },
      ].map((p, i) => (
        <div key={`p${i}`} style={{ position: "absolute", left: p.left, top: p.top, width: p.size, height: p.size, borderRadius: "50%", backgroundColor: "rgba(201,168,76,0.6)", pointerEvents: "none", animation: `goldFloat ${p.dur}s ${p.delay}s ease-in-out infinite` }} />
      ))}

      {/* Glow orb */}
      <div style={{ position: "absolute", top: "25%", left: "50%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)", animation: "glowPulse 5s ease-in-out infinite", pointerEvents: "none" }} />

      {/* Animated content container */}
      <motion.div
        variants={welcomeContainer}
        initial="hidden"
        animate="show"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", zIndex: 1 }}
      >
        {/* Logo */}
        <motion.div variants={welcomeScaleIn} style={{ marginBottom: 8 }}>
          <div className="logo-wrap" style={{ animation: "logoFloat 4s ease-in-out infinite" }}>
            <div className="logo-wrap" style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)", pointerEvents: "none", animation: "glowPulse 4s ease-in-out infinite" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/habitrise-icon.png" alt="HabitRise" style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1, filter: "drop-shadow(0 0 30px rgba(201,168,76,0.9)) drop-shadow(0 0 60px rgba(201,168,76,0.6)) drop-shadow(0 0 120px rgba(201,168,76,0.4))" }} />
            </div>
          </div>
        </motion.div>

        <motion.h1
          variants={welcomeFadeUp}
          style={{ fontFamily: CINZEL, fontWeight: 900, color: "#C9A84C", fontSize: 48, letterSpacing: "0.14em", lineHeight: 1, margin: 0, textShadow: "0 0 40px rgba(201,168,76,0.55)" }}
        >
          HabitRise
        </motion.h1>

        <motion.span
          variants={welcomeFadeUp}
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.45em", textTransform: "uppercase", color: "#C9A84C", opacity: 0.35, marginTop: 8 }}
        >
          Rise Every Day
        </motion.span>

        {/* Features */}
        <motion.div
          variants={welcomeContainer}
          style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 40, width: "100%", maxWidth: 340 }}
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={welcomeSlideRight}
              style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderRadius: 16, backgroundColor: "rgba(17,24,48,0.6)", border: "1px solid rgba(201,168,76,0.12)", backdropFilter: "blur(8px)" }}
            >
              <span style={{ fontSize: 32, flexShrink: 0 }}>{f.emoji}</span>
              <div style={{ direction: "rtl" }}>
                <div style={{ color: "#C9A84C", fontSize: 16, fontWeight: 800, fontFamily: CINZEL }}>{f.title}</div>
                <div style={{ color: "rgba(201,168,76,0.5)", fontSize: 13, fontWeight: 500, marginTop: 2 }}>{f.desc}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={welcomeFadeUp} style={{ width: "100%", maxWidth: 340, marginTop: 40 }}>
          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ width: "100%", padding: "18px 24px", borderRadius: 16, background: "linear-gradient(135deg, #8B6914, #C9A84C)", border: "none", color: "#0D0D1F", fontWeight: 900, fontSize: 18, fontFamily: CINZEL, cursor: "pointer", letterSpacing: "0.1em", animation: "ctaPulse 2.5s 1.5s ease-in-out infinite" }}
          >
            {"בוא נתחיל 🚀"}
          </motion.button>
        </motion.div>
      </motion.div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Login Screen
// ─────────────────────────────────────────────────────────────────────────────
const LOGIN_STARS = [
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
const LOGIN_PARTICLES = [
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
  { left: "20%", top: "78%", size: 2, dur: 3.4, delay: 0.0 },
  { left: "50%", top: "55%", size: 3, dur: 4.9, delay: 2.7 },
  { left: "88%", top: "55%", size: 2, dur: 3.5, delay: 1.3 },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
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
        .login-title { font-size: 64px; }
        .login-main { min-height: 100vh; min-height: 100dvh; padding: 0 32px; }
        .btn-wrap { width: 100%; max-width: 340px; }
        @media (max-width: 400px) {
          .logo-wrap { width: 150px; height: 150px; }
          .login-title { font-size: 48px; }
          .login-main { padding: 0 20px; }
        }
        @media (max-height: 680px) {
          .logo-wrap { width: 140px; height: 140px; }
          .login-title { font-size: 44px; }
        }
      `}</style>

      {/* Stars */}
      {LOGIN_STARS.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.left, top: s.top, width: s.size, height: s.size, borderRadius: "50%", backgroundColor: "#ffffff", pointerEvents: "none", animation: `flicker ${s.dur}s ${s.delay}s ease-in-out infinite` }} />
      ))}
      {/* Gold particles */}
      {LOGIN_PARTICLES.map((p, i) => (
        <div key={`p${i}`} style={{ position: "absolute", left: p.left, top: p.top, width: p.size, height: p.size, borderRadius: "50%", backgroundColor: "rgba(201,168,76,0.6)", pointerEvents: "none", animation: `goldFloat ${p.dur}s ${p.delay}s ease-in-out infinite` }} />
      ))}

      <div style={{ position: "absolute", top: "42%", left: "50%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)", animation: "goldOrb1 6s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "calc(42% + 40px)", left: "calc(50% - 60px)", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)", animation: "goldOrb2 4s 2s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "42%", left: "50%", width: 680, height: 680, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)", animation: "goldOrb3 8s 1s ease-in-out infinite", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 56, zIndex: 1 }}>
        <div style={{ animation: "fadeUp 0.5s 0s ease-out both", marginBottom: 4 }}>
          <div className="logo-wrap" style={{ animation: "logoFloat 4s ease-in-out infinite" }}>
            <div className="logo-wrap" style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)", pointerEvents: "none", animation: "glowPulse 4s ease-in-out infinite" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/habitrise-icon.png" alt="HabitRise" style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1, filter: "drop-shadow(0 0 30px rgba(201,168,76,0.9)) drop-shadow(0 0 60px rgba(201,168,76,0.6)) drop-shadow(0 0 120px rgba(201,168,76,0.4))" }} />
            </div>
          </div>
        </div>
        <h1 className="login-title" style={{ fontFamily: CINZEL, fontWeight: 900, color: "#C9A84C", letterSpacing: "0.14em", lineHeight: 1, margin: 0, textShadow: "0 0 40px rgba(201,168,76,0.55)", animation: "fadeUp 0.5s 0.2s ease-out both" }}>
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

// ─────────────────────────────────────────────────────────────────────────────
// Staircase Logo SVG
// ─────────────────────────────────────────────────────────────────────────────
function StaircaseLogo({ step }: { step: number }) {
  const u = 22;
  const blocks = [
    { bx: 56,  by: 128, h: 22, topC: "#C9A84C", rightC: "#9A7828", leftC: "#6E5418" },
    { bx: 100, by: 128, h: 44, topC: "#DDB840", rightC: "#C9A84C", leftC: "#9A7828" },
    { bx: 144, by: 128, h: 66, topC: "#EDD060", rightC: "#D4B040", leftC: "#C9A84C" },
  ];
  const pts = (h: number) => ({
    r: `0,0 ${u},${-u/2} ${u},${-u/2-h} 0,${-h}`,
    l: `0,0 ${-u},${-u/2} ${-u},${-u/2-h} 0,${-h}`,
    t: `0,${-h} ${u},${-h-u/2} 0,${-h-u} ${-u},${-h-u/2}`,
  });
  return (
    <svg viewBox="0 0 200 140" width="160" height="112" style={{ overflow: "visible" }}>
      <defs>
        <filter id="logoGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <style>{`@keyframes blockPop { from { opacity:0; transform:scale(0.35); } 65% { transform:scale(1.08); } to { opacity:1; transform:scale(1); } }`}</style>
      </defs>
      {blocks.map((b, i) => {
        if (i >= step) return null;
        const p = pts(b.h);
        const isNew = i === step - 1;
        return (
          <g key={`b${i}`} transform={`translate(${b.bx},${b.by})`}>
            <g filter={isNew ? "url(#logoGlow)" : undefined}
              style={{ transformBox: "fill-box", transformOrigin: "50% 100%", animation: isNew ? "blockPop 0.4s ease-out both" : "none" }}>
              <polygon points={p.l} fill={b.leftC} />
              <polygon points={p.r} fill={b.rightC} />
              <polygon points={p.t} fill={b.topC} />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding Screen
// ─────────────────────────────────────────────────────────────────────────────
function OnboardingScreen({ user, onComplete }: { user: User; onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [exiting, setExiting] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [heroName, setHeroName] = useState("");
  const [habit, setHabit] = useState("");
  const [frequency, setFrequency] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  function goNext() {
    setExiting(true);
    setTimeout(() => { setStep(s => s + 1); setExiting(false); }, 280);
  }

  async function handleFinish() {
    if (!frequency) return;
    setSaving(true);
    await supabase.from("profiles").upsert({
      ...makeDefaultProfile(user.id),
      username: heroName.trim().replace(/[<>"'&]/g, "").slice(0, 50) || "Hero",
      habit_type: habit,
      habit_frequency: frequency,
      gender: gender || "male",
    });
    setSaving(false);
    onComplete();
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6"
      style={{ background: "linear-gradient(180deg, #0D0D1F 0%, #060610 100%)" }}>
      <style>{`
        @keyframes stepIn  { from { opacity:0; transform:translateX(48px);  } to { opacity:1; transform:translateX(0);    } }
        @keyframes stepOut { from { opacity:1; transform:translateX(0);    } to { opacity:0; transform:translateX(-48px); } }
        .step-in  { animation: stepIn  0.28s ease-out forwards; }
        .step-out { animation: stepOut 0.28s ease-in  forwards; }
      `}</style>
      <div className="flex flex-col items-center mb-2">
        <StaircaseLogo step={Math.min(step, 3)} />
        <h1 className="text-2xl font-black tracking-widest -mt-2" style={{ color: "#C9A84C", fontFamily: CINZEL }}>HabitRise</h1>
      </div>
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 8, borderRadius: 999, width: i === step ? 28 : 8, backgroundColor: i <= step ? "#C9A84C" : "#1e2d5e", transition: "all 0.35s ease" }} />
        ))}
      </div>
      <div key={step} className={`w-full max-w-sm flex flex-col gap-6 ${exiting ? "step-out" : "step-in"}`}>
        {step === 1 && (
          <>
            <div className="text-center">
              <h2 className="font-black" style={{ color: "#C9A84C", fontSize: 24, fontFamily: CINZEL }}>מי הגיבור שלך?</h2>
              <p className="mt-2 text-xs" style={{ color: "#C9A84C", opacity: 0.45 }}>בחר את הדמות שמייצגת אותך</p>
            </div>
            <div className="flex gap-4">
              {([{ value: "male", label: "גבר", emoji: "👨" }, { value: "female", label: "אישה", emoji: "👩" }] as const).map(g => (
                <button key={g.value} onClick={() => setGender(g.value)}
                  className="flex-1 flex flex-col items-center gap-3 py-8 rounded-2xl transition-all active:scale-95"
                  style={{ backgroundColor: gender === g.value ? "rgba(201,168,76,0.1)" : "#111830", border: `2px solid ${gender === g.value ? "#C9A84C" : "#1e2d5e"}`, transform: gender === g.value ? "scale(1.04)" : "scale(1)", transition: "all 0.2s ease" }}>
                  <span style={{ fontSize: 52 }}>{g.emoji}</span>
                  <span style={{ color: "#C9A84C", fontSize: 16, fontWeight: 800 }}>{g.label}</span>
                </button>
              ))}
            </div>
            <button onClick={goNext} disabled={!gender}
              className="w-full rounded-xl font-black tracking-widest uppercase transition-all active:scale-95"
              style={{ background: gender ? "linear-gradient(135deg, #8B6914, #C9A84C)" : "#1a1a3e", color: "#0D0D1F", padding: "16px", opacity: gender ? 1 : 0.45, fontSize: 14 }}>
              המשך →
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <div className="text-center">
              <h2 className="font-black" style={{ color: "#C9A84C", fontSize: 24, fontFamily: CINZEL }}>מה שם הגיבור שלך?</h2>
            </div>
            <input type="text" placeholder="שם הגיבור..." value={heroName} autoFocus
              onChange={e => setHeroName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && heroName.trim() && goNext()}
              className="w-full rounded-xl text-center text-xl font-bold outline-none"
              style={{ backgroundColor: "#111830", border: "2px solid rgba(201,168,76,0.4)", color: "#C9A84C", padding: "16px 18px", direction: "rtl" }}
              onFocus={e => (e.target.style.borderColor = "#C9A84C")}
              onBlur={e => (e.target.style.borderColor = "rgba(201,168,76,0.4)")} />
            <button onClick={goNext} disabled={!heroName.trim()}
              className="w-full rounded-xl font-black tracking-widest uppercase transition-all active:scale-95"
              style={{ background: heroName.trim() ? "linear-gradient(135deg, #8B6914, #C9A84C)" : "#1a1a3e", color: "#0D0D1F", padding: "16px", opacity: heroName.trim() ? 1 : 0.45, fontSize: 14 }}>
              המשך →
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <div className="text-center">
              <h2 className="font-black" style={{ color: "#C9A84C", fontSize: 22, fontFamily: CINZEL }}>איזה הרגל אתה רוצה לבנות?</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {HABITS.map(h => (
                <button key={h.value} onClick={() => setHabit(h.value)}
                  className="flex flex-col items-center gap-2 py-5 rounded-2xl transition-all active:scale-95"
                  style={{ backgroundColor: habit === h.value ? "rgba(201,168,76,0.1)" : "#111830", border: `2px solid ${habit === h.value ? "#C9A84C" : "#1e2d5e"}`, transform: habit === h.value ? "scale(1.03)" : "scale(1)", transition: "all 0.2s ease" }}>
                  <span style={{ fontSize: 34 }}>{h.emoji}</span>
                  <span style={{ color: "#C9A84C", fontSize: 13, fontWeight: 700 }}>{h.label}</span>
                </button>
              ))}
            </div>
            <button onClick={goNext} disabled={!habit}
              className="w-full rounded-xl font-black tracking-widest uppercase transition-all active:scale-95"
              style={{ background: habit ? "linear-gradient(135deg, #8B6914, #C9A84C)" : "#1a1a3e", color: "#0D0D1F", padding: "16px", opacity: habit ? 1 : 0.45, fontSize: 14 }}>
              המשך →
            </button>
          </>
        )}
        {step === 4 && (
          <>
            <div className="text-center">
              <h2 className="font-black" style={{ color: "#C9A84C", fontSize: 22, fontFamily: CINZEL }}>כמה פעמים בשבוע?</h2>
              <p className="mt-2 text-xs" style={{ color: "#C9A84C", opacity: 0.45 }}>בחר את הקצב שמתאים לך</p>
            </div>
            <div className="flex gap-3">
              {[3, 5, 7].map(n => (
                <button key={n} onClick={() => setFrequency(n)}
                  className="flex-1 py-7 rounded-2xl font-black text-3xl transition-all active:scale-95"
                  style={{ backgroundColor: frequency === n ? "rgba(201,168,76,0.1)" : "#111830", border: `2px solid ${frequency === n ? "#C9A84C" : "#1e2d5e"}`, color: "#C9A84C", transform: frequency === n ? "scale(1.06)" : "scale(1)", transition: "all 0.2s ease" }}>
                  {n}
                </button>
              ))}
            </div>
            <button onClick={handleFinish} disabled={!frequency || saving}
              className="w-full rounded-xl font-black tracking-wide transition-all active:scale-95"
              style={{ background: frequency ? "linear-gradient(135deg, #8B6914, #C9A84C)" : "#1a1a3e", color: "#0D0D1F", padding: "18px", opacity: (frequency && !saving) ? 1 : 0.45, fontSize: 16 }}>
              {saving ? "..." : "בואו נתחיל! 🚀"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App — wraps all tabs after auth
// ─────────────────────────────────────────────────────────────────────────────
function MainApp({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState<typeof TAB_ORDER[number]>("home");
  const prevTabRef = useRef<string>("home");
  const [lang, setLang] = useState<Lang>("he");
  const [themeKey, setThemeKey] = useState<ThemeKey>("dark");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completedToday, setCompletedToday] = useState(false);
  const [heroStatus, setHeroStatus] = useState<"active" | "sleeping" | "decayed">("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tc = THEMES[themeKey];
  const t  = TRANS[lang];

  useEffect(() => {
    const savedLang  = localStorage.getItem("hr-lang") as Lang | null;
    const savedTheme = localStorage.getItem("hr-theme") as ThemeKey | null;
    if (savedLang  === "he" || savedLang  === "en")    setLang(savedLang);
    if (savedTheme === "dark" || savedTheme === "light") setThemeKey(savedTheme);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("No session");
      const uid = currentUser.id;
      const { data: prof, error: profErr } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (profErr) throw new Error(profErr.message);

      // Check hero status (sleep / decay) — safe: ignore if RPC not deployed yet
      let status: "active" | "sleeping" | "decayed" = "active";
      try {
        const { data: statusResult } = await supabase.rpc("check_hero_status", { p_user_id: uid });
        if (statusResult?.status) status = statusResult.status;
      } catch { /* RPC not available yet */ }
      setHeroStatus(status);

      // If decayed, re-fetch the profile to get updated streak/level
      if (status === "decayed") {
        const { data: refreshed } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
        setProfile((refreshed ?? prof ?? makeDefaultProfile(uid)) as Profile);
      } else {
        setProfile((prof ?? makeDefaultProfile(uid)) as Profile);
      }

      const { from, to } = todayRange();
      const { data: logs } = await supabase.from("habit_logs").select("id").eq("user_id", uid).gte("completed_at", from).lte("completed_at", to);
      setCompletedToday((logs ?? []).length > 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function switchTab(tab: typeof TAB_ORDER[number]) {
    prevTabRef.current = activeTab;
    setActiveTab(tab);
  }

  function changeLang(l: Lang) {
    setLang(l);
    localStorage.setItem("hr-lang", l);
  }
  function changeTheme(k: ThemeKey) {
    setThemeKey(k);
    localStorage.setItem("hr-theme", k);
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen" style={{ backgroundColor: tc.bg }}>
        <span className="text-lg font-bold tracking-widest animate-pulse" style={{ color: tc.gold, fontFamily: CINZEL }}>
          LOADING...
        </span>
      </main>
    );
  }
  if (error) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-4 px-6" style={{ backgroundColor: tc.bg }}>
        <p className="text-xs text-center max-w-sm font-mono" style={{ color: "#ff6b6b" }}>{error}</p>
        <button onClick={loadData} className="px-6 py-2 rounded-xl text-xs font-bold tracking-widest uppercase" style={{ border: `1px solid ${tc.gold}`, color: tc.gold }}>Retry</button>
        <button onClick={onSignOut} className="text-xs" style={{ color: tc.gold, opacity: 0.4 }}>Sign Out</button>
      </main>
    );
  }
  if (!profile) return null;

  const fromIdx = TAB_ORDER.indexOf(prevTabRef.current as typeof TAB_ORDER[number]);
  const toIdx   = TAB_ORDER.indexOf(activeTab);
  const slideDir = toIdx >= fromIdx ? 1 : -1;

  return (
    <div style={{ backgroundColor: tc.bg, minHeight: "100vh", position: "relative" }}>
      <style>{`
        @keyframes tabSlideIn {
          from { opacity: 0; transform: translateX(${slideDir * 28}px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes navBounce {
          0%, 100% { transform: scale(1) translateY(0); }
          45%       { transform: scale(1.28) translateY(-4px); }
        }
        @keyframes underlineGrow {
          from { width: 0; opacity: 0; }
          to   { width: 20px; opacity: 1; }
        }
        /* Button hover glow */
        .btn-gold:hover { box-shadow: 0 0 18px rgba(201,168,76,0.4); transform: scale(1.02); }
        .btn-gold { transition: box-shadow 0.2s ease, transform 0.2s ease; }
      `}</style>

      <div key={activeTab} style={{ animation: "tabSlideIn 0.3s ease-out both", paddingBottom: 88 }}>
        {activeTab === "home"     && <HomeTab     user={user} profile={profile} setProfile={setProfile} completedToday={completedToday} setCompletedToday={setCompletedToday} tc={tc} t={t} lang={lang} themeKey={themeKey} heroStatus={heroStatus} setHeroStatus={setHeroStatus} />}
        {activeTab === "profile"  && <ProfileTab  user={user} profile={profile} setProfile={setProfile} tc={tc} t={t} lang={lang} themeKey={themeKey} />}
        {activeTab === "settings" && <SettingsTab onSignOut={onSignOut} tc={tc} t={t} lang={lang} themeKey={themeKey} onChangeLang={changeLang} onChangeTheme={changeTheme} />}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={switchTab} tc={tc} t={t} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom Nav
// ─────────────────────────────────────────────────────────────────────────────
function NavIcon({ id, active, gold, muted }: { id: string; active: boolean; gold: string; muted: string }) {
  const c = active ? gold : muted;
  if (id === "home") return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={c}>
      <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"/>
    </svg>
  );
  if (id === "profile") return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={c}>
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20H4Z"/>
    </svg>
  );
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={c}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z"/>
    </svg>
  );
}

function BottomNav({
  activeTab, setActiveTab, tc, t,
}: {
  activeTab: string;
  setActiveTab: (tab: typeof TAB_ORDER[number]) => void;
  tc: TC; t: TT;
}) {
  const tabs: { id: string; label: string }[] = [
    { id: "home",     label: t.home     },
    { id: "profile",  label: t.profile  },
    { id: "settings", label: t.settings },
  ];

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      backgroundColor: tc.navBg,
      borderTop: `1px solid ${tc.navBorder}`,
      backdropFilter: "blur(24px)",
      display: "flex", justifyContent: "space-around",
      padding: "10px 0 18px",
    }}>
      <style>{`
        @keyframes navIconBounce {
          0%   { transform: translateY(0) scale(1); }
          40%  { transform: translateY(-5px) scale(1.2); }
          70%  { transform: translateY(1px) scale(0.95); }
          100% { transform: translateY(0) scale(1); }
        }
      `}</style>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof TAB_ORDER[number])}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 24px", minWidth: 72 }}>
            <span
              key={isActive ? `${tab.id}-on` : `${tab.id}-off`}
              style={{ display: "block", filter: isActive ? `drop-shadow(0 0 6px ${tc.gold}88)` : "none", animation: isActive ? "navIconBounce 0.4s cubic-bezier(0.34,1.56,0.64,1)" : "none" }}>
              <NavIcon id={tab.id} active={isActive} gold={tc.gold} muted={tc.textSub} />
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: isActive ? tc.gold : tc.textSub, transition: "color 0.2s ease" }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Home Tab
// ─────────────────────────────────────────────────────────────────────────────
function HomeTab({
  user, profile, setProfile, completedToday, setCompletedToday, tc, t, lang, themeKey, heroStatus, setHeroStatus,
}: {
  user: User; profile: Profile; setProfile: (p: Profile) => void;
  completedToday: boolean; setCompletedToday: (v: boolean) => void;
  tc: TC; t: TT; lang: Lang; themeKey: ThemeKey;
  heroStatus: "active" | "sleeping" | "decayed"; setHeroStatus: (s: "active" | "sleeping" | "decayed") => void;
}) {
  const [checking, setChecking]           = useState(false);
  const [justLeveled, setJustLeveled]     = useState(false);
  const [showBurst, setShowBurst]         = useState(false);
  const [avatarExiting, setAvatarExiting] = useState(false);
  const [avatarEntering, setAvatarEntering] = useState(false);
  const [avatarGlowBurst, setAvatarGlowBurst] = useState(false);
  const [avatarBounce, setAvatarBounce]   = useState(false);
  const [showAvatarBurst, setShowAvatarBurst] = useState(false);
  const [showDoneText, setShowDoneText]   = useState(false);

  function triggerLevelUp() {
    setJustLeveled(true);
    setTimeout(() => setJustLeveled(false), 3500);
  }

  async function handleCheck() {
    if (completedToday || checking || !profile) return;
    setChecking(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const uid = currentUser?.id ?? user.id;

    const newXp          = profile.total_xp + XP_PER_COMPLETION;
    const newLevel       = Math.floor(newXp / XP_PER_LEVEL) + 1;
    const newStreak      = profile.current_streak + 1;
    const newAvatarStage = computeAvatarStage(newStreak);
    const newLongest     = Math.max(profile.longest_streak, newStreak);

    const { error: logErr } = await supabase.from("habit_logs").insert({
      user_id: uid, completed_at: new Date().toISOString(), habit_type: profile.habit_type,
    });
    if (logErr) { console.error("log error:", logErr.message); setChecking(false); return; }

    const { error: updErr } = await supabase.from("profiles").update({
      total_xp: newXp, level: newLevel, avatar_stage: newAvatarStage,
      current_streak: newStreak, longest_streak: newLongest,
    }).eq("id", uid);
    if (updErr) { console.error("update error:", updErr.message); setChecking(false); return; }

    const newProfile = { ...profile, total_xp: newXp, level: newLevel, avatar_stage: newAvatarStage, current_streak: newStreak, longest_streak: newLongest };

    setCompletedToday(true);
    setHeroStatus("active");
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 1000);

    setAvatarBounce(true);
    setShowAvatarBurst(true);
    setTimeout(() => setAvatarBounce(false), 300);
    setTimeout(() => setShowAvatarBurst(false), 1000);

    setShowDoneText(true);
    setTimeout(() => setShowDoneText(false), 1500);

    if (newLevel > profile.level) triggerLevelUp();

    setAvatarExiting(true);
    setTimeout(() => {
      setProfile(newProfile);
      setAvatarExiting(false);
      setAvatarEntering(true);
      setAvatarGlowBurst(true);
      setTimeout(() => { setAvatarEntering(false); setAvatarGlowBurst(false); }, 700);
    }, 350);

    setChecking(false);
  }

const xpPct    = xpPercent(profile.total_xp);
  const xpInLvl  = profile.total_xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpInLvl;
  const avatarStage = profile.avatar_stage ?? 1;
  const gender      = profile.gender ?? "male";
  const avatarSrc   = `/avatars/${gender}-${avatarStage}.png`;
  const habitEntry  = HABITS.find(h => h.value === profile.habit_type);
  const habitEmoji  = habitEntry?.emoji ?? "⚡";

  return (
    <main className="relative flex flex-col items-center min-h-screen px-6 py-10 overflow-hidden" style={{ backgroundColor: tc.bg }}>
      <style>{`
        @keyframes glowPulse    { 0%,100%{opacity:.6;transform:scale(1);} 50%{opacity:1;transform:scale(1.1);} }
        @keyframes floatUp      { 0%{transform:translateY(0) scale(1);opacity:0;} 12%{opacity:1;} 88%{opacity:.25;} 100%{transform:translateY(-95vh) scale(.5);opacity:0;} }
        @keyframes fadeSlideUp  { from{opacity:0;transform:translateY(28px);} to{opacity:1;transform:translateY(0);} }
        @keyframes shimmer      { 0%{background-position:-300% center;} 100%{background-position:300% center;} }
        @keyframes burst        { 0%{transform:translate(0,0) scale(1);opacity:1;} 100%{transform:translate(var(--tx),var(--ty)) scale(0);opacity:0;} }
        @keyframes checkDraw    { from{stroke-dashoffset:30;} to{stroke-dashoffset:0;} }
        @keyframes levelIn      { 0%{opacity:0;transform:scale(.85);} 25%{opacity:1;transform:scale(1.04);} 100%{opacity:1;transform:scale(1);} }
        @keyframes crownBounce  { 0%,100%{transform:translateY(0) rotate(-6deg);} 50%{transform:translateY(-14px) rotate(6deg);} }
        @keyframes levelBurst   { 0%{transform:translate(0,0) scale(1);opacity:1;} 100%{transform:translate(var(--lx),var(--ly)) scale(0);opacity:0;} }
        @keyframes avatarExit   { from{opacity:1;transform:scale(1);} to{opacity:0;transform:scale(.75);} }
        @keyframes avatarEnter  { 0%{opacity:0;transform:scale(.8);} 60%{transform:scale(1.06);} 100%{opacity:1;transform:scale(1);} }
        @keyframes avatarGlowBurst { 0%{opacity:0;transform:scale(.9);} 35%{opacity:1;transform:scale(1.5);} 100%{opacity:0;transform:scale(2);} }
        @keyframes avatarBounce { 0%{transform:scale(1);} 50%{transform:scale(1.2);} 100%{transform:scale(1);} }
        @keyframes avatarFloat  { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-4px);} }
        @keyframes avatarParticle { 0%{transform:translate(0,0) scale(1);opacity:1;} 100%{transform:translate(var(--atx),var(--aty)) scale(0);opacity:0;} }
        @keyframes doneTextAnim { 0%{opacity:0;transform:translate(-50%,-50%) scale(.5);} 25%{opacity:1;transform:translate(-50%,-50%) scale(1.1);} 65%{opacity:1;transform:translate(-50%,-50%) scale(1);} 100%{opacity:0;transform:translate(-50%,-50%) scale(.95);} }
      `}</style>

      {/* Background particles */}
      {BG_PARTICLES.map(p => (
        <div key={p.id} style={{ position: "absolute", left: p.left, bottom: -8, zIndex: 0, width: p.size, height: p.size, borderRadius: "50%", backgroundColor: tc.gold, animation: `floatUp ${p.dur}s ${p.delay}s infinite ease-in-out`, pointerEvents: "none" }} />
      ))}

      {/* Level-up overlay */}
      {justLeveled && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "radial-gradient(circle at center, rgba(201,168,76,0.22) 0%, rgba(13,13,31,0.96) 65%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, animation: "levelIn 0.45s ease-out forwards" }}>
          <div style={{ fontSize: 88, animation: "crownBounce 1.1s ease-in-out infinite" }}>👑</div>
          <div style={{ color: tc.gold, fontSize: 38, fontWeight: 900, letterSpacing: "0.22em", textShadow: `0 0 40px ${tc.gold}`, fontFamily: CINZEL }}>LEVEL UP!</div>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 700, opacity: 0.85 }}>Level {profile.level}</div>
          {Array.from({ length: 16 }, (_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const dist  = 130 + (i % 3) * 55;
            return (
              <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: 6 + (i%3)*3, height: 6 + (i%3)*3, borderRadius: "50%", backgroundColor: tc.gold, ["--lx" as string]: `${Math.cos(angle)*dist}px`, ["--ly" as string]: `${Math.sin(angle)*dist}px`, animation: `levelBurst 1.3s ${i*0.045}s ease-out forwards` }} />
            );
          })}
        </div>
      )}

      {/* ✓ DONE! overlay */}
      {showDoneText && (
        <div style={{ position: "fixed", top: "50%", left: "50%", zIndex: 90, pointerEvents: "none", animation: "doneTextAnim 1.5s ease-out forwards" }}>
          <span style={{ fontSize: 52, fontWeight: 900, letterSpacing: "0.1em", color: tc.gold, textShadow: `0 0 30px ${tc.gold}88, 0 0 60px ${tc.gold}44`, fontFamily: CINZEL }}>
            ✓ DONE!
          </span>
        </div>
      )}

      {/* Content */}
      <div className="relative flex flex-col items-center w-full gap-6" style={{ zIndex: 1 }}>
        {/* Logo */}
        <div className="w-full flex flex-col items-center gap-1 mt-2" style={{ animation: "fadeSlideUp 0.5s 0ms ease-out both" }}>
          <h1 className="text-4xl font-black tracking-widest" style={{ color: tc.goldLight, fontFamily: CINZEL }}>HabitRise</h1>
          <span className="text-xs font-medium" style={{ color: tc.goldLight, opacity: 0.45 }}>{user.email}</span>
        </div>

        {/* Hero Card */}
        <div style={{ animation: "fadeSlideUp 0.5s 100ms ease-out both" }}>
          <div style={{ border: `1px solid ${tc.border}`, background: `linear-gradient(180deg, ${tc.card}ee 0%, ${tc.bg}00 100%)`, borderRadius: 28, padding: "32px 32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, boxShadow: `0 0 40px ${tc.gold}14, inset 0 1px 0 ${tc.border}`, backdropFilter: "blur(12px)" }}>
            <div style={{ position: "relative", width: 220, height: 220 }}>
              <div style={{ position: "absolute", inset: -32, borderRadius: "50%", background: `radial-gradient(circle, ${tc.gold}38 0%, transparent 70%)`, animation: "glowPulse 3s ease-in-out infinite", pointerEvents: "none" }} />
              <div style={{ position: "absolute", inset: -4, borderRadius: "50%", boxShadow: `0 0 35px 12px ${tc.gold}40, 0 0 80px 20px ${tc.gold}1a`, animation: "glowPulse 3s ease-in-out infinite", pointerEvents: "none" }} />
              {avatarGlowBurst && (
                <div style={{ position: "absolute", inset: -30, borderRadius: "50%", background: `radial-gradient(circle, ${tc.gold}b0 0%, transparent 65%)`, animation: "avatarGlowBurst 0.7s ease-out forwards", pointerEvents: "none", zIndex: 2 }} />
              )}
              {/* Avatar burst particles */}
              {showAvatarBurst && AVATAR_BURST_DIRS.map((b, i) => (
                <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: 6, height: 6, borderRadius: "50%", backgroundColor: tc.gold, marginTop: -3, marginLeft: -3, ["--atx" as string]: `${b.tx}px`, ["--aty" as string]: `${b.ty}px`, animation: `avatarParticle 1s ${i*0.03}s ease-out forwards`, zIndex: 3, pointerEvents: "none" }} />
              ))}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={avatarSrc} src={avatarSrc} alt="Hero"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", ...(themeKey === "dark" ? { mixBlendMode: "screen" as const } : {}), background: "transparent", filter: heroStatus === "sleeping" ? `drop-shadow(0 0 18px rgba(100,120,200,0.5)) grayscale(0.4) brightness(0.7)` : themeKey === "dark" ? `drop-shadow(0 0 18px ${tc.gold}80)` : `drop-shadow(0 0 10px ${tc.gold}50)`, zIndex: 1,
                  animation: avatarExiting  ? "avatarExit 0.35s ease-in forwards"
                           : avatarEntering ? "avatarEnter 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards"
                           : avatarBounce   ? "avatarBounce 0.3s ease-out forwards"
                           : heroStatus === "sleeping" ? "none"
                           : "avatarFloat 3s ease-in-out infinite",
                }} />
              {/* Sleep overlay */}
              {heroStatus === "sleeping" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingTop: 8, paddingRight: 8, zIndex: 4, pointerEvents: "none" }}>
                  <span style={{ fontSize: 36, animation: "avatarFloat 2s ease-in-out infinite" }}>💤</span>
                </div>
              )}
            </div>
            <div className="font-black tracking-wide text-center" style={{ color: tc.goldLight, fontSize: 24, textShadow: `0 0 20px ${tc.gold}66`, fontFamily: CINZEL }}>
              {profile.username || "Hero"}
            </div>
            <span className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: tc.goldLight, opacity: 0.45 }}>
              {t.stage} {avatarStage} · {t.level} {profile.level}
            </span>
          </div>
        </div>

        {/* Sleeping / Decayed banner */}
        {heroStatus === "sleeping" && !completedToday && (
          <div style={{ width: "100%", maxWidth: 340, padding: "14px 18px", borderRadius: 16, backgroundColor: "rgba(100,120,200,0.1)", border: "1px solid rgba(100,120,200,0.25)", textAlign: "center", animation: "fadeSlideUp 0.5s 150ms ease-out both" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#7B8FD4", marginBottom: 4 }}>
              {lang === "he" ? "😴 הגיבור שלך ישן..." : "😴 Your hero is sleeping..."}
            </div>
            <div style={{ fontSize: 12, color: tc.textSub, lineHeight: 1.4 }}>
              {lang === "he" ? "סמן את ההרגל היום כדי להעיר אותו ולשמור על הסטריק!" : "Complete your habit today to wake them up and save your streak!"}
            </div>
          </div>
        )}

        {/* Daily Quote — above habit card */}
        <DailyQuote lang={lang} tc={tc} />

        {/* Habit Card — right after hero */}
        <div style={{ width: "100%", animation: "fadeSlideUp 0.5s 200ms ease-out both" }}>
          <div onClick={!completedToday && !checking ? handleCheck : undefined}
            className="btn-gold"
            style={{ position: "relative", overflow: "hidden", backgroundColor: completedToday ? `${tc.gold}12` : tc.card, border: `1px solid ${completedToday ? tc.gold : "rgba(201,168,76,0.1)"}`, borderRadius: 16, padding: "22px 24px", display: "flex", alignItems: "center", gap: 18, cursor: completedToday ? "default" : "pointer", opacity: checking ? 0.6 : 1, transition: "border-color 0.3s, background-color 0.3s", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
            {completedToday && (
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.18) 50%, transparent 100%)", backgroundSize: "300% auto", animation: "shimmer 2.8s linear infinite" }} />
            )}
            <span style={{ fontSize: 40, flexShrink: 0, zIndex: 1 }}>{habitEmoji}</span>
            <div className="flex-1" style={{ zIndex: 1 }}>
              <div className="font-black" style={{ color: tc.goldLight, fontSize: 17, opacity: completedToday ? 0.65 : 1 }}>{profile.habit_type}</div>
              <div className="text-xs font-semibold mt-1" style={{ color: tc.gold, opacity: 0.55 }}>
                {completedToday ? `✓ ${lang === "he" ? "כבר עשית היום" : "Done for today"}` : `+${XP_PER_COMPLETION} XP`}
              </div>
            </div>
            <div style={{ position: "relative", flexShrink: 0, zIndex: 1 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid #C9A84C`, backgroundColor: completedToday ? "#C9A84C" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.35s ease" }}>
                {completedToday && (
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10L8.5 14.5L16 6" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" style={{ animation: "checkDraw 0.4s ease-out forwards" }} />
                  </svg>
                )}
              </div>
              {showBurst && BURST_DIRS.map((b, i) => (
                <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: 7, height: 7, borderRadius: "50%", backgroundColor: tc.gold, ["--tx" as string]: `${b.tx}px`, ["--ty" as string]: `${b.ty}px`, animation: `burst 0.75s ${i*0.04}s ease-out forwards` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="flex flex-col items-center gap-1" style={{ animation: "fadeSlideUp 0.5s 300ms ease-out both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="text-8xl font-black leading-none" style={{ color: tc.goldLight, fontFamily: CINZEL }}>{profile.current_streak}</span>
            <span style={{ fontSize: 48 }}>🔥</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 500 }}>
            {lang === "he" ? "רצף נוכחי" : "Current streak"}
          </span>
          <div className="mt-1 w-16 h-px rounded-full" style={{ backgroundColor: tc.gold, opacity: 0.3 }} />
        </div>

        {/* XP Bar */}
        <div style={{ width: 320, animation: "fadeSlideUp 0.5s 400ms ease-out both" }} className="flex flex-col gap-2">
          <div className="flex justify-between text-xs font-semibold" style={{ color: tc.gold, opacity: 0.6 }}>
            <span>{xpInLvl} XP</span>
            <span>{xpToNext} {t.xpToNext} {profile.level + 1}</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: tc.xpTrack }}>
            <div className="h-full rounded-full" style={{ width: `${xpPct}%`, backgroundColor: tc.gold, transition: "width 1.2s ease-out" }} />
          </div>
        </div>


      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Quote
// ─────────────────────────────────────────────────────────────────────────────
function DailyQuote({ lang, tc }: { lang: Lang; tc: TC }) {
  const quotes = MOTIVATIONAL_QUOTES[lang];
  const todayIndex = new Date().getDate() % quotes.length;
  const quote = quotes[todayIndex];
  const isRtl = lang === "he";

  return (
    <div style={{
      width: "100%",
      height: 80,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      animation: "quoteIn 1s ease-out both",
    }}>
      <style>{`@keyframes quoteIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      {/* Decorative opening quote */}
      <span style={{
        position: "absolute",
        left: isRtl ? "auto" : 0,
        right: isRtl ? 0 : "auto",
        top: -4,
        fontSize: 48,
        lineHeight: 1,
        color: tc.gold,
        opacity: 0.15,
        fontFamily: "Georgia, serif",
        userSelect: "none",
        pointerEvents: "none",
      }}>
        &ldquo;
      </span>
      <p style={{
        fontStyle: "italic",
        fontSize: 17,
        fontWeight: 700,
        color: "rgba(240,237,232,0.9)",
        textAlign: "center",
        maxWidth: 280,
        lineHeight: 1.6,
        margin: 0,
        padding: "0 28px",
        direction: isRtl ? "rtl" : "ltr",
        textShadow: "0 2px 12px rgba(201,168,76,0.35), 0 1px 4px rgba(0,0,0,0.5)",
      }}>
        {quote}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile Tab
// ─────────────────────────────────────────────────────────────────────────────
function ProfileTab({
  user, profile, setProfile, tc, t, lang, themeKey,
}: {
  user: User; profile: Profile; setProfile: (p: Profile) => void;
  tc: TC; t: TT; lang: Lang; themeKey: ThemeKey;
}) {
  const [showChangeHabit, setShowChangeHabit] = useState(false);
  const [xpAnimated, setXpAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setXpAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const xpPct    = xpPercent(profile.total_xp);
  const xpInLvl  = profile.total_xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpInLvl;
  const avatarStage = profile.avatar_stage ?? 1;
  const gender      = profile.gender ?? "male";
  const avatarSrc   = `/avatars/${gender}-${avatarStage}.png`;

  return (
    <main style={{ backgroundColor: tc.bg, minHeight: "100vh", padding: "48px 20px 32px" }}>
      <style>{`
        @keyframes avatarFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-4px);} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
      `}</style>

      {/* Header */}
      <h1 style={{ fontFamily: CINZEL, color: tc.gold, fontSize: 26, fontWeight: 700, textAlign: "center", marginBottom: 28, letterSpacing: "0.1em" }}>
        {t.profile}
      </h1>

      {/* Avatar + Name */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 28, animation: "fadeIn 0.4s ease-out both" }}>
        <div style={{ position: "relative", width: 130, height: 130 }}>
          <div style={{ position: "absolute", inset: -20, borderRadius: "50%", background: `radial-gradient(circle, ${tc.gold}30 0%, transparent 70%)` }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarSrc} alt="Hero"
            style={{ width: "100%", height: "100%", objectFit: "contain", ...(themeKey === "dark" ? { mixBlendMode: "screen" as const } : {}), filter: themeKey === "dark" ? `drop-shadow(0 0 12px ${tc.gold}70)` : `drop-shadow(0 0 8px ${tc.gold}40)`, animation: "avatarFloat 3s ease-in-out infinite" }} />
        </div>
        <div style={{ fontFamily: CINZEL, color: tc.goldLight, fontSize: 26, fontWeight: 700, textShadow: `0 0 20px ${tc.gold}55` }}>
          {profile.username || "Hero"}
        </div>
        <div style={{ color: tc.textSub, fontSize: 12, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase" }}>
          {t.stage} {avatarStage} · {t.level} {profile.level}
        </div>
      </div>

      {/* Streak Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, animation: "fadeIn 0.4s 0.1s ease-out both" }}>
        {[
          { label: t.dayStreak, value: profile.current_streak, icon: "🔥" },
          { label: t.longestStreak, value: profile.longest_streak, icon: "🏆" },
        ].map(stat => (
          <div key={stat.label} style={{ flex: 1, backgroundColor: tc.card, border: `1px solid ${tc.border}`, borderRadius: 16, padding: "18px 16px", textAlign: "center", backdropFilter: "blur(8px)" }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontFamily: CINZEL, color: tc.goldLight, fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ color: tc.textSub, fontSize: 11, fontWeight: 600, marginTop: 4, letterSpacing: "0.1em" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* XP Bar */}
      <div style={{ backgroundColor: tc.card, border: `1px solid ${tc.border}`, borderRadius: 16, padding: "18px 20px", marginBottom: 20, animation: "fadeIn 0.4s 0.15s ease-out both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontFamily: CINZEL, color: tc.gold, fontSize: 14, fontWeight: 700 }}>{t.level} {profile.level}</span>
          <span style={{ color: tc.textSub, fontSize: 12 }}>{xpInLvl} / {XP_PER_LEVEL} XP · {Math.round(xpPct)}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 999, backgroundColor: tc.xpTrack, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${tc.gold}, ${tc.goldLight})`, width: xpAnimated ? `${xpPct}%` : "0%", transition: "width 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
        </div>
        <div style={{ color: tc.textSub, fontSize: 11, marginTop: 8, textAlign: "center" }}>
          {xpToNext} XP {t.xpToNext} {profile.level + 1}
        </div>
      </div>

      {/* Calendar */}
      <MonthCalendar uid={user.id} tc={tc} t={t} lang={lang} />

      {/* Change Habit */}
      <button
        className="btn-gold"
        onClick={() => setShowChangeHabit(true)}
        style={{ width: "100%", marginTop: 16, padding: "16px", borderRadius: 16, border: `1.5px solid ${tc.border}`, backgroundColor: tc.card, color: tc.gold, fontWeight: 700, fontSize: 15, fontFamily: CINZEL, letterSpacing: "0.05em", cursor: "pointer", animation: "fadeIn 0.4s 0.35s ease-out both" }}>
        {t.changeHabit} ✦
      </button>

      {showChangeHabit && (
        <ChangeHabitModal
          profile={profile}
          tc={tc} t={t} lang={lang}
          onClose={() => setShowChangeHabit(false)}
          onSave={(newHabit) => setProfile({ ...profile, habit_type: newHabit })}
        />
      )}
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Monthly Calendar
// ─────────────────────────────────────────────────────────────────────────────
function MonthCalendar({ uid, tc, t, lang }: { uid: string; tc: TC; t: TT; lang: Lang }) {
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [animated, setAnimated] = useState(false);

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = lang === "he" ? MONTH_NAMES_HE[month] : MONTH_NAMES_EN[month];

  useEffect(() => {
    const from = new Date(year, month, 1).toISOString();
    const to   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    supabase.from("habit_logs").select("completed_at")
      .eq("user_id", uid).gte("completed_at", from).lte("completed_at", to)
      .then(({ data }) => {
        const days = new Set((data ?? []).map(l => new Date(l.completed_at).getDate()));
        setCompletedDays(days);
        setTimeout(() => setAnimated(true), 80);
      });
  }, [uid, year, month]);

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const dayLabels = lang === "he"
    ? ["א","ב","ג","ד","ה","ו","ש"]
    : ["Su","Mo","Tu","We","Th","Fr","Sa"];

  return (
    <div style={{ backgroundColor: tc.card, border: `1px solid ${tc.border}`, borderRadius: 16, padding: "18px 16px", animation: "fadeIn 0.4s 0.25s ease-out both" }}>
      <div style={{ fontFamily: CINZEL, color: tc.gold, fontSize: 14, fontWeight: 700, marginBottom: 14, textAlign: "center", letterSpacing: "0.08em" }}>
        {t.currentMonth} — {monthName} {year}
      </div>
      {/* Day labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
        {dayLabels.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 9, color: tc.textSub, fontWeight: 700, letterSpacing: "0.05em" }}>{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((day, i) => {
          const done    = day !== null && completedDays.has(day);
          const isToday = day === today;
          const delay   = day ? day * 0.018 : 0;
          return (
            <div key={i} style={{
              aspectRatio: "1",
              borderRadius: 8,
              backgroundColor: day === null ? "transparent" : done ? `${tc.gold}cc` : tc.calEmpty,
              border: day === null ? "none" : isToday ? `1.5px solid ${tc.gold}` : `1px solid ${done ? tc.gold : tc.calBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: done ? 800 : 500,
              color: done ? tc.bg : isToday ? tc.gold : tc.textSub,
              opacity: animated ? 1 : 0,
              transform: animated ? "scale(1)" : "scale(0.4)",
              transition: `opacity 0.35s ${delay}s ease-out, transform 0.35s ${delay}s ease-out`,
            }}>
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Change Habit Modal
// ─────────────────────────────────────────────────────────────────────────────
function ChangeHabitModal({
  profile, tc, t, lang, onClose, onSave,
}: {
  profile: Profile; tc: TC; t: TT; lang: Lang;
  onClose: () => void; onSave: (habit: string) => void;
}) {
  const [selected, setSelected] = useState(profile.habit_type);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase.from("profiles").update({ habit_type: selected }).eq("id", profile.id);
    setSaving(false);
    onSave(selected);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 90px" }}>
      <style>{`@keyframes modalUp { from{opacity:0;transform:translateY(40px);} to{opacity:1;transform:translateY(0);} }`}</style>
      <div style={{ width: "100%", maxWidth: 480, backgroundColor: tc.card, border: `1px solid ${tc.border}`, borderRadius: "24px 24px 16px 16px", padding: "28px 24px 24px", animation: "modalUp 0.3s ease-out both" }}>
        <h2 style={{ fontFamily: CINZEL, color: tc.gold, fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 20 }}>
          {t.chooseHabit}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {HABITS.map(h => (
            <button key={h.value} onClick={() => setSelected(h.value)}
              className="btn-gold"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "18px 12px", borderRadius: 16, cursor: "pointer", backgroundColor: selected === h.value ? `${tc.gold}18` : tc.bg, border: `2px solid ${selected === h.value ? tc.gold : tc.border}`, transform: selected === h.value ? "scale(1.03)" : "scale(1)", transition: "all 0.2s ease" }}>
              <span style={{ fontSize: 30 }}>{h.emoji}</span>
              <span style={{ color: tc.gold, fontSize: 13, fontWeight: 700 }}>{lang === "he" ? h.label : h.labelEn}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} className="btn-gold"
            style={{ flex: 1, padding: "14px", borderRadius: 14, border: `1px solid ${tc.border}`, backgroundColor: "transparent", color: tc.textSub, fontWeight: 700, cursor: "pointer" }}>
            {t.cancel}
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-gold"
            style={{ flex: 2, padding: "14px", borderRadius: 14, border: "none", background: `linear-gradient(135deg, #8B6914, ${tc.gold})`, color: "#0D0D1F", fontWeight: 800, fontSize: 15, fontFamily: CINZEL, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "..." : t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Tab
// ─────────────────────────────────────────────────────────────────────────────
function SettingsTab({
  onSignOut, tc, t, lang, themeKey, onChangeLang, onChangeTheme,
}: {
  onSignOut: () => void; tc: TC; t: TT; lang: Lang;
  themeKey: ThemeKey; onChangeLang: (l: Lang) => void; onChangeTheme: (k: ThemeKey) => void;
}) {
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [pushLoading, setPushLoading] = useState(false);
  const [notifBlocked, setNotifBlocked] = useState(false);
  const [notifUnsupported, setNotifUnsupported] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const isHe = lang === "he";

  useEffect(() => {
    const savedReminder = localStorage.getItem("hr-reminder");
    const savedHour = localStorage.getItem("hr-reminder-hour");
    if (savedReminder === "1") setReminderEnabled(true);
    if (savedHour) setReminderHour(parseInt(savedHour, 10));

    // Detect notification support & blocked
    if (!("Notification" in window)) {
      setNotifUnsupported(true);
    } else if (Notification.permission === "denied") {
      setNotifBlocked(true);
    }

    // Detect standalone (installed PWA)
    const mqStandalone = window.matchMedia("(display-mode: standalone)");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setIsStandalone(mqStandalone.matches || (navigator as any).standalone === true);

    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform("ios");
    } else if (/android/.test(ua)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }
  }, []);

  async function toggleReminder() {
    if (reminderEnabled) {
      setReminderEnabled(false);
      localStorage.setItem("hr-reminder", "0");
      return;
    }
    if (notifUnsupported || notifBlocked) return;
    setPushLoading(true);
    try {
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          setReminderEnabled(true);
          localStorage.setItem("hr-reminder", "1");
        } else if (perm === "denied") {
          setNotifBlocked(true);
        }
      }
    } catch { /* ignore */ }
    setPushLoading(false);
  }

  function changeHour(h: number) {
    setReminderHour(h);
    localStorage.setItem("hr-reminder-hour", String(h));
  }

  return (
    <main style={{ backgroundColor: tc.bg, minHeight: "100vh", padding: "48px 24px 32px" }}>
      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }`}</style>

      <h1 style={{ fontFamily: CINZEL, color: tc.gold, fontSize: 26, fontWeight: 700, marginBottom: 36, letterSpacing: "0.1em" }}>
        {t.settings}
      </h1>

      {/* Language */}
      <SettingCard label={t.language} tc={tc} delay={0}>
        <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", border: `1px solid ${tc.border}` }}>
          {(["he", "en"] as Lang[]).map(l => (
            <button key={l} onClick={() => onChangeLang(l)} className="btn-gold"
              style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", backgroundColor: lang === l ? tc.gold : "transparent", color: lang === l ? (themeKey === "dark" ? "#0D0D1F" : "#FFFDF8") : tc.textSub, transition: "all 0.2s ease" }}>
              {l === "he" ? "עברית" : "English"}
            </button>
          ))}
        </div>
      </SettingCard>

      {/* Dark / Light mode */}
      <SettingCard label={t.darkMode} tc={tc} delay={0.07}>
        <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", border: `1px solid ${tc.border}` }}>
          {(["dark", "light"] as ThemeKey[]).map(k => (
            <button key={k} onClick={() => onChangeTheme(k)} className="btn-gold"
              style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", backgroundColor: themeKey === k ? tc.gold : "transparent", color: themeKey === k ? (themeKey === "dark" ? "#0D0D1F" : "#FFFDF8") : tc.textSub, transition: "all 0.2s ease" }}>
              {k === "dark" ? "🌙 Dark" : "☀️ Light"}
            </button>
          ))}
        </div>
      </SettingCard>

      {/* Daily Reminder */}
      <SettingCard label={isHe ? "תזכורת יומית" : "Daily Reminder"} tc={tc} delay={0.14}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", direction: isHe ? "rtl" : "ltr" }}>
          <div>
            <div style={{ color: tc.text, fontSize: 14, fontWeight: 600 }}>
              {isHe ? "קבל תזכורת יומית" : "Get daily reminder"}
            </div>
            <div style={{ color: tc.textSub, fontSize: 11, marginTop: 2 }}>
              {isHe ? "כדי לא לשכוח לסמן את ההרגל" : "So you don't forget your habit"}
            </div>
          </div>
          <button
            onClick={toggleReminder}
            disabled={pushLoading || notifBlocked || notifUnsupported}
            style={{
              width: 52, height: 30, borderRadius: 15, border: "none", cursor: (notifBlocked || notifUnsupported) ? "not-allowed" : "pointer",
              backgroundColor: reminderEnabled ? tc.gold : tc.toggleOff,
              position: "relative", transition: "background-color 0.3s ease", flexShrink: 0,
              opacity: (pushLoading || notifBlocked || notifUnsupported) ? 0.4 : 1,
            }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", backgroundColor: "#fff",
              position: "absolute", top: 3,
              left: reminderEnabled ? 25 : 3,
              transition: "left 0.3s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }} />
          </button>
        </div>
        {/* Warning: notifications blocked */}
        {notifBlocked && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, backgroundColor: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", direction: isHe ? "rtl" : "ltr" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🚫</span>
              <div style={{ color: "#ff6b6b", fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
                {isHe
                  ? "ההתראות חסומות בדפדפן. כדי להפעיל, עבור להגדרות הדפדפן ← אתר זה ← הרשאות ← התראות ← אפשר."
                  : "Notifications are blocked. To enable, go to Browser Settings → This Site → Permissions → Notifications → Allow."}
              </div>
            </div>
          </div>
        )}
        {/* Warning: notifications not supported */}
        {notifUnsupported && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, backgroundColor: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)", direction: isHe ? "rtl" : "ltr" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <div style={{ color: "#e6a400", fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
                {isHe
                  ? "הדפדפן שלך לא תומך בהתראות. נסה לפתוח מ-Safari או Chrome."
                  : "Your browser does not support notifications. Try opening from Safari or Chrome."}
              </div>
            </div>
          </div>
        )}
        {reminderEnabled && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${tc.border}` }}>
            <div style={{ color: tc.textSub, fontSize: 11, fontWeight: 600, marginBottom: 8, direction: isHe ? "rtl" : "ltr" }}>
              {isHe ? "שעת תזכורת:" : "Reminder time:"}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[18, 19, 20, 21, 22].map(h => (
                <button key={h} onClick={() => changeHour(h)}
                  style={{
                    padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${reminderHour === h ? tc.gold : tc.border}`,
                    backgroundColor: reminderHour === h ? `${tc.gold}18` : "transparent",
                    color: reminderHour === h ? tc.gold : tc.textSub,
                    fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s ease",
                  }}>
                  {`${h}:00`}
                </button>
              ))}
            </div>
          </div>
        )}
      </SettingCard>

      {/* Smart App Installation */}
      <SettingCard label={isHe ? "התקנת האפליקציה" : "Install App"} tc={tc} delay={0.21}>
        <div style={{ direction: isHe ? "rtl" : "ltr" }}>
          {isStandalone ? (
            /* App is already installed */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "16px 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${tc.gold}30, ${tc.gold}15)`, border: `2px solid ${tc.gold}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✅</div>
              <div style={{ color: tc.gold, fontSize: 16, fontWeight: 700, fontFamily: CINZEL }}>
                {isHe ? "האפליקציה מותקנת!" : "App is installed!"}
              </div>
              <div style={{ color: tc.textSub, fontSize: 12, textAlign: "center" }}>
                {isHe ? "את/ה משתמש/ת בגרסה המלאה של HabitRise" : "You're using the full version of HabitRise"}
              </div>
            </div>
          ) : platform === "ios" ? (
            /* iOS Safari installation guide */
            <>
              <div style={{ color: tc.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                {isHe ? "iPhone / iPad (Safari):" : "iPhone / iPad (Safari):"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { num: 1, text: isHe ? 'לחץ על כפתור "שיתוף" (⬆️) בתחתית Safari' : 'Tap the "Share" button (⬆️) at the bottom of Safari' },
                  { num: 2, text: isHe ? 'גלול למטה ובחר "הוסף למסך הבית"' : 'Scroll down and select "Add to Home Screen"' },
                  { num: 3, text: isHe ? 'לחץ "הוסף" בפינה הימנית העליונה' : 'Tap "Add" in the top right corner' },
                  { num: 4, text: isHe ? "האפליקציה תופיע במסך הבית שלך!" : "The app will appear on your home screen!" },
                ].map(step => (
                  <div key={step.num} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: `linear-gradient(135deg, ${tc.gold}30, ${tc.gold}10)`,
                      border: `1.5px solid ${tc.gold}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: tc.gold, fontSize: 12, fontWeight: 800,
                    }}>
                      {step.num}
                    </div>
                    <div style={{ color: tc.text, fontSize: 13, fontWeight: 500, lineHeight: 1.5, paddingTop: 3 }}>
                      {step.text}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : platform === "android" ? (
            /* Android Chrome installation guide */
            <>
              <div style={{ color: tc.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                {isHe ? "Android (Chrome):" : "Android (Chrome):"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { num: 1, text: isHe ? 'לחץ על תפריט ⋮ (שלוש נקודות) בפינה העליונה' : 'Tap the ⋮ menu (three dots) in the top corner' },
                  { num: 2, text: isHe ? 'בחר "הוסף למסך הבית" או "התקן אפליקציה"' : 'Select "Add to Home Screen" or "Install App"' },
                  { num: 3, text: isHe ? 'אשר את ההתקנה' : 'Confirm the installation' },
                  { num: 4, text: isHe ? "האפליקציה תופיע במסך הבית שלך!" : "The app will appear on your home screen!" },
                ].map(step => (
                  <div key={step.num} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: `linear-gradient(135deg, ${tc.gold}30, ${tc.gold}10)`,
                      border: `1.5px solid ${tc.gold}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: tc.gold, fontSize: 12, fontWeight: 800,
                    }}>
                      {step.num}
                    </div>
                    <div style={{ color: tc.text, fontSize: 13, fontWeight: 500, lineHeight: 1.5, paddingTop: 3 }}>
                      {step.text}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Desktop browser */
            <>
              <div style={{ color: tc.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                {isHe ? "מחשב (Chrome / Edge):" : "Desktop (Chrome / Edge):"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { num: 1, text: isHe ? "חפש את אייקון ההתקנה (⊕) בשורת הכתובת" : 'Look for the install icon (⊕) in the address bar' },
                  { num: 2, text: isHe ? 'לחץ עליו ובחר "התקן"' : 'Click it and select "Install"' },
                  { num: 3, text: isHe ? "האפליקציה תיפתח כחלון נפרד!" : "The app will open as a standalone window!" },
                ].map(step => (
                  <div key={step.num} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: `linear-gradient(135deg, ${tc.gold}30, ${tc.gold}10)`,
                      border: `1.5px solid ${tc.gold}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: tc.gold, fontSize: 12, fontWeight: 800,
                    }}>
                      {step.num}
                    </div>
                    <div style={{ color: tc.text, fontSize: 13, fontWeight: 500, lineHeight: 1.5, paddingTop: 3 }}>
                      {step.text}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {!isStandalone && (
            <div style={{
              marginTop: 16, padding: "12px 14px", borderRadius: 12,
              backgroundColor: `${tc.gold}08`, border: `1px solid ${tc.gold}20`,
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
              <div style={{ color: tc.textSub, fontSize: 12, lineHeight: 1.5 }}>
                {isHe
                  ? "התקנת האפליקציה מאפשרת חוויה מלאה כמו אפליקציה רגילה — עם אייקון במסך הבית, מסך מלא, ותזכורות."
                  : "Installing the app gives you a full app experience — with a home screen icon, full screen mode, and reminders."}
              </div>
            </div>
          )}
        </div>
      </SettingCard>

      {/* Sign Out */}
      <div style={{ animation: "fadeIn 0.4s 0.28s ease-out both" }}>
        <button onClick={onSignOut} className="btn-gold"
          style={{ width: "100%", marginTop: 12, padding: "16px", borderRadius: 16, border: `1.5px solid rgba(255,80,80,0.35)`, backgroundColor: "transparent", color: "#ff6b6b", fontWeight: 700, fontSize: 15, fontFamily: CINZEL, cursor: "pointer", letterSpacing: "0.05em" }}>
          {t.signOut}
        </button>
      </div>
    </main>
  );
}

function SettingCard({ label, tc, delay, children }: { label: string; tc: TC; delay: number; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: tc.card, border: `1px solid ${tc.border}`, borderRadius: 16, padding: "18px 20px", marginBottom: 12, animation: `fadeIn 0.4s ${delay}s ease-out both` }}>
      <div style={{ color: tc.textSub, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>{label}</div>
      {children}
    </div>
  );
}
