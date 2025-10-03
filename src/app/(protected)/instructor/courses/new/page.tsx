"use client";

import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CourseCreateForm } from "@/features/instructor/components/course-create-form";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";

export default function CourseCreatePage() {
  const router = useRouter();
  const { data: profile, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profile?.role !== "instructor") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-destructive">
          강사만 코스를 생성할 수 있습니다.
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          대시보드로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/instructor/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            대시보드로 돌아가기
          </Button>
        </Link>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">새 코스 만들기</h1>
          <p className="mt-2 text-muted-foreground">
            학습자들과 공유할 새로운 코스를 생성하세요
          </p>
        </div>

        <CourseCreateForm />
      </div>
    </div>
  );
}
