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
import { useToast } from "@/hooks/use-toast";
import { useCourseDetailQuery } from "@/features/course-catalog/hooks/useCourseDetailQuery";
import { useCourseEnrollmentMutation } from "@/features/course-catalog/hooks/useCourseEnrollmentMutation";
import { useCourseUnenrollmentMutation } from "@/features/course-catalog/hooks/useCourseUnenrollmentMutation";
import {
  COURSE_CATEGORIES,
  COURSE_DIFFICULTIES,
} from "@/features/course-catalog/constants/filters";
import { extractApiErrorMessage } from "@/lib/remote/api-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

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
  const { toast } = useToast();
  const { isAuthenticated } = useCurrentUser();
  const { data: profile } = useUserProfile();

  const {
    data: detailData,
    isLoading,
    error,
  } = useCourseDetailQuery({
    courseId,
    enabled: open && !!courseId,
  });

  const enrollMutation = useCourseEnrollmentMutation();
  const unenrollMutation = useCourseUnenrollmentMutation();

  const handleEnroll = async () => {
    if (!courseId) return;

    try {
      await enrollMutation.mutateAsync({ courseId });
      toast({
        title: "수강신청 성공",
        description: "코스에 성공적으로 등록되었습니다.",
      });
    } catch (err) {
      const message = extractApiErrorMessage(err, "수강신청에 실패했습니다.");
      toast({
        title: "수강신청 실패",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleUnenroll = async () => {
    if (!courseId) return;

    try {
      await unenrollMutation.mutateAsync({ courseId });
      toast({
        title: "수강 취소 성공",
        description: "코스 수강이 취소되었습니다.",
      });
    } catch (err) {
      const message = extractApiErrorMessage(err, "수강 취소에 실패했습니다.");
      toast({
        title: "수강 취소 실패",
        description: message,
        variant: "destructive",
      });
    }
  };

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

              {!isAuthenticated ? (
                <div className="rounded-lg border border-blue-500 bg-blue-50 p-4 dark:bg-blue-950">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    학습자만 수강신청이 가능합니다
                  </p>
                  <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                    로그인 후 이용해주세요
                  </p>
                </div>
              ) : profile?.role !== "learner" ? (
                <div className="rounded-lg border border-blue-500 bg-blue-50 p-4 dark:bg-blue-950">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    학습자만 수강신청이 가능합니다
                  </p>
                </div>
              ) : enrollment?.isEnrolled ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-950">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      이미 수강 중인 코스입니다
                    </p>
                    {enrollment.enrolledAt && (
                      <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                        등록일: {new Date(enrollment.enrolledAt).toLocaleDateString("ko-KR")}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleUnenroll}
                    disabled={unenrollMutation.isPending}
                  >
                    {unenrollMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    수강 취소
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleEnroll}
                  disabled={
                    enrollMutation.isPending || course.status !== "published"
                  }
                >
                  {enrollMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {course.status !== "published" ? "수강신청 불가" : "수강신청"}
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
