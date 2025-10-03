"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { InstructorDashboard } from "../lib/dto";

export function useInstructorDashboard() {
  return useQuery({
    queryKey: ["instructor-dashboard"],
    queryFn: async () => {
      const response = await apiClient.get<InstructorDashboard>(
        "/instructor/dashboard"
      );
      return response.data;
    },
    retry: false,
    meta: {
      errorMessage: (error: unknown) =>
        extractApiErrorMessage(error, "강사 대시보드를 불러오지 못했습니다."),
    },
  });
}
