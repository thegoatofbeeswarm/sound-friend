ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'train';