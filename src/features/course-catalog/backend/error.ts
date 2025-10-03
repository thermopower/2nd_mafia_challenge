export const courseCatalogErrorCodes = {
  invalidFilter: 'INVALID_FILTER',
  courseNotFound: 'COURSE_NOT_FOUND',
  alreadyEnrolled: 'ALREADY_ENROLLED',
  courseNotPublished: 'COURSE_NOT_PUBLISHED',
  notLearner: 'NOT_LEARNER',
  supabaseError: 'SUPABASE_ERROR',
  validationError: 'VALIDATION_ERROR',
} as const;

type CourseCatalogErrorValue =
  (typeof courseCatalogErrorCodes)[keyof typeof courseCatalogErrorCodes];

export type CourseCatalogServiceError = CourseCatalogErrorValue;
