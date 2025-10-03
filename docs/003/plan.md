# Assignment Detail Access Plan

## Overview
- **AssignmentsBackendDomain** (`src/features/assignments/backend/{schema,error,service}.ts`): Learner 전용 과제 상세/요약 데이터를 Supabase에서 조회하고 검증하는 비즈니스 레이어.
- **AssignmentsApiRoutes** (`src/features/assignments/backend/route.ts`, `src/backend/hono/app.ts`): `/assignments/:assignmentId` 엔드포인트를 노출하고 공통 미들웨어 체인에 연결.
- **AssignmentsFrontendData** (`src/features/assignments/lib/dto.ts`, `src/features/assignments/hooks/useAssignmentDetail.ts`): Zod 기반 DTO 재노출과 React Query 훅을 통해 프런트엔드 데이터 접근을 표준화.
- **AssignmentDetailPresentation** (`src/features/assignments/components/assignment-detail-view.tsx`, `src/app/(protected)/dashboard/courses/[courseId]/assignments/[assignmentId]/page.tsx`): 과제 상세 페이지 UI 및 라우팅. `use client` 규칙을 따르며 카드/상태 뷰 구성.
- **LearnerDashboardIntegration** (`src/features/learner-dashboard/backend/{schema,service}.ts`, `src/features/learner-dashboard/components/enrolled-courses-section.tsx`, `src/features/learner-dashboard/components/course-assignments-quick-actions.tsx`): 내 코스 카드에서 과제 빠른 액션을 노출하고 새 API와 연동.

## Diagram
```mermaid
graph TD
  A[EnrolledCoursesSection] --> B[CourseAssignmentsQuickActions]
  B -- click --> C[useAssignmentDetail]
  C --> D[@/lib/remote/api-client]
  D --> E[/GET /assignments/:assignmentId/]
  E --> F[AssignmentsApiRoutes]
  F --> G[AssignmentsBackendDomain]
  G --> H[(Supabase)]
  G -. summary -> I[LearnerDashboardIntegration]
  I --> A
```

## Implementation Plan
### AssignmentsBackendDomain (Business Logic)
1. 생성: `schema.ts`에 `AssignmentDetailSchema`, `CourseAssignmentSummarySchema`를 정의하고 `zod`로 검증, Front/Back 공유를 위해 export.
2. 생성: `error.ts`에 `assignmentDetailErrorCodes`를 선언하고 `ts-pattern`으로 Supabase 에러 매핑.
3. 생성: `service.ts`에 `getAssignmentDetail(client, assignmentId, learnerId)`와 `getCourseAssignmentSummaries(client, learnerId, courseIds)` 구현. `SupabaseClient` 의존성을 주입받고, `es-toolkit`로 데이터 변환, `date-fns`로 날짜 처리.
4. 기존 의존성: `learner-dashboard` 서비스에서 요약 데이터를 얻을 수 있도록 헬퍼 함수 export.
5. Unit Tests (`src/features/assignments/backend/__tests__/service.test.ts`): `vitest`를 devDependency로 추가하고 `pnpm vitest` 스크립트 설정. Supabase 호출은 spy/stub으로 대체하여 정상 케이스, 권한 거부, 미발행 과제 필터링을 검증.

### AssignmentsApiRoutes (Business Logic)
1. 생성: `route.ts`에서 `registerAssignmentRoutes(app)` 정의, `/assignments/:assignmentId` GET 라우트에서 인증 토큰을 검증 후 `getAssignmentDetail` 호출.
2. 업데이트: `src/backend/hono/app.ts`에 `registerAssignmentRoutes`를 등록하고 초기화 로그 추가.
3. 에러 응답: 공통 `respond` 헬퍼 사용, `failure` 포맷 준수.
4. Unit Tests: `vitest`를 활용해 라우트 핸들러가 `getAssignmentDetail` 결과에 따라 200/403/404를 반환하는지 검증 (mock app + c.req).

### AssignmentsFrontendData (Business Logic & Data Layer)
1. 생성: `lib/dto.ts`에서 backend schema re-export, 프런트에서 동일 타입 사용.
2. 생성: `hooks/useAssignmentDetail.ts` (`"use client"`) 에서 `useQuery`와 `apiClient.get<AssignmentDetail>(
   `/assignments/${assignmentId}`
)` 요청 구현. params는 `courseId`와 `assignmentId` 모두 수용하도록 query key 구성.
3. 에러 처리: `extractApiErrorMessage` 활용, 로딩/에러 상태 반환.
4. Unit Tests: `vitest` + `@tanstack/react-query` `QueryClient` mock으로 훅이 성공/실패 시 올바른 상태를 노출하는지 테스트.

### AssignmentDetailPresentation (Presentation)
1. 생성: `components/assignment-detail-view.tsx` (`"use client"`)에서 상세 정보 카드 UI 구성. 제출 상태(badge), 마감일(`date-fns` 포맷), 지연 제출 안내 등을 렌더링.
2. 생성: `src/app/(protected)/dashboard/courses/[courseId]/assignments/[assignmentId]/page.tsx` (`"use client"`). `params`를 `Promise<{ courseId: string; assignmentId: string; }>`로 선언하고 `await` 후 `AssignmentDetailView` + `useAssignmentDetail` 결합.
3. 라우팅: `next/navigation`의 `useSearchParams` 없이 `params`만 활용. Breadcrumb/Back 버튼은 선택적으로 `useRouter`.
4. 상태 처리: 로딩 스켈레톤(`@/components/ui/skeleton` 존재 시) 또는 스피너, 에러 토스트 버튼 제공.
5. QA Sheet:
   - [ ] 수강 등록된 Learner가 정상적으로 과제 상세 정보를 확인할 수 있다.
   - [ ] 마감이 지난 과제는 지연 제출 안내가 노출된다.
   - [ ] 제출 불가 상태(403)에서 접근 시 경고 페이지/토스트가 노출되고 대시보드로 이동할 수 있다.
   - [ ] 로딩 중에는 스켈레톤 또는 스피너가 표시된다.

### LearnerDashboardIntegration (Presentation & Business Logic)
1. 스키마 업데이트: `EnrolledCourseSchema`에 `quickAssignments: CourseAssignmentSummarySchema.array()` 추가하고 `lib/dto.ts` 재수출.
2. 서비스 업데이트: `getLearnerDashboard` 내에서 `getCourseAssignmentSummaries` 호출, courseId 목록을 전달해 각 코스별 top N(예:3) 과제를 병렬로 수집. 기존 진행률 계산 로직과 결합.
3. UI 모듈화: `src/features/learner-dashboard/components/course-assignments-quick-actions.tsx` (`"use client"`) 생성, 과제 리스트/버튼/상태 뱃지 렌더링.
4. `EnrolledCoursesSection` 수정: 신규 컴포넌트를 카드 하단에 배치, 과제 없을 때 Empty state 표시, 버튼 클릭 시 `router.push('/dashboard/courses/${courseId}/assignments/${assignmentId}')` 수행.
5. 접근성: 버튼에 `aria-label` 제공, 카드 내 heading 레벨 유지.
6. QA Sheet:
   - [ ] 내 코스 카드에서 과제 요약이 최대 3건까지 노출된다.
   - [ ] 과제 빠른 액션 클릭 시 상세 페이지로 이동한다.
   - [ ] 과제가 없을 때 Empty state가 나타난다.
   - [ ] 비등록 과제는 빠른 액션에 노출되지 않는다.
   - [ ] 모바일 너비(<=640px)에서 리스트가 세로 방향으로 정렬된다.
