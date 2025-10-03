"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, Users, Calendar, Edit } from "lucide-react";
import { useInstructorCourseDetail } from "@/features/instructor/hooks/useInstructorCourseDetail";
import { useUpdateCourse } from "@/features/instructor/hooks/useUpdateCourse";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InstructorCourseDetailPageProps {
  params: Promise<{ courseId: string }>;
}

export default function InstructorCourseDetailPage({ params }: InstructorCourseDetailPageProps) {
  const router = useRouter();
  const { courseId } = use(params);
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { data: course, isLoading, error } = useInstructorCourseDetail(courseId);

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
    const is403 = error.message?.includes("403") || error.message?.includes("권한");

    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>오류가 발생했습니다</AlertTitle>
          <AlertDescription>
            {is403
              ? "이 코스에 대한 권한이 없습니다."
              : "코스 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push("/instructor/dashboard")} variant="outline">
            대시보드로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTitle>코스를 찾을 수 없습니다</AlertTitle>
          <AlertDescription>
            요청하신 코스 정보를 찾을 수 없습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground mt-2">코스 관리</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/instructor/courses/${courseId}/assignments`)} variant="outline">
            과제 관리
          </Button>
          <Button onClick={() => router.push(`/instructor/courses/${courseId}/edit`)} disabled>
            <Edit className="h-4 w-4 mr-2" />
            수정
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">상태</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                course.status === "published"
                  ? "default"
                  : course.status === "draft"
                  ? "secondary"
                  : "outline"
              }
            >
              {course.status === "published"
                ? "게시됨"
                : course.status === "draft"
                ? "초안"
                : "보관됨"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">수강생</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.enrollmentCount}</div>
            <p className="text-xs text-muted-foreground">명</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">생성일</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {new Date(course.createdAt).toLocaleDateString("ko-KR")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>코스 설명</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">{course.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>코스 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">카테고리</span>
            <span className="text-sm font-medium">{course.category}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">난이도</span>
            <span className="text-sm font-medium">{course.difficulty}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">마지막 수정</span>
            <span className="text-sm font-medium">
              {new Date(course.updatedAt).toLocaleDateString("ko-KR")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
