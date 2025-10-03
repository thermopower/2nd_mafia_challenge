"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Users, Trophy, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function Home() {
  const { user, isAuthenticated, isLoading, refresh } = useCurrentUser();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.replace("/");
  }, [refresh, router]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            SuperNext LMS
          </Link>
          <nav className="flex items-center gap-3">
            {isLoading ? (
              <Button variant="ghost" disabled>
                로딩 중...
              </Button>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end text-sm">
                  <span className="font-medium">{user.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.userMetadata?.role === 'instructor' ? '강사' : '학습자'}
                  </span>
                </div>
                <Button asChild variant="outline">
                  <Link href="/dashboard">대시보드</Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut} title="로그아웃">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">로그인</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">회원가입</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              온라인 학습의 새로운 시작
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              배우고, 성장하고, 성공하세요
            </h1>
            <p className="text-xl text-muted-foreground">
              강사와 학습자를 연결하는 경량 LMS 플랫폼.
              <br />
              과제 제출부터 피드백까지, 체계적인 학습 경험을 제공합니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/catalog">
                  코스 둘러보기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              {!isAuthenticated && (
                <Button asChild variant="outline" size="lg" className="text-lg px-8">
                  <Link href="/signup">무료로 시작하기</Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">다양한 코스</h3>
              <p className="text-muted-foreground">
                카테고리별, 난이도별로 분류된 다양한 코스를 탐색하고 수강하세요.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">체계적인 관리</h3>
              <p className="text-muted-foreground">
                과제 제출, 채점, 피드백까지 모든 학습 과정을 한 곳에서 관리하세요.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">실시간 피드백</h3>
              <p className="text-muted-foreground">
                강사로부터 즉각적인 피드백을 받고, 성적을 실시간으로 확인하세요.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6 p-12 rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10">
            <h2 className="text-3xl md:text-4xl font-bold">
              지금 바로 시작하세요
            </h2>
            <p className="text-lg text-muted-foreground">
              학습자로 등록하거나 강사로 코스를 개설할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/catalog">코스 탐색하기</Link>
              </Button>
              {isAuthenticated && (
                <Button asChild variant="outline" size="lg" className="text-lg px-8">
                  <Link href="/dashboard">내 대시보드</Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 SuperNext LMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
