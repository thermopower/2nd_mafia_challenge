"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users } from "lucide-react";
import type { InstructorCourse } from "../lib/dto";
import { useRouter } from "next/navigation";

interface InstructorCourseListProps {
  courses: InstructorCourse[];
}

export function InstructorCourseList({ courses }: InstructorCourseListProps) {
  const router = useRouter();

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          생성된 코스가 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Card key={course.id} className="hover:shadow-lg transition-shadow">
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => router.push(`/instructor/courses/${course.id}`)}
              >
                관리
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => router.push(`/instructor/courses/${course.id}/assignments`)}
              >
                과제 관리
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
