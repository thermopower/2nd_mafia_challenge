"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, BookOpen, GraduationCap, Award, Users } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: <BookOpen className="w-8 h-8" />,
    title: "다양한 코스",
    description: "전문가가 제작한 고품질 학습 콘텐츠를 만나보세요.",
  },
  {
    icon: <GraduationCap className="w-8 h-8" />,
    title: "강사 지원",
    description: "강사로 등록하여 자신만의 코스를 개설하고 운영하세요.",
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: "과제 & 피드백",
    description: "실시간 과제 제출과 전문가 피드백으로 실력을 향상시키세요.",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "학습 커뮤니티",
    description: "다른 학습자들과 함께 성장하는 학습 경험을 제공합니다.",
  },
];

export default function Home() {
  const { user, isAuthenticated, isLoading, refresh } = useCurrentUser();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.replace("/");
  }, [refresh, router]);

  const authActions = useMemo(() => {
    if (isLoading) {
      return (
        <Button variant="ghost" disabled>
          로딩 중...
        </Button>
      );
    }

    if (isAuthenticated && user) {
      return (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden md:inline">
            {user.email}
          </span>
          <Button asChild variant="outline">
            <Link href="/dashboard">대시보드</Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost">
          <Link href="/login">로그인</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">회원가입</Link>
        </Button>
      </div>
    );
  }, [handleSignOut, isAuthenticated, isLoading, user]);

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            SuperNext LMS
          </Link>
          {authActions}
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold mb-6">
            배움의 여정을 시작하세요
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            전문 강사진과 함께하는 고품질 온라인 학습 플랫폼.
            과제 제출부터 피드백까지 체계적인 학습 관리 시스템을 경험하세요.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/courses">코스 둘러보기</Link>
            </Button>
            {!isAuthenticated && (
              <Button asChild size="lg" variant="outline">
                <Link href="/signup">무료로 시작하기</Link>
              </Button>
            )}
          </div>
        </section>

        <section className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              SuperNext LMS의 특징
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="mb-4 text-primary">{feature.icon}</div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                학습자를 위한 맞춤형 경험
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">코스 탐색</h3>
                    <p className="text-muted-foreground">
                      카테고리, 난이도별로 원하는 코스를 쉽게 찾을 수 있습니다.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">과제 제출</h3>
                    <p className="text-muted-foreground">
                      마감일 관리와 재제출 기능으로 체계적인 학습이 가능합니다.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-muted rounded-lg p-8 text-center">
              <p className="text-4xl font-bold mb-2">1000+</p>
              <p className="text-muted-foreground">활성 학습자</p>
            </div>
          </div>
        </section>

        <section className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-background rounded-lg p-8 text-center">
                <p className="text-4xl font-bold mb-2">500+</p>
                <p className="text-muted-foreground">전문 강사</p>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  강사를 위한 강력한 도구
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">코스 관리</h3>
                      <p className="text-muted-foreground">
                        코스 생성부터 게시, 아카이빙까지 전체 라이프사이클 관리.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">채점 & 피드백</h3>
                      <p className="text-muted-foreground">
                        제출물 채점, 피드백 제공, 재제출 요청까지 한번에.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            무료로 가입하고 첫 코스를 시작해보세요.
          </p>
          <Button asChild size="lg">
            <Link href="/signup">회원가입하기</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 SuperNext LMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

