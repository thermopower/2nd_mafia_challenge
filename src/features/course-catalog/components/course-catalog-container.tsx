"use client";

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { CourseFilters } from "@/features/course-catalog/components/course-filters";
import { CourseCard } from "@/features/course-catalog/components/course-card";
import { CourseDetailDialog } from "@/features/course-catalog/components/course-detail-dialog";
import { Button } from "@/components/ui/button";
import { useCourseCatalogQuery } from "@/features/course-catalog/hooks/useCourseCatalogQuery";
import { DEFAULT_FILTERS } from "@/features/course-catalog/constants/filters";
import { extractApiErrorMessage } from "@/lib/remote/api-client";

export const CourseCatalogContainer = () => {
  const [filters, setFilters] = useState<{
    search: string;
    category?: string;
    difficulty?: string;
    sortBy: string;
    page: number;
  }>({
    search: DEFAULT_FILTERS.search,
    category: DEFAULT_FILTERS.category,
    difficulty: DEFAULT_FILTERS.difficulty,
    sortBy: DEFAULT_FILTERS.sortBy,
    page: DEFAULT_FILTERS.page,
  });

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useCourseCatalogQuery({
    ...filters,
  });

  const handleFiltersChange = (newFilters: {
    search: string;
    category?: string;
    difficulty?: string;
    sortBy: string;
  }) => {
    setFilters({
      ...newFilters,
      page: 1,
    });
  };

  const handleDetailsClick = (courseId: string) => {
    setSelectedCourseId(courseId);
    setDialogOpen(true);
  };

  const handleLoadMore = () => {
    setFilters((prev) => ({
      ...prev,
      page: prev.page + 1,
    }));
  };

  return (
    <div className="space-y-6">
      <CourseFilters onFiltersChange={handleFiltersChange} />

      {isLoading && (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-center text-sm text-destructive">
            {extractApiErrorMessage(error, "코스 목록을 불러오는 데 실패했습니다.")}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            다시 시도
          </Button>
        </div>
      )}

      {!isLoading && !error && data && (
        <>
          {data.courses.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-2">
              <p className="text-sm text-muted-foreground">
                검색 결과가 없습니다.
              </p>
              <p className="text-xs text-muted-foreground">
                다른 검색어나 필터를 시도해보세요.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onDetailsClick={handleDetailsClick}
                  />
                ))}
              </div>

              {data.hasMore && (
                <div className="flex justify-center pt-8">
                  <Button variant="outline" onClick={handleLoadMore}>
                    더 보기
                  </Button>
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground">
                총 {data.total}개의 코스
              </div>
            </>
          )}
        </>
      )}

      <CourseDetailDialog
        courseId={selectedCourseId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};
