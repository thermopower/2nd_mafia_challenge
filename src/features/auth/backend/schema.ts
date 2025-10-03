import { z } from 'zod';

export const SignupRequestSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력하세요.' }),
  password: z.string().min(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' }),
  fullName: z.string().min(1, { message: '이름을 입력하세요.' }),
  mobilePhone: z.string().min(1, { message: '휴대전화번호를 입력하세요.' }),
  role: z.enum(['learner', 'instructor'], { message: '역할을 선택하세요.' }),
  termsVersionId: z.string().uuid({ message: '유효한 약관 버전 ID를 입력하세요.' }),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const SignupResponseSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['learner', 'instructor']),
  fullName: z.string(),
  mobilePhone: z.string(),
  createdAt: z.string(),
});

export type SignupResponse = z.infer<typeof SignupResponseSchema>;

export const LatestTermsVersionResponseSchema = z.object({
  id: z.string().uuid(),
  versionCode: z.string(),
  effectiveAt: z.string(),
  description: z.string().nullable(),
});

export type LatestTermsVersionResponse = z.infer<typeof LatestTermsVersionResponseSchema>;

export const TermsVersionRowSchema = z.object({
  id: z.string().uuid(),
  version_code: z.string(),
  effective_at: z.string(),
  description: z.string().nullable(),
});

export type TermsVersionRow = z.infer<typeof TermsVersionRowSchema>;

export const ProfileRowSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['learner', 'instructor']),
  full_name: z.string(),
  mobile_phone: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ProfileRow = z.infer<typeof ProfileRowSchema>;

export const ProfileResponseSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string(),
  phoneNumber: z.string(),
  role: z.enum(['learner', 'instructor']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
