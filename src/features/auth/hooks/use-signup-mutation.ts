"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type {
  SignupRequest,
  SignupResponse,
} from "@/features/auth/lib/signup-dto";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

const signupUser = async (
  payload: SignupRequest
): Promise<SignupResponse> => {
  const response = await apiClient.post<SignupResponse>(
    "/auth/signup",
    payload
  );
  return response.data;
};

export const useSignupMutation = () => {
  const { refresh } = useCurrentUser();

  return useMutation({
    mutationFn: signupUser,
    onSuccess: async () => {
      await refresh();
    },
  });
};

export const useSignupMutationWithError = () => {
  const mutation = useSignupMutation();

  return {
    ...mutation,
    errorMessage: mutation.error
      ? extractApiErrorMessage(
          mutation.error,
          "회원가입 중 오류가 발생했습니다."
        )
      : undefined,
  };
};
