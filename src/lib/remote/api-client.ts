"use client";

import axios, { isAxiosError } from "axios";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to every request
apiClient.interceptors.request.use(async (config) => {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log('[API Client] Session:', session ? 'exists' : 'null');

  if (session?.access_token) {
    console.log('[API Client] Adding auth token, length:', session.access_token.length);
    config.headers.Authorization = `Bearer ${session.access_token}`;
  } else {
    console.log('[API Client] No access token available');
  }

  return config;
});

type ErrorPayload = {
  error?: {
    message?: string;
  };
  message?: string;
};

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage = "API request failed."
) => {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ErrorPayload | undefined;

    if (typeof payload?.error?.message === "string") {
      return payload.error.message;
    }

    if (typeof payload?.message === "string") {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export { apiClient, isAxiosError };
