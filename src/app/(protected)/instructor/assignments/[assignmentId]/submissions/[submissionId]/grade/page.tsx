"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
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
    assignmentId: string;
    submissionId: string;
  }>;
}

export default function InstructorAssignmentGradePage({ params }: PageProps) {
  const { assignmentId, submissionId } = use(params);
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { data: submission, isLoading, error, refetch } = useAssignmentSubmissionDetail(assignmentId, submissionId);

  useEffect(() => {
    if (!isProfileLoading && profile && profile.role === "learner") {
      router.replace("/dashboard");
    }
  }, [profile, isProfileLoading, router]);

  const handleBackClick = () => {
    router.push(`/instructor/dashboard`);
  };

  const handleGradeSuccess = () => {
    router.push(`/instructor/dashboard`);
  };

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
    const is404 = error.message?.includes("404") || error.message?.includes("찾을 수 없");

    return (
      <div className="container mx-auto py-8 space-y-4">
        <Button variant="ghost" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          대시보드로 돌아가기
        </Button>

        <Alert variant="destructive">
          <AlertTitle>오류가 발생했습니다</AlertTitle>
          <AlertDescription>
            {is403
              ? "이 제출물에 접근할 권한이 없습니다. 본인이 담당하는 코스의 과제만 채점할 수 있습니다."
              : is404
              ? "제출물 정보를 불러오지 못했습니다. 제출물이 존재하지 않거나 삭제되었을 수 있습니다."
              : "제출물을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Button variant="ghost" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          대시보드로 돌아가기
        </Button>

        <Alert>
          <AlertTitle>제출물을 찾을 수 없습니다</AlertTitle>
          <AlertDescription>
            요청하신 제출물을 찾을 수 없습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          대시보드로 돌아가기
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>제출 내용</CardTitle>
            <CardDescription>
              제출 버전: {submission.version}
              {submission.late && " · 지각 제출"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">답안</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {submission.answerText}
              </p>
            </div>

            {submission.answerLink && (
              <div>
                <h4 className="font-medium mb-2">링크</h4>
                <a
                  href={submission.answerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {submission.answerLink}
                </a>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">제출 상태:</span>
                  <span className="ml-2 font-medium">
                    {submission.status === "submitted"
                      ? "제출됨"
                      : submission.status === "graded"
                      ? "채점 완료"
                      : "재제출 요청"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">제출일:</span>
                  <span className="ml-2 font-medium">
                    {new Date(submission.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>채점</CardTitle>
            <CardDescription>
              점수와 피드백을 입력하여 제출물을 채점하세요
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
