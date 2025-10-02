import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/constants/env";
import type { Database } from "./types";

type WritableCookieStore = Awaited<ReturnType<typeof cookies>> & {
  set?: (options: {
    name: string;
    value: string;
    path?: string;
    expires?: Date;
    maxAge?: number;
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
  }) => void;
};

export const createSupabaseServerClient = async (): Promise<
  SupabaseClient<Database>
> => {
  const cookieStore = (await cookies()) as WritableCookieStore;

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (typeof cookieStore.set === "function") {
                cookieStore.set({ name, value, ...options });
              }
            });
          } catch (error) {
            // Next.js 15에서는 Server Action/Route Handler 외부에서 쿠키 수정 불가
            // 이 경우 무시하고 계속 진행
          }
        },
      },
    }
  );
};
