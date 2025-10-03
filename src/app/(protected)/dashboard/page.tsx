"use client";

import { Loader2, AlertCircle } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useLearnerDashboard } from "@/features/learner-dashboard/hooks/useLearnerDashboard";
import { EnrolledCoursesSection } from "@/features/learner-dashboard/components/enrolled-courses-section";
import { UpcomingAssignmentsSection } from "@/features/learner-dashboard/components/upcoming-assignments-section";
import { RecentFeedbackSection } from "@/features/learner-dashboard/components/recent-feedback-section";
import { Button } from "@/components/ui/button";
import { extractApiErrorMessage } from "@/lib/remote/api-client";

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;
  const { user } = useCurrentUser();
  const { data, isLoading, error, refetch } = useLearnerDashboard();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">대시보드</h1>
          <p className="text-muted-foreground">
            {user?.email ?? "알 수 없는 사용자"} 님, 환영합니다.
          </p>
        </header>
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-center text-sm text-destructive">
            {extractApiErrorMessage(error, "대시보드 데이터를 불러오는 데 실패했습니다.")}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">대시보드</h1>
        <p className="text-muted-foreground">
          {user?.email ?? "알 수 없는 사용자"} 님, 환영합니다.
        </p>
      </header>

      <EnrolledCoursesSection courses={data?.enrolledCourses ?? []} />

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingAssignmentsSection
          assignments={data?.upcomingAssignments ?? []}
        />
        <RecentFeedbackSection feedback={data?.recentFeedback ?? []} />
      </div>
    </div>
  );
}
