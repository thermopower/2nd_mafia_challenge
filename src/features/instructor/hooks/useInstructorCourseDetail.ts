"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { InstructorCourseDetail } from "../lib/dto";

export function useInstructorCourseDetail(courseId: string | undefined) {
  return useQuery({
    queryKey: ["instructor-course-detail", courseId],
    queryFn: async () => {
      if (!courseId) {
        throw new Error("Course ID is required");
      }
      const response = await apiClient.get<InstructorCourseDetail>(
        `/instructor/courses/${courseId}`
      );
      return response.data;
    },
    enabled: !!courseId,
    retry: false,
    meta: {
      errorMessage: (error: unknown) =>
        extractApiErrorMessage(error, "코스 상세 정보를 불러오지 못했습니다."),
    },
  });
}
