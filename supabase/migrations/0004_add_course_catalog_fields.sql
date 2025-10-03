-- Migration: Add missing fields for course catalog feature
BEGIN;

-- Add title, description, thumbnail_url to courses table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'courses'
  ) THEN
    -- Add title column if not exists
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'courses'
        AND column_name = 'title'
    ) THEN
      EXECUTE 'ALTER TABLE public.courses ADD COLUMN title text NOT NULL DEFAULT ''''';
      RAISE NOTICE 'Added title column to courses';
    END IF;

    -- Add description column if not exists
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'courses'
        AND column_name = 'description'
    ) THEN
      EXECUTE 'ALTER TABLE public.courses ADD COLUMN description text NOT NULL DEFAULT ''''';
      RAISE NOTICE 'Added description column to courses';
    END IF;

    -- Add thumbnail_url column if not exists
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'courses'
        AND column_name = 'thumbnail_url'
    ) THEN
      EXECUTE 'ALTER TABLE public.courses ADD COLUMN thumbnail_url text';
      RAISE NOTICE 'Added thumbnail_url column to courses';
    END IF;

    -- Update status check constraint to allow draft/published/archived
    BEGIN
      EXECUTE 'ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_status_check';
      EXECUTE 'ALTER TABLE public.courses ADD CONSTRAINT courses_status_check CHECK (status IN (''draft'', ''published'', ''archived''))';
      RAISE NOTICE 'Updated status constraint for courses';
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Status constraint update skipped: %', SQLERRM;
    END;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'courses table modification skipped: %', SQLERRM;
END;
$$;

-- Create indexes for filtering and sorting
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'courses_status_idx'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX courses_status_idx ON public.courses (status)';
    RAISE NOTICE 'Created index courses_status_idx';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'courses_status_idx creation skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'courses_category_idx'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX courses_category_idx ON public.courses (category)';
    RAISE NOTICE 'Created index courses_category_idx';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'courses_category_idx creation skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'courses_difficulty_idx'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX courses_difficulty_idx ON public.courses (difficulty)';
    RAISE NOTICE 'Created index courses_difficulty_idx';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'courses_difficulty_idx creation skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'courses_title_idx'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX courses_title_idx ON public.courses (title)';
    RAISE NOTICE 'Created index courses_title_idx';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'courses_title_idx creation skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'courses_created_at_idx'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX courses_created_at_idx ON public.courses (created_at DESC)';
    RAISE NOTICE 'Created index courses_created_at_idx';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'courses_created_at_idx creation skipped: %', SQLERRM;
END;
$$;

COMMIT;
