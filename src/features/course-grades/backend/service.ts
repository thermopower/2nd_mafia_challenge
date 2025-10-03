import type { SupabaseClient } from "@supabase/supabase-js";
import type { CourseGradesResponse, AssignmentGrade } from "./schema";
import {
  fetchCourseAssignments,
  fetchLearnerSubmissions,
  verifyEnrollment,
} from "./queries";
import { calculateCourseGrade } from "../lib/grades-calculator";

export const getCourseGrades = async (
  client: SupabaseClient,
  learnerId: string,
  courseId: string
): Promise<CourseGradesResponse> => {
  // 1. 수강 등록 여부 검증
  const isEnrolled = await verifyEnrollment(client, learnerId, courseId);
  if (!isEnrolled) {
    throw new Error("ENROLLMENT_NOT_FOUND");
  }

  // 2. 코스의 published 과제 목록 조회
  const assignments = await fetchCourseAssignments(client, courseId);

  if (assignments.length === 0) {
    // 빈 상태 응답
    return {
      summary: {
        totalScore: 0,
        totalWeight: 0,
        gradedCount: 0,
        totalAssignments: 0,
        isPartialScore: false,
      },
      assignments: [],
    };
  }

  // 3. 학습자의 제출 이력 조회
  const assignmentIds = assignments.map((a) => a.id);
  const submissionsMap = await fetchLearnerSubmissions(
    client,
    learnerId,
    assignmentIds
  );

  // 4. 과제별 성적 데이터 조합
  const assignmentGrades: AssignmentGrade[] = assignments.map((assignment) => {
    const submission = submissionsMap.get(assignment.id);

    return {
      assignmentId: assignment.id,
      title: assignment.title,
      weight: assignment.weight,
      score: submission?.score ?? null,
      status: submission
        ? (submission.status as "submitted" | "graded" | "resubmission_required")
        : "not_submitted",
      late: submission?.late ?? false,
      feedback: submission?.feedback ?? null,
      submittedAt: submission?.created_at ?? null,
      gradedAt: submission?.graded_at ?? null,
    };
  });

  // 5. 총점 계산
  const summary = calculateCourseGrade({
    assignments: assignmentGrades.map((a) => ({
      weight: a.weight,
      score: a.score,
      status: a.status,
    })),
  });

  return {
    summary,
    assignments: assignmentGrades,
  };
};
