"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAssignmentDetail } from "@/features/assignments/hooks/useAssignmentDetail";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubmitAssignment } from "@/features/assignments/hooks/useSubmitAssignment";
import { useToast } from "@/hooks/use-toast";

interface PageProps {
  params: Promise<{
    courseId: string;
    assignmentId: string;
  }>;
}

export default function AssignmentSubmitPage({ params }: PageProps) {
  const { courseId, assignmentId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { data: assignment, isLoading, error } = useAssignmentDetail(assignmentId);
  const submitMutation = useSubmitAssignment();

  const [submissionText, setSubmissionText] = useState("");
  const [submissionLink, setSubmissionLink] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleBackClick = () => {
    router.push(`/dashboard/courses/${courseId}/assignments/${assignmentId}`);
  };

  const handleSubmit = async () => {
    setValidationError(null);

    if (!submissionText.trim()) {
      setValidationError("제출 내용을 입력해주세요.");
      return;
    }

    if (submissionLink && !isValidUrl(submissionLink)) {
      setValidationError("올바른 URL 형식을 입력해주세요.");
      return;
    }

    submitMutation.mutate(
      {
        assignmentId,
        submissionText: submissionText.trim(),
        submissionLink: submissionLink.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          toast({
            title: "제출 완료",
            description: data.late
              ? "과제가 지각 제출되었습니다."
              : "과제가 성공적으로 제출되었습니다.",
          });
          // 대시보드로 이동
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        },
        onError: (error) => {
          toast({
            title: "제출 실패",
            description: error.message || "과제 제출 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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

  if (error || !assignment) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={handleBackClick} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
        <Alert variant="destructive">
          <AlertTitle>오류가 발생했습니다</AlertTitle>
          <AlertDescription>
            과제 정보를 불러오지 못했습니다. 권한이 없거나 과제가 존재하지 않을 수 있습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const dueDate = new Date(assignment.dueAt);
  const isOverdue = dueDate < new Date();
  const isClosed = assignment.status === "closed";
  const canSubmit = !isClosed && (!isOverdue || (isOverdue && assignment.allowLate));

  if (!canSubmit) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={handleBackClick} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
        <Alert>
          <AlertTitle>제출할 수 없습니다</AlertTitle>
          <AlertDescription>
            {isClosed
              ? "이 과제는 마감되었습니다."
              : "마감일이 지났으며 지각 제출이 허용되지 않습니다."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Button variant="ghost" onClick={handleBackClick} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        돌아가기
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{assignment.title}</CardTitle>
          <CardDescription>과제 제출</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isOverdue && assignment.allowLate && (
            <Alert>
              <AlertTitle>지각 제출</AlertTitle>
              <AlertDescription>
                마감일이 지났습니다. 제출하시면 지각 표시가 됩니다.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="submission-text">제출 내용 *</Label>
            <Textarea
              id="submission-text"
              placeholder="과제 내용을 입력하세요"
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              className="min-h-[200px]"
              disabled={submitMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="submission-link">제출 링크 (선택)</Label>
            <Input
              id="submission-link"
              type="url"
              placeholder="https://example.com"
              value={submissionLink}
              onChange={(e) => setSubmissionLink(e.target.value)}
              disabled={submitMutation.isPending}
            />
          </div>

          {validationError && (
            <Alert variant="destructive">
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {submitMutation.isError && (
            <Alert variant="destructive">
              <AlertTitle>제출 실패</AlertTitle>
              <AlertDescription>
                과제 제출 중 오류가 발생했습니다. 다시 시도해주세요.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="flex-1"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  제출 중...
                </>
              ) : (
                "제출하기"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleBackClick}
              disabled={submitMutation.isPending}
            >
              취소
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
