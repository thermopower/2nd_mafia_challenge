export const ROUTES = {
  HOME: "/",

  // Auth
  LOGIN: "/login",
  SIGNUP: "/signup",

  // Catalog
  CATALOG: "/catalog",
  COURSE_DETAIL: (courseId: string) => `/catalog/${courseId}`,

  // Learner Dashboard
  LEARNER_DASHBOARD: "/dashboard",

  // Instructor
  INSTRUCTOR_DASHBOARD: "/instructor/dashboard",
  INSTRUCTOR_COURSE_NEW: "/instructor/courses/new",
  INSTRUCTOR_COURSE_DETAIL: (courseId: string) => `/instructor/courses/${courseId}`,
  INSTRUCTOR_COURSE_ASSIGNMENTS: (courseId: string) => `/instructor/courses/${courseId}/assignments`,
} as const;
