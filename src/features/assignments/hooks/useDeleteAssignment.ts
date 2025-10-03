"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import { DeleteAssignmentResponse } from "../lib/dto";
import { extractApiErrorMessage } from "@/lib/remote/error";
import { useToast } from "@/hooks/use-toast";

export function useDeleteAssignment(courseId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiClient.delete<DeleteAssignmentResponse>(
        `/instructor/assignments/${assignmentId}`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["instructor-course-assignments", courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["instructor-dashboard"],
      });
      toast({
        title: "성공",
        description:
          data.mode === "hard"
            ? "과제가 완전히 삭제되었습니다."
            : "과제가 숨김 처리되었습니다. (제출 내역 보존)",
      });
    },
    onError: (error: unknown) => {
      const message = extractApiErrorMessage(error);
      toast({
        title: "과제 삭제 실패",
        description: message || "과제를 삭제하지 못했습니다.",
        variant: "destructive",
      });
    },
  });
}
