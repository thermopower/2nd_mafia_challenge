"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { FileText, ChevronRight } from "lucide-react";
import type { CourseAssignmentSummary } from "@/features/assignments/lib/dto";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CourseAssignmentsQuickActionsProps {
  courseId: string;
  assignments: CourseAssignmentSummary[];
}

export function CourseAssignmentsQuickActions({
  courseId,
  assignments,
}: CourseAssignmentsQuickActionsProps) {
  const router = useRouter();

  if (!assignments || assignments.length === 0) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-muted/50 text-center">
        <p className="text-sm text-muted-foreground">
          현재 진행 중인 과제가 없습니다
        </p>
      </div>
    );
  }

  const handleAssignmentClick = (assignmentId: string) => {
    router.push(`/dashboard/courses/${courseId}/assignments/${assignmentId}`);
  };

  const getSubmissionStatusBadge = (summary: CourseAssignmentSummary) => {
    if (!summary.submissionStatus || summary.submissionStatus === "not_submitted") {
      return <Badge variant="outline">미제출</Badge>;
    }
    if (summary.submissionStatus === "submitted") {
      return (
        <Badge variant="secondary">
          {summary.late ? "지각 제출" : "제출됨"}
        </Badge>
      );
    }
    if (summary.submissionStatus === "graded") {
      return (
        <Badge variant="default">
          채점 완료 ({summary.score ?? 0}점)
        </Badge>
      );
    }
    if (summary.submissionStatus === "resubmission_required") {
      return <Badge variant="destructive">재제출 요청</Badge>;
    }
    return null;
  };

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground px-1">
        과제 빠른 액션
      </h4>
      <div className="space-y-2">
        {assignments.map((assignment) => (
          <Button
            key={assignment.id}
            variant="ghost"
            className="w-full justify-between h-auto py-3 px-4"
            onClick={() => handleAssignmentClick(assignment.id)}
            aria-label={`${assignment.title} 과제 상세 보기`}
          >
            <div className="flex items-start gap-3 flex-1 text-left">
              <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {assignment.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(assignment.dueAt), "PPP", { locale: ko })} 마감
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getSubmissionStatusBadge(assignment)}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
