"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import { useCurrentUser } from "./useCurrentUser";

type UserProfile = {
  userId: string;
  fullName: string;
  phoneNumber: string;
  role: "learner" | "instructor";
  createdAt: string;
  updatedAt: string;
};

export const useUserProfile = () => {
  const { user, isAuthenticated } = useCurrentUser();

  return useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      const response = await apiClient.get<UserProfile>("/auth/profile");
      return response.data;
    },
    enabled: isAuthenticated && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
