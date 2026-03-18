-- Run this in your Supabase SQL Editor (Database → SQL Editor → New query)

CREATE OR REPLACE FUNCTION check_hero_status(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_log_time  TIMESTAMPTZ;
  hours_since    FLOAT;
BEGIN
  -- Get most recent habit completion
  SELECT completed_at INTO last_log_time
  FROM habit_logs
  WHERE user_id = p_user_id
  ORDER BY completed_at DESC
  LIMIT 1;

  -- New hero or no logs — treat as active
  IF last_log_time IS NULL THEN
    RETURN json_build_object('status', 'active');
  END IF;

  hours_since := EXTRACT(EPOCH FROM (NOW() - last_log_time)) / 3600.0;

  IF hours_since >= 48 THEN
    -- Apply decay once (guard: only if streak > 0 to avoid repeat penalty)
    UPDATE profiles
    SET
      current_streak = 0,
      level          = CASE WHEN current_streak > 0 THEN GREATEST(1, level - 1) ELSE level END
    WHERE id = p_user_id;

    RETURN json_build_object('status', 'decayed');

  ELSIF hours_since >= 24 THEN
    RETURN json_build_object('status', 'sleeping');

  ELSE
    RETURN json_build_object('status', 'active');
  END IF;
END;
$$;
