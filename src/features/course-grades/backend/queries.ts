import type { SupabaseClient } from "@supabase/supabase-js";

type Assignment = {
  id: string;
  title: string;
  weight: number;
  status: string;
};

type Submission = {
  assignment_id: string;
  version: number;
  status: string;
  late: boolean;
  score: number | null;
  feedback: string | null;
  created_at: string;
  graded_at: string | null;
};

export const fetchCourseAssignments = async (
  client: SupabaseClient,
  courseId: string
): Promise<Assignment[]> => {
  const { data, error } = await client
    .from("assignments")
    .select("id, title, weight, status")
    .eq("course_id", courseId)
    .eq("is_deleted", false)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch assignments: ${error.message}`);
  }

  return data ?? [];
};

export const fetchLearnerSubmissions = async (
  client: SupabaseClient,
  learnerId: string,
  assignmentIds: string[]
): Promise<Map<string, Submission>> => {
  if (assignmentIds.length === 0) {
    return new Map();
  }

  // 각 과제의 최신 버전만 조회
  const { data, error } = await client
    .from("assignment_submissions")
    .select("assignment_id, version, status, late, score, feedback, created_at, graded_at")
    .eq("learner_id", learnerId)
    .in("assignment_id", assignmentIds)
    .order("assignment_id", { ascending: true })
    .order("version", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch submissions: ${error.message}`);
  }

  // 각 과제의 최신 제출물만 맵으로 저장
  const submissionMap = new Map<string, Submission>();

  (data ?? []).forEach((submission) => {
    if (!submissionMap.has(submission.assignment_id)) {
      submissionMap.set(submission.assignment_id, submission);
    }
  });

  return submissionMap;
};

export const verifyEnrollment = async (
  client: SupabaseClient,
  learnerId: string,
  courseId: string
): Promise<boolean> => {
  const { data, error } = await client
    .from("enrollments")
    .select("id")
    .eq("learner_id", learnerId)
    .eq("course_id", courseId)
    .single();

  if (error) {
    return false;
  }

  return !!data;
};
