CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.hearing_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  environment_db numeric,
  trials integer NOT NULL DEFAULT 0,
  worst_threshold_db numeric,
  avg_threshold_db numeric,
  safe_volume_offset_db numeric,
  notes text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hearing_tests TO authenticated;
GRANT ALL ON public.hearing_tests TO service_role;
ALTER TABLE public.hearing_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tests select" ON public.hearing_tests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own tests insert" ON public.hearing_tests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tests update" ON public.hearing_tests FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own tests delete" ON public.hearing_tests FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.threshold_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.hearing_tests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  ear text NOT NULL CHECK (ear IN ('left','right')),
  frequency_hz integer NOT NULL,
  threshold_db numeric NOT NULL,
  confidence numeric NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threshold_points TO authenticated;
GRANT ALL ON public.threshold_points TO service_role;
ALTER TABLE public.threshold_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own points select" ON public.threshold_points FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own points insert" ON public.threshold_points FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own points delete" ON public.threshold_points FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_points_test ON public.threshold_points(test_id);
CREATE INDEX idx_tests_user ON public.hearing_tests(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();