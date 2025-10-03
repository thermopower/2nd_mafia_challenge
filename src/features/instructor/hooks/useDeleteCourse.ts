"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { DeleteCourseResponse } from "../lib/dto";

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiClient.delete<DeleteCourseResponse>(
        `/instructor/courses/${courseId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-dashboard"] });
    },
    meta: {
      errorMessage: (error: unknown) =>
        extractApiErrorMessage(error, "코스 삭제에 실패했습니다."),
    },
  });
}
