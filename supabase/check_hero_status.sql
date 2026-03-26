-- Run this in your Supabase SQL Editor (Database → SQL Editor → New query)

CREATE OR REPLACE FUNCTION check_hero_status(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_log_time  TIMESTAMPTZ;
  hours_since    FLOAT;
  freq           INT;
  prev_week_start  TIMESTAMPTZ;
  prev_week_end    TIMESTAMPTZ;
  prev_week_completions INT;
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

  -- Get user's habit frequency (default 7 if not set)
  SELECT COALESCE(habit_frequency, 7) INTO freq
  FROM profiles
  WHERE id = p_user_id;

  hours_since := EXTRACT(EPOCH FROM (NOW() - last_log_time)) / 3600.0;

  -- Check if the PREVIOUS week's target was missed (streak break logic)
  -- Previous week = Monday 00:00 to Sunday 23:59:59
  prev_week_start := date_trunc('week', NOW() - INTERVAL '7 days');
  prev_week_end   := date_trunc('week', NOW()) - INTERVAL '1 second';

  SELECT COUNT(*) INTO prev_week_completions
  FROM habit_logs
  WHERE user_id = p_user_id
    AND completed_at >= prev_week_start
    AND completed_at <= prev_week_end;

  -- If previous week missed the target AND it's been >24h since last completion → decay
  IF prev_week_completions < freq AND hours_since >= 48 THEN
    UPDATE profiles
    SET
      current_streak = 0,
      level = CASE WHEN current_streak > 0 THEN GREATEST(1, level - 1) ELSE level END
    WHERE id = p_user_id;

    RETURN json_build_object(
      'status', 'decayed',
      'prev_week_completions', prev_week_completions,
      'target', freq
    );

  ELSIF hours_since >= 48 AND prev_week_completions >= freq THEN
    -- Met last week's target — no decay even if 48h passed
    RETURN json_build_object('status', 'sleeping');

  ELSIF hours_since >= 24 THEN
    RETURN json_build_object('status', 'sleeping');

  ELSE
    RETURN json_build_object('status', 'active');
  END IF;
END;
$$;
