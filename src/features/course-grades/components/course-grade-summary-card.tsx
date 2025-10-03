"use client";

import { CheckCircle2, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CourseGradeSummary } from "../backend/schema";
import { GRADE_CONSTANTS } from "../constants/grades";

type CourseGradeSummaryCardProps = {
  summary: CourseGradeSummary;
};

export const CourseGradeSummaryCard = ({
  summary,
}: CourseGradeSummaryCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          코스 총점
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-bold text-primary">
            {summary.totalScore.toFixed(GRADE_CONSTANTS.DECIMAL_PLACES)}
          </p>
          <p className="text-lg text-muted-foreground">
            / {GRADE_CONSTANTS.MAX_SCORE}
          </p>
          {summary.isPartialScore && (
            <Badge variant="outline" className="ml-2">
              부분 총점
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">채점 완료</p>
            <p className="mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {summary.gradedCount} / {summary.totalAssignments}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">전체 가중치</p>
            <p className="mt-1 font-medium">{summary.totalWeight.toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">채점된 가중치</p>
            <p className="mt-1 font-medium">
              {summary.isPartialScore
                ? `${(summary.totalScore / (summary.totalScore > 0 ? 1 : 1)).toFixed(0)}%`
                : `${GRADE_CONSTANTS.MAX_WEIGHT}%`}
            </p>
          </div>
        </div>

        {summary.isPartialScore && (
          <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-3 dark:bg-yellow-950">
            <p className="text-xs text-yellow-900 dark:text-yellow-100">
              일부 과제만 채점이 완료되어 부분 총점이 표시됩니다. 모든 과제의
              채점이 완료되면 최종 점수가 산출됩니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
