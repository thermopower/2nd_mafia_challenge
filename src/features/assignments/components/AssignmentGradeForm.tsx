"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GradeAssignmentRequestSchema, type AssignmentSubmissionDetail } from "../lib/dto";
import { useGradeAssignment } from "../hooks/useGradeAssignment";
import { z } from "zod";

type GradeFormValues = z.infer<typeof GradeAssignmentRequestSchema>;

interface AssignmentGradeFormProps {
  assignmentId: string;
  submissionId: string;
  currentSubmission: AssignmentSubmissionDetail;
  onSuccess?: () => void;
  onConflict?: () => void;
}

export function AssignmentGradeForm({
  assignmentId,
  submissionId,
  currentSubmission,
  onSuccess,
  onConflict,
}: AssignmentGradeFormProps) {
  const { toast } = useToast();
  const gradeAssignmentMutation = useGradeAssignment();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GradeFormValues>({
    resolver: zodResolver(GradeAssignmentRequestSchema),
    defaultValues: {
      score: currentSubmission.score ?? undefined,
      feedback: currentSubmission.feedback ?? "",
      requestResubmission: false,
      expectedUpdatedAt: currentSubmission.updatedAt,
    },
  });

  const requestResubmission = watch("requestResubmission");

  const onSubmit = async (data: GradeFormValues) => {
    try {
      await gradeAssignmentMutation.mutateAsync({
        assignmentId,
        submissionId,
        ...data,
      });

      toast({
        title: "채점 완료",
        description: data.requestResubmission
          ? "재제출 요청이 전송되었습니다."
          : "채점이 완료되었습니다.",
      });

      onSuccess?.();
    } catch (error) {
      if (error instanceof Error && error.message.includes("409")) {
        toast({
          title: "충돌 발생",
          description: "다른 사용자가 이 제출물을 수정했습니다. 페이지를 새로고침해주세요.",
          variant: "destructive",
        });
        onConflict?.();
      } else {
        toast({
          title: "채점 실패",
          description: error instanceof Error ? error.message : "채점 처리에 실패했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">제출 정보</h3>
          <Badge variant={
            currentSubmission.status === "graded" ? "default" :
            currentSubmission.status === "resubmission_required" ? "secondary" :
            "outline"
          }>
            {currentSubmission.status === "graded" ? "채점 완료" :
             currentSubmission.status === "resubmission_required" ? "재제출 요청됨" :
             "제출됨"}
          </Badge>
        </div>

        <div className="rounded-lg border p-4 space-y-2">
          <div className="text-sm text-muted-foreground">제출 답안</div>
          <div className="whitespace-pre-wrap">{currentSubmission.answerText}</div>
          {currentSubmission.answerLink && (
            <div className="pt-2">
              <a
                href={currentSubmission.answerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {currentSubmission.answerLink}
              </a>
            </div>
          )}
          {currentSubmission.late && (
            <Badge variant="destructive" className="mt-2">지각 제출</Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="requestResubmission"
            {...register("requestResubmission")}
          />
          <Label htmlFor="requestResubmission">재제출 요청</Label>
        </div>

        {!requestResubmission && (
          <div className="space-y-2">
            <label htmlFor="score" className="text-sm font-medium">
              점수 (0-100) <span className="text-red-500">*</span>
            </label>
            <Input
              id="score"
              type="number"
              min={0}
              max={100}
              {...register("score", { valueAsNumber: true })}
              placeholder="점수를 입력하세요"
              disabled={gradeAssignmentMutation.isPending}
            />
            {errors.score && (
              <p className="text-sm text-red-500">{errors.score.message}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="feedback" className="text-sm font-medium">
            피드백 <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="feedback"
            {...register("feedback")}
            placeholder="피드백을 입력하세요 (최소 5자)"
            rows={6}
            disabled={gradeAssignmentMutation.isPending}
            className="resize-none"
          />
          {errors.feedback && (
            <p className="text-sm text-red-500">{errors.feedback.message}</p>
          )}
        </div>

        {errors.root && (
          <Alert variant="destructive">
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={gradeAssignmentMutation.isPending}
          className="flex-1"
        >
          {gradeAssignmentMutation.isPending ? "처리 중..." : requestResubmission ? "재제출 요청" : "채점 저장"}
        </Button>
      </div>
    </form>
  );
}
