"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Calendar, Users, FileText, Edit, Trash2, Send, Lock } from "lucide-react";
import { useCourseAssignments } from "@/features/instructor/hooks/useCourseAssignments";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AssignmentEditorSheet } from "@/features/assignments/components/assignment-editor-sheet";
import { AssignmentDeleteDialog } from "@/features/assignments/components/assignment-delete-dialog";
import { AssignmentDetail } from "@/features/assignments/lib/dto";
import { useChangeAssignmentStatus } from "@/features/assignments/hooks/useChangeAssignmentStatus";

interface InstructorCourseAssignmentsPageProps {
  params: Promise<{ courseId: string }>;
}

export default function InstructorCourseAssignmentsPage({ params }: InstructorCourseAssignmentsPageProps) {
  const router = useRouter();
  const { courseId } = use(params);
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { data: assignmentsData, isLoading, error } = useCourseAssignments(courseId);

  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentDetail | undefined>();
  const [deletingAssignment, setDeletingAssignment] = useState<{
    id: string;
    title: string;
    hasSubmissions: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isProfileLoading && profile && profile.role === "learner") {
      router.replace("/dashboard");
    }
  }, [profile, isProfileLoading, router]);

  if (isProfileLoading || isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (profile?.role === "learner") {
    return null;
  }

  if (error) {
    const is403 = error.message?.includes("403") || error.message?.includes("권한");

    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>오류가 발생했습니다</AlertTitle>
          <AlertDescription>
            {is403
              ? "이 코스에 대한 권한이 없습니다."
              : "과제 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push("/instructor/dashboard")} variant="outline">
            대시보드로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  if (!assignmentsData) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTitle>과제 목록을 찾을 수 없습니다</AlertTitle>
          <AlertDescription>
            요청하신 과제 목록을 찾을 수 없습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { courseTitle, assignments } = assignmentsData;

  const handleCreateClick = () => {
    setEditingAssignment(undefined);
    setEditorOpen(true);
  };

  const handleEditClick = (assignment: AssignmentDetail) => {
    setEditingAssignment(assignment);
    setEditorOpen(true);
  };

  const handleDeleteClick = (assignment: AssignmentDetail, hasSubmissions: boolean) => {
    setDeletingAssignment({
      id: assignment.id,
      title: assignment.title,
      hasSubmissions,
    });
    setDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{courseTitle}</h1>
          <p className="text-muted-foreground mt-2">과제 관리</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/instructor/courses/${courseId}`)} variant="outline">
            코스 상세
          </Button>
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            새 과제 추가
          </Button>
        </div>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            생성된 과제가 없습니다. 새 과제 추가 버튼을 눌러 과제를 생성하세요.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const AssignmentCard = () => {
              const changeStatusMutation = useChangeAssignmentStatus(assignment.id, courseId);

              const handleStatusChange = async (newStatus: "draft" | "published" | "closed") => {
                await changeStatusMutation.mutateAsync(newStatus);
              };

              return (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {assignment.description}
                        </p>
                      </div>
                      <Badge
                        variant={
                          assignment.status === "published"
                            ? "default"
                            : assignment.status === "draft"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {assignment.status === "published"
                          ? "게시됨"
                          : assignment.status === "draft"
                          ? "초안"
                          : "마감됨"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">마감일:</span>
                        <span className="font-medium">
                          {new Date(assignment.dueAt).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">제출:</span>
                        <span className="font-medium">{assignment.submissionCount}건</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">채점 대기:</span>
                        <span className="font-medium">{assignment.pendingCount}건</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>비중: {assignment.weight}%</span>
                        <span>•</span>
                        <span>{assignment.allowLate ? "지각 허용" : "지각 불가"}</span>
                        <span>•</span>
                        <span>{assignment.allowResubmission ? "재제출 가능" : "재제출 불가"}</span>
                      </div>
                      <div className="flex gap-2">
                        {assignment.status === "draft" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStatusChange("published")}
                            disabled={changeStatusMutation.isPending}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            게시하기
                          </Button>
                        )}
                        {assignment.status === "published" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange("closed")}
                            disabled={changeStatusMutation.isPending}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            마감하기
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(assignment as unknown as AssignmentDetail)}
                          disabled={assignment.status === "closed"}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          편집
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDeleteClick(
                              assignment as unknown as AssignmentDetail,
                              assignment.submissionCount > 0
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            };

            return <AssignmentCard key={assignment.id} />;
          })}
        </div>
      )}

      <AssignmentEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        courseId={courseId}
        assignment={editingAssignment}
        mode={editingAssignment ? "edit" : "create"}
      />

      {deletingAssignment && (
        <AssignmentDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          assignmentId={deletingAssignment.id}
          assignmentTitle={deletingAssignment.title}
          courseId={courseId}
          hasSubmissions={deletingAssignment.hasSubmissions}
        />
      )}
    </div>
  );
}
