"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourseGrades } from "@/features/course-grades/hooks/useCourseGrades";
import { CourseGradeSummaryCard } from "@/features/course-grades/components/course-grade-summary-card";
import { AssignmentGradeTable } from "@/features/course-grades/components/assignment-grade-table";
import { extractApiErrorMessage } from "@/lib/remote/api-client";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { useRouter } from "next/navigation";

type CourseGradesPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

export default function CourseGradesPage({ params }: CourseGradesPageProps) {
  const { courseId } = use(params);
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();

  const {
    data: gradesData,
    isLoading,
    error,
    refetch,
  } = useCourseGrades({
    courseId,
    enabled: !!profile && profile.role === "learner",
  });

  // 프로필 로딩 중
  if (isProfileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 강사 권한 체크
  if (profile?.role !== "learner") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-destructive">
          학습자만 성적을 조회할 수 있습니다.
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          대시보드로 돌아가기
        </Button>
      </div>
    );
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 에러 처리
  if (error) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              대시보드로 돌아가기
            </Button>
          </Link>
        </div>
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <p className="text-sm text-destructive">
            {extractApiErrorMessage(error, "성적 정보를 불러오는 데 실패했습니다.")}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!gradesData) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              대시보드로 돌아가기
            </Button>
          </Link>
        </div>
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <p className="text-sm text-muted-foreground">
            성적 정보를 찾을 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            대시보드로 돌아가기
          </Button>
        </Link>
      </div>

      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">코스 성적</h1>
          <p className="mt-2 text-muted-foreground">
            과제별 점수와 피드백을 확인하세요
          </p>
        </div>

        <CourseGradeSummaryCard summary={gradesData.summary} />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">과제별 성적</h2>
          <AssignmentGradeTable assignments={gradesData.assignments} />
        </div>
      </div>
    </div>
  );
}
