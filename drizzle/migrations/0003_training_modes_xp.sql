ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'soundscape',
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_sec integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS training_sessions_user_created_idx
  ON public.training_sessions (user_id, created_at DESC);