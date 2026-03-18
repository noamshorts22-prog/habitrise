-- DEV ONLY — Run once in Supabase SQL Editor
-- Creates a time-travel helper for local testing

CREATE OR REPLACE FUNCTION dev_time_travel(p_user_id UUID, p_mode TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target TIMESTAMPTZ;
BEGIN
  IF p_mode = 'sleeping' THEN
    -- Move last log to 25 hours ago
    UPDATE habit_logs
    SET completed_at = NOW() - INTERVAL '25 hours'
    WHERE id = (
      SELECT id FROM habit_logs
      WHERE user_id = p_user_id
      ORDER BY completed_at DESC
      LIMIT 1
    );
    RETURN json_build_object('ok', true, 'mode', 'sleeping');

  ELSIF p_mode = 'decayed' THEN
    -- Move last log to 49 hours ago + restore streak so decay is visible
    UPDATE habit_logs
    SET completed_at = NOW() - INTERVAL '49 hours'
    WHERE id = (
      SELECT id FROM habit_logs
      WHERE user_id = p_user_id
      ORDER BY completed_at DESC
      LIMIT 1
    );
    UPDATE profiles SET current_streak = 5, level = 3 WHERE id = p_user_id;
    RETURN json_build_object('ok', true, 'mode', 'decayed');

  ELSIF p_mode = 'active' THEN
    -- Insert a fresh log right now
    INSERT INTO habit_logs (user_id, habit_type, completed_at)
    VALUES (p_user_id, 'dev_test', NOW());
    UPDATE profiles SET current_streak = 7 WHERE id = p_user_id;
    RETURN json_build_object('ok', true, 'mode', 'active');

  ELSIF p_mode = 'add_coins' THEN
    UPDATE profiles SET coins = coins + 100 WHERE id = p_user_id;
    RETURN json_build_object('ok', true, 'mode', 'add_coins');

  ELSIF p_mode = 'clear_coins' THEN
    UPDATE profiles SET coins = 0 WHERE id = p_user_id;
    RETURN json_build_object('ok', true, 'mode', 'clear_coins');

  END IF;

  RETURN json_build_object('ok', false, 'error', 'unknown mode');
END;
$$;
