"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import { courseCatalogQueryKeys } from "@/features/course-catalog/constants/filters";

type UnenrollFromCourseParams = {
  courseId: string;
};

export const useCourseUnenrollmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId }: UnenrollFromCourseParams) => {
      const response = await apiClient.delete<{ success: boolean }>(
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

      // Invalidate learner dashboard to update enrolled courses
      queryClient.invalidateQueries({
        queryKey: ['learner-dashboard'],
      });
    },
    meta: {
      errorMessage: "수강 취소에 실패했습니다.",
    },
  });
};
