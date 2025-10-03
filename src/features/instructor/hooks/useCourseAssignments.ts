"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { CourseAssignmentsResponse } from "../lib/dto";

export function useCourseAssignments(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-assignments", courseId],
    queryFn: async () => {
      if (!courseId) {
        throw new Error("Course ID is required");
      }
      const response = await apiClient.get<CourseAssignmentsResponse>(
        `/instructor/courses/${courseId}/assignments`
      );
      return response.data;
    },
    enabled: !!courseId,
    retry: false,
    meta: {
      errorMessage: (error: unknown) =>
        extractApiErrorMessage(error, "과제 목록을 불러오지 못했습니다."),
    },
  });
}
