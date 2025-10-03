"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle } from "lucide-react";
import type { PendingSubmission } from "../lib/dto";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface PendingSubmissionsListProps {
  submissions: PendingSubmission[];
}

export function PendingSubmissionsList({ submissions }: PendingSubmissionsListProps) {
  const router = useRouter();

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          채점 대기 중인 제출물이 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 제출물</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{submission.assignmentTitle}</h4>
                  {submission.late && (
                    <Badge variant="destructive" className="h-5">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      지각
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {submission.courseTitle} · {submission.learnerName}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(submission.submittedAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() =>
                  router.push(
                    `/dashboard/courses/${submission.courseId}/assignments/${submission.assignmentId}/submissions/${submission.id}/grade`
                  )
                }
              >
                채점하기
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
