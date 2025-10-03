"use client";

import Image from "next/image";
import { Loader2, Users, BookOpen, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCourseDetailQuery } from "@/features/course-catalog/hooks/useCourseDetailQuery";
import {
  COURSE_CATEGORIES,
  COURSE_DIFFICULTIES,
} from "@/features/course-catalog/constants/filters";
import { extractApiErrorMessage } from "@/lib/remote/api-client";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { CourseEnrollButtons } from "./course-enroll-buttons";

type CourseDetailDialogProps = {
  courseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CourseDetailDialog = ({
  courseId,
  open,
  onOpenChange,
}: CourseDetailDialogProps) => {
  const {
    data: detailData,
    isLoading,
    error,
  } = useCourseDetailQuery({
    courseId,
    enabled: open && !!courseId,
  });

  const course = detailData?.course;
  const enrollment = detailData?.enrollment;

  const categoryLabel =
    COURSE_CATEGORIES.find((c) => c.value === course?.category)?.label ??
    course?.category;
  const difficultyLabel =
    COURSE_DIFFICULTIES.find((d) => d.value === course?.difficulty)?.label ??
    course?.difficulty;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {isLoading && (
          <>
            <VisuallyHidden>
              <SheetTitle>코스 로딩 중</SheetTitle>
            </VisuallyHidden>
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </>
        )}

        {error && (
          <>
            <VisuallyHidden>
              <SheetTitle>코스 로드 실패</SheetTitle>
            </VisuallyHidden>
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <p className="text-sm text-destructive">
                {extractApiErrorMessage(error, "코스 정보를 불러오는 데 실패했습니다.")}
              </p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                닫기
              </Button>
            </div>
          </>
        )}

        {course && (
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle className="text-2xl">{course.title}</SheetTitle>

              <SheetDescription className="text-base">
                {course.description}
              </SheetDescription>

              <div className="relative h-64 w-full overflow-hidden rounded-lg">
                <Image
                  src={course.thumbnailUrl ?? `https://picsum.photos/seed/${course.id}/800/600`}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Badge variant="secondary">{categoryLabel}</Badge>
                <Badge variant="outline">{difficultyLabel}</Badge>
                {course.status === "published" && (
                  <Badge variant="default">공개</Badge>
                )}
              </div>
            </SheetHeader>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{course.instructorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>{course.enrollmentCount}명 수강 중</span>
                </div>
              </div>

              <CourseEnrollButtons
                courseId={course.id}
                courseStatus={course.status}
                isEnrolled={enrollment?.isEnrolled ?? false}
                enrolledAt={enrollment?.enrolledAt}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
