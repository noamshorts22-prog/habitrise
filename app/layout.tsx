import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
  weight: ["400", "700", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HabitRise",
  description: "Build your habits, rise every day",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" className={`${cinzel.variable} ${inter.variable}`}>
      <body style={{ margin: 0, padding: 0, fontFamily: "var(--font-inter, sans-serif)" }}>
        {children}
      </body>
    </html>
  );
}
