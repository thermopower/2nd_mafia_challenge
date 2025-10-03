"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { UpdateCourseRequest, UpdateCourseResponse } from "../lib/dto";

export function useUpdateCourse(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: UpdateCourseRequest) => {
      const response = await apiClient.patch<UpdateCourseResponse>(
        `/instructor/courses/${courseId}`,
        updates
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-course-detail", courseId] });
      queryClient.invalidateQueries({ queryKey: ["instructor-dashboard"] });
    },
    meta: {
      errorMessage: (error: unknown) =>
        extractApiErrorMessage(error, "코스 수정에 실패했습니다."),
    },
  });
}
