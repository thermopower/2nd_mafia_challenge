import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  ProfileRowSchema,
  TermsVersionRowSchema,
  type LatestTermsVersionResponse,
  type ProfileRow,
  type SignupRequest,
  type SignupResponse,
  type TermsVersionRow,
} from '@/features/auth/backend/schema';
import {
  authSignupErrorCodes,
  type AuthSignupServiceError,
} from '@/features/auth/backend/error';

const PROFILES_TABLE = 'profiles';
const TERMS_VERSIONS_TABLE = 'terms_versions';
const TERMS_ACCEPTANCES_TABLE = 'terms_acceptances';

export const signupUser = async (
  client: SupabaseClient,
  payload: SignupRequest,
): Promise<HandlerResult<SignupResponse, AuthSignupServiceError, unknown>> => {
  let termsVersionId = payload.termsVersionId;
  let needsLatestTerms = !termsVersionId || termsVersionId.trim() === '';

  if (!needsLatestTerms) {
    const { data: termsVersion, error: termsError } = await client
      .from(TERMS_VERSIONS_TABLE)
      .select('id')
      .eq('id', termsVersionId)
      .maybeSingle();

    if (termsError) {
      needsLatestTerms = true;
    } else if (!termsVersion) {
      needsLatestTerms = true;
    }
  }

  if (needsLatestTerms) {
    const { data: latestTerms, error: latestError } = await client
      .from(TERMS_VERSIONS_TABLE)
      .select('id')
      .lte('effective_at', new Date().toISOString())
      .order('effective_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      return failure(
        500,
        authSignupErrorCodes.supabaseAuthFailed,
        '약관 버전 조회 중 오류가 발생했습니다.',
      );
    }

    if (latestTerms?.id) {
      termsVersionId = latestTerms.id;
    } else {
      return failure(
        404,
        authSignupErrorCodes.termsVersionNotFound,
        '유효한 약관 버전이 없습니다. 관리자에게 문의하세요.',
      );
    }
  }

  const { data: authData, error: authError } = await client.auth.signUp({
    email: payload.email,
    password: payload.password,
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      return failure(
        409,
        authSignupErrorCodes.duplicateEmail,
        '이미 가입된 이메일입니다.',
      );
    }

    return failure(
      500,
      authSignupErrorCodes.supabaseAuthFailed,
      authError.message,
    );
  }

  if (!authData.user) {
    return failure(
      500,
      authSignupErrorCodes.supabaseAuthFailed,
      '계정 생성에 실패했습니다.',
    );
  }

  const userId = authData.user.id;

  const { error: profileError } = await client.from(PROFILES_TABLE).insert({
    user_id: userId,
    role: payload.role,
    full_name: payload.fullName,
    mobile_phone: payload.mobilePhone,
  });

  if (profileError) {
    return failure(
      500,
      authSignupErrorCodes.profileCreationFailed,
      '프로필 생성 중 오류가 발생했습니다.',
    );
  }

  const { error: acceptanceError } = await client
    .from(TERMS_ACCEPTANCES_TABLE)
    .insert({
      user_id: userId,
      terms_version_id: termsVersionId,
    });

  if (acceptanceError) {
    return failure(
      500,
      authSignupErrorCodes.termsAcceptanceFailed,
      '약관 동의 기록 중 오류가 발생했습니다.',
    );
  }

  const { data: profileData, error: profileFetchError } = await client
    .from(PROFILES_TABLE)
    .select('user_id, role, full_name, mobile_phone, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle<ProfileRow>();

  if (profileFetchError || !profileData) {
    return failure(
      500,
      authSignupErrorCodes.profileCreationFailed,
      '프로필 조회 중 오류가 발생했습니다.',
    );
  }

  const profileParse = ProfileRowSchema.safeParse(profileData);

  if (!profileParse.success) {
    return failure(
      500,
      authSignupErrorCodes.validationError,
      '프로필 데이터 검증에 실패했습니다.',
      profileParse.error.format(),
    );
  }

  const response: SignupResponse = {
    userId: profileParse.data.user_id,
    role: profileParse.data.role,
    fullName: profileParse.data.full_name,
    mobilePhone: profileParse.data.mobile_phone,
    createdAt: profileParse.data.created_at,
  };

  return success(response, 201);
};

export const getLatestTermsVersion = async (
  client: SupabaseClient,
): Promise<
  HandlerResult<LatestTermsVersionResponse, AuthSignupServiceError, unknown>
> => {
  try {
    const { data, error } = await client
      .from(TERMS_VERSIONS_TABLE)
      .select('id, version_code, effective_at, description')
      .lte('effective_at', new Date().toISOString())
      .order('effective_at', { ascending: false })
      .limit(1)
      .maybeSingle<TermsVersionRow>();

    if (error) {
      console.error('Terms version query error:', error);
      return failure(
        500,
        authSignupErrorCodes.supabaseAuthFailed,
        `약관 버전 조회 실패: ${error.message}`,
        error,
      );
    }

    if (!data) {
      return failure(
        404,
        authSignupErrorCodes.noActiveTerms,
        '활성화된 약관 버전이 없습니다.',
      );
    }

    const parse = TermsVersionRowSchema.safeParse(data);

    if (!parse.success) {
      console.error('Terms version validation error:', parse.error);
      return failure(
        500,
        authSignupErrorCodes.validationError,
        '약관 버전 데이터 검증에 실패했습니다.',
        parse.error.format(),
      );
    }

    const response: LatestTermsVersionResponse = {
      id: parse.data.id,
      versionCode: parse.data.version_code,
      effectiveAt: parse.data.effective_at,
      description: parse.data.description,
    };

    return success(response);
  } catch (error) {
    console.error('Unexpected error in getLatestTermsVersion:', error);
    return failure(
      500,
      authSignupErrorCodes.supabaseAuthFailed,
      '약관 버전 조회 중 예상치 못한 오류가 발생했습니다.',
      error instanceof Error ? error.message : String(error),
    );
  }
};
