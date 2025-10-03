import { CourseCategory, CourseDifficulty } from "@/features/course-catalog/lib/dto";

export const INSTRUCTOR_COURSE_CATEGORIES = [
  { value: CourseCategory.Development, label: "개발" },
  { value: CourseCategory.Design, label: "디자인" },
  { value: CourseCategory.Business, label: "비즈니스" },
  { value: CourseCategory.Marketing, label: "마케팅" },
  { value: CourseCategory.PersonalDevelopment, label: "자기계발" },
] as const;

export const INSTRUCTOR_COURSE_DIFFICULTIES = [
  { value: CourseDifficulty.Beginner, label: "초급" },
  { value: CourseDifficulty.Intermediate, label: "중급" },
  { value: CourseDifficulty.Advanced, label: "고급" },
] as const;
