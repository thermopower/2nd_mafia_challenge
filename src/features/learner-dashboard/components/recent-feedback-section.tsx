"use client";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecentFeedback } from "@/features/learner-dashboard/lib/dto";

type RecentFeedbackSectionProps = {
  feedback: RecentFeedback[];
};

const getScoreBadgeVariant = (score: number | null) => {
  if (score === null) return "secondary";
  if (score >= 90) return "default";
  if (score >= 70) return "secondary";
  return "destructive";
};

export const RecentFeedbackSection = ({
  feedback,
}: RecentFeedbackSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 피드백</CardTitle>
        <CardDescription>
          최근에 받은 과제 피드백입니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            최근 피드백이 없습니다.
          </p>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => {
              const gradedDate = new Date(item.gradedAt);
              const timeAgo = formatDistanceToNow(gradedDate, {
                addSuffix: true,
                locale: ko,
              });

              return (
                <div
                  key={item.id}
                  className="space-y-2 rounded-lg border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium leading-none">
                        {item.assignmentTitle}
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.courseTitle}
                      </p>
                    </div>
                    {item.score !== null && (
                      <Badge variant={getScoreBadgeVariant(item.score)}>
                        {item.score}점
                      </Badge>
                    )}
                  </div>
                  {item.feedback && (
                    <div className="flex gap-2 rounded-md bg-muted p-2">
                      <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <p className="text-sm">{item.feedback}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{timeAgo} 채점됨</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
