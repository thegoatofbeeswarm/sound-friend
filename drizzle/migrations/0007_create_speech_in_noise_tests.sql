CREATE TABLE public.speech_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  srt_db numeric NOT NULL,
  score integer NOT NULL,
  trials integer NOT NULL,
  reversals integer NOT NULL,
  spread_db numeric,
  noise_type text NOT NULL,
  device_type text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.speech_tests TO authenticated;
GRANT ALL ON public.speech_tests TO service_role;

ALTER TABLE public.speech_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own speech tests"
  ON public.speech_tests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own speech tests"
  ON public.speech_tests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own speech tests"
  ON public.speech_tests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own speech tests"
  ON public.speech_tests FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX speech_tests_user_created_idx ON public.speech_tests (user_id, created_at DESC);