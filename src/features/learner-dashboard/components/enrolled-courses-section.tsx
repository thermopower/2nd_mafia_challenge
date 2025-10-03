"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, BarChart3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { EnrolledCourse } from "@/features/learner-dashboard/lib/dto";
import { CourseAssignmentsQuickActions } from "./course-assignments-quick-actions";

type EnrolledCoursesSectionProps = {
  courses: EnrolledCourse[];
};

export const EnrolledCoursesSection = ({
  courses,
}: EnrolledCoursesSectionProps) => {
  if (courses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>내 코스</CardTitle>
          <CardDescription>수강 중인 코스가 없습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            메인 페이지에서 관심있는 코스를 찾아 수강 신청해보세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">내 코스</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden">
            <div className="relative h-40 w-full">
              <Image
                src={course.thumbnailUrl ?? `https://picsum.photos/seed/${course.id}/400/300`}
                alt={course.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <CardHeader>
              <CardTitle className="line-clamp-1">{course.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {course.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>{course.instructorName}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">진행률</span>
                  <span className="font-medium">{course.progressPercentage}%</span>
                </div>
                <Progress value={course.progressPercentage} />
                <p className="text-xs text-muted-foreground">
                  {course.completedAssignments} / {course.totalAssignments} 과제 완료
                </p>
              </div>
              {course.quickAssignments && course.quickAssignments.length > 0 && (
                <CourseAssignmentsQuickActions
                  courseId={course.id}
                  assignments={course.quickAssignments}
                />
              )}
              <Link href={`/dashboard/courses/${course.id}/grades`} className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  성적 보기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
