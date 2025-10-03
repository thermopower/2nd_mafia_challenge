"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import { courseCatalogQueryKeys } from "@/features/course-catalog/constants/filters";
import type { CourseDetailResponse } from "@/features/course-catalog/lib/dto";

type UseCourseDetailQueryParams = {
  courseId: string | null;
  enabled?: boolean;
};

export const useCourseDetailQuery = ({
  courseId,
  enabled = true,
}: UseCourseDetailQueryParams) => {
  return useQuery({
    queryKey: courseCatalogQueryKeys.detail(courseId ?? ""),
    queryFn: async () => {
      if (!courseId) {
        throw new Error("Course ID is required");
      }

      const response = await apiClient.get<CourseDetailResponse>(
        `/catalog/courses/${courseId}`
      );
      return response.data;
    },
    enabled: enabled && !!courseId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
    meta: {
      errorMessage: "코스 상세 정보를 불러오는 데 실패했습니다.",
    },
  });
};
