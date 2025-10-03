"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import { CreateAssignmentRequest, AssignmentDetail } from "../lib/dto";
import { extractApiErrorMessage } from "@/lib/remote/error";
import { useToast } from "@/hooks/use-toast";

export function useCreateAssignment(courseId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: Omit<CreateAssignmentRequest, "courseId">) => {
      const response = await apiClient.post<AssignmentDetail>(
        `/instructor/courses/${courseId}/assignments`,
        { ...request, courseId }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["instructor-course-assignments", courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["instructor-dashboard"],
      });
      toast({
        title: "성공",
        description: "과제가 생성되었습니다.",
      });
    },
    onError: (error: unknown) => {
      const message = extractApiErrorMessage(error);
      toast({
        title: "과제 생성 실패",
        description: message || "과제를 생성하지 못했습니다.",
        variant: "destructive",
      });
    },
  });
}
