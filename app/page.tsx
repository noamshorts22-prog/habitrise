"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
    bg: "#F8F4EC", card: "#FFFFFF", card2: "#F0EBE0",
    border: "rgba(184,146,42,0.3)", borderStrong: "rgba(184,146,42,0.6)",
    text: "#1A1A2E", textSub: "#6B7280", textMuted: "rgba(26,26,46,0.3)",
    gold: "#B8922A", goldLight: "#C9A84C",
    navBg: "rgba(240,236,228,0.97)", navBorder: "rgba(184,146,42,0.3)",
    calEmpty: "#EDE9E0", calBorder: "rgba(184,146,42,0.12)",
    toggleOff: "#D1D5DB", inputBg: "#F0EBE0",
    xpTrack: "#E5DDD0",
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
type AppView = "loading" | "login" | "onboarding" | "home";

export default function Root() {
  const [view, setView]   = useState<AppView>("loading");
  const [user, setUser]   = useState<User | null>(null);
  const timeoutRef        = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    timeoutRef.current = setTimeout(() => {
      if (mounted) setView(v => v === "loading" ? "login" : v);
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (!mounted) return;

          if (!session) {
            setView("login");
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
          // AbortError = React Strict Mode double-mount artifact — safe to ignore
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
      <main style={{ backgroundColor: "#0D0D1F", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes loadingPulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }`}</style>
        <span style={{ color: "#C9A84C", fontFamily: CINZEL, fontSize: 18, fontWeight: 700, letterSpacing: "0.2em", animation: "loadingPulse 1.5s ease-in-out infinite" }}>
          LOADING...
        </span>
      </main>
    );
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
// Login Screen
// ─────────────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin: _onLogin }: { onLogin: (u: User) => void }) {
  return (
    <main style={{ background: "linear-gradient(180deg, #0D0D1F 0%, #060610 100%)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glowPulseLogin { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        .google-btn:hover { border-color: rgba(201,168,76,0.7) !important; background: rgba(201,168,76,0.06) !important; transform: scale(1.02); }
        .google-btn { transition: all 0.2s ease; }
      `}</style>

      {/* Glow orb */}
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)", animation: "glowPulseLogin 4s ease-in-out infinite", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 56, animation: "fadeUp 0.5s ease-out both" }}>
        <h1 style={{ fontSize: 52, fontFamily: CINZEL, fontWeight: 900, color: "#C9A84C", letterSpacing: "0.14em", lineHeight: 1, margin: 0, textShadow: "0 0 40px rgba(201,168,76,0.35)" }}>
          HabitRise
        </h1>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.45em", textTransform: "uppercase", color: "#C9A84C", opacity: 0.35 }}>
          Rise Every Day
        </span>
      </div>

      {/* Google button */}
      <div style={{ width: "100%", maxWidth: 340, animation: "fadeUp 0.5s 0.15s ease-out both" }}>
        <button
          className="google-btn"
          onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } })}
          style={{ width: "100%", padding: "17px 24px", borderRadius: 16, backgroundColor: "transparent", border: "1.5px solid rgba(201,168,76,0.3)", color: "#ffffff", fontWeight: 600, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
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
      setProfile((prof ?? makeDefaultProfile(uid)) as Profile);
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
        {activeTab === "home"     && <HomeTab     user={user} profile={profile} setProfile={setProfile} completedToday={completedToday} setCompletedToday={setCompletedToday} tc={tc} t={t} lang={lang} />}
        {activeTab === "profile"  && <ProfileTab  user={user} profile={profile} setProfile={setProfile} tc={tc} t={t} lang={lang} />}
        {activeTab === "settings" && <SettingsTab onSignOut={onSignOut} tc={tc} t={t} lang={lang} themeKey={themeKey} onChangeLang={changeLang} onChangeTheme={changeTheme} />}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={switchTab} tc={tc} t={t} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom Nav
// ─────────────────────────────────────────────────────────────────────────────
function BottomNav({
  activeTab, setActiveTab, tc, t,
}: {
  activeTab: string;
  setActiveTab: (tab: typeof TAB_ORDER[number]) => void;
  tc: TC; t: TT;
}) {
  const tabs = [
    { id: "home",     emoji: "🏠", label: t.home     },
    { id: "profile",  emoji: "👤", label: t.profile  },
    { id: "settings", emoji: "⚙️", label: t.settings },
  ] as const;

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      backgroundColor: tc.navBg,
      borderTop: `1px solid ${tc.navBorder}`,
      backdropFilter: "blur(24px)",
      display: "flex", justifyContent: "space-around",
      padding: "10px 0 14px",
    }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 20px", position: "relative" }}>
            <span
              key={isActive ? `${tab.id}-on` : `${tab.id}-off`}
              style={{ fontSize: 22, display: "block", animation: isActive ? "navBounce 0.4s ease-out" : "none" }}>
              {tab.emoji}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: isActive ? tc.gold : tc.textSub, transition: "color 0.2s ease" }}>
              {tab.label}
            </span>
            {isActive && (
              <div style={{ height: 2, borderRadius: 1, backgroundColor: tc.gold, animation: "underlineGrow 0.3s ease-out forwards", position: "absolute", bottom: 0 }} />
            )}
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
  user, profile, setProfile, completedToday, setCompletedToday, tc, t, lang,
}: {
  user: User; profile: Profile; setProfile: (p: Profile) => void;
  completedToday: boolean; setCompletedToday: (v: boolean) => void;
  tc: TC; t: TT; lang: Lang;
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
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "screen", background: "transparent", filter: `drop-shadow(0 0 18px ${tc.gold}80)`, zIndex: 1,
                  animation: avatarExiting  ? "avatarExit 0.35s ease-in forwards"
                           : avatarEntering ? "avatarEnter 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards"
                           : avatarBounce   ? "avatarBounce 0.3s ease-out forwards"
                           : "avatarFloat 3s ease-in-out infinite",
                }} />
            </div>
            <div className="font-black tracking-wide text-center" style={{ color: tc.goldLight, fontSize: 24, textShadow: `0 0 20px ${tc.gold}66`, fontFamily: CINZEL }}>
              {profile.username || "Hero"}
            </div>
            <span className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: tc.goldLight, opacity: 0.45 }}>
              {t.stage} {avatarStage} · {t.level} {profile.level}
            </span>
          </div>
        </div>

        {/* Streak */}
        <div className="flex flex-col items-center gap-1" style={{ animation: "fadeSlideUp 0.5s 200ms ease-out both" }}>
          <span className="text-8xl font-black leading-none" style={{ color: tc.goldLight, fontFamily: CINZEL }}>{profile.current_streak}</span>
          <span className="text-sm font-semibold tracking-[0.3em] uppercase" style={{ color: tc.gold }}>{t.dayStreak}</span>
          <div className="mt-1 w-16 h-px rounded-full" style={{ backgroundColor: tc.gold, opacity: 0.3 }} />
        </div>

        {/* XP Bar */}
        <div style={{ width: 320, animation: "fadeSlideUp 0.5s 300ms ease-out both" }} className="flex flex-col gap-2">
          <div className="flex justify-between text-xs font-semibold" style={{ color: tc.gold, opacity: 0.6 }}>
            <span>{xpInLvl} XP</span>
            <span>{xpToNext} {t.xpToNext} {profile.level + 1}</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: tc.xpTrack }}>
            <div className="h-full rounded-full" style={{ width: `${xpPct}%`, backgroundColor: tc.gold, transition: "width 1.2s ease-out" }} />
          </div>
        </div>

        {/* Daily Quote */}
        <DailyQuote lang={lang} tc={tc} />

        {/* Habit Card */}
        <div style={{ width: "100%", animation: "fadeSlideUp 0.5s 400ms ease-out both" }}>
          <div onClick={!completedToday && !checking ? handleCheck : undefined}
            className="btn-gold"
            style={{ position: "relative", overflow: "hidden", backgroundColor: completedToday ? `${tc.gold}12` : tc.card, border: `2px solid ${completedToday ? tc.gold : tc.border}`, borderRadius: 20, padding: "22px 24px", display: "flex", alignItems: "center", gap: 18, cursor: completedToday ? "default" : "pointer", opacity: checking ? 0.6 : 1, transition: "border-color 0.3s, background-color 0.3s" }}>
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
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: `2.5px solid ${tc.gold}`, backgroundColor: completedToday ? tc.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.35s ease" }}>
                {completedToday && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10L8.5 14.5L16 6" stroke={tc.bg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" style={{ animation: "checkDraw 0.4s ease-out forwards" }} />
                  </svg>
                )}
              </div>
              {showBurst && BURST_DIRS.map((b, i) => (
                <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: 7, height: 7, borderRadius: "50%", backgroundColor: tc.gold, ["--tx" as string]: `${b.tx}px`, ["--ty" as string]: `${b.ty}px`, animation: `burst 0.75s ${i*0.04}s ease-out forwards` }} />
              ))}
            </div>
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
        fontSize: 14,
        color: "rgba(240,237,232,0.75)",
        textAlign: "center",
        maxWidth: 280,
        lineHeight: 1.6,
        margin: 0,
        padding: "0 28px",
        direction: isRtl ? "rtl" : "ltr",
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
  user, profile, setProfile, tc, t, lang,
}: {
  user: User; profile: Profile; setProfile: (p: Profile) => void;
  tc: TC; t: TT; lang: Lang;
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
            style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "screen", filter: `drop-shadow(0 0 12px ${tc.gold}70)`, animation: "avatarFloat 3s ease-in-out infinite" }} />
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
              style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", backgroundColor: lang === l ? tc.gold : "transparent", color: lang === l ? "#0D0D1F" : tc.textSub, transition: "all 0.2s ease" }}>
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
              style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", backgroundColor: themeKey === k ? tc.gold : "transparent", color: themeKey === k ? "#0D0D1F" : tc.textSub, transition: "all 0.2s ease" }}>
              {k === "dark" ? "🌙 Dark" : "☀️ Light"}
            </button>
          ))}
        </div>
      </SettingCard>

      {/* Sign Out */}
      <div style={{ animation: "fadeIn 0.4s 0.18s ease-out both" }}>
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
