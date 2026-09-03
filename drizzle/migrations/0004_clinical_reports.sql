CREATE TABLE public.clinical_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  source_label text,
  test_date date,
  status text NOT NULL DEFAULT 'pending',
  summary text,
  error text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_reports TO authenticated;
GRANT ALL ON public.clinical_reports TO service_role;
ALTER TABLE public.clinical_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own clinical reports" ON public.clinical_reports FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.clinical_threshold_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.clinical_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  ear text NOT NULL,
  frequency_hz integer NOT NULL,
  threshold_db numeric NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_threshold_points TO authenticated;
GRANT ALL ON public.clinical_threshold_points TO service_role;
ALTER TABLE public.clinical_threshold_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own clinical points" ON public.clinical_threshold_points FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX clinical_points_report_idx ON public.clinical_threshold_points(report_id);
