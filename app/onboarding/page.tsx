"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const GOLD = "#C9A84C";
const BG = "#080810";
const CARD_BG = "rgba(255,255,255,0.03)";
const CARD_BORDER = "1px solid rgba(201,168,76,0.12)";
const CARD_SHADOW = "0 8px 32px rgba(0,0,0,0.5)";
const CINZEL = "var(--font-cinzel, 'Cinzel', Georgia, serif)";
const LUXURY_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ── Animation variants ── */
const stepVariants = {
  enterForward: { x: 60, opacity: 0 },
  enterBack: { x: -60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exitForward: { x: -60, opacity: 0 },
  exitBack: { x: 60, opacity: 0 },
};

const cardItem = {
  hidden: { opacity: 0, scale: 0.9 },
  show: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: LUXURY_EASE },
  }),
};

/* ── Intro Slides (swipeable, 3 cards) ── */
function IntroSlides({ onDone }: { onDone: () => void }) {
  const [slide, setSlide] = useState(0);
  const [slideDir, setSlideDir] = useState<"forward" | "back">("forward");
  const doneRef = useRef(false);

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }

  function next() {
    if (slide === 2) {
      finish();
      return;
    }
    setSlideDir("forward");
    setSlide((s) => s + 1);
  }

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -50) {
      if (slide < 2) {
        setSlideDir("forward");
        setSlide((s) => s + 1);
      } else {
        finish();
      }
    } else if (info.offset.x > 50 && slide > 0) {
      setSlideDir("back");
      setSlide((s) => s - 1);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 400, textAlign: "center", position: "relative", minHeight: 380 }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={slide}
          initial={slideDir === "forward" ? { x: 60, opacity: 0 } : { x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={slideDir === "forward" ? { x: -60, opacity: 0 } : { x: 60, opacity: 0 }}
          transition={{ duration: 0.45, ease: LUXURY_EASE }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}
        >
          {/* Slide 0: Meet Your Hero */}
          {slide === 0 && (
            <>
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <Image src="/avatars/male-1.png" alt="Hero" fill style={{ objectFit: "contain" }} />
              </div>
              <h1 style={{ color: "white", fontSize: 24, fontWeight: 700, margin: 0, fontFamily: CINZEL }}>
                Meet Your Hero 🎮
              </h1>
              <p style={{ color: "white", opacity: 0.6, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                Every day you show up, he grows stronger.
              </p>
            </>
          )}

          {/* Slide 1: Swipe Every Day */}
          {slide === 1 && (
            <>
              {/* Animated gold swipe slider */}
              <div
                style={{
                  position: "relative",
                  width: 260,
                  height: 64,
                  borderRadius: 32,
                  overflow: "hidden",
                  background: "rgba(201,168,76,0.12)",
                  border: "1px solid rgba(201,168,76,0.25)",
                }}
              >
                <motion.div
                  style={{
                    position: "absolute",
                    inset: "0",
                    right: "auto",
                    borderRadius: 32,
                    background: `linear-gradient(90deg, ${GOLD}33, ${GOLD}88)`,
                  }}
                  animate={{ width: ["14%", "85%", "14%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  style={{
                    position: "absolute",
                    top: "50%",
                    translateY: "-50%",
                    left: 4,
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: GOLD,
                    color: BG,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                  animate={{ x: [0, 192, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {">>"}
                </motion.div>
              </div>
              <h1 style={{ color: "white", fontSize: 24, fontWeight: 700, margin: 0, fontFamily: CINZEL }}>
                Swipe Every Day ✅
              </h1>
              <p style={{ color: "white", opacity: 0.6, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                Finish your habit → swipe → your hero levels up.
              </p>
            </>
          )}

          {/* Slide 2: Miss a Day — He Sleeps */}
          {slide === 2 && (
            <>
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <Image
                  src="/avatars/male-1.png"
                  alt="Hero sleeping"
                  fill
                  style={{ objectFit: "contain", filter: "grayscale(60%) brightness(0.6)" }}
                />
                {/* Floating Z z z */}
                <motion.span
                  style={{ position: "absolute", top: -8, right: 8, fontSize: 22, color: "white", opacity: 0.7, userSelect: "none" }}
                  animate={{ y: [0, -18, 0], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  Z
                </motion.span>
                <motion.span
                  style={{ position: "absolute", top: -16, right: -4, fontSize: 16, color: "white", opacity: 0.5, userSelect: "none" }}
                  animate={{ y: [0, -14, 0], opacity: [0.2, 0.6, 0.2] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                >
                  z
                </motion.span>
                <motion.span
                  style={{ position: "absolute", top: -20, right: -14, fontSize: 12, color: "white", opacity: 0.4, userSelect: "none" }}
                  animate={{ y: [0, -10, 0], opacity: [0.15, 0.45, 0.15] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                >
                  z
                </motion.span>
              </div>
              <h1 style={{ color: "white", fontSize: 24, fontWeight: 700, margin: 0, fontFamily: CINZEL }}>
                Miss a Day — He Sleeps 😴
              </h1>
              <p style={{ color: "white", opacity: 0.6, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                Come back and he wakes up. Never too late.
              </p>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: i === slide ? 1.5 : 1,
              background: i === slide ? GOLD : "rgba(255,255,255,0.2)",
            }}
            transition={{ duration: 0.4, ease: LUXURY_EASE }}
            style={{ width: 10, height: 10, borderRadius: "50%" }}
          />
        ))}
      </div>

      {/* Arrow button → bottom right */}
      <motion.button
        onClick={next}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: GOLD,
          color: BG,
          border: "none",
          fontSize: 22,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
        }}
      >
        →
      </motion.button>
    </div>
  );
}

/* ── Back Button ── */
function BackButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ color: "white", opacity: 0.45, fontSize: 14, background: "none", border: "none", cursor: "pointer", marginTop: 4 }}
    >
      ← Back
    </button>
  );
}

/* ── Continue Button ── */
function ContinueButton({ onClick, disabled, label = "Continue" }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <motion.button
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%",
        padding: "16px 0",
        borderRadius: 12,
        fontSize: 18,
        fontWeight: 700,
        fontFamily: CINZEL,
        letterSpacing: "0.1em",
        background: `linear-gradient(135deg, #C9A84C, #A8872E)`,
        color: BG,
        border: "none",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.3 : 1,
        boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
      }}
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      animate={!disabled ? {
        boxShadow: [
          "0 4px 20px rgba(201,168,76,0.3)",
          "0 4px 30px rgba(201,168,76,0.5)",
          "0 4px 20px rgba(201,168,76,0.3)",
        ],
      } : {}}
      transition={!disabled ? { duration: 2.5, repeat: Infinity, ease: LUXURY_EASE } : {}}
    >
      {label}
    </motion.button>
  );
}

/* ════════════════════════════════════════════════════════
   Main Onboarding Page
   ════════════════════════════════════════════════════════ */
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // Data
  const [selectedHabit, setSelectedHabit] = useState("");
  const [customHabit, setCustomHabit] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [frequency, setFrequency] = useState(0);
  const [heroName, setHeroName] = useState("");
  const [selectedGender, setSelectedGender] = useState<"male" | "female" | "">("");

  function goNext() {
    setDirection("forward");
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection("back");
    setStep((s) => s - 1);
  }

  function selectHabit(habit: string) {
    setSelectedHabit(habit);
    setShowCustomInput(false);
    setCustomHabit("");
  }

  function finishOnboarding() {
    const habitType = showCustomInput && customHabit.trim()
      ? customHabit.trim()
      : selectedHabit;
    const payload = JSON.stringify({
      habit_type: habitType,
      habit_frequency: frequency,
      username: heroName.trim(),
      gender: selectedGender,
    });
    // Save to cookie (survives navigation + OAuth redirect)
    document.cookie = `hab_data=${encodeURIComponent(payload)}; path=/; max-age=300; SameSite=Lax`;
    // Redirect to the login page (Google OAuth lives there)
    window.location.href = "/login";
  }

  const habits = [
    { label: "Daily Sport", icon: "🏃" },
    { label: "Reading", icon: "📚" },
    { label: "Meditation", icon: "🧘" },
    { label: "Drink Water", icon: "💧" },
  ];

  const frequencies = [
    { value: 3, label: "Flexible" },
    { value: 5, label: "Committed" },
    { value: 7, label: "Elite" },
  ];

  const canContinueHabit =
    selectedHabit !== "" || (showCustomInput && customHabit.trim() !== "");

  // Total question steps = 4 (steps 1–4)
  const questionStep = step >= 1 && step <= 4 ? step : 0;

  return (
    <div
      style={{
        background: `linear-gradient(180deg, ${BG} 0%, #040408 100%)`,
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        position: "relative",
      }}
    >
      {/* Progress dots for steps 1–4 */}
      {questionStep > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: i === questionStep ? 1.5 : 1,
                background: i <= questionStep ? GOLD : "rgba(255,255,255,0.2)",
              }}
              transition={{ duration: 0.4, ease: LUXURY_EASE }}
              style={{ width: 10, height: 10, borderRadius: "50%" }}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={direction === "forward" ? "enterForward" : "enterBack"}
          animate="center"
          exit={direction === "forward" ? "exitForward" : "exitBack"}
          variants={stepVariants}
          transition={{ duration: 0.45, ease: LUXURY_EASE }}
          style={{ width: "100%", maxWidth: 420 }}
        >
          {/* ── Step 0: Intro Slides ── */}
          {step === 0 && <IntroSlides onDone={goNext} />}

          {/* ── Step 1: Habit Selection ── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0, textAlign: "center", fontFamily: CINZEL }}>
                What habit do you want to build?
              </h1>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}>
                {habits.map((h, i) => {
                  const isActive = selectedHabit === h.label && !showCustomInput;
                  return (
                    <motion.button
                      key={h.label}
                      custom={i}
                      variants={cardItem}
                      initial="hidden"
                      animate="show"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => selectHabit(h.label)}
                      style={{
                        padding: "24px 12px",
                        borderRadius: 16,
                        textAlign: "center",
                        border: isActive ? `2px solid ${GOLD}` : CARD_BORDER,
                        background: isActive ? "rgba(201,168,76,0.15)" : CARD_BG,
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        boxShadow: CARD_SHADOW,
                        color: "white",
                        cursor: "pointer",
                        transform: isActive ? "scale(1.04)" : undefined,
                      }}
                    >
                      <div style={{ fontSize: 32, marginBottom: 8 }}>{h.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{h.label}</div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Custom habit + button */}
              {!showCustomInput ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowCustomInput(true);
                    setSelectedHabit("");
                  }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 700,
                    background: GOLD,
                    color: BG,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: CARD_SHADOW,
                  }}
                >
                  +
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    width: "100%",
                    padding: 16,
                    borderRadius: 16,
                    border: `2px solid ${GOLD}`,
                    background: "rgba(201,168,76,0.08)",
                  }}
                >
                  <input
                    autoFocus
                    type="text"
                    value={customHabit}
                    onChange={(e) => setCustomHabit(e.target.value)}
                    placeholder="Type your own habit..."
                    style={{
                      width: "100%",
                      background: "transparent",
                      color: "white",
                      textAlign: "center",
                      outline: "none",
                      border: "none",
                      fontSize: 18,
                    }}
                  />
                </motion.div>
              )}

              <ContinueButton onClick={goNext} disabled={!canContinueHabit} />
              <BackButton onClick={goBack} />
            </div>
          )}

          {/* ── Step 2: Frequency ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0, textAlign: "center", fontFamily: CINZEL }}>
                How often per week?
              </h1>

              <div style={{ display: "flex", gap: 12, width: "100%" }}>
                {frequencies.map((f, i) => {
                  const isActive = frequency === f.value;
                  return (
                    <motion.button
                      key={f.value}
                      custom={i}
                      variants={cardItem}
                      initial="hidden"
                      animate="show"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setFrequency(f.value)}
                      style={{
                        flex: 1,
                        padding: "28px 8px",
                        borderRadius: 16,
                        textAlign: "center",
                        border: isActive ? `2px solid ${GOLD}` : CARD_BORDER,
                        background: isActive ? "rgba(201,168,76,0.15)" : CARD_BG,
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        boxShadow: CARD_SHADOW,
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 32, fontWeight: 700, color: GOLD }}>{f.value}</div>
                      <div style={{ fontSize: 12, marginTop: 6, opacity: 0.6 }}>{f.label}</div>
                    </motion.button>
                  );
                })}
              </div>

              <ContinueButton onClick={goNext} disabled={frequency === 0} />
              <BackButton onClick={goBack} />
            </div>
          )}

          {/* ── Step 3: Hero Name ── */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0, textAlign: "center", fontFamily: CINZEL }}>
                Name your hero
              </h1>

              <div
                style={{
                  width: "100%",
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid rgba(201,168,76,0.3)",
                  background: CARD_BG,
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow: CARD_SHADOW,
                }}
              >
                <input
                  autoFocus
                  type="text"
                  value={heroName}
                  onChange={(e) => setHeroName(e.target.value)}
                  placeholder="e.g. Alex, Shadow, Zeus..."
                  style={{
                    width: "100%",
                    background: "transparent",
                    color: "white",
                    textAlign: "center",
                    outline: "none",
                    border: "none",
                    fontSize: 20,
                  }}
                />
              </div>

              <ContinueButton onClick={goNext} disabled={heroName.trim() === ""} />
              <BackButton onClick={goBack} />
            </div>
          )}

          {/* ── Step 4: Choose Hero ── */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0, textAlign: "center", fontFamily: CINZEL }}>
                Choose your hero
              </h1>

              <div style={{ display: "flex", gap: 16, width: "100%" }}>
                {([
                  { gender: "male" as const, label: "Male", avatar: "/avatars/male-1.png" },
                  { gender: "female" as const, label: "Female", avatar: "/avatars/female-1.png" },
                ]).map((item, i) => {
                  const isActive = selectedGender === item.gender;
                  return (
                    <motion.button
                      key={item.gender}
                      custom={i}
                      variants={cardItem}
                      initial="hidden"
                      animate="show"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedGender(item.gender)}
                      style={{
                        flex: 1,
                        padding: "28px 12px",
                        borderRadius: 16,
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                        border: isActive ? `2px solid ${GOLD}` : CARD_BORDER,
                        background: isActive ? "rgba(201,168,76,0.15)" : CARD_BG,
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        boxShadow: isActive ? `0 0 20px rgba(201,168,76,0.3), ${CARD_SHADOW}` : CARD_SHADOW,
                        color: "white",
                        cursor: "pointer",
                        transform: isActive ? "scale(1.04)" : undefined,
                      }}
                    >
                      <div style={{ position: "relative", width: 80, height: 80 }}>
                        <Image src={item.avatar} alt={item.label} fill style={{ objectFit: "contain" }} />
                      </div>
                      <div style={{ fontWeight: 500, fontSize: 18 }}>{item.label}</div>
                    </motion.button>
                  );
                })}
              </div>

              <ContinueButton onClick={finishOnboarding} disabled={!selectedGender} label="Continue" />
              <BackButton onClick={goBack} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
