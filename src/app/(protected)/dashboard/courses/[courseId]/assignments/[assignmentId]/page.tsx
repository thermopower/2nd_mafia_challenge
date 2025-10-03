"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAssignmentDetail } from "@/features/assignments/hooks/useAssignmentDetail";
import { AssignmentDetailView } from "@/features/assignments/components/assignment-detail-view";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PageProps {
  params: Promise<{
    courseId: string;
    assignmentId: string;
  }>;
}

export default function AssignmentDetailPage({ params }: PageProps) {
  const { courseId, assignmentId } = use(params);
  const router = useRouter();
  const { data: assignment, isLoading, error } = useAssignmentDetail(assignmentId);

  const handleBackClick = () => {
    router.push('/dashboard');
  };

  const handleSubmitClick = () => {
    router.push(`/dashboard/courses/${courseId}/assignments/${assignmentId}/submit`);
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
    return (
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="mb-4"
        >
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

  if (!assignment) {
    return (
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
        <Alert>
          <AlertTitle>과제를 찾을 수 없습니다</AlertTitle>
          <AlertDescription>
            요청하신 과제를 찾을 수 없습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        onClick={handleBackClick}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        돌아가기
      </Button>
      <AssignmentDetailView
        assignment={assignment}
        onSubmitClick={handleSubmitClick}
      />
    </div>
  );
}
