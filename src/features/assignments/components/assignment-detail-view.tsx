"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, Weight, Info } from "lucide-react";
import type { AssignmentDetail } from "../lib/dto";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AssignmentDetailViewProps {
  assignment: AssignmentDetail;
  onSubmitClick?: () => void;
}

export function AssignmentDetailView({
  assignment,
  onSubmitClick,
}: AssignmentDetailViewProps) {
  const dueDate = new Date(assignment.dueAt);
  const isOverdue = dueDate < new Date();
  const isClosed = assignment.status === "closed";

  const canSubmit =
    !isClosed && (!isOverdue || (isOverdue && assignment.allowLate));

  const statusBadgeVariant = () => {
    if (assignment.status === "published") return "default";
    if (assignment.status === "closed") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <CardDescription className="mt-2">
                {format(dueDate, "PPP p", { locale: ko })} 마감
              </CardDescription>
            </div>
            <Badge variant={statusBadgeVariant()}>
              {assignment.status === "published" && "진행 중"}
              {assignment.status === "closed" && "마감"}
              {assignment.status === "draft" && "준비 중"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">과제 설명</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {assignment.description}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">마감일</p>
                <p className="text-sm text-muted-foreground">
                  {format(dueDate, "PPP p", { locale: ko })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Weight className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">배점</p>
                <p className="text-sm text-muted-foreground">
                  {assignment.weight}%
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">제출 정책</h3>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                지각 제출:{" "}
                {assignment.allowLate ? "허용됨" : "허용되지 않음"}
              </li>
              <li>
                재제출:{" "}
                {assignment.allowResubmission ? "허용됨" : "허용되지 않음"}
              </li>
            </ul>
          </div>

          {isOverdue && !isClosed && (
            <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
              <p className="font-medium">마감일이 지났습니다</p>
              {assignment.allowLate ? (
                <p className="mt-1">
                  지각 제출이 허용되지만, 제출물에 지각 표시가 됩니다.
                </p>
              ) : (
                <p className="mt-1">
                  지각 제출이 허용되지 않아 제출할 수 없습니다.
                </p>
              )}
            </div>
          )}

          {isClosed && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-800">
              <p className="font-medium">이 과제는 마감되었습니다</p>
              <p className="mt-1">더 이상 제출할 수 없습니다.</p>
            </div>
          )}

          {canSubmit && onSubmitClick && (
            <Button onClick={onSubmitClick} className="w-full">
              과제 제출하기
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
