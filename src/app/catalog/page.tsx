"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CourseCatalogContainer } from "@/features/course-catalog/components/course-catalog-container";

export default function CatalogPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            SuperNext LMS
          </Link>
          <nav className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/">홈</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-12">
          <header className="mb-8 space-y-2">
            <h1 className="text-3xl font-semibold">코스 카탈로그</h1>
            <p className="text-muted-foreground">
              원하는 코스를 찾아 수강 신청하세요.
            </p>
          </header>

          <CourseCatalogContainer />
        </section>
      </main>

      <footer className="border-t py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 SuperNext LMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

