"use client";

import Image from "next/image";
import { Users, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CourseEnrollButtons } from "./course-enroll-buttons";
import type { CourseDetailResponse } from "@/features/course-catalog/lib/dto";
import {
  COURSE_CATEGORIES,
  COURSE_DIFFICULTIES,
} from "@/features/course-catalog/constants/filters";
import { COURSE_RATING } from "@/features/course-catalog/constants/course-rating";

type CourseIntroTabProps = {
  course: CourseDetailResponse["course"];
  enrollment: CourseDetailResponse["enrollment"];
};

export const CourseIntroTab = ({ course, enrollment }: CourseIntroTabProps) => {
  const categoryLabel =
    COURSE_CATEGORIES.find((c) => c.value === course.category)?.label ??
    course.category;
  const difficultyLabel =
    COURSE_DIFFICULTIES.find((d) => d.value === course.difficulty)?.label ??
    course.difficulty;

  return (
    <div className="space-y-6">
      <div className="relative h-80 w-full overflow-hidden rounded-lg">
        <Image
          src={
            course.thumbnailUrl ??
            `https://picsum.photos/seed/${course.id}/1200/800`
          }
          alt={course.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          priority
        />
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">{categoryLabel}</Badge>
        <Badge variant="outline">{difficultyLabel}</Badge>
        {course.status === "published" && <Badge variant="default">공개</Badge>}
      </div>

      <div>
        <h2 className="text-3xl font-bold">{course.title}</h2>
        <p className="mt-4 text-base text-muted-foreground">
          {course.description}
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">코스 정보</h3>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{course.instructorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span>{course.enrollmentCount}명 수강 중</span>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="mb-2 font-medium">평균 평점</h4>
          <p className="text-2xl font-bold text-primary">
            {COURSE_RATING.MOCK_AVERAGE} / {COURSE_RATING.MAX_RATING}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            (모의 데이터 - 향후 실제 평점 기능 추가 예정)
          </p>
        </div>
      </div>

      <Separator />

      <CourseEnrollButtons
        courseId={course.id}
        courseStatus={course.status}
        isEnrolled={enrollment?.isEnrolled ?? false}
        enrolledAt={enrollment?.enrolledAt}
      />
    </div>
  );
};
