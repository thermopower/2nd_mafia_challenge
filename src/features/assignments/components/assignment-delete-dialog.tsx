"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteAssignment } from "../hooks/useDeleteAssignment";

interface AssignmentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  hasSubmissions?: boolean;
}

export function AssignmentDeleteDialog({
  open,
  onOpenChange,
  assignmentId,
  assignmentTitle,
  courseId,
  hasSubmissions = false,
}: AssignmentDeleteDialogProps) {
  const deleteMutation = useDeleteAssignment(courseId);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(assignmentId);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>과제를 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                <strong>{assignmentTitle}</strong> 과제를 삭제하려고 합니다.
              </p>
              {hasSubmissions ? (
                <p className="text-yellow-600 dark:text-yellow-400">
                  ⚠️ 이 과제에는 제출 내역이 있습니다. 학습자 화면에서 숨겨지며 제출
                  데이터는 보존됩니다. (소프트 삭제)
                </p>
              ) : (
                <p className="text-red-600 dark:text-red-400">
                  ⚠️ 제출 내역이 없어 즉시 완전히 삭제됩니다. 이 작업은 되돌릴 수
                  없습니다.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? "삭제 중..." : "삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
