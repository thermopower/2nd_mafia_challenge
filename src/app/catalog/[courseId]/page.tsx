"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseDetailView } from "@/features/course-catalog/components/course-detail-view";

type CourseDetailPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = use(params);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-6">
          <Link href="/catalog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              카탈로그로 돌아가기
            </Button>
          </Link>
        </div>

        <CourseDetailView courseId={courseId} />
      </div>
    </div>
  );
}
