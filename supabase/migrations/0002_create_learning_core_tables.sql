-- Migration: create core learning tables derived from userflow
BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
  ) THEN
    EXECUTE $profile$
      CREATE TABLE public.profiles (
        user_id uuid PRIMARY KEY REFERENCES auth.users(id),
        role text NOT NULL CHECK (role IN ('learner','instructor')),
        full_name text NOT NULL,
        mobile_phone text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    $profile$;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'profiles creation skipped: %', SQLERRM;
END;
$$;

ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_updated_at_profiles'
  ) THEN
    EXECUTE $trigger$
      CREATE TRIGGER set_updated_at_profiles
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at()
    $trigger$;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'profiles trigger skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'terms_versions'
  ) THEN
    EXECUTE $terms_versions$
      CREATE TABLE public.terms_versions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        version_code text NOT NULL UNIQUE,
        effective_at timestamptz NOT NULL,
        description text,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    $terms_versions$;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'terms_versions creation skipped: %', SQLERRM;
END;
$$;

ALTER TABLE IF EXISTS public.terms_versions DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'terms_versions'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_updated_at_terms_versions'
  ) THEN
    EXECUTE $trigger$
      CREATE TRIGGER set_updated_at_terms_versions
      BEFORE UPDATE ON public.terms_versions
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at()
    $trigger$;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'terms_versions trigger skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'terms_acceptances'
  ) THEN
    EXECUTE $terms_acceptances$
      CREATE TABLE public.terms_acceptances (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES public.profiles(user_id),
        terms_version_id uuid NOT NULL REFERENCES public.terms_versions(id),
        accepted_at timestamptz NOT NULL DEFAULT NOW(),
        user_agent text,
        ip_address text
      )
    $terms_acceptances$;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'terms_acceptances creation skipped: %', SQLERRM;
END;
$$;

ALTER TABLE IF EXISTS public.terms_acceptances DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'courses'
  ) THEN
    EXECUTE $courses$
      CREATE TABLE public.courses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        instructor_id uuid NOT NULL REFERENCES public.profiles(user_id),
        status text NOT NULL CHECK (status = 'published'),
        category text NOT NULL,
        difficulty text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    $courses$;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'courses creation skipped: %', SQLERRM;
END;
$$;

ALTER TABLE IF EXISTS public.courses DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'courses'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_updated_at_courses'
  ) THEN
    EXECUTE $trigger$
      CREATE TRIGGER set_updated_at_courses
      BEFORE UPDATE ON public.courses
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at()
    $trigger$;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'courses trigger skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'enrollments'
  ) THEN
    EXECUTE $enrollments$
      CREATE TABLE public.enrollments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        learner_id uuid NOT NULL REFERENCES public.profiles(user_id),
        course_id uuid NOT NULL REFERENCES public.courses(id),
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT enrollments_unique_learner_course UNIQUE (learner_id, course_id)
      )
    $enrollments$;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'enrollments creation skipped: %', SQLERRM;
END;
$$;

ALTER TABLE IF EXISTS public.enrollments DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'enrollments'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_updated_at_enrollments'
  ) THEN
    EXECUTE $trigger$
      CREATE TRIGGER set_updated_at_enrollments
      BEFORE UPDATE ON public.enrollments
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at()
    $trigger$;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'enrollments trigger skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'assignments'
  ) THEN
    EXECUTE $assignments$
      CREATE TABLE public.assignments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id uuid NOT NULL REFERENCES public.courses(id),
        title text NOT NULL,
        description text NOT NULL,
        due_at timestamptz NOT NULL,
        weight numeric(5, 2) NOT NULL,
        allow_late boolean NOT NULL,
        allow_resubmission boolean NOT NULL,
        status text NOT NULL CHECK (status IN ('draft','published','closed')),
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    $assignments$;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'assignments creation skipped: %', SQLERRM;
END;
$$;

ALTER TABLE IF EXISTS public.assignments DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'assignments'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_updated_at_assignments'
  ) THEN
    EXECUTE $trigger$
      CREATE TRIGGER set_updated_at_assignments
      BEFORE UPDATE ON public.assignments
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at()
    $trigger$;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'assignments trigger skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'assignment_submissions'
  ) THEN
    EXECUTE $submissions$
      CREATE TABLE public.assignment_submissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id uuid NOT NULL REFERENCES public.assignments(id),
        learner_id uuid NOT NULL REFERENCES public.profiles(user_id),
        version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
        answer_text text NOT NULL,
        answer_link text,
        status text NOT NULL CHECK (status IN ('submitted','graded','resubmission_required')),
        late boolean NOT NULL DEFAULT FALSE,
        score integer CHECK (score BETWEEN 0 AND 100),
        feedback text,
        graded_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT assignment_submissions_unique_version UNIQUE (assignment_id, learner_id, version)
      )
    $submissions$;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'assignment_submissions creation skipped: %', SQLERRM;
END;
$$;

ALTER TABLE IF EXISTS public.assignment_submissions DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'assignment_submissions'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_updated_at_assignment_submissions'
  ) THEN
    EXECUTE $trigger$
      CREATE TRIGGER set_updated_at_assignment_submissions
      BEFORE UPDATE ON public.assignment_submissions
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at()
    $trigger$;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'assignment_submissions trigger skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'terms_versions_code_idx'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX terms_versions_code_idx ON public.terms_versions (version_code)';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'terms_versions_code_idx creation skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'terms_acceptances_user_idx'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX terms_acceptances_user_idx ON public.terms_acceptances (user_id)';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'terms_acceptances_user_idx creation skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'terms_acceptances_version_idx'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX terms_acceptances_version_idx ON public.terms_acceptances (terms_version_id)';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'terms_acceptances_version_idx creation skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'courses_instructor_idx'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX courses_instructor_idx ON public.courses (instructor_id)';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'courses_instructor_idx creation skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'enrollments_course_idx'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX enrollments_course_idx ON public.enrollments (course_id)';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'enrollments_course_idx creation skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'enrollments_learner_idx'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX enrollments_learner_idx ON public.enrollments (learner_id)';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'enrollments_learner_idx creation skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'assignments_course_idx'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX assignments_course_idx ON public.assignments (course_id)';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'assignments_course_idx creation skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'assignment_submissions_assignment_idx'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX assignment_submissions_assignment_idx ON public.assignment_submissions (assignment_id)';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'assignment_submissions_assignment_idx creation skipped: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'assignment_submissions_learner_idx'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX assignment_submissions_learner_idx ON public.assignment_submissions (learner_id)';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'assignment_submissions_learner_idx creation skipped: %', SQLERRM;
END;
$$;

-- Insert default terms version if none exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.terms_versions
    WHERE version_code = 'v1.0'
  ) THEN
    INSERT INTO public.terms_versions (version_code, effective_at, description)
    VALUES (
      'v1.0',
      NOW(),
      '서비스 이용 약관 및 개인정보 처리방침에 동의합니다.'
    );
    RAISE NOTICE 'Default terms version v1.0 inserted';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Default terms version insert skipped: %', SQLERRM;
END;
$$;

COMMIT;
