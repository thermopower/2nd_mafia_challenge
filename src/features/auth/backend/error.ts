export const authSignupErrorCodes = {
  duplicateEmail: 'AUTH_DUPLICATE_EMAIL',
  termsVersionNotFound: 'AUTH_TERMS_VERSION_NOT_FOUND',
  supabaseAuthFailed: 'AUTH_SUPABASE_AUTH_FAILED',
  profileCreationFailed: 'AUTH_PROFILE_CREATION_FAILED',
  termsAcceptanceFailed: 'AUTH_TERMS_ACCEPTANCE_FAILED',
  validationError: 'AUTH_VALIDATION_ERROR',
  noActiveTerms: 'AUTH_NO_ACTIVE_TERMS',
} as const;

type AuthSignupErrorValue =
  (typeof authSignupErrorCodes)[keyof typeof authSignupErrorCodes];

export type AuthSignupServiceError = AuthSignupErrorValue;
