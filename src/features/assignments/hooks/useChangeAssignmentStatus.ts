"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import { AssignmentStatus, AssignmentDetail } from "../lib/dto";
import { extractApiErrorMessage } from "@/lib/remote/error";
import { useToast } from "@/hooks/use-toast";

export function useChangeAssignmentStatus(assignmentId: string, courseId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (status: AssignmentStatus) => {
      const response = await apiClient.patch<AssignmentDetail>(
        `/instructor/assignments/${assignmentId}/status`,
        { status }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["instructor-course-assignments", courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["assignment-detail", assignmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["instructor-dashboard"],
      });

      const statusText =
        data.status === "published" ? "게시됨" :
        data.status === "closed" ? "마감됨" : "초안";

      toast({
        title: "상태 변경 완료",
        description: `과제가 ${statusText} 상태로 변경되었습니다.`,
      });
    },
    onError: (error: unknown) => {
      const message = extractApiErrorMessage(error);
      toast({
        title: "상태 변경 실패",
        description: message || "과제 상태를 변경하지 못했습니다.",
        variant: "destructive",
      });
    },
  });
}
