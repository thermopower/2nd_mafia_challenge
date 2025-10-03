"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import {
  courseCatalogQueryKeys,
  DEFAULT_FILTERS,
} from "@/features/course-catalog/constants/filters";
import type { CourseCatalogResponse } from "@/features/course-catalog/lib/dto";

type UseCourseCatalogQueryParams = {
  search?: string;
  category?: string;
  difficulty?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
};

export const useCourseCatalogQuery = (params: UseCourseCatalogQueryParams = {}) => {
  const {
    search = DEFAULT_FILTERS.search,
    category = DEFAULT_FILTERS.category,
    difficulty = DEFAULT_FILTERS.difficulty,
    sortBy = DEFAULT_FILTERS.sortBy,
    page = DEFAULT_FILTERS.page,
    limit = DEFAULT_FILTERS.limit,
    enabled = true,
  } = params;

  const queryParams = new URLSearchParams();

  if (search) queryParams.set("search", search);
  if (category) queryParams.set("category", category);
  if (difficulty) queryParams.set("difficulty", difficulty);
  if (sortBy) queryParams.set("sortBy", sortBy);
  queryParams.set("page", page.toString());
  queryParams.set("limit", limit.toString());

  const filterKey = {
    search,
    category,
    difficulty,
    sortBy,
    page,
    limit,
  };

  return useQuery({
    queryKey: courseCatalogQueryKeys.list(filterKey),
    queryFn: async () => {
      const response = await apiClient.get<CourseCatalogResponse>(
        `/catalog/courses?${queryParams.toString()}`
      );
      return response.data;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
    meta: {
      errorMessage: "코스 목록을 불러오는 데 실패했습니다.",
    },
  });
};
