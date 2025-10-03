"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { AssignmentDetail } from "../lib/dto";

export function useAssignmentDetail(assignmentId: string) {
  return useQuery({
    queryKey: ["assignment-detail", assignmentId],
    queryFn: async () => {
      const response = await apiClient.get<AssignmentDetail>(
        `/assignments/${assignmentId}`
      );
      return response.data;
    },
    enabled: !!assignmentId,
    retry: false,
    meta: {
      errorMessage: (error: unknown) =>
        extractApiErrorMessage(error, "과제 정보를 불러오지 못했습니다."),
    },
  });
}
