"use client";

import Link from "next/link";

const GOLD = "#C9A84C";
const BG = "#0D0D1F";
const TEXT = "rgba(255,255,255,0.8)";

const sections = [
  {
    title: "1. Service Description",
    items: [
      "HabitRise is a habit-building app that helps you track daily habits, build streaks, and level up your personal hero.",
      "The app is provided as-is and may be updated or changed at any time.",
    ],
  },
  {
    title: "2. User Responsibilities",
    items: [
      "You must provide accurate information during registration.",
      "You are responsible for maintaining the security of your account.",
      "You may not abuse, exploit, or misuse the service in any way.",
      "You may not use the service for any illegal or unauthorized purpose.",
    ],
  },
  {
    title: "3. No Guarantee of Results",
    items: [
      "HabitRise is a tool to support your habits, not a guarantee of results.",
      "Your progress depends on your own effort and consistency.",
      "We are not responsible for any outcomes related to your habit goals.",
    ],
  },
  {
    title: "4. Account Termination",
    items: [
      "We reserve the right to suspend or terminate accounts that violate these terms.",
      "You may delete your account at any time by contacting us.",
      "Upon termination, your data will be permanently removed.",
    ],
  },
  {
    title: "5. Governing Law",
    items: [
      "These terms are governed by the laws of the State of Israel.",
      "Any disputes will be resolved under Israeli jurisdiction.",
    ],
  },
];

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ color: TEXT, opacity: 0.5, fontSize: 13, marginBottom: 36 }}>
          Effective date: March 2026
        </p>

        <p style={{ color: TEXT, fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          By using HabitRise, you agree to the following terms and conditions.
          Please read them carefully.
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
            If you have any questions about these terms, contact us at{" "}
            <a href="mailto:theprotocoltv@gmail.com" style={{ color: GOLD, opacity: 0.8 }}>
              theprotocoltv@gmail.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
