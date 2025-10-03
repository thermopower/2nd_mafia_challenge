import type { CourseGradeSummary } from "../backend/schema";
import { GRADE_CONSTANTS } from "../constants/grades";

type GradeCalculationInput = {
  assignments: Array<{
    weight: number;
    score: number | null;
    status: string;
  }>;
};

export const calculateCourseGrade = (
  input: GradeCalculationInput
): CourseGradeSummary => {
  const totalAssignments = input.assignments.length;

  // 채점 완료된 과제만 필터링
  const gradedAssignments = input.assignments.filter(
    (a) => a.status === "graded" && a.score !== null
  );

  const gradedCount = gradedAssignments.length;

  // 총 가중치 합계 계산
  const totalWeight = input.assignments.reduce(
    (sum, a) => sum + a.weight,
    0
  );

  // 채점 완료된 과제의 가중치 합계
  const gradedWeight = gradedAssignments.reduce(
    (sum, a) => sum + a.weight,
    0
  );

  // 가중치 기반 총점 계산: Σ(과제 점수 × 과제 가중치 / MAX_WEIGHT)
  const totalScore = gradedAssignments.reduce((sum, a) => {
    return sum + (a.score! * a.weight) / GRADE_CONSTANTS.MAX_WEIGHT;
  }, 0);

  // 가중치 합이 MAX_WEIGHT 미만인 경우 부분 총점으로 표시
  const isPartialScore = gradedWeight < GRADE_CONSTANTS.MAX_WEIGHT;

  const roundingFactor = Math.pow(10, GRADE_CONSTANTS.DECIMAL_PLACES);

  return {
    totalScore: Math.round(totalScore * roundingFactor) / roundingFactor,
    totalWeight,
    gradedCount,
    totalAssignments,
    isPartialScore,
  };
};
