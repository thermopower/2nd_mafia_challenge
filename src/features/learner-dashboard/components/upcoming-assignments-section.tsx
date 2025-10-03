"use client";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Clock, AlertCircle, CheckCircle, Edit } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UpcomingAssignment } from "@/features/learner-dashboard/lib/dto";

type UpcomingAssignmentsSectionProps = {
  assignments: UpcomingAssignment[];
};

const getStatusBadge = (status: UpcomingAssignment["status"]) => {
  switch (status) {
    case "not_submitted":
      return <Badge variant="secondary">미제출</Badge>;
    case "submitted":
      return <Badge variant="outline">제출완료</Badge>;
    case "graded":
      return <Badge variant="default">채점완료</Badge>;
    case "resubmission_required":
      return <Badge variant="destructive">재제출필요</Badge>;
  }
};

const getStatusIcon = (status: UpcomingAssignment["status"]) => {
  switch (status) {
    case "not_submitted":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case "submitted":
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case "graded":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "resubmission_required":
      return <Edit className="h-4 w-4 text-destructive" />;
  }
};

export const UpcomingAssignmentsSection = ({
  assignments,
}: UpcomingAssignmentsSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>마감 임박 과제</CardTitle>
        <CardDescription>
          앞으로 7일 이내에 마감되는 과제입니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            마감 임박한 과제가 없습니다.
          </p>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const dueDate = new Date(assignment.dueAt);
              const timeAgo = formatDistanceToNow(dueDate, {
                addSuffix: true,
                locale: ko,
              });

              return (
                <div
                  key={assignment.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="mt-0.5">{getStatusIcon(assignment.status)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium leading-none">
                        {assignment.title}
                      </h4>
                      {getStatusBadge(assignment.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {assignment.courseTitle}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {assignment.isOverdue ? (
                        <>
                          <AlertCircle className="h-3 w-3 text-destructive" />
                          <span className="text-destructive">마감 지남</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>{timeAgo} 마감</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
