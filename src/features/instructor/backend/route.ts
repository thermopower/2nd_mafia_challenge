import { Hono } from "hono";
import type { AppEnv } from "@/backend/hono/context";
import { getInstructorDashboard } from "./service";
import { respond } from "@/backend/http/response";
import { instructorErrorCodes } from "./error";

export function registerInstructorRoutes(app: Hono<AppEnv>) {
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
}
