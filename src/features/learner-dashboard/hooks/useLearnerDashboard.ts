"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import type { LearnerDashboardResponse } from "@/features/learner-dashboard/lib/dto";

export const learnerDashboardQueryKeys = {
  all: ["learner-dashboard"] as const,
  dashboard: () => [...learnerDashboardQueryKeys.all, "data"] as const,
};

export const useLearnerDashboard = () => {
  return useQuery({
    queryKey: learnerDashboardQueryKeys.dashboard(),
    queryFn: async () => {
      const response = await apiClient.get<LearnerDashboardResponse>(
        "/learner/dashboard"
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
