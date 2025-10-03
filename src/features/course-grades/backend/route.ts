import { Hono } from "hono";
import type { AppEnv } from "@/backend/hono/context";
import { respond, failure, success } from "@/backend/http/response";
import { getCourseGrades } from "./service";
import { CourseGradesResponseSchema } from "./schema";

export const registerCourseGradesRoutes = (app: Hono<AppEnv>) => {
  app.get("/learner/courses/:courseId/grades", async (c) => {
    const { courseId } = c.req.param();
    const supabase = c.get("supabase");
    const logger = c.get("logger");
    const userToken = c.get("userToken");

    try {
      // 토큰 검증
      if (!userToken) {
        logger.warn("Missing auth token for grades request");
        return respond(c, failure(401, "UNAUTHORIZED", "인증이 필요합니다."));
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(userToken);

      if (authError || !user) {
        logger.warn("Invalid auth token for grades request", { authError });
        return respond(c, failure(401, "UNAUTHORIZED", "유효하지 않은 인증 토큰입니다."));
      }

      // 코스 성적 조회
      const gradesData = await getCourseGrades(supabase, user.id, courseId);

      // 스키마 검증
      const validated = CourseGradesResponseSchema.parse(gradesData);

      return respond(c, success(validated, 200));
    } catch (error) {
      if (error instanceof Error && error.message === "ENROLLMENT_NOT_FOUND") {
        logger.info("Enrollment not found for grades request", {
          courseId,
          userId: userToken ? "authenticated" : "none",
        });
        return respond(
          c,
          failure(403, "FORBIDDEN", "해당 코스에 수강 등록되어 있지 않습니다.")
        );
      }

      logger.error("Failed to fetch course grades", {
        error: error instanceof Error ? error.message : String(error),
        courseId,
      });

      return respond(
        c,
        failure(500, "INTERNAL_ERROR", "성적을 불러오는 데 실패했습니다.")
      );
    }
  });
};
