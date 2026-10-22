-- A stable id for each finished result, chosen by the client, so a retry,
-- a second tab or a lost response cannot create the same result twice.
-- Nullable: rows saved before this migration keep NULL, which the unique
-- index allows any number of times.
ALTER TABLE public.hearing_tests ADD COLUMN IF NOT EXISTS client_result_id uuid;
ALTER TABLE public.speech_tests ADD COLUMN IF NOT EXISTS client_result_id uuid;
ALTER TABLE public.training_sessions ADD COLUMN IF NOT EXISTS client_result_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS hearing_tests_user_client_result_key ON public.hearing_tests (user_id, client_result_id);
CREATE UNIQUE INDEX IF NOT EXISTS speech_tests_user_client_result_key ON public.speech_tests (user_id, client_result_id);
CREATE UNIQUE INDEX IF NOT EXISTS training_sessions_user_client_result_key ON public.training_sessions (user_id, client_result_id);
