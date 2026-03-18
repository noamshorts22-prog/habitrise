-- ═══════════════════════════════════════════════════════════
-- DEV TESTING QUERIES — run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════
-- Step 0: Find your user_id (run this first, copy the id)
-- ───────────────────────────────────────────────────────────
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;


-- ══════════════════════════════
-- SETUP (run once)
-- ══════════════════════════════

-- 1. Make sure SQL functions exist (run check_hero_status.sql + rescue_streak.sql first)

-- 2. Add coins column if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0;

-- 3. Give yourself starting coins for testing
UPDATE profiles SET coins = 100 WHERE id = 'YOUR_USER_ID';


-- ══════════════════════════════
-- TEST: status = 'sleeping'
-- (last completion was 25 hours ago)
-- ══════════════════════════════
UPDATE habit_logs
SET completed_at = NOW() - INTERVAL '25 hours'
WHERE user_id = 'YOUR_USER_ID'
  AND completed_at = (
    SELECT MAX(completed_at) FROM habit_logs WHERE user_id = 'YOUR_USER_ID'
  );
-- → Now refresh the app. Avatar should go grey 30%, show 💤, button says "העיר את הגיבור 🔔"


-- ══════════════════════════════
-- TEST: status = 'decayed'
-- (last completion was 49 hours ago)
-- ══════════════════════════════
UPDATE habit_logs
SET completed_at = NOW() - INTERVAL '49 hours'
WHERE user_id = 'YOUR_USER_ID'
  AND completed_at = (
    SELECT MAX(completed_at) FROM habit_logs WHERE user_id = 'YOUR_USER_ID'
  );
-- Also restore streak so you can see it get reset:
UPDATE profiles SET current_streak = 5, level = 3 WHERE id = 'YOUR_USER_ID';
-- → Now refresh the app. Avatar grey 60%, toast "הסטריק שלך אופס 😔", streak resets to 0


-- ══════════════════════════════
-- TEST: Rescue button ENABLED
-- (coins >= 50)
-- ══════════════════════════════
UPDATE profiles SET coins = 100 WHERE id = 'YOUR_USER_ID';
-- → Button shows red + gold border: "הצל את הסטריק — 50 מטבעות"


-- ══════════════════════════════
-- TEST: Rescue button DISABLED
-- (coins < 50)
-- ══════════════════════════════
UPDATE profiles SET coins = 20 WHERE id = 'YOUR_USER_ID';
-- → Button shows greyed out: "אין מספיק מטבעות"


-- ══════════════════════════════
-- TEST: +10 coins on habit completion
-- ══════════════════════════════
-- Check current coins before clicking complete:
SELECT coins FROM profiles WHERE id = 'YOUR_USER_ID';
-- Click complete in the app, then run again — should be +10


-- ══════════════════════════════
-- RESET: back to normal (active)
-- ══════════════════════════════
INSERT INTO habit_logs (user_id, habit_type, completed_at)
VALUES ('YOUR_USER_ID', 'ספורט יומי', NOW());
UPDATE profiles SET current_streak = 7, coins = 80 WHERE id = 'YOUR_USER_ID';
-- → Refresh app → status active, hero normal
