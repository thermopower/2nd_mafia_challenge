"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCourseEnrollmentMutation } from "@/features/course-catalog/hooks/useCourseEnrollmentMutation";
import { useCourseUnenrollmentMutation } from "@/features/course-catalog/hooks/useCourseUnenrollmentMutation";
import { extractApiErrorMessage } from "@/lib/remote/api-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";

type CourseEnrollButtonsProps = {
  courseId: string;
  courseStatus: string;
  isEnrolled: boolean;
  enrolledAt?: string | null;
};

export const CourseEnrollButtons = ({
  courseId,
  courseStatus,
  isEnrolled,
  enrolledAt,
}: CourseEnrollButtonsProps) => {
  const { toast } = useToast();
  const { isAuthenticated } = useCurrentUser();
  const { data: profile } = useUserProfile();

  const enrollMutation = useCourseEnrollmentMutation();
  const unenrollMutation = useCourseUnenrollmentMutation();

  const handleEnroll = async () => {
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

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-blue-500 bg-blue-50 p-4 dark:bg-blue-950">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
          학습자만 수강신청이 가능합니다
        </p>
        <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
          로그인 후 이용해주세요
        </p>
      </div>
    );
  }

  if (profile?.role !== "learner") {
    return (
      <div className="rounded-lg border border-blue-500 bg-blue-50 p-4 dark:bg-blue-950">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
          학습자만 수강신청이 가능합니다
        </p>
      </div>
    );
  }

  if (isEnrolled) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-950">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">
            이미 수강 중인 코스입니다
          </p>
          {enrolledAt && (
            <p className="mt-1 text-xs text-green-700 dark:text-green-300">
              등록일: {new Date(enrolledAt).toLocaleDateString("ko-KR")}
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
    );
  }

  return (
    <Button
      className="w-full"
      onClick={handleEnroll}
      disabled={enrollMutation.isPending || courseStatus !== "published"}
    >
      {enrollMutation.isPending && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {courseStatus !== "published" ? "수강신청 불가" : "수강신청"}
    </Button>
  );
};
