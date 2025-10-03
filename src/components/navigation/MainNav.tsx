"use client";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard } from "lucide-react";

export function MainNav() {
  const { user } = useCurrentUser();
  const { data: profile } = useUserProfile();
  const router = useRouter();

  if (!user || !profile) {
    return null;
  }

  const isInstructor = profile.role === "instructor";
  const isLearner = profile.role === "learner";

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1
              className="text-xl font-bold cursor-pointer"
              onClick={() => router.push("/")}
            >
              LMS
            </h1>

            <div className="flex items-center gap-2">
              {isLearner && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/catalog")}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    코스 탐색
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/dashboard")}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    내 대시보드
                  </Button>
                </>
              )}

              {isInstructor && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/instructor/dashboard")}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  강사 대시보드
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile.fullName} ({isInstructor ? "강사" : "학습자"})
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
