"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import type { CreateCourseRequest, CreateCourseResponse } from "../backend/schema";

export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCourseRequest) => {
      const response = await apiClient.post<CreateCourseResponse>(
        "/instructor/courses",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 강사 대시보드 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["instructor", "dashboard"],
      });

      // 강사 코스 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["instructor", "courses"],
      });
    },
    meta: {
      errorMessage: "코스 생성에 실패했습니다.",
    },
  });
};
