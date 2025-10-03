"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import type { CourseGradesResponse } from "../backend/schema";
import { CACHE_CONFIG } from "../constants/grades";

type UseCourseGradesParams = {
  courseId: string;
  enabled?: boolean;
};

export const useCourseGrades = ({
  courseId,
  enabled = true,
}: UseCourseGradesParams) => {
  return useQuery({
    queryKey: ["course-grades", courseId],
    queryFn: async () => {
      const response = await apiClient.get<CourseGradesResponse>(
        `/learner/courses/${courseId}/grades`
      );
      return response.data;
    },
    enabled: enabled && !!courseId,
    staleTime: CACHE_CONFIG.STALE_TIME_MS,
    gcTime: CACHE_CONFIG.GC_TIME_MS,
    retry: 1,
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: "성적 정보를 불러오는 데 실패했습니다.",
    },
  });
};
