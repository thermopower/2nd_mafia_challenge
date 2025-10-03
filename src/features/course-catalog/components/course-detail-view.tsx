"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCourseDetailQuery } from "@/features/course-catalog/hooks/useCourseDetailQuery";
import { extractApiErrorMessage } from "@/lib/remote/api-client";
import { CourseIntroTab } from "./course-intro-tab";
import { CourseCurriculumTab } from "./course-curriculum-tab";

type CourseDetailViewProps = {
  courseId: string;
};

export const CourseDetailView = ({ courseId }: CourseDetailViewProps) => {
  const {
    data: detailData,
    isLoading,
    error,
    refetch,
  } = useCourseDetailQuery({
    courseId,
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-sm text-destructive">
          {extractApiErrorMessage(error, "코스 정보를 불러오는 데 실패했습니다.")}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          다시 시도
        </Button>
      </div>
    );
  }

  if (!detailData?.course) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">
          코스를 찾을 수 없습니다.
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          뒤로 가기
        </Button>
      </div>
    );
  }

  const { course, enrollment } = detailData;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Tabs defaultValue="intro" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="intro">소개</TabsTrigger>
          <TabsTrigger value="curriculum">커리큘럼</TabsTrigger>
        </TabsList>

        <TabsContent value="intro" className="mt-6">
          <CourseIntroTab course={course} enrollment={enrollment} />
        </TabsContent>

        <TabsContent value="curriculum" className="mt-6">
          <CourseCurriculumTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
