-- Run this in your Supabase SQL Editor (Database → SQL Editor → New query)

-- 1. Add coins column to profiles (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0;

-- 2. Update complete_habit to award 10 coins per completion
--    (find the existing complete_habit function and add: coins = coins + 10)
--    If complete_habit doesn't exist yet, here is a minimal version:
--
-- CREATE OR REPLACE FUNCTION complete_habit(p_user_id UUID, p_habit_type TEXT)
-- RETURNS JSON ...
--    SET coins = coins + 10  <-- add this line inside the UPDATE

-- 3. rescue_streak function
CREATE OR REPLACE FUNCTION rescue_streak(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coins INT;
BEGIN
  SELECT coins INTO v_coins FROM profiles WHERE id = p_user_id;

  IF v_coins IS NULL OR v_coins < 50 THEN
    RETURN json_build_object('success', false, 'reason', 'not_enough_coins');
  END IF;

  UPDATE profiles
  SET
    coins          = coins - 50,
    current_streak = GREATEST(current_streak, 1)
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'coins',   (SELECT coins FROM profiles WHERE id = p_user_id)
  );
END;
$$;
