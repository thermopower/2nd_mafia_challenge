import { Hono } from "hono";
import type { AppEnv } from "@/backend/hono/context";
import { getInstructorDashboard, getInstructorCourseDetail, updateCourse, getCourseAssignments, createCourse } from "./service";
import { respond } from "@/backend/http/response";
import { instructorErrorCodes } from "./error";
import { UpdateCourseRequestSchema, CreateCourseRequestSchema } from "./schema";
import {
  createAssignment,
  updateAssignment,
  changeAssignmentStatus,
  deleteAssignment,
} from "@/features/assignments/backend/service";
import {
  CreateAssignmentRequestSchema,
  UpdateAssignmentRequestSchema,
  AssignmentStatusSchema,
} from "@/features/assignments/backend/schema";
import { assignmentDetailErrorCodes } from "@/features/assignments/backend/error";

export function registerInstructorRoutes(app: Hono<AppEnv>) {
  app.post("/instructor/courses", async (c) => {
    const supabase = c.get("supabase");
    const userToken = c.get("userToken");

    if (!userToken) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
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
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
          message: "Invalid or expired token",
        },
      });
    }

    const instructorId = userData.user.id;

    let body;
    try {
      body = await c.req.json();
    } catch {
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: instructorErrorCodes.INVALID_REQUEST,
          message: "Invalid JSON body",
        },
      });
    }

    const validation = CreateCourseRequestSchema.safeParse(body);
    if (!validation.success) {
      return respond(c, {
        ok: false,
        status: 422,
        error: {
          code: instructorErrorCodes.INVALID_REQUEST,
          message: validation.error.errors[0]?.message || "Validation failed",
        },
      });
    }

    const result = await createCourse(supabase, instructorId, validation.data);

    return respond(c, result);
  });

  app.get("/instructor/dashboard", async (c) => {
    const supabase = c.get("supabase");
    const userToken = c.get("userToken");

    if (!userToken) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
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
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
          message: "Invalid or expired token",
        },
      });
    }

    const instructorId = userData.user.id;

    const result = await getInstructorDashboard(supabase, instructorId);

    return respond(c, result);
  });

  app.get("/instructor/courses/:courseId", async (c) => {
    const supabase = c.get("supabase");
    const userToken = c.get("userToken");
    const courseId = c.req.param("courseId");

    if (!userToken) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
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
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
          message: "Invalid or expired token",
        },
      });
    }

    const instructorId = userData.user.id;

    const result = await getInstructorCourseDetail(supabase, courseId, instructorId);

    return respond(c, result);
  });

  app.patch("/instructor/courses/:courseId", async (c) => {
    const supabase = c.get("supabase");
    const userToken = c.get("userToken");
    const courseId = c.req.param("courseId");

    if (!userToken) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
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
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
          message: "Invalid or expired token",
        },
      });
    }

    const instructorId = userData.user.id;

    let body;
    try {
      body = await c.req.json();
    } catch {
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: instructorErrorCodes.INVALID_REQUEST,
          message: "Invalid JSON body",
        },
      });
    }

    const validation = UpdateCourseRequestSchema.safeParse(body);
    if (!validation.success) {
      return respond(c, {
        ok: false,
        status: 422,
        error: {
          code: instructorErrorCodes.INVALID_REQUEST,
          message: validation.error.errors[0]?.message || "Validation failed",
        },
      });
    }

    const result = await updateCourse(supabase, courseId, instructorId, validation.data);

    return respond(c, result);
  });

  app.get("/instructor/courses/:courseId/assignments", async (c) => {
    const supabase = c.get("supabase");
    const userToken = c.get("userToken");
    const courseId = c.req.param("courseId");

    if (!userToken) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
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
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
          message: "Invalid or expired token",
        },
      });
    }

    const instructorId = userData.user.id;

    const result = await getCourseAssignments(supabase, courseId, instructorId);

    return respond(c, result);
  });

  app.post("/instructor/courses/:courseId/assignments", async (c) => {
    const supabase = c.get("supabase");
    const userToken = c.get("userToken");
    const courseId = c.req.param("courseId");

    if (!userToken) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
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
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
          message: "Invalid or expired token",
        },
      });
    }

    const instructorId = userData.user.id;

    let body;
    try {
      body = await c.req.json();
    } catch {
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: instructorErrorCodes.INVALID_REQUEST,
          message: "Invalid JSON body",
        },
      });
    }

    const validation = CreateAssignmentRequestSchema.safeParse({ ...body, courseId });
    if (!validation.success) {
      return respond(c, {
        ok: false,
        status: 422,
        error: {
          code: instructorErrorCodes.INVALID_REQUEST,
          message: validation.error.errors[0]?.message || "Validation failed",
        },
      });
    }

    const result = await createAssignment(supabase, instructorId, validation.data);

    return respond(c, result);
  });

  app.patch("/instructor/assignments/:assignmentId", async (c) => {
    const supabase = c.get("supabase");
    const userToken = c.get("userToken");
    const assignmentId = c.req.param("assignmentId");

    if (!userToken) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
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
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
          message: "Invalid or expired token",
        },
      });
    }

    const instructorId = userData.user.id;

    let body;
    try {
      body = await c.req.json();
    } catch {
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: instructorErrorCodes.INVALID_REQUEST,
          message: "Invalid JSON body",
        },
      });
    }

    const validation = UpdateAssignmentRequestSchema.safeParse(body);
    if (!validation.success) {
      return respond(c, {
        ok: false,
        status: 422,
        error: {
          code: instructorErrorCodes.INVALID_REQUEST,
          message: validation.error.errors[0]?.message || "Validation failed",
        },
      });
    }

    const result = await updateAssignment(supabase, assignmentId, instructorId, validation.data);

    return respond(c, result);
  });

  app.patch("/instructor/assignments/:assignmentId/status", async (c) => {
    const supabase = c.get("supabase");
    const userToken = c.get("userToken");
    const assignmentId = c.req.param("assignmentId");

    if (!userToken) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
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
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
          message: "Invalid or expired token",
        },
      });
    }

    const instructorId = userData.user.id;

    let body;
    try {
      body = await c.req.json();
    } catch {
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: instructorErrorCodes.INVALID_REQUEST,
          message: "Invalid JSON body",
        },
      });
    }

    const statusValidation = AssignmentStatusSchema.safeParse(body.status);
    if (!statusValidation.success) {
      return respond(c, {
        ok: false,
        status: 422,
        error: {
          code: assignmentDetailErrorCodes.INVALID_STATUS_TRANSITION,
          message: "Invalid status value",
        },
      });
    }

    const result = await changeAssignmentStatus(supabase, assignmentId, instructorId, statusValidation.data);

    return respond(c, result);
  });

  app.delete("/instructor/assignments/:assignmentId", async (c) => {
    const supabase = c.get("supabase");
    const userToken = c.get("userToken");
    const assignmentId = c.req.param("assignmentId");

    if (!userToken) {
      return respond(c, {
        ok: false,
        status: 401,
        error: {
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
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
          code: instructorErrorCodes.UNAUTHORIZED_ACCESS,
          message: "Invalid or expired token",
        },
      });
    }

    const instructorId = userData.user.id;

    const result = await deleteAssignment(supabase, assignmentId, instructorId);

    return respond(c, result);
  });
}
