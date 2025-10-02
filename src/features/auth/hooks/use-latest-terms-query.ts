"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { LatestTermsVersionResponse } from "@/features/auth/lib/signup-dto";

const fetchLatestTerms = async (): Promise<LatestTermsVersionResponse> => {
  const response = await apiClient.get<LatestTermsVersionResponse>(
    "/auth/terms/latest"
  );
  return response.data;
};

export const useLatestTermsVersionQuery = () => {
  return useQuery({
    queryKey: ["auth", "terms", "latest"],
    queryFn: fetchLatestTerms,
    staleTime: 1000 * 60 * 5,
    retry: false,
    meta: {
      errorMessage: "약관 버전을 불러오는 중 오류가 발생했습니다.",
    },
  });
};

export const useLatestTermsVersionQueryWithError = () => {
  const query = useLatestTermsVersionQuery();

  return {
    ...query,
    errorMessage: query.error
      ? extractApiErrorMessage(
          query.error,
          "약관 버전을 불러오는 중 오류가 발생했습니다."
        )
      : undefined,
  };
};
