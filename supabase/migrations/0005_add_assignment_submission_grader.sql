-- Migration: add graded_by column to assignment_submissions
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assignment_submissions'
      AND column_name = 'graded_by'
  ) THEN
    ALTER TABLE public.assignment_submissions
    ADD COLUMN graded_by uuid REFERENCES public.profiles(user_id);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'graded_by column addition skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'assignment_submissions'
      AND indexname = 'assignment_submissions_graded_by_idx'
  ) THEN
    CREATE INDEX assignment_submissions_graded_by_idx
    ON public.assignment_submissions(graded_by);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'graded_by index creation skipped: %', SQLERRM;
END;
$$;

COMMIT;
