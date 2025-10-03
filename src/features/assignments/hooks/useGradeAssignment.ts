"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type {
  GradeAssignmentRequest,
  GradeAssignmentResponse,
} from "../lib/dto";

export function useGradeAssignment() {
  const queryClient = useQueryClient();

  return useMutation<
    GradeAssignmentResponse,
    Error,
    { assignmentId: string; submissionId: string } & GradeAssignmentRequest
  >({
    mutationFn: async ({ assignmentId, submissionId, ...request }) => {
      const response = await apiClient.patch<GradeAssignmentResponse>(
        `/assignments/${assignmentId}/submissions/${submissionId}`,
        request
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["assignment-submission", variables.submissionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["recent-feedback"],
      });
      queryClient.invalidateQueries({
        queryKey: ["learner-dashboard"],
      });
    },
    meta: {
      errorMessage: (error: unknown) =>
        extractApiErrorMessage(error, "채점 처리에 실패했습니다."),
    },
  });
}
