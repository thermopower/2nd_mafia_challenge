import { Hono } from "hono";
import type { AppEnv } from "@/backend/hono/context";
import { getAssignmentDetail, submitAssignment, getSubmissionForInstructor, gradeAssignment } from "./service";
import { respond } from "@/backend/http/response";
import { assignmentDetailErrorCodes } from "./error";
import { SubmitAssignmentRequestSchema, GradeAssignmentRequestSchema } from "./schema";

export function registerAssignmentRoutes(app: Hono<AppEnv>) {
  app.get("/assignments/:assignmentId", async (c) => {
    const supabase = c.get("supabase");
    const userToken = c.get("userToken");

    if (!userToken) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: assignmentDetailErrorCodes.UNAUTHORIZED_ACCESS,
          message: "No authorization token provided",
        },
      });
    }

    const { data: userData, error: userError } =
      await supabase.auth.getUser(userToken);

    if (userError || !userData?.user) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: assignmentDetailErrorCodes.UNAUTHORIZED_ACCESS,
          message: "Invalid or expired token",
        },
      });
    }

    const assignmentId = c.req.param("assignmentId");
    const learnerId = userData.user.id;

    const result = await getAssignmentDetail(supabase, assignmentId, learnerId);

    return respond(c, result);
  });

  app.post("/assignments/:assignmentId/submit", async (c) => {
    const supabase = c.get("supabase");
    const userToken = c.get("userToken");

    if (!userToken) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: assignmentDetailErrorCodes.UNAUTHORIZED_ACCESS,
          message: "No authorization token provided",
        },
      });
    }

    const { data: userData, error: userError } =
      await supabase.auth.getUser(userToken);

    if (userError || !userData?.user) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: assignmentDetailErrorCodes.UNAUTHORIZED_ACCESS,
          message: "Invalid or expired token",
        },
      });
    }

    const assignmentId = c.req.param("assignmentId");
    const learnerId = userData.user.id;

    const body = await c.req.json();
    const parseResult = SubmitAssignmentRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: assignmentDetailErrorCodes.INVALID_SUBMISSION_DATA,
          message: "Invalid submission data",
          details: parseResult.error.errors,
        },
      });
    }

    const result = await submitAssignment(supabase, assignmentId, learnerId, parseResult.data);

    return respond(c, result);
  });

  app.get("/assignments/:assignmentId/submissions/:submissionId", async (c) => {
    const supabase = c.get("supabase");
    const userToken = c.get("userToken");

    if (!userToken) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: assignmentDetailErrorCodes.UNAUTHORIZED_ACCESS,
          message: "No authorization token provided",
        },
      });
    }

    const { data: userData, error: userError } =
      await supabase.auth.getUser(userToken);

    if (userError || !userData?.user) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: assignmentDetailErrorCodes.UNAUTHORIZED_ACCESS,
          message: "Invalid or expired token",
        },
      });
    }

    const assignmentId = c.req.param("assignmentId");
    const submissionId = c.req.param("submissionId");
    const instructorId = userData.user.id;

    const result = await getSubmissionForInstructor(supabase, assignmentId, submissionId, instructorId);

    return respond(c, result);
  });

  app.patch("/assignments/:assignmentId/submissions/:submissionId", async (c) => {
    const supabase = c.get("supabase");
    const userToken = c.get("userToken");

    if (!userToken) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: assignmentDetailErrorCodes.UNAUTHORIZED_ACCESS,
          message: "No authorization token provided",
        },
      });
    }

    const { data: userData, error: userError } =
      await supabase.auth.getUser(userToken);

    if (userError || !userData?.user) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: assignmentDetailErrorCodes.UNAUTHORIZED_ACCESS,
          message: "Invalid or expired token",
        },
      });
    }

    const assignmentId = c.req.param("assignmentId");
    const submissionId = c.req.param("submissionId");
    const instructorId = userData.user.id;

    const body = await c.req.json();
    const parseResult = GradeAssignmentRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: assignmentDetailErrorCodes.INVALID_SUBMISSION_DATA,
          message: "Invalid grading data",
          details: parseResult.error.errors,
        },
      });
    }

    const result = await gradeAssignment(supabase, assignmentId, submissionId, instructorId, parseResult.data);

    return respond(c, result);
  });
}
