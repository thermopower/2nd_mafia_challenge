"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type {
  SubmitAssignmentRequest,
  SubmitAssignmentResponse,
} from "../lib/dto";

export function useSubmitAssignment() {
  const queryClient = useQueryClient();

  return useMutation<
    SubmitAssignmentResponse,
    Error,
    { assignmentId: string } & SubmitAssignmentRequest
  >({
    mutationFn: async ({ assignmentId, ...request }) => {
      const response = await apiClient.post<SubmitAssignmentResponse>(
        `/assignments/${assignmentId}/submit`,
        request
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["assignment-detail", variables.assignmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["learner-dashboard"],
      });
    },
    meta: {
      errorMessage: (error: unknown) =>
        extractApiErrorMessage(error, "과제 제출에 실패했습니다"),
    },
  });
}
