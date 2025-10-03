-- Migration: Add assignment management extensions (grading_rubric, auto_close_at, soft delete)
BEGIN;

-- Add grading_rubric column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assignments'
      AND column_name = 'grading_rubric'
  ) THEN
    ALTER TABLE public.assignments
    ADD COLUMN grading_rubric text NOT NULL DEFAULT '';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'grading_rubric column addition skipped: %', SQLERRM;
END;
$$;

-- Add auto_close_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assignments'
      AND column_name = 'auto_close_at'
  ) THEN
    ALTER TABLE public.assignments
    ADD COLUMN auto_close_at timestamptz;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'auto_close_at column addition skipped: %', SQLERRM;
END;
$$;

-- Add is_deleted column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assignments'
      AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE public.assignments
    ADD COLUMN is_deleted boolean NOT NULL DEFAULT FALSE;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'is_deleted column addition skipped: %', SQLERRM;
END;
$$;

-- Add deleted_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assignments'
      AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.assignments
    ADD COLUMN deleted_at timestamptz;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'deleted_at column addition skipped: %', SQLERRM;
END;
$$;

-- Add deleted_by column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assignments'
      AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE public.assignments
    ADD COLUMN deleted_by uuid REFERENCES public.profiles(user_id);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'deleted_by column addition skipped: %', SQLERRM;
END;
$$;

-- Create index for is_deleted
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'assignments'
      AND indexname = 'assignments_is_deleted_idx'
  ) THEN
    CREATE INDEX assignments_is_deleted_idx
    ON public.assignments(is_deleted);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'is_deleted index creation skipped: %', SQLERRM;
END;
$$;

-- Create index for auto_close_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'assignments'
      AND indexname = 'assignments_auto_close_at_idx'
  ) THEN
    CREATE INDEX assignments_auto_close_at_idx
    ON public.assignments(auto_close_at)
    WHERE auto_close_at IS NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'auto_close_at index creation skipped: %', SQLERRM;
END;
$$;

-- Create index for deleted_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'assignments'
      AND indexname = 'assignments_deleted_by_idx'
  ) THEN
    CREATE INDEX assignments_deleted_by_idx
    ON public.assignments(deleted_by)
    WHERE deleted_by IS NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'deleted_by index creation skipped: %', SQLERRM;
END;
$$;

COMMIT;
