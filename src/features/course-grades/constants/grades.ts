export const GRADE_CONSTANTS = {
  MAX_SCORE: 100,
  MAX_WEIGHT: 100,
  DECIMAL_PLACES: 2,
  FEEDBACK_PREVIEW_LENGTH: 100,
} as const;

export const CACHE_CONFIG = {
  STALE_TIME_MS: 1000 * 60 * 3, // 3 minutes
  GC_TIME_MS: 1000 * 60 * 10, // 10 minutes
} as const;
