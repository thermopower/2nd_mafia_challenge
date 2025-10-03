"use client";

import Image from "next/image";
import { Users, BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CourseSummary } from "@/features/course-catalog/lib/dto";
import {
  COURSE_CATEGORIES,
  COURSE_DIFFICULTIES,
} from "@/features/course-catalog/constants/filters";

type CourseCardProps = {
  course: CourseSummary;
  onDetailsClick: (courseId: string) => void;
};

export const CourseCard = ({ course, onDetailsClick }: CourseCardProps) => {
  const categoryLabel =
    COURSE_CATEGORIES.find((c) => c.value === course.category)?.label ??
    course.category;
  const difficultyLabel =
    COURSE_DIFFICULTIES.find((d) => d.value === course.difficulty)?.label ??
    course.difficulty;

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative h-48 w-full">
        <Image
          src={course.thumbnailUrl ?? `https://picsum.photos/seed/${course.id}/400/300`}
          alt={course.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <CardHeader>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary">{categoryLabel}</Badge>
          <Badge variant="outline">{difficultyLabel}</Badge>
        </div>
        <CardTitle className="line-clamp-2">{course.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {course.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{course.enrollmentCount}명</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{course.instructorName}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant="default"
          onClick={() => onDetailsClick(course.id)}
        >
          상세보기
        </Button>
      </CardFooter>
    </Card>
  );
};
