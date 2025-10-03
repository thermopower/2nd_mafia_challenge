import {
  CourseCategory,
  CourseDifficulty,
  CourseSortBy,
} from '@/features/course-catalog/lib/dto';

export const COURSE_CATEGORIES = [
  { value: CourseCategory.Development, label: '개발' },
  { value: CourseCategory.Design, label: '디자인' },
  { value: CourseCategory.Business, label: '비즈니스' },
  { value: CourseCategory.Marketing, label: '마케팅' },
  { value: CourseCategory.PersonalDevelopment, label: '자기계발' },
] as const;

export const COURSE_DIFFICULTIES = [
  { value: CourseDifficulty.Beginner, label: '초급' },
  { value: CourseDifficulty.Intermediate, label: '중급' },
  { value: CourseDifficulty.Advanced, label: '고급' },
] as const;

export const COURSE_SORT_OPTIONS = [
  { value: CourseSortBy.Latest, label: '최신순' },
  { value: CourseSortBy.Popular, label: '인기순' },
] as const;

export const DEFAULT_FILTERS = {
  search: '',
  category: undefined,
  difficulty: undefined,
  sortBy: CourseSortBy.Latest,
  page: 1,
  limit: 20,
} as const;

export const courseCatalogQueryKeys = {
  all: ['course-catalog'] as const,
  lists: () => [...courseCatalogQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...courseCatalogQueryKeys.lists(), filters] as const,
  details: () => [...courseCatalogQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseCatalogQueryKeys.details(), id] as const,
} as const;
