"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAssignmentSubmissionDetail } from "@/features/assignments/hooks/useAssignmentSubmissionDetail";
import { AssignmentGradeForm } from "@/features/assignments/components/AssignmentGradeForm";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PageProps {
  params: Promise<{
    courseId: string;
    assignmentId: string;
    submissionId: string;
  }>;
}

export default function AssignmentSubmissionGradePage({ params }: PageProps) {
  const { courseId, assignmentId, submissionId } = use(params);
  const router = useRouter();
  const { data: submission, isLoading, error, refetch } = useAssignmentSubmissionDetail(assignmentId, submissionId);

  const handleBackClick = () => {
    router.push(`/dashboard/courses/${courseId}/assignments/${assignmentId}`);
  };

  const handleGradeSuccess = () => {
    router.push(`/dashboard/courses/${courseId}/assignments/${assignmentId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    const is403 = error.message?.includes("403") || error.message?.includes("권한");

    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={handleBackClick} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
        <Alert variant="destructive">
          <AlertTitle>오류가 발생했습니다</AlertTitle>
          <AlertDescription>
            {is403
              ? "제출물을 조회할 권한이 없습니다. 본인이 담당하는 코스의 제출물만 채점할 수 있습니다."
              : "제출물 정보를 불러오지 못했습니다. 제출물이 존재하지 않거나 삭제되었을 수 있습니다."}
          </AlertDescription>
        </Alert>
        {is403 && (
          <div className="mt-4">
            <Button onClick={() => router.push("/dashboard")}>
              대시보드로 이동
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={handleBackClick} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
        <Alert variant="destructive">
          <AlertTitle>제출물을 찾을 수 없습니다</AlertTitle>
          <AlertDescription>
            요청하신 제출물이 존재하지 않습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button variant="ghost" onClick={handleBackClick} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        돌아가기
      </Button>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>과제 채점</CardTitle>
            <CardDescription>
              학습자의 제출물을 검토하고 점수와 피드백을 제공하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssignmentGradeForm
              assignmentId={assignmentId}
              submissionId={submissionId}
              currentSubmission={submission}
              onSuccess={handleGradeSuccess}
              onConflict={() => refetch()}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
