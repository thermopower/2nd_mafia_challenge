export const learnerDashboardErrorCodes = {
  supabaseError: 'SUPABASE_ERROR',
  notLearner: 'NOT_LEARNER',
  validationError: 'VALIDATION_ERROR',
} as const;

export type LearnerDashboardServiceError =
  (typeof learnerDashboardErrorCodes)[keyof typeof learnerDashboardErrorCodes];
