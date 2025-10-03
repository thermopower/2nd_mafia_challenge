"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, Users, FileText, ClipboardList } from "lucide-react";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { useInstructorDashboard } from "@/features/instructor/hooks/useInstructorDashboard";
import { InstructorCourseList } from "@/features/instructor/components/InstructorCourseList";
import { PendingSubmissionsList } from "@/features/instructor/components/PendingSubmissionsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function InstructorDashboardPage() {
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { data: dashboard, isLoading, error } = useInstructorDashboard();

  useEffect(() => {
    if (!isProfileLoading && profile && profile.role === "learner") {
      router.replace("/dashboard");
    }
  }, [profile, isProfileLoading, router]);

  if (isProfileLoading || isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (profile?.role === "learner") {
    return null;
  }

  if (error) {
    const is403 = error.message?.includes("403") || error.message?.includes("강사");

    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>오류가 발생했습니다</AlertTitle>
          <AlertDescription>
            {is403
              ? "강사 권한이 필요합니다. 학습자 계정으로는 접근할 수 없습니다."
              : "대시보드를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTitle>데이터를 찾을 수 없습니다</AlertTitle>
          <AlertDescription>
            대시보드 정보를 불러올 수 없습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">강사 대시보드</h1>
        <p className="text-muted-foreground mt-2">
          코스와 과제를 관리하고 학습자의 제출물을 채점하세요
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 코스</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              게시됨: {dashboard.stats.publishedCourses}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수강생</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.stats.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              전체 코스 수강생
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">채점 대기</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              미채점 제출물
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 제출</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.recentSubmissions.length}</div>
            <p className="text-xs text-muted-foreground">
              최근 10개 제출물
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">채점 대기 중인 제출물</h2>
        <PendingSubmissionsList submissions={dashboard.recentSubmissions} />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">내 코스</h2>
        <InstructorCourseList courses={dashboard.courses} />
      </div>
    </div>
  );
}
