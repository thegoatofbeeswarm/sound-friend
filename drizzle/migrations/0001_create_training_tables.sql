CREATE TABLE public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  rounds integer NOT NULL DEFAULT 0,
  correct integer NOT NULL DEFAULT 0,
  accuracy numeric NOT NULL DEFAULT 0,
  start_level numeric NOT NULL DEFAULT 1,
  end_level numeric NOT NULL DEFAULT 1,
  quietest_db numeric
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_sessions TO authenticated;
GRANT ALL ON public.training_sessions TO service_role;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own training sessions" ON public.training_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.training_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  days smallint[] NOT NULL DEFAULT '{1,3,5}',
  time_of_day text NOT NULL DEFAULT '19:00',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_schedules TO authenticated;
GRANT ALL ON public.training_schedules TO service_role;
ALTER TABLE public.training_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own training schedule" ON public.training_schedules FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);