"use client";

import Link from "next/link";

const GOLD = "#C9A84C";
const BG = "#0D0D1F";
const TEXT = "rgba(255,255,255,0.8)";

const sections = [
  {
    title: "1. Data We Collect",
    items: [
      "Email address (via Google login)",
      "Habit data (type, frequency, streak)",
      "Push notification tokens (if you enable reminders)",
      "Usage data (habit completion dates)",
    ],
  },
  {
    title: "2. How We Use Your Data",
    items: [
      "To personalize your experience and track your progress",
      "To send daily reminders you have requested",
      "To calculate streaks, XP, and level progression",
      "We NEVER sell your data to third parties",
    ],
  },
  {
    title: "3. Third-Party Services",
    items: [
      "Google — authentication only",
      "Supabase — secure data storage",
    ],
  },
  {
    title: "4. Your Rights",
    items: [
      "You can delete your account and all data at any time",
      "You can disable push notifications in Settings",
      "Contact us: theprotocoltv@gmail.com",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main style={{ background: BG, minHeight: "100dvh", padding: "24px 20px 64px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            color: GOLD,
            opacity: 0.6,
            fontSize: 14,
            textDecoration: "none",
            display: "inline-block",
            marginBottom: 32,
          }}
        >
          ← Back
        </Link>

        <h1 style={{ color: GOLD, fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ color: TEXT, opacity: 0.5, fontSize: 13, marginBottom: 36 }}>
          Effective date: March 2026
        </p>

        <p style={{ color: TEXT, fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          HabitRise is committed to protecting your privacy. This policy explains
          what data we collect, how we use it, and your rights.
        </p>

        {sections.map((s) => (
          <div key={s.title} style={{ marginBottom: 28 }}>
            <h2 style={{ color: GOLD, fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              {s.title}
            </h2>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {s.items.map((item) => (
                <li
                  key={item}
                  style={{
                    color: TEXT,
                    fontSize: 14,
                    lineHeight: 1.8,
                    listStyleType: "disc",
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div style={{ borderTop: "1px solid rgba(201,168,76,0.15)", paddingTop: 24, marginTop: 12 }}>
          <p style={{ color: TEXT, opacity: 0.5, fontSize: 13, lineHeight: 1.7 }}>
            If you have any questions about this policy, contact us at{" "}
            <a href="mailto:theprotocoltv@gmail.com" style={{ color: GOLD, opacity: 0.8 }}>
              theprotocoltv@gmail.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
