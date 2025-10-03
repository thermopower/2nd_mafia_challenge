"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import { UpdateAssignmentRequest, AssignmentDetail } from "../lib/dto";
import { extractApiErrorMessage } from "@/lib/remote/error";
import { useToast } from "@/hooks/use-toast";

export function useUpdateAssignment(assignmentId: string, courseId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: UpdateAssignmentRequest) => {
      const response = await apiClient.patch<AssignmentDetail>(
        `/instructor/assignments/${assignmentId}`,
        request
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["instructor-course-assignments", courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["assignment-detail", assignmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["instructor-dashboard"],
      });
      toast({
        title: "성공",
        description: "과제가 수정되었습니다.",
      });
    },
    onError: (error: unknown) => {
      const message = extractApiErrorMessage(error);
      toast({
        title: "과제 수정 실패",
        description: message || "과제를 수정하지 못했습니다.",
        variant: "destructive",
      });
    },
  });
}
