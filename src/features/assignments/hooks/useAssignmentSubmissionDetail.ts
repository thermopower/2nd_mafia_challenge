"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { AssignmentSubmissionDetail } from "../lib/dto";

export function useAssignmentSubmissionDetail(assignmentId: string, submissionId: string) {
  return useQuery({
    queryKey: ["assignment-submission", submissionId],
    queryFn: async () => {
      const response = await apiClient.get<AssignmentSubmissionDetail>(
        `/assignments/${assignmentId}/submissions/${submissionId}`
      );
      return response.data;
    },
    enabled: !!assignmentId && !!submissionId,
    retry: false,
    meta: {
      errorMessage: (error: unknown) =>
        extractApiErrorMessage(error, "제출물 정보를 불러오지 못했습니다."),
    },
  });
}
