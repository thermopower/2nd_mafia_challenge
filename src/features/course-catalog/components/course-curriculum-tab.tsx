"use client";

import { BookOpen } from "lucide-react";

export const CourseCurriculumTab = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BookOpen className="h-16 w-16 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold">커리큘럼 준비 중</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        과제 목록 기능은 곧 추가될 예정입니다.
      </p>
    </div>
  );
};
