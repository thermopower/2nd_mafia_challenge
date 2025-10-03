"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { courseCatalogQueryKeys } from "@/features/course-catalog/constants/filters";

type EnrollInCourseParams = {
  courseId: string;
};

export const useCourseEnrollmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId }: EnrollInCourseParams) => {
      const response = await apiClient.post<{ success: boolean }>(
        `/catalog/courses/${courseId}/enroll`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate course detail to refetch enrollment status
      queryClient.invalidateQueries({
        queryKey: courseCatalogQueryKeys.detail(variables.courseId),
      });

      // Invalidate course catalog list
      queryClient.invalidateQueries({
        queryKey: courseCatalogQueryKeys.lists(),
      });
    },
    meta: {
      errorMessage: "수강 신청에 실패했습니다.",
    },
  });
};
