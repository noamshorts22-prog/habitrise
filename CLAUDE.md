# HabitRise — Project Rules for Claude

## NEXT SESSION TODO (Priority order)
1. Test coins HUD position (top-right)
2. Fix border warning in SwipeHabitCard
3. Add Free + Elite plans ($7/month)
4. RevenueCat payments integration
5. React Native / Expo conversion
6. App Store submission
7. Custom domain habitrise.app

## KNOWN BUGS
- SwipeHabitCard border/borderTop CSS warning
- Coins display position needs polish

## WORKING FEATURES (March 25, 2026)
- Full onboarding → Google OAuth → Home
- Swipe to complete habit (RPC complete_habit)
- Streak + XP + Coins tracking
- Shop tab: Streak Rescue + XP Boost
- Push notifications with timezone
- Privacy Policy + Terms of Service
- Dark/Light mode

## Design System (NEVER deviate)
- Background: #0D0D1F
- Gold: #C9A84C
- Card bg: #141428
- Card border: 1px solid rgba(201,168,76,0.12)
- Card border-radius: 16px
- Card shadow: 0 4px 24px rgba(0,0,0,0.4)
- Font: system default, no Inter/Arial

## STRICT RULES
- English only — zero Hebrew in UI
- NEVER touch middleware.ts without being explicitly told
- NEVER deploy to Vercel — always wait for user confirmation
- NEVER change Design System colors
- Always check localhost before suggesting deploy
- Use Framer Motion for all animations
- Use Sonnet for small fixes, Opus for complex rewrites

## Stack
- Next.js 14, TypeScript, Supabase, Framer Motion, Vercel
- Deploy: npx vercel --prod (only when user says so)

## Sensitive Files — ASK before touching
- middleware.ts
- app/auth/callback/page.tsx
- app/api/cron/route.ts
- .env.local

## Database (Supabase)
- profiles: id, username, gender, habit_type,
  habit_frequency, coins, level, streak, total_xp
- push_subscriptions: user_id, subscription,
  reminder_hour, timezone
- habit_logs: user_id, date, completed

## Current State (March 2026)
- Onboarding: 5 steps — intro slides, habit, frequency, hero name, gender → /login → /home
- Auth: Google OAuth via Supabase
- Home: SwipeHabitCard, streak, XP, coins, Shop button
- Profile: avatar, calendar, stats
- Settings: dark mode, notifications, Privacy Policy, Terms of Service
- Shop: Streak Rescue (50 coins), XP Boost (30 coins)

## Key RPCs (Supabase SECURITY DEFINER)
- complete_habit(p_user_id, p_habit_type) → saves log, updates XP/streak/coins/level
- create_profile(p_id, p_username, p_gender, p_habit_type, p_habit_frequency) → creates profile on first login
- rescue_streak(p_user_id) → costs 50 coins, saves streak
- check_hero_status(p_user_id) → returns active/sleeping/decayed

## What's Next (TODO)
- Shop tab (in progress)
- Free + Elite plans ($7/month)
- RevenueCat payments
- React Native / Expo
- App Store submission
- Custom domain + email

## Deployment
- Vercel: npx vercel --prod
- Supabase project: pzpsjmvazpuvdyxgiehv
- Live URL: habitrise-mvp.vercel.app

## Light Mode Text Rules
- Background is cream: #F5F0E8
- Never use white or rgba(255,255,255,...) in light mode
- Conversion table:
  rgba(255,255,255,0.8) → rgba(0,0,0,0.7)
  rgba(255,255,255,0.6) → rgba(0,0,0,0.5)
  rgba(255,255,255,0.4) → rgba(0,0,0,0.35)
  rgba(255,255,255,0.3) → rgba(0,0,0,0.25)
  "white" → "#3D2B0F"
- Gold #C9A84C stays as-is in both modes
- Bottom nav is dark bg — white text is correct there

## When to use Opus vs Sonnet
- Sonnet: UI fixes, colors, text, small features
- Opus: new full screens, auth flow, complex bugs,
  multi-file refactors
- Default: always try Sonnet first

## Git Rules for Agents
Before making ANY changes:
  git add .
  git commit -m "snapshot: before [description]"

After finishing successfully:
  git add .
  git commit -m "fix: [what was done]"

Branch per day:
  git checkout -b YYYY-MM-DD

To restore if something breaks:
  git checkout .          ← discard all changes
  git log --oneline       ← see all versions
  git checkout [hash] .   ← restore specific version
