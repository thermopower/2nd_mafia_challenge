-- Migration: Seed default terms version
BEGIN;

-- Insert default terms version if none exists
INSERT INTO public.terms_versions (version_code, effective_at, description)
SELECT 'v1.0', NOW(), '서비스 이용 약관 및 개인정보 처리방침에 동의합니다.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.terms_versions WHERE version_code = 'v1.0'
);

COMMIT;
