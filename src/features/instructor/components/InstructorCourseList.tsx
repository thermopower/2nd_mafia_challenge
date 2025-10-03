"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Upload, Archive, Trash2 } from "lucide-react";
import type { InstructorCourse } from "../lib/dto";
import { useRouter } from "next/navigation";
import { useUpdateCourse } from "../hooks/useUpdateCourse";
import { useDeleteCourse } from "../hooks/useDeleteCourse";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/constants/routes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface InstructorCourseListProps {
  courses: InstructorCourse[];
}

export function InstructorCourseList({ courses }: InstructorCourseListProps) {
  const router = useRouter();
  const { toast } = useToast();

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          생성된 코스가 없습니다.
        </CardContent>
      </Card>
    );
  }

  const CourseCard = ({ course }: { course: InstructorCourse }) => {
    const { mutate: updateCourse, isPending: isUpdating } = useUpdateCourse(course.id);
    const { mutate: deleteCourse, isPending: isDeleting } = useDeleteCourse();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleStatusChange = (newStatus: "draft" | "published" | "archived") => {
      updateCourse(
        { status: newStatus },
        {
          onSuccess: () => {
            toast({
              title: "상태 변경 완료",
              description: `코스가 ${
                newStatus === "published"
                  ? "게시"
                  : newStatus === "draft"
                  ? "초안으로 전환"
                  : "보관"
              }되었습니다.`,
            });
          },
        }
      );
    };

    const handleDelete = () => {
      deleteCourse(course.id, {
        onSuccess: () => {
          toast({
            title: "삭제 완료",
            description: "코스가 성공적으로 삭제되었습니다.",
          });
          setIsDeleteDialogOpen(false);
        },
      });
    };

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">
                {course.title}
              </CardTitle>
            </div>
            <Badge
              variant={
                course.status === "published"
                  ? "default"
                  : course.status === "draft"
                  ? "secondary"
                  : "outline"
              }
            >
              {course.status === "published"
                ? "게시됨"
                : course.status === "draft"
                ? "초안"
                : "보관됨"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{course.category}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.enrollmentCount}명</span>
            </div>
          </div>

          <div className="space-y-2">
            {course.status === "draft" && (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => handleStatusChange("published")}
                disabled={isUpdating || isDeleting}
              >
                <Upload className="mr-2 h-4 w-4" />
                게시하기
              </Button>
            )}
            {course.status === "published" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleStatusChange("archived")}
                disabled={isUpdating || isDeleting}
              >
                <Archive className="mr-2 h-4 w-4" />
                보관하기
              </Button>
            )}
            {course.status === "archived" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleStatusChange("published")}
                disabled={isUpdating || isDeleting}
              >
                <Upload className="mr-2 h-4 w-4" />
                다시 게시하기
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => router.push(ROUTES.INSTRUCTOR_COURSE_DETAIL(course.id))}
              >
                관리
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => router.push(ROUTES.INSTRUCTOR_COURSE_ASSIGNMENTS(course.id))}
              >
                과제 관리
              </Button>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={isUpdating || isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>코스를 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 작업은 되돌릴 수 없습니다. 코스와 관련된 모든 과제 및 제출물이 함께 삭제됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "삭제 중..." : "삭제"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
