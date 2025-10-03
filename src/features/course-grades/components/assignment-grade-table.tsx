"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AssignmentGrade } from "../backend/schema";
import { GRADE_CONSTANTS } from "../constants/grades";

type AssignmentGradeTableProps = {
  assignments: AssignmentGrade[];
};

const getStatusBadge = (status: string, late: boolean) => {
  if (status === "graded") {
    return (
      <Badge variant="default" className="bg-green-600">
        채점 완료
      </Badge>
    );
  }
  if (status === "resubmission_required") {
    return <Badge variant="destructive">재제출 필요</Badge>;
  }
  if (status === "submitted") {
    return late ? (
      <Badge variant="outline" className="border-orange-500 text-orange-700">
        <Clock className="mr-1 h-3 w-3" />
        지각 제출
      </Badge>
    ) : (
      <Badge variant="outline">평가 대기</Badge>
    );
  }
  return <Badge variant="secondary">미제출</Badge>;
};

export const AssignmentGradeTable = ({
  assignments,
}: AssignmentGradeTableProps) => {
  const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(
    new Set()
  );

  const toggleFeedback = (assignmentId: string) => {
    setExpandedFeedback((prev) => {
      const next = new Set(prev);
      if (next.has(assignmentId)) {
        next.delete(assignmentId);
      } else {
        next.add(assignmentId);
      }
      return next;
    });
  };

  if (assignments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          아직 과제가 등록되지 않았습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>과제명</TableHead>
            <TableHead className="text-center">가중치</TableHead>
            <TableHead className="text-center">점수</TableHead>
            <TableHead className="text-center">상태</TableHead>
            <TableHead>피드백</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => {
            const isExpanded = expandedFeedback.has(assignment.assignmentId);
            const hasFeedback = assignment.feedback && assignment.feedback.length > 0;
            const feedbackPreview = hasFeedback
              ? assignment.feedback.slice(0, GRADE_CONSTANTS.FEEDBACK_PREVIEW_LENGTH)
              : null;

            return (
              <TableRow key={assignment.assignmentId}>
                <TableCell className="font-medium">
                  {assignment.title}
                  {assignment.late && (
                    <Badge
                      variant="outline"
                      className="ml-2 border-orange-500 text-orange-700"
                    >
                      지각
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {assignment.weight.toFixed(0)}%
                </TableCell>
                <TableCell className="text-center">
                  {assignment.score !== null ? (
                    <span className="font-semibold">{assignment.score}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(assignment.status, assignment.late)}
                </TableCell>
                <TableCell>
                  {hasFeedback ? (
                    <div className="space-y-2">
                      <p
                        className={`text-sm ${
                          isExpanded ? "" : "line-clamp-2"
                        }`}
                      >
                        {assignment.feedback}
                      </p>
                      {assignment.feedback.length > GRADE_CONSTANTS.FEEDBACK_PREVIEW_LENGTH && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFeedback(assignment.assignmentId)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="mr-1 h-3 w-3" />
                              접기
                            </>
                          ) : (
                            <>
                              <ChevronDown className="mr-1 h-3 w-3" />
                              더보기
                            </>
                          )}
                        </Button>
                      )}
                      {assignment.gradedAt && (
                        <p className="text-xs text-muted-foreground">
                          채점일:{" "}
                          {format(new Date(assignment.gradedAt), "PPP", {
                            locale: ko,
                          })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
